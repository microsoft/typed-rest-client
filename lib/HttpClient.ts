// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import url = require("url");
import http = require("http");
import https = require("https");
import tunnel = require("tunnel");
import ifm = require('./Interfaces');
import fs = require('fs');

http.globalAgent.maxSockets = 100;

export enum HttpCodes {
    OK = 200,
    MultipleChoices = 300,
    MovedPermanently = 301,
    ResourceMoved = 302,
    NotModified = 304,
    UseProxy = 305,
    SwitchProxy = 306,
    TemporaryRedirect = 307,
    PermanentRedirect = 308,
    BadRequest = 400,
    Unauthorized = 401,
    PaymentRequired = 402,
    Forbidden = 403,
    NotFound = 404,
    MethodNotAllowed = 405,
    NotAcceptable = 406,
    ProxyAuthenticationRequired = 407,
    RequestTimeout = 408,
    Conflict = 409,
    Gone = 410,
    InternalServerError = 500,
    NotImplemented = 501,
    BadGateway = 502,
    ServiceUnavailable = 503,
    GatewayTimeout = 504,
}

const HttpRedirectCodes: number[] = [ HttpCodes.MovedPermanently, HttpCodes.ResourceMoved, HttpCodes.TemporaryRedirect, HttpCodes.PermanentRedirect ];

export class HttpClientResponse {
    constructor(message: http.IncomingMessage) {
        this.message = message;
    }

    public message: http.IncomingMessage;
    readBody(): Promise<string> {
        return new Promise<string>(async (resolve, reject) => {
            let output: string = '';

            this.message.on('data', (chunk: string) => {
                output += chunk;
            });

            this.message.on('end', () => {
                resolve(output);
            });
        });
    }
}

export interface RequestInfo {
    options: http.RequestOptions;
    parsedUrl: url.Url;
    httpModule: any;
}

export function isHttps(requestUrl: string) {
    let parsedUrl: url.Url = url.parse(requestUrl);
    return parsedUrl.protocol === 'https:';
}

enum EnvironmentVariables {
    HTTP_PROXY = "HTTP_PROXY", 
    HTTPS_PROXY = "HTTPS_PROXY",
}

export class HttpClient {
    userAgent: string;
    handlers: ifm.IRequestHandler[];
    requestOptions: ifm.IRequestOptions;

    private _ignoreSslError: boolean = false;
    private _socketTimeout: number;
    private _httpProxy: ifm.IProxyConfiguration;
    private _httpProxyBypassHosts: RegExp[];
    private _allowRedirects: boolean = true;
    private _maxRedirects: number = 50

    private _certConfig: ifm.ICertConfiguration;
    private _ca: string;
    private _cert: string;
    private _key: string;

    constructor(userAgent: string, handlers?: ifm.IRequestHandler[], requestOptions?: ifm.IRequestOptions) {
        this.userAgent = userAgent;
        this.handlers = handlers;
        this.requestOptions = requestOptions;
        if (requestOptions) {
            if (requestOptions.ignoreSslError != null) {
                this._ignoreSslError = requestOptions.ignoreSslError;
            }

            this._socketTimeout = requestOptions.socketTimeout;
            this._httpProxy = requestOptions.proxy;
            if (requestOptions.proxy && requestOptions.proxy.proxyBypassHosts) {
                this._httpProxyBypassHosts = [];
                requestOptions.proxy.proxyBypassHosts.forEach(bypass => {
                    this._httpProxyBypassHosts.push(new RegExp(bypass, 'i'));
                });
            }

            this._certConfig = requestOptions.cert;

            // cache the cert content into memory, so we don't have to read it from disk every time 
            if (this._certConfig && this._certConfig.caFile && fs.existsSync(this._certConfig.caFile)) {
                this._ca = fs.readFileSync(this._certConfig.caFile, 'utf8');
            }

            if (this._certConfig && this._certConfig.certFile && fs.existsSync(this._certConfig.certFile)) {
                this._cert = fs.readFileSync(this._certConfig.certFile, 'utf8');
            }

            if (this._certConfig && this._certConfig.keyFile && fs.existsSync(this._certConfig.keyFile)) {
                this._key = fs.readFileSync(this._certConfig.keyFile, 'utf8');
            }

            if (requestOptions.allowRedirects != null) {
                this._allowRedirects = requestOptions.allowRedirects;
            }

            if (requestOptions.maxRedirects != null) {
                this._maxRedirects = Math.max(requestOptions.maxRedirects, 0);
            }
        }
    }

