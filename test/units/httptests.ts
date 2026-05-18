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
        return new Promise<void>(async (resolve, reject) => {
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

describe('Http Proxy Tunnel Tests', function () {

    it('creates tunnel agent with numeric port from explicit proxy port', () => {
        let http: httpm.HttpClient = new httpm.HttpClient('typed-test-client-tests', [], {
            proxy: {
                proxyUrl: 'http://proxy-server:8080'
            }
        });

        let agent = (http as any)._getAgent(new URL('http://target-server/artifact'));
        let proxyAgent = (http as any)._proxyAgent;

        assert(proxyAgent, 'proxy agent should be created');
        assert.strictEqual(proxyAgent.options.proxy.port, 8080, 'port should be numeric 8080');
        assert.strictEqual(typeof proxyAgent.options.proxy.port, 'number', 'port type should be number');
    });

    it('creates tunnel agent defaulting to port 80 for HTTP proxy without explicit port', () => {
        let http: httpm.HttpClient = new httpm.HttpClient('typed-test-client-tests', [], {
            proxy: {
                proxyUrl: 'http://proxy-server'
            }
        });

        let agent = (http as any)._getAgent(new URL('http://target-server/artifact'));
        let proxyAgent = (http as any)._proxyAgent;

        assert(proxyAgent, 'proxy agent should be created');
        assert.strictEqual(proxyAgent.options.proxy.port, 80, 'port should default to 80 for HTTP proxy');
        assert.strictEqual(typeof proxyAgent.options.proxy.port, 'number', 'port type should be number');
    });

    it('creates tunnel agent defaulting to port 443 for HTTPS proxy without explicit port', () => {
        let http: httpm.HttpClient = new httpm.HttpClient('typed-test-client-tests', [], {
            proxy: {
                proxyUrl: 'https://secure-proxy'
            }
        });

        let agent = (http as any)._getAgent(new URL('https://target-server/artifact'));
        let proxyAgent = (http as any)._proxyAgent;

        assert(proxyAgent, 'proxy agent should be created');
        assert.strictEqual(proxyAgent.options.proxy.port, 443, 'port should default to 443 for HTTPS proxy');
        assert.strictEqual(typeof proxyAgent.options.proxy.port, 'number', 'port type should be number');
    });

    it('creates tunnel agent for HTTPS target through HTTP proxy', () => {
        let http: httpm.HttpClient = new httpm.HttpClient('typed-test-client-tests', [], {
            proxy: {
                proxyUrl: 'http://proxy-server:3128'
            }
        });

        let agent = (http as any)._getAgent(new URL('https://target-server/artifact'));
        let proxyAgent = (http as any)._proxyAgent;

        assert(proxyAgent, 'proxy agent should be created for HTTPS target through HTTP proxy');
        assert.strictEqual(proxyAgent.options.proxy.host, 'proxy-server');
        assert.strictEqual(proxyAgent.options.proxy.port, 3128);
    });

    it('creates tunnel agent for HTTP target through HTTP proxy', () => {
        let http: httpm.HttpClient = new httpm.HttpClient('typed-test-client-tests', [], {
            proxy: {
                proxyUrl: 'http://proxy-server:3128'
            }
        });

        let agent = (http as any)._getAgent(new URL('http://target-server/artifact'));
        let proxyAgent = (http as any)._proxyAgent;

        assert(proxyAgent, 'proxy agent should be created for HTTP target through HTTP proxy');
        assert.strictEqual(proxyAgent.options.proxy.host, 'proxy-server');
        assert.strictEqual(proxyAgent.options.proxy.port, 3128);
    });

    it('passes proxy auth credentials to tunnel agent', () => {
        let http: httpm.HttpClient = new httpm.HttpClient('typed-test-client-tests', [], {
            proxy: {
                proxyUrl: 'http://proxy-server:8080',
                proxyUsername: 'admin',
                proxyPassword: 'p@ss:w0rd#!'
            }
        });

        let agent = (http as any)._getAgent(new URL('http://target-server/artifact'));
        let proxyAgent = (http as any)._proxyAgent;

        assert(proxyAgent, 'proxy agent should be created');
        assert.strictEqual(proxyAgent.options.proxy.proxyAuth, 'admin:p@ss:w0rd#!');
    });

    it('does not create tunnel agent when proxy bypass matches', () => {
        let http: httpm.HttpClient = new httpm.HttpClient('typed-test-client-tests', [], {
            proxy: {
                proxyUrl: 'http://proxy-server:8080',
                proxyBypassHosts: ['target-server']
            }
        });

        let agent = (http as any)._getAgent(new URL('http://target-server/artifact'));
        let proxyAgent = (http as any)._proxyAgent;

        assert(!proxyAgent, 'proxy agent should not be created when host is bypassed');
    });

    it('resolves proxy from HTTP_PROXY environment variable', () => {
        let httpProxyBefore = process.env["HTTP_PROXY"];
        process.env["HTTP_PROXY"] = "http://env-proxy:9090";

        try {
            let http: httpm.HttpClient = new httpm.HttpClient('typed-test-client-tests');
            let proxy = (http as any)._getProxy(new URL('http://target-server/artifact'));
            assert(proxy.proxyUrl, 'proxy should be resolved from env');
            assert.strictEqual(proxy.proxyUrl.hostname, 'env-proxy');
            assert.strictEqual(proxy.proxyUrl.port, '9090');
        } finally {
            if (httpProxyBefore !== undefined) {
                process.env["HTTP_PROXY"] = httpProxyBefore;
            } else {
                delete process.env["HTTP_PROXY"];
            }
        }
    });

    it('reuses cached proxy agent for subsequent requests with keepAlive', () => {
        let http: httpm.HttpClient = new httpm.HttpClient('typed-test-client-tests', [], {
            keepAlive: true,
            proxy: {
                proxyUrl: 'http://proxy-server:8080'
            }
        });

        let agent1 = (http as any)._getAgent(new URL('http://target-server/artifact1'));
        let agent2 = (http as any)._getAgent(new URL('http://target-server/artifact2'));

        assert.strictEqual(agent1, agent2, 'should reuse the same cached proxy agent');
    });

    it('prepareRequest sets correct port from URL with explicit port', () => {
        let http: httpm.HttpClient = new httpm.HttpClient('typed-test-client-tests');
        let info = (http as any)._prepareRequest('GET', new URL('http://server:9090/path'), {});

        assert.strictEqual(info.options.port, 9090, 'port should be parsed as number');
        assert.strictEqual(info.options.host, 'server');
        assert.strictEqual(info.options.path, '/path');
    });

    it('prepareRequest defaults to port 443 for HTTPS URL without explicit port', () => {
        let http: httpm.HttpClient = new httpm.HttpClient('typed-test-client-tests');
        let info = (http as any)._prepareRequest('GET', new URL('https://server/path'), {});

        assert.strictEqual(info.options.port, 443, 'port should default to 443 for HTTPS');
    });

    it('prepareRequest defaults to port 80 for HTTP URL without explicit port', () => {
        let http: httpm.HttpClient = new httpm.HttpClient('typed-test-client-tests');
        let info = (http as any)._prepareRequest('GET', new URL('http://server/path'), {});

        assert.strictEqual(info.options.port, 80, 'port should default to 80 for HTTP');
    });

    it('prepareRequest preserves query string in path', () => {
        let http: httpm.HttpClient = new httpm.HttpClient('typed-test-client-tests');
        let info = (http as any)._prepareRequest('GET', new URL('http://server/api?param=value&other=123'), {});

        assert.strictEqual(info.options.path, '/api?param=value&other=123', 'path should include query string');
    });
});

describe('Http Redirect Tests with relative URLs', function () {

    afterEach(() => {
        nock.cleanAll();
    });

    it('handles relative redirect Location header', async() => {
        let _http: httpm.HttpClient = new httpm.HttpClient('typed-test-client-tests');
        nock('http://microsoft.com')
            .get('/old-path')
            .reply(301, undefined, {
                location: '/new-path'
            });
        nock('http://microsoft.com')
            .get('/new-path')
            .reply(200, {
                source: "nock",
                redirected: true
            });

        let res: httpm.HttpClientResponse = await _http.get('http://microsoft.com/old-path');
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();
        let obj: any = JSON.parse(body);
        assert(obj.redirected === true, "should have followed relative redirect");
    });

    it('handles relative redirect with path-only Location', async() => {
        let _http: httpm.HttpClient = new httpm.HttpClient('typed-test-client-tests');
        nock('http://microsoft.com')
            .get('/api/v1/resource')
            .reply(302, undefined, {
                location: '../v2/resource'
            });
        nock('http://microsoft.com')
            .get('/api/v2/resource')
            .reply(200, {
                source: "nock",
                version: "v2"
            });

        let res: httpm.HttpClientResponse = await _http.get('http://microsoft.com/api/v1/resource');
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();
        let obj: any = JSON.parse(body);
        assert(obj.version === "v2", "should have followed relative path redirect");
    });

    it('handles absolute redirect preserving correct behavior', async() => {
        let _http: httpm.HttpClient = new httpm.HttpClient('typed-test-client-tests');
        nock('http://microsoft.com')
            .get('/redirect-to')
            .reply(307, undefined, {
                location: 'http://other-server.com/new-location'
            });
        nock('http://other-server.com')
            .get('/new-location')
            .reply(200, {
                source: "nock",
                server: "other"
            });

        let res: httpm.HttpClientResponse = await _http.get('http://microsoft.com/redirect-to');
        assert(res.message.statusCode == 200, "status code should be 200");
        let body: string = await res.readBody();
        let obj: any = JSON.parse(body);
        assert(obj.server === "other", "should have followed absolute redirect to other server");
    });
});