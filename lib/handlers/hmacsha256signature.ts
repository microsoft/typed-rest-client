// Copyright (c) Taras Trishchuk<x51xxx@gmail.com>. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createHmac } from 'crypto';
import ifm = require('../Interfaces');

export class HMACSHA256SignatureHandler implements ifm.IRequestHandler {
    secret: string;
    signatureHeaderName: string;
    timestampHeaderName: string;

    constructor(secret: string, signatureHeaderName = 'X-Signature', timeHeaderName = 'X-Timestamp') {
        this.secret = secret;
        this.signatureHeaderName = signatureHeaderName;
        this.timestampHeaderName = timeHeaderName;
    }

    prepareRequest(options: any, data?: string | NodeJS.ReadableStream): void {
        if (typeof data !== 'string') {
            data = '';
        }

        const timestamp = Math.floor(Date.now() / 1000);
        const [ path, query = '' ] = options.path.split('?');
        const requestData = timestamp + "\n" +
            options.method + "\n" +
            path + "\n" +
            query + "\n" +
            data;
        const signature = createHmac('sha256', this.secret)
            .update(requestData)
            .digest('hex');

        options.headers[this.timestampHeaderName] = timestamp;
        options.headers[this.signatureHeaderName] = signature;
    }

    // This handler cannot handle 401
    canHandleAuthentication(response: ifm.IHttpClientResponse): boolean {
        return false;
    }

    handleAuthentication(httpClient: ifm.IHttpClient, requestInfo: ifm.IRequestInfo, objs): Promise<ifm.IHttpClientResponse> {
        return null;
    }
}
