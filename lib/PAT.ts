// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import ifm = require('./interfaces');
import http = require("http");

export class PersonalAccessTokenCredentialHandler implements ifm.IRequestHandler {
    token: string;

    constructor(token: string) {
        this.token = token;
    }

    prepareRequest(options:http.RequestOptions): void {
        options.headers['Authorization'] = 'Basic ' + new Buffer('PAT:' + this.token).toString('base64');
        options.headers['X-TFS-FedAuthRedirect'] = 'Suppress';
    }

    // This handler cannot handle 401
    canHandleAuthentication(res: ifm.IHttpClientResponse): boolean {
        return false;
    }

    handleAuthentication(httpClient: ifm.IHttpClient, info: ifm.IRequestInfo, objs): Promise<ifm.IHttpClientResponse> {
        // no op since this doesn't handle auth challenges (expected to have Authorization header)
        return null;
    }
}
