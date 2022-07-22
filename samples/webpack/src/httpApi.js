// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import * as httpc from 'typed-rest-client/HttpClient';

export async function exampleGetWithHttp() {
    const client = new httpc.HttpClient('vsts-node-api');

    try {
        const response = await client.get('https://httpbin.org/get');
        const body = await response.readBody();
        const json = JSON.parse(body)

        return 'Received response from: ' + json.url + ' using HTTP client'
    }
    catch (e) {
        return 'HTTP client request failed with reason: ' + e.toString();
    }
}
