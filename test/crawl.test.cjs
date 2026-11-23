const test = require('node:test');
const assert = require('node:assert/strict');
const { NstdataCrawl } = require('../dist/nodes/NstdataCrawl/NstdataCrawl.node.js');

function context(parameters, request, count = 1) {
	return {
		getInputData: () => Array.from({ length: count }, () => ({ json: {} })),
		getNodeParameter: (name, i) => typeof parameters[name] === 'function' ? parameters[name](i) : parameters[name],
		getNode: () => ({ name: 'Nstdata Crawl', type: 'n8n-nodes-nstdata.nstdataCrawl', typeVersion: 1, parameters: {} }),
		getExecutionCancelSignal: () => undefined,
		continueOnFail: () => true,
		helpers: { httpRequestWithAuthentication: (_, options) => request(options) },
	};
}
const envelope = (data) => ({ err: false, code: 200, data });
const run = (ctx) => new NstdataCrawl().execute.call(ctx);

test('processing/success:false is pending, not failed; resume the same task and read Markdown', async () => {
	let submissions = 0;
	let polls = 0;
	let reads = 0;
	const ctx = context({
		operation: 'scrape', formats: ['markdown'], url: 'https://example.org/', options: {}, resultMode: 'wait',
	}, (request) => {
		if (request.method === 'POST') {
			submissions++;
			return envelope({ id: 'task-1', status: 'processing' });
		}
		if (request.url.endsWith('/task-1')) {
			polls++;
			if (polls === 1) return envelope({ status: 'processing', success: false });
			return envelope({ status: 'completed', success: true, data: { markdownRef: 'ref', truncated: true } });
		}
		assert.equal(request.qs.st, 'ref');
		reads++;
		return Buffer.from('# Page');
	});
	const [[item]] = await run(ctx);
	assert.equal(item.json.markdown, '# Page');
	assert.equal(item.json.truncated, true);
	assert.deepEqual([submissions, polls, reads], [1, 2, 1]);
});

test('invalid URL does not block the next item under Continue on Error; submit-only performs no reads', async () => {
	let calls = 0;
	const ctx = context({
		operation: 'scrape', formats: ['markdown'], url: (i) => ['invalid', 'https://example.com'][i],
		options: {}, resultMode: 'submit',
	}, (req) => {
		assert.equal(req.method, 'POST');
		calls++;
		return envelope({ id: 'task-2', status: 'processing' });
	}, 2);
	const [[bad, ok]] = await run(ctx);
	assert.match(bad.json.error, /URL/);
	assert.deepEqual([bad.pairedItem.item, ok.pairedItem.item], [0, 1]);
	assert.equal(ok.json.taskId, 'task-2');
	assert.equal(calls, 1);
});

test('return the existing task ID when the polling window expires', async () => {
	const ctx = context({
		operation: 'scrape', formats: ['markdown'], url: 'https://example.org/', options: { waitSeconds: 1 }, resultMode: 'wait',
	}, (req) => envelope(req.method === 'POST' ? { id: 'keep-this-task' } : { status: 'processing', success: false }));
	const [[item]] = await run(ctx);
	assert.equal(item.json.taskId, 'keep-this-task');
	assert.equal(item.json.timedOut, true);
	assert.equal(item.json.error, undefined);
});

test('the default connection uses the saved Crawl credential and only tests account information', async () => {
	const { NstdataCrawlApi } = require('../dist/credentials/NstdataCrawlApi.credentials.js');
	const credential = new NstdataCrawlApi();
	const description = new NstdataCrawl().description;
	const auth = description.properties.find((p) => p.name === 'authType').default;
	assert.equal(auth, credential.name);
	assert.ok(description.credentials.find((c) => c.name === auth && c.required));
	assert.deepEqual(credential.authenticate.properties.headers, { 'X-API-Key': '={{$credentials.apiKey}}' });
	const probe = credential.test.request;
	assert.equal(probe.method, 'GET');
	assert.equal(new URL(probe.url, probe.baseURL).href, 'https://api.nstdata.io/api/v1/api/user/info');
	assert.equal(probe.disableFollowRedirect, true);

	const ctx = context({ authType: auth, operation: 'getResult', taskId: 'task-3', resolveRefs: false });
	ctx.helpers.httpRequestWithAuthentication = (name, opts) => {
		assert.equal(name, auth);
		assert.equal(opts.url, 'https://api.nstdata.io/api/v1/crawl/scrape/task-3');
		return envelope({ status: 'processing' });
	};
	const [[item]] = await run(ctx);
	assert.equal(item.json.status, 'processing');
});