    public options(requestUrl: string, additionalHeaders?: ifm.IHeaders): Promise<HttpClientResponse> {
        return this.request('OPTIONS', requestUrl, null, additionalHeaders || {});
    }

    public get(requestUrl: string, additionalHeaders?: ifm.IHeaders): Promise<HttpClientResponse> {
        return this.request('GET', requestUrl, null, additionalHeaders || {});
    }

    public del(requestUrl: string, additionalHeaders?: ifm.IHeaders): Promise<HttpClientResponse> {
        return this.request('DELETE', requestUrl, null, additionalHeaders || {});
    }

    public post(requestUrl: string, data: string, additionalHeaders?: ifm.IHeaders): Promise<HttpClientResponse> {
        return this.request('POST', requestUrl, data, additionalHeaders || {});
    }

    public patch(requestUrl: string, data: string, additionalHeaders?: ifm.IHeaders): Promise<HttpClientResponse> {
        return this.request('PATCH', requestUrl, data, additionalHeaders || {});
    }

    public put(requestUrl: string, data: string, additionalHeaders?: ifm.IHeaders): Promise<HttpClientResponse> {
        return this.request('PUT', requestUrl, data, additionalHeaders || {});
    }

    public head(requestUrl: string, additionalHeaders?: ifm.IHeaders): Promise<HttpClientResponse> {
        return this.request('HEAD', requestUrl, null, additionalHeaders || {});
    }

    public sendStream(verb: string, requestUrl: string, stream: NodeJS.ReadableStream, additionalHeaders?: ifm.IHeaders): Promise<HttpClientResponse> {
        return this.request(verb, requestUrl, stream, additionalHeaders);
    }

    /**
     * Makes a raw http request.
     * All other methods such as get, post, patch, and request ultimately call this.
     * Prefer get, del, post and patch
     */
    public async request(verb: string, requestUrl: string, data: string | NodeJS.ReadableStream, headers: ifm.IHeaders): Promise<HttpClientResponse> {
        let info: RequestInfo = this._prepareRequest(verb, requestUrl, headers);
        let response: HttpClientResponse = await this._requestRaw(info, data);

        let redirectsRemaining: number = this._maxRedirects;
        while (HttpRedirectCodes.indexOf(response.message.statusCode) != -1
               && this._allowRedirects
               && redirectsRemaining > 0) {

            const redirectUrl: any = response.message.headers["location"];
            if (!redirectUrl) {
                // if there's no location to redirect to, we won't
                break;
            }

            // we need to finish reading the response before reassigning response
            // which will leak the open socket.
            await response.readBody();

            // let's make the request with the new redirectUrl
            info = this._prepareRequest(verb, redirectUrl, headers);
            response = await this._requestRaw(info, data);
            redirectsRemaining--;
        }

        return response;
    }

    private _requestRaw(info: RequestInfo, data: string | NodeJS.ReadableStream): Promise<HttpClientResponse> {
        return new Promise<HttpClientResponse>((resolve, reject) => {
            let socket;

            let isDataString = typeof (data) === 'string';

            if (typeof (data) === 'string') {
                info.options.headers["Content-Length"] = Buffer.byteLength(data, 'utf8');
            }

            let req: http.ClientRequest = info.httpModule.request(info.options, (msg: http.IncomingMessage) => {
                let res: HttpClientResponse = new HttpClientResponse(msg);
                resolve(res);
            });

            req.on('socket', (sock) => {
                socket = sock;
            });

            // If we ever get disconnected, we want the socket to timeout eventually
            req.setTimeout(this._socketTimeout || 3 * 60000, () => {
                if (socket) {
                    socket.end();
                }
                reject(new Error('Request timeout: ' + info.options.path));
            });

            req.on('error', function (err) {
                // err has statusCode property
                // res should have headers
                reject(err);
            });

            if (data && typeof (data) === 'string') {
                req.write(data, 'utf8');
            }

            if (data && typeof (data) !== 'string') {
                data.on('close', function () {
                    req.end();
                });

                data.pipe(req);
            }
            else {
                req.end();
            }
        });
    }

