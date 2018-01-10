import * as hm from 'typed-rest-client/Handlers'
import * as cm from './common';
import * as httpm from 'typed-rest-client/HttpClient';

var httpntlm = require('httpntlm');

export async function run() {
    cm.banner('Handler Samples');

    /* HOME */
    // var username = "stephen";
    // var password = process.env["PW"];
    // var workstation = "DESKTOP-0J7UTAA";
    // var domain = "WORKGROUP";
    // var url = "http://localhost/";

    /* WORK */
    var username = "stfrance"
    var password = process.env["PW"];
    var workstation = "STEPHENMICHAELF";
    var domain = "NORTHAMERICA";
    var url = "http://stephenmichaelf:8080/tfs/DefaultCollection/_projects?_a=new";

    // httpntlm.get({
    //     url: url,
    //     username: username,
    //     password: password,
    //     workstation: workstation,
    //     domain: domain,

    // }, function (err, res){
    //     if(err) return console.log('ERROR: ' + err);
    
    //     console.log('start response log');
    //     console.log("status code inside: " + res.statusCode);
    //     console.log('end response log');
    // });
    // console.log("END FROM ROOT");

    // process.env["NODE_DEBUG"] = "http";
    // console.log(process.env["NODE_DEBUG"]);
    
    let bh: hm.BasicCredentialHandler = new hm.BasicCredentialHandler('johndoe', 'password');
    let ph: hm.PersonalAccessTokenCredentialHandler = new hm.PersonalAccessTokenCredentialHandler('scbfb44vxzku5l4xgc3qfazn3lpk4awflfryc76esaiq7aypcbhs');
    let nh: hm.NtlmCredentialHandler = new hm.NtlmCredentialHandler(username, password, workstation, domain);

    // These handlers would then be passed to the constructors of the http or rest modules

    let httpc: httpm.HttpClient = new httpm.HttpClient('vsts-node-api', [nh]/*, { keepAlive: true }*/);
    let res: httpm.HttpClientResponse = await httpc.get(url);
    console.log("response code: " + res.message.statusCode);
}
