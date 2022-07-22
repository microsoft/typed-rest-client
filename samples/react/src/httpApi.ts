// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import * as httpc from 'typed-rest-client/HttpClient';

export async function exampleGetWithHttp() {
    let result;
    const client = new httpc.HttpClient('vsts-node-api');

    try {
        const response = await client.get('https://httpbin.org/get');
        const body = await response.readBody();
        const json = JSON.parse(body)

        result = 'Received response from: ' + json.url + ' using HTTP client'
    }
    catch (e: any) {
        result = 'HTTP client request failed with reason: ' + e.toString();
    }

    return result;
}