// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import assert = require('assert');
import * as httpm from 'typed-rest-client/HttpClient';
import * as hm from 'typed-rest-client/Handlers';
import * as fs from 'fs';
import * as path from 'path';

let sampleFilePath: string = path.join(__dirname, 'testoutput.txt');

describe('Http Tests', function () {
    let _http: httpm.HttpClient;
    let _httpbin: httpm.HttpClient;

    before(() => {
        _http = new httpm.HttpClient('typed-rest-client-tests'/*, null, {proxy: { proxyUrl: "http://127.0.0.1:8888" } }*/);
    });

    after(() => {
    });

    it('constructs', () => {
        this.timeout(1000);

        let http: httpm.HttpClient = new httpm.HttpClient('typed-rest-client-tests');
        assert(http, 'http client should not be null');
    });

    // responses from httpbin return something like:
    // {
    //     "args": {}, 
    //     "headers": {
    //       "Connection": "close", 
    //       "Host": "httpbin.org", 
    //       "User-Agent": "typed-rest-client-tests"
    //     }, 
    //     "origin": "173.95.152.44", 
    //     "url": "https://httpbin.org/get"
    //  }  
    it('does basic http get request', async() => {
        let res: httpm.HttpClientResponse = await _http.get('http://httpbin.org/get');
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();      
        let obj:any = JSON.parse(body);
        assert(obj.url === "http://httpbin.org/get");
    });

    it('does basic https get request', async() => {
        let res: httpm.HttpClientResponse = await _http.get('https://httpbin.org/get');
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();
        let obj:any = JSON.parse(body);
        assert(obj.url === "https://httpbin.org/get");
    });

    it('does basic http get request with basic auth', async() => {
        let bh: hm.BasicCredentialHandler = new hm.BasicCredentialHandler('johndoe', 'password');
        let http: httpm.HttpClient = new httpm.HttpClient('typed-rest-client-tests', [bh]);
        let res: httpm.HttpClientResponse = await http.get('http://httpbin.org/get');
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody(); 
        let obj:any = JSON.parse(body);
        let auth: string = obj.headers.Authorization;
        let creds: string = Buffer.from(auth.substring('Basic '.length), 'base64').toString();
        assert(creds === 'johndoe:password', "should be the username and password");
        assert(obj.url === "http://httpbin.org/get");
    });
    
    it('does basic http get request with pat token auth', async() => {
        let token: string = 'scbfb44vxzku5l4xgc3qfazn3lpk4awflfryc76esaiq7aypcbhs';
        let ph: hm.PersonalAccessTokenCredentialHandler = 
            new hm.PersonalAccessTokenCredentialHandler(token);
        let http: httpm.HttpClient = new httpm.HttpClient('typed-rest-client-tests', [ph]);
        let res: httpm.HttpClientResponse = await http.get('http://httpbin.org/get');
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody(); 
        let obj:any = JSON.parse(body);
        let auth: string = obj.headers.Authorization;
        let creds: string = Buffer.from(auth.substring('Basic '.length), 'base64').toString();
        assert(creds === 'PAT:' + token, "creds should be the token");
        assert(obj.url === "http://httpbin.org/get");
    });

    it('pipes a get request', () => {
        return new Promise<string>(async (resolve, reject) => {
            let file: NodeJS.WritableStream = fs.createWriteStream(sampleFilePath);
            (await _http.get('https://httpbin.org/get')).message.pipe(file).on('close', () => {
                let body: string = fs.readFileSync(sampleFilePath).toString();
                let obj:any = JSON.parse(body);
                assert(obj.url === "https://httpbin.org/get", "response from piped stream should have url");
                resolve();
            });
        });
    });
    
    it('does basic get request with redirects', async() => {
        let res: httpm.HttpClientResponse = await _http.get("https://httpbin.org/redirect-to?url=" + encodeURIComponent("https://httpbin.org/get"))
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();
        let obj:any = JSON.parse(body);
        assert(obj.url === "https://httpbin.org/get");
    });
    
    it('does not follow redirects if disabled', async() => {
        let http: httpm.HttpClient = new httpm.HttpClient('typed-test-client-tests', null, { allowRedirects: false });
        let res: httpm.HttpClientResponse = await http.get("https://httpbin.org/redirect-to?url=" + encodeURIComponent("https://httpbin.org/get"))
        assert(res.message.statusCode == 302, "status code should be 302");
        let body: string = await res.readBody();
    });
    
    it('does basic head request', async() => {
        let res: httpm.HttpClientResponse = await _http.head('http://httpbin.org/get');
        assert(res.message.statusCode == 200, "status code should be 200");
    });

    it('does basic http delete request', async() => {
        let res: httpm.HttpClientResponse = await _http.del('http://httpbin.org/delete');
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();      
        let obj:any = JSON.parse(body);
    });

    it('does basic http post request', async() => {
        let b: string = 'Hello World!';
        let res: httpm.HttpClientResponse = await _http.post('http://httpbin.org/post', b);
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();
        let obj:any = JSON.parse(body);
        assert(obj.data === b);
        assert(obj.url === "http://httpbin.org/post");
    });
    
    it('does basic http patch request', async() => {
        let b: string = 'Hello World!';
        let res: httpm.HttpClientResponse = await _http.patch('http://httpbin.org/patch', b);
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();
        let obj:any = JSON.parse(body);
        assert(obj.data === b);
        assert(obj.url === "http://httpbin.org/patch");
    });
    
    it('does basic http options request', async() => {
        let res: httpm.HttpClientResponse = await _http.options('http://httpbin.org');
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();
    });
    
    it('returns 404 for not found get request', async() => {
        let res: httpm.HttpClientResponse = await _http.get('http://httpbin.org/status/404');
        assert(res.message.statusCode == 404, "status code should be 404");
        let body: string = await res.readBody();
    });

    it('sends headers with http requests', async() => {
        this.timeout(5000);
        // calls to /headers returns something like the following (in the body)
        // {"headers":{"Accept":"application/json","Connection":"close","Host":"httpbin.org","User-Agent":"typed-rest-client-tests"}}

        // set the headers in the method call
        let res: httpm.HttpClientResponse = await _http.get('http://httpbin.org/headers', { 'Accept': 'application/json'});
        let body: any = JSON.parse(await res.readBody());
        assert(body.headers.Accept === 'application/json');
        
        // set the headers in the constructor
        let http2: httpm.HttpClient = new httpm.HttpClient('typed-rest-client-tests', null, { headers: { 'Accept': 'application/json'} });
        let res2: httpm.HttpClientResponse = await _http.get('http://httpbin.org/headers');
        let body2: any = JSON.parse(await res.readBody());
        assert(body2.headers.Accept === 'application/json');

        // set the headers in both, method call should supersede
        let http3: httpm.HttpClient = new httpm.HttpClient('typed-rest-client-tests', null, { headers: { 'Accept': 'application/json1'} });
        let res3: httpm.HttpClientResponse = await _http.get('http://httpbin.org/headers', { 'Accept': 'application/json2'});
        let body3: any = JSON.parse(await res.readBody());
        assert(body3.headers.Accept === 'application/json2');
    });
});

