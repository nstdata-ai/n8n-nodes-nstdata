import type { IAuthenticateGeneric, ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';

export class NstdataCrawlApi implements ICredentialType {
	name = 'nstdataCrawlApi';
	displayName = 'Nstdata Crawl API';
	icon = { light: 'file:../assets/nstdata.svg', dark: 'file:../assets/nstdata.svg' } as const;
	documentationUrl = 'https://docs.nstdata.io/docs/crawl';
	properties: INodeProperties[] = [{
		displayName: 'API Key', name: 'apiKey', type: 'string', typeOptions: { password: true },
		default: '', required: true,
		description: 'API key from your Nstdata dashboard at app.nstdata.io',
	}];
	authenticate: IAuthenticateGeneric = {
		type: 'generic', properties: { headers: { 'X-API-Key': '={{$credentials.apiKey}}' } },
	};
	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.nstdata.io',
			url: '/api/v1/api/user/info',
			method: 'GET',
			disableFollowRedirect: true,
			timeout: 10000,
		},
		rules: [{
			type: 'responseSuccessBody',
			properties: { key: 'err', value: true, message: 'Nstdata did not accept this API key' },
		}],
	};
}
