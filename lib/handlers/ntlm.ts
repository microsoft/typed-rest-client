// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// This handler has been deprecated.
// Our recommendation is to use one of the other supported handlers due to security concerns around NTLM protocol.
// See these articles for more info:
// * https://securiteam.com/securityreviews/5op0b2kgac/
// * https://www.bleepingcomputer.com/news/security/new-microsoft-ntlm-flaws-may-allow-full-domain-compromise/
// * https://docs.microsoft.com/en-us/archive/blogs/miriamxyra/stop-using-lan-manager-and-ntlmv1 - this one is us (MS) telling people to stop using NTLMV1, and pointing to some issues surrounding V2 that have since been discovered to be worse than thought
// * https://www.helpnetsecurity.com/2019/10/10/ntlm-vulnerabilities/

import ifm = require('../Interfaces');
import http = require("http");
import https = require("https");

const _ = require("underscore");
const ntlm = require("../opensource/Node-SMB/lib/ntlm");

interface INtlmOptions {
    username?: string,
    password?: string,
    domain: string,
    workstation: string
}

export class NtlmCredentialHandler implements ifm.IRequestHandler {
    private _ntlmOptions: INtlmOptions;

    constructor(username: string, password: string, workstation?: string, domain?: string) {
        this._ntlmOptions = <INtlmOptions>{};

        this._ntlmOptions.username = username;
        this._ntlmOptions.password = password;
        this._ntlmOptions.domain = domain || '';
        this._ntlmOptions.workstation = workstation || '';
    }

    public prepareRequest(options: http.RequestOptions): void {
        // No headers or options need to be set.  We keep the credentials on the handler itself.
        // If a (proxy) agent is set, remove it as we don't support proxy for NTLM at this time
        if (options.agent) {
            delete options.agent;
        }
    }

    public canHandleAuthentication(response: ifm.IHttpClientResponse): boolean {
        if (response && response.message && response.message.statusCode === 401) {
            // Ensure that we're talking NTLM here
            // Once we have the www-authenticate header, split it so we can ensure we can talk NTLM
            const wwwAuthenticate = response.message.headers['www-authenticate'];

            return wwwAuthenticate && (wwwAuthenticate.split(', ').indexOf("NTLM") >= 0)
        }

        return false;
    }

    public handleAuthentication(httpClient: ifm.IHttpClient, requestInfo: ifm.IRequestInfo, objs): Promise<ifm.IHttpClientResponse> {
        return new Promise<ifm.IHttpClientResponse>((resolve, reject) => {
            const callbackForResult = function (err: any, res: ifm.IHttpClientResponse) {
                if (err) {
                    reject(err);
                    return;
                }
                // We have to readbody on the response before continuing otherwise there is a hang.
                res.readBody().then(() => {
                    resolve(res);
                });
            };

            this.handleAuthenticationPrivate(httpClient, requestInfo, objs, callbackForResult);
        });
    }

    private handleAuthenticationPrivate(httpClient: any, requestInfo: ifm.IRequestInfo, objs, finalCallback): void {
        // Set up the headers for NTLM authentication
        requestInfo.options = _.extend(requestInfo.options, {
            username: this._ntlmOptions.username,
            password: this._ntlmOptions.password,
            domain: this._ntlmOptions.domain,
            workstation: this._ntlmOptions.workstation
        });

        requestInfo.options.agent = httpClient.isSsl ?
            new https.Agent({ keepAlive: true }):
            new http.Agent({ keepAlive: true });

        let self = this;

        // The following pattern of sending the type1 message following immediately (in a setImmediate) is
        // critical for the NTLM exchange to happen.  If we removed setImmediate (or call in a different manner)
        // the NTLM exchange will always fail with a 401.
        this.sendType1Message(httpClient, requestInfo, objs, function (err, res) {
            if (err) {
                return finalCallback(err, null, null);
            }

            /// We have to readbody on the response before continuing otherwise there is a hang.
            res.readBody().then(() => {
                // It is critical that we have setImmediate here due to how connection requests are queued.
                // If setImmediate is removed then the NTLM handshake will not work.
                // setImmediate allows us to queue a second request on the same connection. If this second
                // request is not queued on the connection when the first request finishes then node closes
                // the connection. NTLM requires both requests to be on the same connection so we need this.
                setImmediate(function () {
                    self.sendType3Message(httpClient, requestInfo, objs, res, finalCallback);
                });
            });
        });
    }

    // The following method is an adaptation of code found at https://github.com/SamDecrock/node-http-ntlm/blob/master/httpntlm.js
    private sendType1Message(httpClient: ifm.IHttpClient, requestInfo: ifm.IRequestInfo, objs: any, finalCallback): void {
        const type1HexBuffer: Buffer = ntlm.encodeType1(this._ntlmOptions.workstation, this._ntlmOptions.domain);
        const type1msg: string = `NTLM ${type1HexBuffer.toString('base64')}`;

        const type1options: http.RequestOptions = {
            headers: {
                'Connection': 'keep-alive',
                'Authorization': type1msg
            },
            timeout: requestInfo.options.timeout || 0,
            agent: requestInfo.httpModule,
        };

        const type1info = <ifm.IRequestInfo>{};
        type1info.httpModule = requestInfo.httpModule;
        type1info.parsedUrl = requestInfo.parsedUrl;
        type1info.options = _.extend(type1options, _.omit(requestInfo.options, 'headers'));

        return httpClient.requestRawWithCallback(type1info, objs, finalCallback);
    }

    // The following method is an adaptation of code found at https://github.com/SamDecrock/node-http-ntlm/blob/master/httpntlm.js
    private sendType3Message(httpClient: ifm.IHttpClient, requestInfo: ifm.IRequestInfo, objs: any, res, callback): void {
        if (!res.message.headers && !res.message.headers['www-authenticate']) {
            throw new Error('www-authenticate not found on response of second request');
        }

        /**
         * Server will respond with challenge/nonce
         * assigned to response's "WWW-AUTHENTICATE" header
         * and should adhere to RegExp /^NTLM\s+(.+?)(,|\s+|$)/
         */
        const serverNonceRegex: RegExp = /^NTLM\s+(.+?)(,|\s+|$)/;
        const serverNonce: Buffer = Buffer.from(
            (res.message.headers['www-authenticate'].match(serverNonceRegex) || [])[1],
            'base64'
        );

        let type2msg: Buffer;

        /**
         * Wrap decoding the Server's challenge/nonce in
         * try-catch block to throw more comprehensive
         * Error with clear message to consumer
         */
        try {
            type2msg = ntlm.decodeType2(serverNonce);
        } catch (error) {
            throw new Error(`Decoding Server's Challenge to Obtain Type2Message failed with error: ${error.message}`)
        }

        const type3msg: string = ntlm.encodeType3(
            this._ntlmOptions.username,
            this._ntlmOptions.workstation,
            this._ntlmOptions.domain,
            type2msg,
            this._ntlmOptions.password
        ).toString('base64');

        const type3options: http.RequestOptions = {
            headers: {
                'Authorization': `NTLM ${type3msg}`,
                'Connection': 'Close'
            },
            agent: requestInfo.httpModule,
        };

        const type3info = <ifm.IRequestInfo>{};
        type3info.httpModule = requestInfo.httpModule;
        type3info.parsedUrl = requestInfo.parsedUrl;
        type3options.headers = _.extend(type3options.headers, requestInfo.options.headers);
        type3info.options = _.extend(type3options, _.omit(requestInfo.options, 'headers'));

        return httpClient.requestRawWithCallback(type3info, objs, callback);
    }
}
