import { NodeConnectionTypes, NodeOperationError, sleep } from 'n8n-workflow';
import type {
	IDataObject, IExecuteFunctions, IHttpRequestOptions, INodeExecutionData,
	INodeType, INodeTypeDescription,
} from 'n8n-workflow';
import { fields } from './fields';

const base = 'https://api.nstdata.io/api/v1/crawl';
const isObject = (value: unknown): value is IDataObject =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

async function request(ctx: IExecuteFunctions, index: number, path: string, options: Omit<IHttpRequestOptions, 'url'>) {
	const auth = ctx.getNodeParameter('authType', index) as string;
	try {
		return await ctx.helpers.httpRequestWithAuthentication.call(ctx, auth, {
			timeout: 30000, ...options, url: base + path, disableFollowRedirect: true,
		});
	} catch (error) {
		// References and authentication templates may be present in the underlying request.
		const cause = error as { httpCode?: string; statusCode?: number; response?: { status?: number } };
		const code = cause.httpCode ?? cause.statusCode ?? cause.response?.status;
		throw new NodeOperationError(ctx.getNode(), 'Nstdata request failed' + (code ? ' (HTTP ' + code + ')' : ' (check credentials, connectivity and timeout)'));
	}
}

async function api(ctx: IExecuteFunctions, i: number, path: string, options: Omit<IHttpRequestOptions, 'url'>) {
	const envelope = await request(ctx, i, path, { ...options, json: true });
	if (!isObject(envelope) || envelope.err !== false || envelope.code !== 200 || !isObject(envelope.data)) {
		const code = isObject(envelope) && typeof envelope.code === 'number' ? ' (code ' + envelope.code + ')' : '';
		throw new NodeOperationError(ctx.getNode(), 'Nstdata returned an unsuccessful or invalid API response' + code);
	}
	return envelope.data;
}

async function readText(ctx: IExecuteFunctions, i: number, reference: string): Promise<string> {
	if (!reference.trim()) throw new NodeOperationError(ctx.getNode(), 'A content reference is required');
	const bytes = await request(ctx, i, '/storage/read', { method: 'GET', qs: { st: reference }, encoding: 'arraybuffer' });
	if (bytes instanceof Uint8Array || bytes instanceof ArrayBuffer) return new TextDecoder().decode(bytes);
	if (typeof bytes === 'string') return bytes;
	throw new NodeOperationError(ctx.getNode(), 'Expected text from the storage endpoint');
}

async function getResult(ctx: IExecuteFunctions, i: number, id: string, output: IDataObject, resolve: boolean, timeout: number) {
	if (!id.trim() || id === '.' || id === '..') throw new NodeOperationError(ctx.getNode(), 'A valid task ID is required');
	const task = await api(ctx, i, '/scrape/' + encodeURIComponent(id), { method: 'GET', timeout });
	if (typeof task.status !== 'string') throw new NodeOperationError(ctx.getNode(), 'Task response has no status');
	output.status = task.status;
	// 'processing' may carry success: false before the job finishes.
	if (['failed', 'expired', 'cancelled', 'canceled'].includes(task.status) || (task.status === 'completed' && task.success === false)) {
		throw new NodeOperationError(ctx.getNode(), 'Scrape task ' + task.status + (typeof task.errorCode === 'string' ? ' (' + task.errorCode + ')' : ''));
	}
	if (task.status !== 'completed') return;
	if (!isObject(task.data)) throw new NodeOperationError(ctx.getNode(), 'Completed task has no result data');
	const data = task.data;
	if (isObject(data.metadata)) {
		output.metadata = data.metadata;
		if (typeof data.metadata.title === 'string') output.title = data.metadata.title;
	}
	if (Array.isArray(data.links)) output.links = data.links;
	if (typeof data.truncated === 'boolean') output.truncated = data.truncated;
	for (const field of ['markdown', 'html']) {
		const ref = data[field + 'Ref'];
		if (typeof ref === 'string') output[field + 'Ref'] = ref;
		if (typeof data[field] === 'string') output[field] = data[field];
		else if (resolve && typeof ref === 'string') output[field] = await readText(ctx, i, ref);
	}
}

export class NstdataCrawl implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Nstdata Crawl', name: 'nstdataCrawl', group: ['transform'], version: 1,
		subtitle: '={{$parameter["operation"]}}',
		usableAsTool: true,
		icon: { light: 'file:../../assets/nstdata.svg', dark: 'file:../../assets/nstdata.svg' },
		description: 'Scrape web pages and read Markdown or HTML results',
		defaults: { name: 'Nstdata Crawl' },
		inputs: [NodeConnectionTypes.Main], outputs: [NodeConnectionTypes.Main],
		credentials: ['nstdataCrawlApi', 'httpTemplatedCustomAuth'].map(name => ({
			name, required: true, displayOptions: { show: { authType: [name] } },
		})),
		properties: fields,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const results: INodeExecutionData[] = [];
		const items = this.getInputData();
		for (let i = 0; i < items.length; i++) {
			const output: IDataObject = {};
			try {
				const operation = this.getNodeParameter('operation', i);
				if (operation === 'read') {
					const type = String(this.getNodeParameter('contentType', i));
					output[type] = await readText(this, i, String(this.getNodeParameter('reference', i)));
				} else if (operation === 'getResult') {
					const taskId = String(this.getNodeParameter('taskId', i));
					output.taskId = taskId;
					await getResult(this, i, taskId, output, Boolean(this.getNodeParameter('resolveRefs', i)), 30000);
				} else {
					const url = String(this.getNodeParameter('url', i)).trim();
					if (!/^https?:\/\//i.test(url) || !URL.canParse(url)) throw new NodeOperationError(this.getNode(), 'Provide an HTTP or HTTPS URL');
					output.url = url;
					const formats = this.getNodeParameter('formats', i) as string[];
					if (!formats.length) throw new NodeOperationError(this.getNode(), 'Select at least one output format');
					const options = this.getNodeParameter('options', i) as IDataObject;
					const body: IDataObject = { url, formats };
					if (typeof options.onlyMainContent === 'boolean') body.onlyMainContent = options.onlyMainContent;
					const submitted = await api(this, i, '/scrape', { method: 'POST', qs: { async: true }, body });
					if (typeof submitted.id !== 'string' || !submitted.id.trim()) throw new NodeOperationError(this.getNode(), 'Submission returned no task ID');
					output.taskId = submitted.id;
					output.status = submitted.status ?? 'submitted';
					if (this.getNodeParameter('resultMode', i) === 'wait') {
						const deadline = Date.now() + 1000 * Math.min(300, Math.max(1, Number(options.waitSeconds ?? 60)));
						while (Date.now() < deadline) {
							if (this.getExecutionCancelSignal()?.aborted) throw new NodeOperationError(this.getNode(), 'Execution cancelled');
							await getResult(this, i, submitted.id, output, true, Math.min(30000, Math.max(1, deadline - Date.now())));
							if (output.status === 'completed') break;
							await sleep(Math.min(1500, Math.max(0, deadline - Date.now())));
						}
						if (output.status !== 'completed') output.timedOut = true;
						else if (formats.includes('markdown') && typeof output.markdown !== 'string') throw new NodeOperationError(this.getNode(), 'Completed task returned no Markdown');
					}
				}
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Nstdata operation failed';
				if (!this.continueOnFail()) throw new NodeOperationError(this.getNode(), message + (output.taskId ? ' — task ' + output.taskId : ''), { itemIndex: i });
				output.error = message;
			}
			results.push({ json: output, pairedItem: { item: i } });
		}
		return [results];
	}
}
