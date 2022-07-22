// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import * as restc from 'typed-rest-client/RestClient';

export async function exampleGetWithRest() {
    const client = new restc.RestClient('vsts-node-api');

    try {
        const response = await client.get('https://httpbin.org/get');

        return 'Received response from: ' + response.result.url + ' using REST client'
    }
    catch (e) {
        return 'REST client request failed with reason: ' + e.toString();
    }
}
