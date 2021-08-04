// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import assert = require('assert');
import nock = require('nock');
import * as httpm from 'typed-rest-client/HttpClient';
import * as hm from 'typed-rest-client/Handlers';
import * as fs from 'fs';
import * as path from 'path';

let sampleFilePath: string = path.join(__dirname, 'testoutput.txt');

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
        assert(http.userAgent, 'user-agent should not be null')
    });

    it('constructs with null user-agent', () => {
        this.timeout(1000);

        let http: httpm.HttpClient = new httpm.HttpClient(null);
        assert(http, 'http client should not be null');
        assert(http.userAgent == null, 'user-agent should be null')
    });

    it('constructs with undefined user-agent', () => {
        this.timeout(1000);

        let http: httpm.HttpClient = new httpm.HttpClient(undefined);
        assert(http, 'http client should not be null');
        assert(http.userAgent == null, 'user-agent should be null')
    });

    it('constructs with empty user-agent', () => {
        this.timeout(1000);

        let http: httpm.HttpClient = new httpm.HttpClient('');
        assert(http, 'http client should not be null');
        assert(http.userAgent != null, 'user-agent should not be null')
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
        return new Promise<string | void>(async (resolve, reject) => {
            let file: NodeJS.WritableStream = fs.createWriteStream(sampleFilePath);
            (await _http.get('http://microsoft.com')).message.pipe(file).on('close', () => {
                let body: string = fs.readFileSync(sampleFilePath).toString();
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

    it('fails request on redirect protocol downgrade', async() => {
        nock('https://microsoft.com')
            .get('/redirect-to')
            .reply(301, undefined, {
                location:'http://microsoft.com'
            });
        nock('http://microsoft.com')
            .get('/')
            .reply(200, {
                source: "nock"
            });
        try {
            await _http.get('https://microsoft.com/redirect-to');
            assert(false, "The above should fail");
        } catch (err) {
            assert.equal((err as Error).message, "Redirect from HTTPS to HTTP protocol. This downgrade is not allowed for security reasons. If you want to allow this behavior, set the allowRedirectDowngrade option to true.", "Error information.")
        }
    });

    it('does basic get request with redirect when downgrade is allowed', async () => {
        _http = new httpm.HttpClient('typed-test-client-tests', null, { allowRedirectDowngrade: true });
        nock('https://microsoft.com')
            .get('/redirect-to')
            .reply(301, undefined, {
                location:'http://microsoft.com'
            });
        nock('http://microsoft.com')
            .get('/')
            .reply(200, {
                source: "nock"
            });
        let res: httpm.HttpClientResponse = await _http.get('https://microsoft.com/redirect-to');
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

    it('does basic http get request with server response having encoding supported by nodejs', async() => {
        nock('http://microsoft.com')
            .get('/')
            .reply(200, 'Microsoft', {
                'Content-Type': 'text/plain;charset=utf-8'
            });
        let res: httpm.HttpClientResponse = await _http.get('http://microsoft.com');
        let body = await res.readBody();
        assert(body == 'Microsoft', "response should be 'Microsoft'");
    });

    it('does basic http get request with server response having encoding not supported by nodejs', async() => {
        nock('http://microsoft.com')
            .get('/')
            .reply(200, 'Microsoft', {
                'Content-Type': 'text/plain;charset=us-ascii'
            });
        let res: httpm.HttpClientResponse = await _http.get('http://microsoft.com');
        let body = await res.readBody();
        assert(body == 'Microsoft', "response should be 'Microsoft'");
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

    it('handles retries correctly', async() => {
        _http = new httpm.HttpClient('typed-test-client-tests', null, {allowRetries: true, maxRetries: 3});

        let numTries = 0;
        nock('http://microsoft.com')
            .options('/')
            .times(4)
            .reply(504, function(uri, requestBody) {
                numTries += 1;
            });
        let res: httpm.HttpClientResponse = await _http.options('http://microsoft.com');
        assert(numTries == 4, "client should retry on failure");
        assert(res.message.statusCode == 504, "status code should be 504");
    });

    it('doesnt retry non-retryable verbs', async() => {
        _http = new httpm.HttpClient('typed-test-client-tests', null, {allowRetries: true, maxRetries: 3});

        let numTries = 0;
        nock('http://microsoft.com')
            .post('/')
            .reply(504, function(uri, requestBody) {
                numTries += 1;
            });
        let res: httpm.HttpClientResponse = await _http.post('http://microsoft.com', 'abc');
        assert(numTries == 1, "client should not retry on failure");
        assert(res.message.statusCode == 504, "status code should be 504");
    });

    it('doesnt retry non-retryable return codes', async() => {
        _http = new httpm.HttpClient('typed-test-client-tests', null, {allowRetries: true, maxRetries: 3});

        let numTries = 0;
        nock('http://microsoft.com')
            .options('/')
            .times(1)
            .reply(501, function(uri, requestBody) {
                numTries += 1;
            });
        let res: httpm.HttpClientResponse = await _http.options('http://microsoft.com');
        assert(numTries == 1, "client should not retry on failure");
        assert(res.message.statusCode == 501, "status code should be 501");
    });
});

describe('Http Tests with NO_PROXY environment variable', function () {
    let noProxyBeforeTest = undefined;
    before(() => {

    });

    after(() => {

    });

    beforeEach(() => {
        noProxyBeforeTest = process.env["NO_PROXY"];
    });

    afterEach(() => {
        if (undefined !== noProxyBeforeTest) {
            process.env["NO_PROXY"] = noProxyBeforeTest;
        } else {
            delete process.env["NO_PROXY"];
        }
    })

    it('constructs with NO_PROXY', () => {
        this.timeout(1000);
        process.env["NO_PROXY"] = "microsoft.com";
        let http: httpm.HttpClient = new httpm.HttpClient('typed-test-client-tests');
        assert(http, 'http client should not be null');
        assert(http.userAgent, 'user-agent should not be null')
    });

    it('constructs with wildcard in NO_PROXY', () => {
        this.timeout(1000);
        process.env["NO_PROXY"] = "*.microsoft.com";
        let http: httpm.HttpClient = new httpm.HttpClient('typed-test-client-tests');
        assert(http, 'http client should not be null');
        assert(http.userAgent, 'user-agent should not be null')
    });

});