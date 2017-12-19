// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import ifm = require('../Interfaces');
import http = require("http");
import https = require("https");
import { setImmediate } from 'timers';
var _ = require("underscore");
var ntlm = require("../opensource/node-http-ntlm/ntlm");

interface INtlmOptions {
    username?:string,
    password?:string,
    domain: string,
    workstation: string
}

export class NtlmCredentialHandler implements ifm.IRequestHandler {
    private _ntlmOptions: INtlmOptions;

    constructor(username: string, password: string,  workstation?: string, domain?: string) {
        this._ntlmOptions = <INtlmOptions>{};

        this._ntlmOptions.username = username;
        this._ntlmOptions.password = password;

        if (domain !== undefined) {
            this._ntlmOptions.domain = domain;
        }
        if (workstation !== undefined) {
            this._ntlmOptions.workstation = workstation;
        }
    }

    prepareRequest(options:http.RequestOptions): void {
        // No headers or options need to be set.  We keep the credentials on the handler itself.
        // If a (proxy) agent is set, remove it as we don't support proxy for NTLM at this time
        if (options.agent) {
            delete options.agent;
        }
    }

    canHandleAuthentication(response: ifm.IHttpClientResponse): boolean {
        if (response && response.message.statusCode === 401) {
            // Ensure that we're talking NTLM here
            // Once we have the www-authenticate header, split it so we can ensure we can talk NTLM
            const wwwAuthenticate = response.message.headers['www-authenticate'];

            if (wwwAuthenticate) {
                const mechanisms = wwwAuthenticate.split(', ');
                const index =  mechanisms.indexOf("NTLM");
                if (index >= 0) {
                    // Check specifically for 'NTLM' since www-authenticate header can also contain
                    // the Authorization value to use in the form of 'NTLM TlRMTVNT....AAAADw=='
                    if (mechanisms[index].length == 4) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    // The following method is an adaptation of code found at https://github.com/SamDecrock/node-http-ntlm/blob/master/httpntlm.js
    async handleAuthentication(httpClient: any, requestInfo: ifm.IRequestInfo, data: any): Promise<ifm.IHttpClientResponse> {
        // try {
        //     // Set up the headers for NTLM authentication
        //     let keepaliveAgent;
        //     if (httpClient.isSsl === true) {
        //         keepaliveAgent = new https.Agent({ keepAlive: true });
        //     } else {
        //         keepaliveAgent = new http.Agent({ keepAlive: true });
        //     }

        //     // The following pattern of sending the type1 message following immediately (in a setImmediate) is
        //     // critical for the NTLM exchange to happen.  If we removed setImmediate (or call in a different manner)
        //     // the NTLM exchange will always fail with a 401.

        //     // TODO: Is this where our bug is?
        //     const that = this;
        //     let response: ifm.IHttpClientResponse;
            
        //     response = await this._sendType1Message(httpClient, reqInfo, data, keepaliveAgent);
        //     setImmediate(async() => {
        //         return that._sendType3Message(httpClient, reqInfo, data, keepaliveAgent, response);
        //         //console.log("set immediate done");
        //         // TODO: Is this running late?
        //     });
        //     throw new Error('why did the code get here');
        // }
        // catch (err) {
        //     throw err;
        // }

        requestInfo.options = _.extend(requestInfo.options, {
            username: this._ntlmOptions.username,
            password: this._ntlmOptions.password,
            domain: this._ntlmOptions.domain,
            workstation: this._ntlmOptions.workstation
        });
        // Is this replacing the current agent in info.options? Is it supposed to?
        //let keepaliveAgent;
        if (httpClient.isSsl === true) {
            //keepaliveAgent = new https.Agent({ keepAlive: true });
            requestInfo.options.agent = new https.Agent({ keepAlive: true });
        }
        else {
            //keepaliveAgent = new http.Agent({ keepAlive: true });
            requestInfo.options.agent = new http.Agent({ keepAlive: true });
        }
        const self = this;
        // The following pattern of sending the type1 message following immediately (in a setImmediate) is
        // critical for the NTLM exchange to happen.  If we removed setImmediate (or call in a different manner)
        // the NTLM exchange will always fail with a 401.
        let type1response: ifm.IHttpClientResponse;
        try {
            type1response = await this._sendType1Message(httpClient, requestInfo, data);

            const result: ifm.IHttpClientResponse = await new Promise<ifm.IHttpClientResponse>((resolve, reject) => {
                setImmediate(async function () {
                    let r: ifm.IHttpClientResponse;
                    try {
                        r = await self._sendType3Message(httpClient, requestInfo, data, type1response);
                        resolve(r);
                    } catch(ex) {
                        reject(ex);
                    }
                });
            });
            return result;
        } catch(exception) {
            throw exception;
        }
    }

    // The following method is an adaptation of code found at https://github.com/SamDecrock/node-http-ntlm/blob/master/httpntlm.js
    private async _sendType1Message(httpClient: ifm.IHttpClient, requestInfo: ifm.IRequestInfo, data: any): Promise<ifm.IHttpClientResponse> {
        // const type1msg = ntlm.createType1Message(this._ntlmOptions);

        // const type1options: http.RequestOptions = {
        //     headers: {
        //         'Connection': 'keep-alive',
        //         'Authorization': type1msg
        //     },
        //     timeout: reqInfo.options.timeout || 0,
        //     agent: keepaliveAgent,
        //     // don't redirect because http could change to https which means we need to change the keepaliveAgent
        //     //allowRedirects: false
        // };

        // const type1info = <ifm.IRequestInfo>{};
        // type1info.httpModule = reqInfo.httpModule;
        // type1info.parsedUrl = reqInfo.parsedUrl;
        // type1info.options = _.extend(type1options, _.omit(reqInfo.options, 'headers'));

        // return httpClient.requestRaw(type1info, objs);

        const type1msg = ntlm.createType1Message(requestInfo.options);
        const headers = {
                'Connection': 'keep-alive',
                'Authorization': type1msg
        };
        requestInfo.options.headers = headers;
        httpClient.requestRaw(requestInfo, data);
    }

    // The following method is an adaptation of code found at https://github.com/SamDecrock/node-http-ntlm/blob/master/httpntlm.js
    private async _sendType3Message(httpClient: ifm.IHttpClient, 
                                    reqInfo: ifm.IRequestInfo,
                                    data: any, 
                                    res: ifm.IHttpClientResponse): Promise<ifm.IHttpClientResponse> {

            if (!res.message.headers && !res.message.headers['www-authenticate']) {
                throw new Error('www-authenticate not found on response of second request');
            }

            const type2msg = ntlm.parseType2Message(res.message.headers['www-authenticate']);
            const type3msg = ntlm.createType3Message(type2msg, this._ntlmOptions);

            const type3options: http.RequestOptions = {
                headers: {
                    'Authorization': type3msg,
                    //'Connection': 'Close'
                },
                //allowRedirects: false,
                agent: keepaliveAgent
            };

            const type3info = <ifm.IRequestInfo>{};
            type3info.httpModule = reqInfo.httpModule;
            type3info.parsedUrl = reqInfo.parsedUrl;
            type3options.headers = _.extend(type3options.headers, reqInfo.options.headers);
            type3info.options = _.extend(type3options, _.omit(reqInfo.options, 'headers'));

            // send type3 message to server:
            return httpClient.requestRaw(type3info, data);
    }
}

// TO COPY

// // The following method is an adaptation of code found at https://github.com/SamDecrock/node-http-ntlm/blob/master/httpntlm.js
// NtlmCredentialHandler.prototype.sendType3Message = function (httpClient, protocol, options, objs, keepaliveAgent, res, callback) {
//     if (!res.headers['www-authenticate']) {
//         return callback(new Error('www-authenticate not found on response of second request'));
//     }
//     // parse type2 message from server:
//     var type2msg = ntlm.parseType2Message(res.headers['www-authenticate']);
//     // create type3 message:
//     var type3msg = ntlm.createType3Message(type2msg, options);
//     // build type3 request:
//     var type3options = {
//         headers: {
//             'Authorization': type3msg
//         },
//         allowRedirects: false,
//         agent: keepaliveAgent
//     };
//     // pass along other options:
//     type3options.headers = _.extend(type3options.headers, options.headers);
//     type3options = _.extend(type3options, _.omit(options, 'headers'));
//     // send type3 message to server:
//     httpClient.requestInternal(protocol, type3options, objs, callback);
// };