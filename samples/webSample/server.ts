import http = require('http');
import * as cm from '../common';
import * as httpm from 'typed-rest-client/HttpClient';
import * as restm from 'typed-rest-client/RestClient';
var port = process.env.port || 1337
let httpc: httpm.HttpClient = new httpm.HttpClient('vsts-node-api');
let restc: restm.RestClient = new restm.RestClient('rest-samples', 'https://httpbin.org');

function formatRestResponse(res: restm.IRestResponse<cm.HttpBinData>): string {
    let output_string = "";
    output_string += "Status code: " + res.statusCode;
    output_string += "\nurl: " + res.result.url;
    return output_string;
}

http.createServer(async function (req, res) {
    let output: string = "HTTP example\n";
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    const result: httpm.HttpClientResponse = await httpc.get('https://httpbin.org/get');
    const body: string =  await result.readBody();
    output += body;
    const restResponse: restm.IRestResponse<cm.HttpBinData> = await restc.get<cm.HttpBinData>('get');
    output += "\nRest example\n" + formatRestResponse(restResponse);
    res.end(output);
}).listen(port);