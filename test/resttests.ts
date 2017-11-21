// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import assert = require('assert');
import * as restm from 'typed-rest-client/RestClient';
import * as fs from 'fs';
import * as path from 'path';

describe('Rest Tests', function () {
    let _rest: restm.RestClient;

    before(() => {
        _rest = new restm.RestClient('typed-rest-client-tests');
    });

    after(() => {
    });

    it('constructs', () => {
        this.timeout(1000);
        
        let rest: restm.RestClient = new restm.RestClient('typed-test-client-tests');
        assert(rest, 'rest client should not be null');
    })

    // TODO: more tests here
});