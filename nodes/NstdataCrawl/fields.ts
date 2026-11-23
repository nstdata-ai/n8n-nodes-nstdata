import type { INodeProperties } from 'n8n-workflow';

export const fields: INodeProperties[] = [
	{
		displayName: 'Credential Type', name: 'authType', type: 'options', noDataExpression: true,
		options: [
			{ name: 'Nstdata API Key', value: 'nstdataCrawlApi' },
			{ name: 'Reuse HTTP Request Credential (Simplified Custom Auth)', value: 'httpTemplatedCustomAuth' },
		], default: 'nstdataCrawlApi',
	},
	{
		displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true,
		options: [
			{ name: 'Scrape a Page', value: 'scrape', action: 'Scrape a page' },
			{ name: 'Get Scrape Result', value: 'getResult', action: 'Get a scrape result' },
			{ name: 'Read Referenced Content', value: 'read', action: 'Read referenced content' },
		], default: 'scrape',
	},
	{
		displayName: 'URL', name: 'url', type: 'string', required: true, default: '', placeholder: 'https://example.com/',
		description: 'Enter a URL or map the URL field from each incoming item',
		displayOptions: { show: { operation: ['scrape'] } },
	},
	{
		displayName: 'Output Formats', name: 'formats', type: 'multiOptions', default: ['markdown'], required: true,
		options: [{ name: 'HTML', value: 'html' }, { name: 'Links', value: 'links' }, { name: 'Markdown', value: 'markdown' }],
		displayOptions: { show: { operation: ['scrape'] } },
	},
	{
		displayName: 'Return', name: 'resultMode', type: 'options', default: 'wait',
		options: [{ name: 'Wait for Content', value: 'wait' }, { name: 'Task ID Immediately', value: 'submit' }],
		displayOptions: { show: { operation: ['scrape'] } },
	},
	{
		displayName: 'Options', name: 'options', type: 'collection', default: {}, placeholder: 'Add Option',
		displayOptions: { show: { operation: ['scrape'] } },
		options: [
			{ displayName: 'Maximum Wait (Seconds)', name: 'waitSeconds', type: 'number', default: 60,
				typeOptions: { minValue: 1, maxValue: 300 }, description: 'In Wait for Content mode, return a pending task ID when this polling window ends' },
			{ displayName: 'Only Main Content', name: 'onlyMainContent', type: 'boolean', default: true,
				description: 'Whether to request only the main content of the page' },
		],
	},
	{
		displayName: 'Task ID', name: 'taskId', type: 'string', required: true, default: '={{ $json.taskId }}',
		displayOptions: { show: { operation: ['getResult'] } },
	},
	{
		displayName: 'Read Text References', name: 'resolveRefs', type: 'boolean', default: true,
		description: 'Whether to fetch Markdown or HTML when only a reference is returned',
		displayOptions: { show: { operation: ['getResult'] } },
	},
	{
		displayName: 'Content Type', name: 'contentType', type: 'options', default: 'markdown',
		options: [{ name: 'HTML', value: 'html' }, { name: 'Markdown', value: 'markdown' }],
		displayOptions: { show: { operation: ['read'] } },
	},
	{
		displayName: 'Reference', name: 'reference', type: 'string', required: true, default: '',
		placeholder: 'Map markdownRef or htmlRef from a previous node',
		displayOptions: { show: { operation: ['read'] } },
	},
];
