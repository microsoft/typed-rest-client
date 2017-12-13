import * as hm from 'typed-rest-client/Handlers'
import * as cm from './common';
import * as httpm from 'typed-rest-client/HttpClient';

export async function run() {
    cm.banner('Handler Samples');
    
    let bh: hm.BasicCredentialHandler = new hm.BasicCredentialHandler('johndoe', 'password');
    let ph: hm.PersonalAccessTokenCredentialHandler = 
        new hm.PersonalAccessTokenCredentialHandler('scbfb44vxzku5l4xgc3qfazn3lpk4awflfryc76esaiq7aypcbhs');
    
        let nh: hm.NtlmCredentialHandler = new hm.NtlmCredentialHandler('stfrance@microsoft.com', 'password');
    // These handlers would then be passed to the constructors of the http or rest modules

    let httpc: httpm.HttpClient = new httpm.HttpClient('vsts-node-api', [nh]);
    let res: httpm.HttpClientResponse = await httpc.get('hrweb');
    let body: string = await res.readBody();
    cm.outputHttpBinResponse(body, res.message);
}
