import * as httpm from 'typed-rest-client/HttpClient';
import * as fs from 'fs';
import * as path from 'path';
import * as cm from './common';

let sampleFilePath: string = path.join(process.cwd(), 'httpClientStreamSample.txt');

let httpc: httpm.HttpClient = new httpm.HttpClient('vsts-node-api');

export async function run() {
    try {
        cm.banner('Http Samples');

        //
        // Http get.  Can await get response.
        // The response offers a message (IncomingMessage) and
        // an awaitable readBody() which reads the stream to end
        //
        cm.heading('get request output body');
        let res: httpm.HttpClientResponse = await httpc.get('https://httpbin.org/get');
        let body: string = await res.readBody();
        cm.outputHttpBinResponse(body, res.message);

        //
        // Http get request reading body to end in a single line
        //
        cm.heading('get request in a single line');
        body = await (await httpc.get('https://httpbin.org/get')).readBody();
        cm.outputHttpBinResponse(body);

        //
        // Http get request using a proxy
        //
        cm.heading('get request using the proxy url set in the env variables');
        const proxySettings = {
            proxyUrl: cm.getEnv('PROXY_URL'),
            proxyUsername: cm.getEnv('PROXY_USERNAME'),
            proxyPassword: cm.getEnv('PROXY_PASSWORD'),
            proxyBypassHosts: cm.getEnv('PROXY_BYPASS_HOSTS') ? cm.getEnv('PROXY_BYPASS_HOSTS').split(', ') : undefined
        }
        if (proxySettings.proxyUrl) {
            httpc = new httpm.HttpClient('vsts-node-api', undefined, { proxy: proxySettings });
            body = await (await httpc.get('https://httpbin.org/get')).readBody();
            cm.outputHttpBinResponse(body);
        }
        else {
            console.log("No proxy url set. To set a proxy url, set the PROXY_URL env variable (e.g. set PROXY_URL=proxy.com)");
        }

        //
        // Http get request disabling redirects
        //
        cm.heading('get request disabling redirects');
        httpc = new httpm.HttpClient('vsts-node-api', undefined, { allowRedirects: false });
        res = await httpc.get("http://httpbin.org/redirect-to?url=" + encodeURIComponent("http://httpbin.org/get"))
        body = await res.readBody();
        cm.outputHttpBinResponse(body, res.message);

        // reset the client
        httpc = new httpm.HttpClient('vsts-node-api');

        //
        // Http get request implicity allowing redirects
        //
        cm.heading('get request with implicitly allowed redirects');
        res = await httpc.get("http://httpbin.org/redirect-to?url=" + encodeURIComponent("http://httpbin.org/get"))
        body = await res.readBody();
        cm.outputHttpBinResponse(body, res.message);

        //
        // Http get piping to another stream
        // response message is an IncomingMessage which is a stream
        //
        cm.heading('get request and pipe stream');
        let file: NodeJS.WritableStream = fs.createWriteStream(sampleFilePath);
        (await httpc.get('https://httpbin.org/get')).message.pipe(file);
        body = fs.readFileSync(sampleFilePath).toString();
        cm.outputHttpBinResponse(body);

        // HEAD request
        cm.heading('head request');
        res = await httpc.head('https://httpbin.org/get');
        body = await res.readBody();
        cm.outputHttpBinResponse(body, res.message);

        // DELETE request
        cm.heading('delete request');
        res = await httpc.del('https://httpbin.org/delete');
        body = await res.readBody();
        cm.outputHttpBinResponse(body, res.message);

        let b: string = 'Hello World!';

        // POST request
        cm.heading('post request');
        res = await httpc.post('https://httpbin.org/post', b);
        body = await res.readBody();
        cm.outputHttpBinResponse(body, res.message);

        // PATCH request
        cm.heading('patch request');
        res = await httpc.patch('https://httpbin.org/patch', b);
        body = await res.readBody();
        cm.outputHttpBinResponse(body, res.message);

        cm.heading('options request');
        res = await httpc.options('https://httpbin.org');
        body = await res.readBody();
        cm.outputHttpBinResponse(body, res.message);

        // GET not found
        cm.heading('get not found');
        res = await httpc.get('https://httpbin.org/status/404');
        body = await res.readBody();
        cm.outputHttpBinResponse(body, res.message);
    }
    catch (err) {
        console.error('Failed: ' + err.message);
    }
}
