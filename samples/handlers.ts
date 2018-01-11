import * as hm from 'typed-rest-client/Handlers'
import * as cm from './common';
import * as httpm from 'typed-rest-client/HttpClient';

export async function run() {
    cm.banner('Handler Samples');

    var username = "";
    var password = "";
    var workstation = "";
    var domain = "";
    var url = "";
    
    const basicHandler: hm.BasicCredentialHandler = new hm.BasicCredentialHandler(username, password);
    const patHandler: hm.PersonalAccessTokenCredentialHandler = new hm.PersonalAccessTokenCredentialHandler('scbfb44vxzku5l4xgc3qfazn3lpk4awflfryc76esaiq7aypcbhs');
    const ntlmHandler: hm.NtlmCredentialHandler = new hm.NtlmCredentialHandler(username, password, workstation, domain);

    // These handlers would then be passed to the constructors of the http or rest modules

    // const httpClient: httpm.HttpClient = new httpm.HttpClient('vsts-node-api', [ntlmHandler]);
    // const response: httpm.HttpClientResponse = await httpClient.get(url);
    // console.log("response code: " + response.message.statusCode);
}
