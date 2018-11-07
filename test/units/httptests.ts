// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import assert = require('assert');
import nock = require('nock');
import * as httpm from 'typed-rest-client/HttpClient';
import * as hm from 'typed-rest-client/Handlers';
import { WritableStreamBuffer } from 'stream-buffers';
import * as path from 'path';


describe('Http Tests', function () {
    let _http: httpm.HttpClient;

    before(() => {
        _http = new httpm.HttpClient('typed-test-client-tests');
    });

    after(() => {
    });

    afterEach(() => {
        nock.cleanAll();
    })

    it('constructs', () => {
        this.timeout(1000);

        let http: httpm.HttpClient = new httpm.HttpClient('typed-test-client-tests');
        assert(http, 'http client should not be null');
    });

    it('does basic http get request', async() => {
        nock('http://microsoft.com')
            .get('/')
            .reply(200, {
                source: "nock"
            });
        let res: httpm.HttpClientResponse = await _http.get('http://microsoft.com');
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();      
        let obj: any = JSON.parse(body);
        assert(obj.source === "nock", "http get request should be intercepted by nock");
    })

    it('does basic http get request with basic auth', async() => {
        //Set nock for correct credentials
        nock('http://microsoft.com')
            .get('/')
            .basicAuth({
                user: 'johndoe',
                pass: 'password'
            })
            .reply(200, {
                success: true,
                source: "nock"
            });
        //Set nock for request without credentials or with incorrect credentials
        nock('http://microsoft.com')
            .get('/')
            .reply(200, {
                success: false,
                source: "nock"
            });
        let bh: hm.BasicCredentialHandler = new hm.BasicCredentialHandler('johndoe', 'password');
        let http: httpm.HttpClient = new httpm.HttpClient('typed-rest-client-tests', [bh]);
        let res: httpm.HttpClientResponse = await http.get('http://microsoft.com');
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();      
        let obj: any = JSON.parse(body);
        assert(obj.source === "nock", "http get request should be intercepted by nock");
        assert(obj.success, "Authentication should succeed");
    });
    
    it('does basic http get request with pat token auth', async() => {
        let token: string = 'scbfb44vxzku5l4xgc3qfazn3lpk4awflfryc76esaiq7aypcbhs';
        let pat: string = new Buffer('PAT:' + token).toString('base64')
        //Set nock for correct credentials
        nock('http://microsoft.com', {
            reqheaders: {
                'Authorization': 'Basic ' + pat,
                'X-TFS-FedAuthRedirect': 'Suppress'
            }})
            .get('/')
            .reply(200, {
                success: true,
                source: "nock"
            });
        //Set nock for request without credentials or with incorrect credentials
        nock('http://microsoft.com')
            .get('/')
            .reply(200, {
                success: false,
                source: "nock"
            });
        let ph: hm.PersonalAccessTokenCredentialHandler = 
            new hm.PersonalAccessTokenCredentialHandler(token);
        let http: httpm.HttpClient = new httpm.HttpClient('typed-rest-client-tests', [ph]);
        let res: httpm.HttpClientResponse = await http.get('http://microsoft.com');
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();      
        let obj: any = JSON.parse(body);
        assert(obj.source === "nock", "http get request should be intercepted by nock");
        assert(obj.success, "Authentication should succeed");
    });

    it('does basic http get request with default headers', async() => {
        //Set nock for correct credentials
        nock('http://microsoft.com', {
            reqheaders: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .get('/')
            .reply(200, {
            success: true,
            source: "nock"
        });
        let http: httpm.HttpClient = new httpm.HttpClient('typed-rest-client-tests', [], {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        let res: httpm.HttpClientResponse = await http.get('http://microsoft.com');
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();      
        let obj: any = JSON.parse(body);
        assert(obj.source === "nock", "http get request should be intercepted by nock");
        assert(obj.success, "Headers should send");
    });

    it('does basic http get request with merged headers', async() => {
        //Set nock for correct credentials
        nock('http://microsoft.com', {
            reqheaders: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
            .get('/')
            .reply(200, {
            success: true,
            source: "nock"
        });
        let http: httpm.HttpClient = new httpm.HttpClient('typed-rest-client-tests', [], {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        let res: httpm.HttpClientResponse = await http.get('http://microsoft.com', {
            'content-type': 'application/x-www-form-urlencoded'
        });
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();      
        let obj: any = JSON.parse(body);
        assert(obj.source === "nock", "http get request should be intercepted by nock");
        assert(obj.success, "Headers should merge/send");
    });

    it('pipes a get request', () => {
        nock('http://microsoft.com')
            .get('/')
            .reply(200, {
                url: "http://microsoft.com"
            });
        return new Promise<string>(async (resolve, reject) => {
            let file: WritableStreamBuffer = new WritableStreamBuffer();
            (await _http.get('http://microsoft.com')).message.pipe(file).on('finish', () => {
                let body: string = file.getContentsAsString('utf8');
                let obj:any = JSON.parse(body);
                assert(obj.url === "http://microsoft.com", "response from piped stream should have url");
                resolve();
            });
        });
    });
    
    it('does basic get request with redirects', async() => {
        nock('http://microsoft.com')
            .get('/redirect-to')
            .reply(301, undefined, {
                location:'http://microsoft.com'
            });
        nock('http://microsoft.com')
            .get('/')
            .reply(200, {
                source: "nock"
            });
        let res: httpm.HttpClientResponse = await _http.get('http://microsoft.com/redirect-to');
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();      
        let obj: any = JSON.parse(body);
        assert(obj.source === "nock", "request should redirect to mocked page");
    });

    it('does basic get request with redirects (303)', async() => {
        nock('http://microsoft.com')
            .get('/redirect-to')
            .reply(303, undefined, {
                location:'http://microsoft.com'
            });
        nock('http://microsoft.com')
            .get('/')
            .reply(200, {
                source: "nock"
            });
        let res: httpm.HttpClientResponse = await _http.get('http://microsoft.com/redirect-to');
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();      
        let obj: any = JSON.parse(body);
        assert(obj.source === "nock", "request should redirect to mocked page");
    });

    it('returns 404 for not found get request on redirect', async() => {
        nock('http://microsoft.com')
        .get('/redirect-to')
        .reply(301, undefined, {
            location:'http://badmicrosoft.com'
        });
        nock('http://badmicrosoft.com')
        .get('/')
        .reply(404, {
            source: "nock"
        });
    let res: httpm.HttpClientResponse = await _http.get('http://microsoft.com/redirect-to');
    assert(res.message.statusCode == 404, "status code should be 404");
    let body: string = await res.readBody();      
    let obj: any = JSON.parse(body);
    assert(obj.source === "nock", "request should redirect to mocked missing");
    });

    it('does not follow redirects if disabled', async() => {
        nock('http://microsoft.com')
        .get('/redirect-to')
        .reply(302, undefined, {
            location:'http://microsoft.com'
        });
        nock('http://microsoft.com')
            .get('/')
            .reply(200, {
                source: "nock"
            });
        let http: httpm.HttpClient = new httpm.HttpClient('typed-test-client-tests', null, { allowRedirects: false });
        let res: httpm.HttpClientResponse = await http.get('http://microsoft.com/redirect-to');
        assert(res.message.statusCode == 302, "status code should be 302");
        let body: string = await res.readBody();
    });

    it('does basic head request', async() => {
        nock('http://microsoft.com')
            .head('/')
            .reply(200, {
                source: "nock"
            });
        let res: httpm.HttpClientResponse = await _http.head('http://microsoft.com');
        assert(res.message.statusCode == 200, "status code should be 200");
    });

    it('does basic http delete request', async() => {
        nock('http://microsoft.com')
            .delete('/')
            .reply(200, {
                source: "nock"
            });
        let res: httpm.HttpClientResponse = await _http.del('http://microsoft.com');
        assert(res.message.statusCode == 200, "status code should be 200");
    });

    it('does basic http post request', async() => {
        nock('http://microsoft.com')
            .post('/')
            .reply(200, function(uri, requestBody) {
                return {data: requestBody};
            });
        let b: string = 'Hello World!';
        let res: httpm.HttpClientResponse = await _http.post('http://microsoft.com', b);
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();
        let obj:any = JSON.parse(body);
        assert(obj.data === b);
    });
    
    it('does basic http patch request', async() => {
        nock('http://microsoft.com')
            .patch('/')
            .reply(200, function(uri, requestBody) {
                return {data: requestBody};
            });
        let b: string = 'Hello World!';
        let res: httpm.HttpClientResponse = await _http.patch('http://microsoft.com', b);
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();
        let obj:any = JSON.parse(body);
        assert(obj.data === b);
    });
    
    it('does basic http options request', async() => {
        nock('http://microsoft.com')
            .options('/')
            .reply(200);
        let res: httpm.HttpClientResponse = await _http.options('http://microsoft.com');
        assert(res.message.statusCode == 200, "status code should be 200");
    });
    
    it('returns 404 for not found get request', async() => {
        nock('http://badmicrosoft.com')
            .get('/')
            .reply(404);
        let res: httpm.HttpClientResponse = await _http.get('http://badmicrosoft.com');
        assert(res.message.statusCode == 404, "status code should be 404");
        let body: string = await res.readBody();
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
        nock('http://microsoft.com')
            .get('/')
            .reply(200, {
                source: "nock"
            });
        let res: httpm.HttpClientResponse = await _http.get('http://microsoft.com');
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();      
        let obj: any = JSON.parse(body);
        assert(obj.source === "nock", "http get request should be intercepted by nock");
    });

    it('does basic head request with keepAlive true', async() => {
        nock('http://microsoft.com')
            .head('/')
            .reply(200, {
                source: "nock"
            });
        let res: httpm.HttpClientResponse = await _http.head('http://microsoft.com');
        assert(res.message.statusCode == 200, "status code should be 200");
    });    

    it('does basic http delete request with keepAlive true', async() => {
        nock('http://microsoft.com')
            .delete('/')
            .reply(200, {
                source: "nock"
            });
        let res: httpm.HttpClientResponse = await _http.del('http://microsoft.com');
        assert(res.message.statusCode == 200, "status code should be 200");
    });

    it('does basic http post request with keepAlive true', async() => {
        nock('http://microsoft.com')
            .post('/')
            .reply(200, function(uri, requestBody) {
                return {data: requestBody};
            });
        let b: string = 'Hello World!';
        let res: httpm.HttpClientResponse = await _http.post('http://microsoft.com', b);
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();
        let obj:any = JSON.parse(body);
        assert(obj.data === b);
    });
    
    it('does basic http patch request with keepAlive true', async() => {
        nock('http://microsoft.com')
            .patch('/')
            .reply(200, function(uri, requestBody) {
                return {data: requestBody};
            });
        let b: string = 'Hello World!';
        let res: httpm.HttpClientResponse = await _http.patch('http://microsoft.com', b);
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();
        let obj:any = JSON.parse(body);
        assert(obj.data === b);
    }); 
    
    it('does basic http options request with keepAlive true', async() => {
        nock('http://microsoft.com')
            .options('/')
            .reply(200);
        let res: httpm.HttpClientResponse = await _http.options('http://microsoft.com');
        assert(res.message.statusCode == 200, "status code should be 200");
    });
});