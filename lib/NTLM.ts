// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import ifm = require('./interfaces');
import http = require("http");
import https = require("https");
var _ = require("underscore");
var ntlm = require("../opensource/node-http-ntlm/ntlm");

interface INtlmOptions {
    domain: string,
    workstation: string,
    username?:string,
    password?:string
}

export class NtlmCredentialHandler implements ifm.IRequestHandler {
    private _ntlmOptions: INtlmOptions;
    private _username: string;
    private _password: string;

    constructor(username: string, password: string,  workstation?: string, domain?: string) {
        this._ntlmOptions = <INtlmOptions>{};

        this._username = username;
        this._password = password;
        this._ntlmOptions.workstation = workstation || '';
        this._ntlmOptions.domain = domain || '';
    }

    prepareRequest(options:http.RequestOptions): void {
        // No headers or options need to be set.  We keep the credentials on the handler itself.
        // If a (proxy) agent is set, remove it as we don't support proxy for NTLM at this time
        if (options.agent) {
            delete options.agent;
        }
    }

    canHandleAuthentication(res: ifm.IHttpClientResponse): boolean {
        if (res && res.message.statusCode === 401) {
            // Ensure that we're talking NTLM here
            // Once we have the www-authenticate header, split it so we can ensure we can talk NTLM
            var wwwAuthenticate = res.message.headers['www-authenticate'];
            if (wwwAuthenticate) {
                var mechanisms = wwwAuthenticate.split(', ');
                var idx =  mechanisms.indexOf("NTLM");
                if (idx >= 0) {
                    // Check specifically for 'NTLM' since www-authenticate header can also contain
                    // the Authorization value to use in the form of 'NTLM TlRMTVNT....AAAADw=='
                    if (mechanisms[idx].length == 4) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // The following method is an adaptation of code found at https://github.com/SamDecrock/node-http-ntlm/blob/master/httpntlm.js
    async handleAuthentication(httpClient,
                               reqInfo: ifm.IRequestInfo, 
                               objs): Promise<ifm.IHttpClientResponse> {
        
        return new Promise<ifm.IHttpClientResponse>(async(resolve, reject) => {
            try {
                // Set up the headers for NTLM authentication
                var keepaliveAgent;
                if (httpClient.isSsl === true) {
                    keepaliveAgent = new https.Agent({});
                } else {
                    keepaliveAgent = new http.Agent({ keepAlive: true });
                }
                

                // The following pattern of sending the type1 message following immediately (in a setImmediate) is
                // critical for the NTLM exchange to happen.  If we removed setImmediate (or call in a different manner)
                // the NTLM exchange will always fail with a 401.
                let res: ifm.IHttpClientResponse = await this._sendType1Message(httpClient, reqInfo, objs, keepaliveAgent);

                let that = this;
                setImmediate(async() => {
                    res = await that._sendType3Message(httpClient, reqInfo, objs, keepaliveAgent, res);
                    resolve(res);
                });
            }
            catch (err) {
                reject(err);
            }
        });
    }

    // The following method is an adaptation of code found at https://github.com/SamDecrock/node-http-ntlm/blob/master/httpntlm.js
    private async _sendType1Message(httpClient: ifm.IHttpClient, reqInfo: ifm.IRequestInfo, objs, keepaliveAgent): Promise<ifm.IHttpClientResponse> {
        return new Promise<ifm.IHttpClientResponse>(async(resolve, reject) => {
            var type1msg = ntlm.createType1Message(this._ntlmOptions);

            let type1options: http.RequestOptions = {
                headers: {
                    'Connection': 'keep-alive',
                    'Authorization': type1msg
                },
                //timeout: reqInfo.options.timeout || 0,
                agent: keepaliveAgent,
                // don't redirect because http could change to https which means we need to change the keepaliveAgent
                // allowRedirects: false
            };

            let type1info = <ifm.IRequestInfo>{};
            type1info.httpModule = reqInfo.httpModule;
            type1info.parsedUrl = reqInfo.parsedUrl;
            type1info.options = _.extend(type1options, _.omit(reqInfo.options, 'headers'));
            let res: ifm.IHttpClientResponse = await httpClient.requestRaw(type1info, objs);
            resolve(res);
        });
    }

    // The following method is an adaptation of code found at https://github.com/SamDecrock/node-http-ntlm/blob/master/httpntlm.js
    private async _sendType3Message(httpClient: ifm.IHttpClient, 
                                    reqInfo: ifm.IRequestInfo,
                                    objs, 
                                    keepaliveAgent, 
                                    res: ifm.IHttpClientResponse): Promise<ifm.IHttpClientResponse> {

        return new Promise<ifm.IHttpClientResponse>(async(resolve, reject) => {
            if (!res.message.headers && !res.message.headers['www-authenticate']) {
                reject(new Error('www-authenticate not found on response of second request'));
                return;
            }

            var type2msg = ntlm.parseType2Message(res.message.headers['www-authenticate']);

            this._ntlmOptions.username = this._username;
            this._ntlmOptions.password = this._password;

            var type3msg = ntlm.createType3Message(type2msg, this._ntlmOptions);
            
            let type3options: http.RequestOptions = {
                headers: {
                    'Authorization': type3msg
                },
                //allowRedirects: false,
                agent: keepaliveAgent
            };

            let type3info = <ifm.IRequestInfo>{};
            type3info.httpModule = reqInfo.httpModule;
            type3info.parsedUrl = reqInfo.parsedUrl;
            // pass along other options:
            type3options.headers = _.extend(type3options.headers, reqInfo.options.headers);
            type3info.options = _.extend(type3options, _.omit(reqInfo.options, 'headers'));
            // send type3 message to server:
            let type3res: ifm.IHttpClientResponse = await httpClient.requestRaw(type3info, objs);
            resolve(type3res);
        });
    }
}