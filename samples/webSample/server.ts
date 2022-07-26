import http = require('http');

import * as httpm from 'typed-rest-client/HttpClient';
import * as restm from 'typed-rest-client/RestClient';

interface HttpBinData {
    url: string;
    data: any;
}

const port = process.env.port || 1337

const httpc: httpm.HttpClient = new httpm.HttpClient('vsts-node-api');
const restc: restm.RestClient = new restm.RestClient('rest-samples', 'https://httpbin.org');

function formatRestResponse(res: restm.IRestResponse<HttpBinData>): string {
    let output_string = "";

    output_string += "Status code: " + res.statusCode;
    output_string += "\nurl: " + res.result.url;

    return output_string;
}

http.createServer(async function (req, res) {
    let output: string = "HTTP example\n";

    res.writeHead(200, { 'Content-Type': 'text/plain' });

    const result: httpm.HttpClientResponse = await httpc.get('https://httpbin.org/get');
    const body: string = await result.readBody();
    output += body;

    const restResponse: restm.IRestResponse<HttpBinData> = await restc.get<HttpBinData>('get');
    output += "\nRest example\n" + formatRestResponse(restResponse);

    res.end(output);
}).listen(port, () => {
    console.log(`Server alive on port: ${port}.\nhttp://localhost:${port}`);
});