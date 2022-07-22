// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import * as restc from 'typed-rest-client/RestClient';

export async function exampleGetWithRest() {
    let result;
    const client = new restc.RestClient('vsts-node-api');

    try {
        const response = await client.get<any>('https://httpbin.org/get');

        result = 'Received response from: ' + response.result.url + ' using REST client'
    }
    catch (e: any) {
        result = 'REST client request failed with reason: ' + e.toString();
    }

    return result;
}