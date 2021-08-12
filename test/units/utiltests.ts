// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import assert = require('assert');
import url = require("url");
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
            let parsedUrl = url.parse("https://microsoft.com/api/resource");
            let bypassed = regExp.test(parsedUrl.href);
            assert.equal(bypassed, true);
        });

        it('bypasses subdomain using wildcard', () => {
            let regExp = util.buildProxyBypassRegexFromEnv('*.microsoft.com');
            assert(regExp, 'regExp should not be null');
            let parsedUrl = url.parse("https://subdomain.microsoft.com/api/resource");
            let bypassed = regExp.test(parsedUrl.href);
            assert.equal(bypassed, true);
        });       

    });

});