import * as hm from 'typed-rest-client/Handlers'
import * as cm from './common';
import * as httpm from 'typed-rest-client/HttpClient';

var httpntlm = require('httpntlm');

export async function run() {
    cm.banner('Handler Samples');

    var proxyUrl = "http://127.0.0.1:8888";

    /* HOME */
    // var username = "-----";
    // var password = process.env["PW"];
    // var workstation = "DESKTOP-CU5JTPL";
    // var domain = "WORKGROUP";
    // var url = "http://localhost/";

    /* WORK */
    var username = "stfrance"
    var password = process.env["PW"];
    var workstation = "STEPHENMICHAELF";
    var domain = "NORTHAMERICA";
    var url = "http://stephenmichaelf:8080/tfs/DefaultCollection/ExperimentalProject/_build/index?context=mine&path=%5C&definitionId=1&_a=completed";

    //process.env["http_proxy"] = "http://127.0.0.1:8888";
    console.log("FROM ROOT " + process.env["PW"]);
    httpntlm.get({
        url: url,
        username: username,
        password: password,
        workstation: workstation,
        domain: domain,

    }, function (err, res){
        if(err) return console.log('ERROR: ' + err);
    
        console.log('start response log');
        console.log("status code inside: " + res.statusCode);
        console.log('end response log');
    });
    console.log("END FROM ROOT");
    
    let bh: hm.BasicCredentialHandler = new hm.BasicCredentialHandler('johndoe', 'password');
    let ph: hm.PersonalAccessTokenCredentialHandler = new hm.PersonalAccessTokenCredentialHandler('scbfb44vxzku5l4xgc3qfazn3lpk4awflfryc76esaiq7aypcbhs');
    let nh: hm.NtlmCredentialHandler = new hm.NtlmCredentialHandler(username, password, workstation, domain);

    // These handlers would then be passed to the constructors of the http or rest modules

    let httpc: httpm.HttpClient = new httpm.HttpClient('vsts-node-api', [nh], { proxy: { proxyUrl: proxyUrl }, keepAlive: true, maxSockets: 30 });
    let res: httpm.HttpClientResponse = await httpc.get(url);
    console.log("response code: " + res.message.statusCode);
}
