// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import ifm = require('../Interfaces');

export class PersonalAccessTokenCredentialHandler implements ifm.IRequestHandler {
    token: string;
    allowCrossOriginAuthentication: boolean;
    origin: string;

    constructor(token: string, allowCrossOriginAuthentication?: boolean) {
        this.token = token;
        this.allowCrossOriginAuthentication = allowCrossOriginAuthentication;
    }

    // currently implements pre-authorization
    // TODO: support preAuth = false where it hooks on 401
    prepareRequest(options:any): void {
        if (!this.origin) {
            this.origin = options.host;
        }
        // If this is a redirection, don't set the Authorization header
        if (this.origin === options.host || this.allowCrossOriginAuthentication) {
            options.headers['Authorization'] = `Basic ${Buffer.from(`PAT:${this.token}`).toString('base64')}`;
        }
        options.headers['X-TFS-FedAuthRedirect'] = 'Suppress';
    }

    // This handler cannot handle 401
    canHandleAuthentication(response: ifm.IHttpClientResponse): boolean {
        return false;
    }

    handleAuthentication(httpClient: ifm.IHttpClient, requestInfo: ifm.IRequestInfo, objs): Promise<ifm.IHttpClientResponse> {
        return null;
    }
}
