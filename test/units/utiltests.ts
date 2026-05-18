// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import assert = require('assert');
import * as util from '../../lib/Util';

describe('Util Tests', function () {

    before(() => {

    });

    after(() => {
    });

    describe('buildProxyBypassRegexFromEnv', () => {
        it('constructs RegExp for domain', () => {
            let regExp = util.buildProxyBypassRegexFromEnv('microsoft.com');
            assert(regExp, 'regExp should not be null');
        });

        it('constructs RegExp for wildcard domain', () => {
            let regExp = util.buildProxyBypassRegexFromEnv('*.microsoft.com');
            assert(regExp, 'regExp should not be null');
        });

        it('bypasses same domain', () => {
            let regExp = util.buildProxyBypassRegexFromEnv('microsoft.com');
            assert(regExp, 'regExp should not be null');
            let parsedUrl = new URL("https://microsoft.com/api/resource");
            let bypassed = regExp.test(parsedUrl.href);
            assert.equal(bypassed, true);
        });

        it('bypasses subdomain using wildcard', () => {
            let regExp = util.buildProxyBypassRegexFromEnv('*.microsoft.com');
            assert(regExp, 'regExp should not be null');
            let parsedUrl = new URL("https://subdomain.microsoft.com/api/resource");
            let bypassed = regExp.test(parsedUrl.href);
            assert.equal(bypassed, true);
        });       

    });

    describe('getUrl edge cases', () => {
        it('resolves absolute resource ignoring baseUrl', () => {
            let res: string = util.getUrl('http://other-server.com/path', 'http://base-server.com');
            assert.strictEqual(res, 'http://other-server.com/path', 'absolute resource should ignore baseUrl');
        });

        it('resolves relative resource appending to baseUrl with path', () => {
            let res: string = util.getUrl('sub/path', 'http://server.com/api/v1');
            assert.strictEqual(res, 'http://server.com/api/v1/sub/path', `should append to base path but got ${res}`);
        });

        it('resolves relative resource appending to baseUrl with trailing slash', () => {
            let res: string = util.getUrl('sub/path', 'http://server.com/api/v1/');
            assert.strictEqual(res, 'http://server.com/api/v1/sub/path', `should append to base path but got ${res}`);
        });

        it('resolves rooted resource replacing path of baseUrl', () => {
            let res: string = util.getUrl('/new/path', 'http://server.com/api/v1');
            assert.strictEqual(res, 'http://server.com/new/path', `rooted path should replace base path but got ${res}`);
        });

        it('preserves trailing slash on resource', () => {
            let res: string = util.getUrl('resources/', 'http://server.com/api');
            assert(res.endsWith('/'), `result should end with trailing slash: ${res}`);
        });

        it('preserves query parameters from resource', () => {
            let res: string = util.getUrl('/path?key=value', 'http://server.com');
            assert.strictEqual(res, 'http://server.com/path?key=value', `should preserve query params but got ${res}`);
        });

        it('handles baseUrl with port', () => {
            let res: string = util.getUrl('resource', 'http://server.com:8080/api');
            assert(res.indexOf(':8080') > -1, `should preserve port in result: ${res}`);
            assert(res.indexOf('resource') > -1, `should contain resource: ${res}`);
        });

        it('handles resource with fragment', () => {
            let res: string = util.getUrl('/path#section', 'http://server.com');
            assert.strictEqual(res, 'http://server.com/path#section', `should preserve fragment but got ${res}`);
        });
    });

});