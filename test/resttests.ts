// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import assert = require('assert');
import * as restm from 'typed-rest-client/RestClient';
import * as fs from 'fs';
import * as path from 'path';

export interface HttpBinData {
    url: string;
    data: any;
    args?: any
}

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

    it('gets a resource', async() => {
        let restRes: restm.IRestResponse<HttpBinData> = await _rest.get<HttpBinData>('https://httpbin.org/get');
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result.url === 'https://httpbin.org/get');
    });

    //----------------------------------------------
    // Get Error Cases
    //----------------------------------------------

    //
    // Resource not found (404)
    // should return a null resource, 404 status, and should not throw
    //
    it('gets a non-existant resource (404)', async() => {
        try {
            let restRes: restm.IRestResponse<HttpBinData> = await _rest.get<HttpBinData>('https://httpbin.org/status/404');
            
            assert(restRes.statusCode == 404, "statusCode should be 404");
            assert(restRes.result == null, "object should be null");
        }
        catch(err) {
            assert(false, "should not throw");
        }
    });

    //
    // Unauthorized (401)
    // should throw and attach statusCode to the Error object
    // err.message is message proerty of resourceful error object or if not supplied, a generic error message
    //    
    it('gets and handles unauthorized (401)', async() => {
        try {
            let restRes: restm.IRestResponse<HttpBinData> = await _rest.get<HttpBinData>('https://httpbin.org/status/401');
            assert(false, "should throw");
        }
        catch(err) {
            assert(err['statusCode'] == 401, "statusCode should be 401");
            assert(err.message && err.message.length > 0, "should have error message");
        }
    });    
    
    //
    // Internal Server Error
    // should throw and attach statusCode to the Error object
    // err.message is message proerty of resourceful error object or if not supplied, a generic error message
    //    
    it('gets and handles a server error (500)', async() => {
        try {
            let restRes: restm.IRestResponse<HttpBinData> = await _rest.get<HttpBinData>('https://httpbin.org/status/500');
            assert(false, "should throw");
        }
        catch(err) {
            assert(err['statusCode'] == 500, "statusCode should be 500");
            assert(err.message && err.message.length > 0, "should have error message");
        }
    });

    //--------------------------------------------------------
    // Path in baseUrl tests
    //--------------------------------------------------------
    it('removes the path from the base url', async() => {
        // Arrange
        let rest = new restm.RestClient('typed-rest-client-tests', 'https://httpbin.org/pathtoremove');

        // Act
        let restRes: restm.IRestResponse<HttpBinData> = await rest.get<HttpBinData>('/get');

        // Assert
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result.url === 'https://httpbin.org/get');
    });

    it('removes the path from the base url when excplicit', async() => {
        // Arrange
        let rest = new restm.RestClient('typed-rest-client-tests', 'https://httpbin.org/pathtoremove', null, null, false);

        // Act
        let restRes: restm.IRestResponse<HttpBinData> = await rest.get<HttpBinData>('/get');

        // Assert
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result.url === 'https://httpbin.org/get');
    });

    it('maintains the path from the base url', async() => {
        // Arrange
        let rest = new restm.RestClient('typed-rest-client-tests', 'https://httpbin.org/anything', null, null, true);

        // Act
        let restRes: restm.IRestResponse<HttpBinData> = await rest.get<HttpBinData>('/anythingextra');

        // Assert
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result.url === 'https://httpbin.org/anything/anythingextra');
    });

    it('maintains the path from the base url with no slashes', async() => {
        // Arrange
        let rest = new restm.RestClient('typed-rest-client-tests', 'https://httpbin.org/anything', null, null, true);

        // Act
        let restRes: restm.IRestResponse<HttpBinData> = await rest.get<HttpBinData>('anythingextra');

        // Assert
        assert(restRes.statusCode == 200, "statusCode should be 200");
        console.log(restRes.result.url)
        assert(restRes.result.url === 'https://httpbin.org/anything/anythingextra');
    });

    it('maintains the path from the base url with double slashes', async() => {
        // Arrange
        let rest = new restm.RestClient('typed-rest-client-tests', 'https://httpbin.org/anything/', null, null, true);

        // Act
        let restRes: restm.IRestResponse<HttpBinData> = await rest.get<HttpBinData>('/anythingextra');

        // Assert
        assert(restRes.statusCode == 200, "statusCode should be 200");
        console.log(restRes.result.url)
        assert(restRes.result.url === 'https://httpbin.org/anything/anythingextra');
    });

    it('maintains the path from the base url with multiple parts', async() => {
        // Arrange
        let rest = new restm.RestClient('typed-rest-client-tests', 'https://httpbin.org/anything/extrapart', null, null, true);

        // Act
        let restRes: restm.IRestResponse<HttpBinData> = await rest.get<HttpBinData>('/anythingextra');

        // Assert
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result.url === 'https://httpbin.org/anything/extrapart/anythingextra');
    });

    it('maintains the path from the base url where request has multiple parts', async() => {
        // Arrange
        let rest = new restm.RestClient('typed-rest-client-tests', 'https://httpbin.org/anything', null, null, true);

        // Act
        let restRes: restm.IRestResponse<HttpBinData> = await rest.get<HttpBinData>('/anythingextra/moreparts');

        // Assert
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result.url === 'https://httpbin.org/anything/anythingextra/moreparts');
    });

    it('maintains the path from the base url where both have multiple parts', async() => {
        // Arrange
        let rest = new restm.RestClient('typed-rest-client-tests', 'https://httpbin.org/anything/multiple', null, null, true);

        // Act
        let restRes: restm.IRestResponse<HttpBinData> = await rest.get<HttpBinData>('/anythingextra/moreparts');

        // Assert
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result.url === 'https://httpbin.org/anything/multiple/anythingextra/moreparts');
    });

    it('maintains the path from the base url where request has query parameters', async() => {
        // Arrange
        let rest = new restm.RestClient('typed-rest-client-tests', 'https://httpbin.org/anything/multiple', null, null, true);

        // Act
        let restRes: restm.IRestResponse<HttpBinData> = await rest.get<HttpBinData>('/anythingextra/moreparts?foo=bar&baz=top');

        // Assert
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result.url === 'https://httpbin.org/anything/multiple/anythingextra/moreparts?foo=bar&baz=top');
        assert(restRes.result.args.foo === 'bar');
        assert(restRes.result.args.baz === 'top');
    });

    // TODO: more tests here    
});
