/// <reference path="../typings/index.d.ts" />

import * as httpm from 'typed-rest-client/HttpClient';
import * as restm from 'typed-rest-client/RestClient';
import * as fs from 'fs';
import * as path from 'path';
import * as cm from './common';

let sampleFilePath: string = path.join(process.cwd(), 'httpClientStreamSample.txt');

let httpc: httpm.HttpClient = new httpm.HttpClient('vsts-node-api');
let restc: restm.RestClient = new restm.RestClient('vsts-http');

export async function run() {
    let restRes: restm.IRestClientResponse;
    
    try {
        //--------------------------------------
        // HttpClient
        //--------------------------------------

        //
        // Http get.  Can await get response.
        // The response offers a message (IncomingMessage) and
        // an awaitable readBody() which reads the stream to end
        //
        cm.heading('get request output body');
        let res: httpm.HttpClientResponse = await httpc.get('https://httpbin.org/get');
        let status: number = res.message.statusCode;
        let body: string = await res.readBody();
        outputHttpBinResponse(body, status);

        //
        // Http get request reading body to end in a single line
        //
        cm.heading('get request in a single line');
        body = await (await httpc.get('https://httpbin.org/get')).readBody();
        outputHttpBinResponse(body);

        //
        // Http get piping to another stream
        // response message is an IncomingMessage which is a stream
        //
        cm.heading('get request and pipe stream');
        let file: NodeJS.WritableStream = fs.createWriteStream(sampleFilePath);
        (await httpc.get('https://httpbin.org/get')).message.pipe(file);
        body = fs.readFileSync(sampleFilePath).toString();
        outputHttpBinResponse(body);

        // DELETE request
        cm.heading('delete request');
        res = await httpc.del('https://httpbin.org/delete');
        body = await res.readBody();
        outputHttpBinResponse(body, status);

        let b: string = 'Hello World!';

        // POST request
        cm.heading('post request');
        res = await httpc.post('https://httpbin.org/post', b);
        body = await res.readBody();
        outputHttpBinResponse(body, status);       

        // PATCH request
        cm.heading('patch request');
        res = await httpc.patch('https://httpbin.org/patch', b);
        body = await res.readBody();
        outputHttpBinResponse(body, status);

        // GET not found
        cm.heading('get not found');
        res = await httpc.get('https://httpbin.org/status/404');
        body = await res.readBody();
        outputHttpBinResponse(body, status);

        //--------------------------------------
        // RestClient
        //--------------------------------------
        cm.heading('get rest obj');
        restRes = await restc.get('https://httpbin.org/get', '1.0-preview');
        outputRestResponse(restRes);

        let obj: any = { message: "Hello World!" };

        cm.heading('create rest obj');
        restRes = await restc.create('https://httpbin.org/post', '1.0-preview', obj);
        outputRestResponse(restRes);

        cm.heading('update rest obj');
        restRes = await restc.update('https://httpbin.org/patch', '1.0-preview', obj);
        outputRestResponse(restRes);     
    }
    catch (err) {
        console.error('Failed: ' + err.message);
    }
}

//
// Utility functions
//
async function outputHttpBinResponse(body: string, status?: number) {
    if (status) {
        console.log('status', status);
    }
    
    if (body) {
        let obj = JSON.parse(body.toString());
        console.log('response from ' + obj.url);
        if (obj.data) {
            console.log('data:', obj.data);
        }        
    }
}

function outputRestResponse(res: restm.IRestClientResponse) {
    console.log('statusCode:' + res.statusCode);

    if (res && res.result) {
        console.log('response from ' + res.result.url);
        if (res.result.data) {
            console.log('data:', res.result.data);
        }
    }    
}

run();