describe('Http Tests with keepAlive', function () {
    let _http: httpm.HttpClient;

    before(() => {
        _http = new httpm.HttpClient('typed-test-client-tests', [], { keepAlive: true });
    });

    after(() => {
    });

    it('does basic http get request with keepAlive true', async() => {
        let res: httpm.HttpClientResponse = await _http.get('http://httpbin.org/get');
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();      
        let obj:any = JSON.parse(body);
        assert(obj.url === "http://httpbin.org/get");
    });

    it('does basic head request with keepAlive true', async() => {
        let res: httpm.HttpClientResponse = await _http.head('http://httpbin.org/get');
        assert(res.message.statusCode == 200, "status code should be 200");
    });    

    it('does basic http delete request with keepAlive true', async() => {
        let res: httpm.HttpClientResponse = await _http.del('http://httpbin.org/delete');
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();      
        let obj:any = JSON.parse(body);
    });

    it('does basic http post request with keepAlive true', async() => {
        let b: string = 'Hello World!';
        let res: httpm.HttpClientResponse = await _http.post('http://httpbin.org/post', b);
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();
        let obj:any = JSON.parse(body);
        assert(obj.data === b);
        assert(obj.url === "http://httpbin.org/post");
    });
    
    it('does basic http patch request with keepAlive true', async() => {
        let b: string = 'Hello World!';
        let res: httpm.HttpClientResponse = await _http.patch('http://httpbin.org/patch', b);
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();
        let obj:any = JSON.parse(body);
        assert(obj.data === b);
        assert(obj.url === "http://httpbin.org/patch");
    }); 
    
    it('does basic http options request with keepAlive true', async() => {
        let res: httpm.HttpClientResponse = await _http.options('http://httpbin.org');
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();
    });
});