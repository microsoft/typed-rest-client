/// <reference path="../typings/index.d.ts" />

import * as httpm from 'typed-rest-client/HttpClient';
import * as fs from 'fs';
import * as path from 'path';
import * as cm from './common';

let sampleFilePath: string = path.join(process.cwd(), 'httpClientStreamSample.txt');

let httpc: httpm.HttpClient = new httpm.HttpClient('vsts-node-api');

export async function run() {    
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
        cm.outputHttpBinResponse(body, status);

        //
        // Http get request reading body to end in a single line
        //
        cm.heading('get request in a single line');
        body = await (await httpc.get('https://httpbin.org/get')).readBody();
        cm.outputHttpBinResponse(body);

        //
        // Http get piping to another stream
        // response message is an IncomingMessage which is a stream
        //
        cm.heading('get request and pipe stream');
        let file: NodeJS.WritableStream = fs.createWriteStream(sampleFilePath);
        (await httpc.get('https://httpbin.org/get')).message.pipe(file);
        body = fs.readFileSync(sampleFilePath).toString();
        cm.outputHttpBinResponse(body);

        // DELETE request
        cm.heading('delete request');
        res = await httpc.del('https://httpbin.org/delete');
        body = await res.readBody();
        cm.outputHttpBinResponse(body, status);

        let b: string = 'Hello World!';

        // POST request
        cm.heading('post request');
        res = await httpc.post('https://httpbin.org/post', b);
        body = await res.readBody();
        cm.outputHttpBinResponse(body, status);       

        // PATCH request
        cm.heading('patch request');
        res = await httpc.patch('https://httpbin.org/patch', b);
        body = await res.readBody();
        cm.outputHttpBinResponse(body, status);

        // GET not found
        cm.heading('get not found');
        res = await httpc.get('https://httpbin.org/status/404');
        body = await res.readBody();
        cm.outputHttpBinResponse(body, status);
    }
    catch (err) {
        console.error('Failed: ' + err.message);
    }
}