    private _prepareRequest(method: string, requestUrl: string, headers: any): RequestInfo {
        let info: RequestInfo = <RequestInfo>{};

        info.parsedUrl = url.parse(requestUrl);
        let usingSsl = info.parsedUrl.protocol === 'https:';
        info.httpModule = usingSsl ? https : http;
        var defaultPort: number = usingSsl ? 443 : 80;

        let proxyConfig: ifm.IProxyConfiguration = this._httpProxy;

        // fallback to http_proxy and https_proxy env
        let https_proxy: string = process.env[EnvironmentVariables.HTTPS_PROXY];
        let http_proxy: string = process.env[EnvironmentVariables.HTTP_PROXY];

        if (!proxyConfig) {
            if (https_proxy && usingSsl) {
                proxyConfig = {
                    proxyUrl: https_proxy
                };
            } else if (http_proxy) {
                proxyConfig = {
                    proxyUrl: http_proxy
                };
            }
        }

        let proxyUrl: url.Url;
        let proxyAuth: string;
        if (proxyConfig) {
            if (proxyConfig.proxyUrl.length > 0) {
                proxyUrl = url.parse(proxyConfig.proxyUrl);
            }

            if (proxyConfig.proxyUsername || proxyConfig.proxyPassword) {
                proxyAuth = proxyConfig.proxyUsername + ":" + encodeURIComponent(proxyConfig.proxyPassword);
            }
        }

        info.options = <http.RequestOptions>{};
        info.options.host = info.parsedUrl.hostname;
        info.options.port = info.parsedUrl.port ? parseInt(info.parsedUrl.port) : defaultPort;
        info.options.path = (info.parsedUrl.pathname || '') + (info.parsedUrl.search || '');
        info.options.method = method;
        info.options.headers = headers || {};
        info.options.headers["User-Agent"] = this.userAgent;

        let useProxy = proxyUrl && proxyUrl.hostname && !this._isBypassProxy(requestUrl);
        if (useProxy) {
            var agentOptions: tunnel.TunnelOptions = {
                maxSockets: http.globalAgent.maxSockets,
                proxy: {
                    proxyAuth: proxyAuth,
                    host: proxyUrl.hostname,
                    port: proxyUrl.port
                },
            };

            var tunnelAgent: Function;
            var overHttps = proxyUrl.protocol === 'https:';
            if (usingSsl) {
                tunnelAgent = overHttps ? tunnel.httpsOverHttps : tunnel.httpsOverHttp;
            } else {
                tunnelAgent = overHttps ? tunnel.httpOverHttps : tunnel.httpOverHttp;
            }

            info.options.agent = tunnelAgent(agentOptions);
        }

        if (usingSsl && this._ignoreSslError) {
            if (!info.options.agent) {
                info.options.agent = https.globalAgent;
            }

            // we don't want to set NODE_TLS_REJECT_UNAUTHORIZED=0 since that will affect request for entire process
            // http.RequestOptions doesn't expose a way to modify RequestOptions.agent.options
            // we have to cast it to any and change it directly
            let agent: any = info.options.agent;
            agent.options = Object.assign(agent.options || {}, { rejectUnauthorized: false });
        }

        if (usingSsl && this._certConfig) {
            if (!info.options.agent) {
                info.options.agent = https.globalAgent;
            }

            let agent: any = info.options.agent;
            agent.options = Object.assign(agent.options || {}, { ca: this._ca, cert: this._cert, key: this._key, passphrase: this._certConfig.passphrase });
        }

        // gives handlers an opportunity to participate
        if (this.handlers) {
            this.handlers.forEach((handler) => {
                handler.prepareRequest(info.options);
            });
        }

        return info;
    }

    private _isBypassProxy(requestUrl: string): Boolean {
        if (!this._httpProxyBypassHosts) {
            return false;
        }

        let bypass: boolean = false;
        this._httpProxyBypassHosts.forEach(bypassHost => {
            if (bypassHost.test(requestUrl)) {
                bypass = true;
            }
        });

        return bypass;
    }
}
