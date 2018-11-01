// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import url = require("url");
import http = require("http");
import https = require("https");
import tunnel = require("tunnel");
import ifm = require('./Interfaces');
import fs = require('fs');

export enum HttpCodes {
    OK = 200,
    MultipleChoices = 300,
    MovedPermanently = 301,
    ResourceMoved = 302,
    SeeOther = 303,
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

const HttpRedirectCodes: number[] = [HttpCodes.MovedPermanently, HttpCodes.ResourceMoved, HttpCodes.SeeOther, HttpCodes.TemporaryRedirect, HttpCodes.PermanentRedirect];

export class HttpClientResponse implements ifm.IHttpClientResponse {
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

export class HttpClient implements ifm.IHttpClient {
    userAgent: string;
    handlers: ifm.IRequestHandler[];
    requestOptions: ifm.IRequestOptions;

    private _ignoreSslError: boolean = false;
    private _socketTimeout: number;
    private _httpProxy: ifm.IProxyConfiguration;
    private _httpProxyBypassHosts: RegExp[];
    private _allowRedirects: boolean = true;
    private _maxRedirects: number = 50
    private _agent;
    private _proxyAgent;
    private _keepAlive: boolean = false;
    private _disposed: boolean = false;
    private _certConfig: ifm.ICertConfiguration;
    private _ca: string;
    private _cert: string;
    private _key: string;

    constructor(userAgent: string, handlers?: ifm.IRequestHandler[], requestOptions?: ifm.IRequestOptions) {
        this.userAgent = userAgent;
        this.handlers = handlers || [];
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

            if (requestOptions.keepAlive != null) {
                this._keepAlive = requestOptions.keepAlive;
            }
        }
    }

    public options(requestUrl: string, additionalHeaders?: ifm.IHeaders): Promise<ifm.IHttpClientResponse> {
        return this.request('OPTIONS', requestUrl, null, additionalHeaders || {});
    }

    public get(requestUrl: string, additionalHeaders?: ifm.IHeaders): Promise<ifm.IHttpClientResponse> {
        return this.request('GET', requestUrl, null, additionalHeaders || {});
    }

    public del(requestUrl: string, additionalHeaders?: ifm.IHeaders): Promise<ifm.IHttpClientResponse> {
        return this.request('DELETE', requestUrl, null, additionalHeaders || {});
    }

    public post(requestUrl: string, data: string, additionalHeaders?: ifm.IHeaders): Promise<ifm.IHttpClientResponse> {
        return this.request('POST', requestUrl, data, additionalHeaders || {});
    }

    public patch(requestUrl: string, data: string, additionalHeaders?: ifm.IHeaders): Promise<ifm.IHttpClientResponse> {
        return this.request('PATCH', requestUrl, data, additionalHeaders || {});
    }

    public put(requestUrl: string, data: string, additionalHeaders?: ifm.IHeaders): Promise<ifm.IHttpClientResponse> {
        return this.request('PUT', requestUrl, data, additionalHeaders || {});
    }

    public head(requestUrl: string, additionalHeaders?: ifm.IHeaders): Promise<ifm.IHttpClientResponse> {
        return this.request('HEAD', requestUrl, null, additionalHeaders || {});
    }

    public sendStream(verb: string, requestUrl: string, stream: NodeJS.ReadableStream, additionalHeaders?: ifm.IHeaders): Promise<ifm.IHttpClientResponse> {
        return this.request(verb, requestUrl, stream, additionalHeaders);
    }

    /**
     * Makes a raw http request.
     * All other methods such as get, post, patch, and request ultimately call this.
     * Prefer get, del, post and patch
     */
    public async request(verb: string, requestUrl: string, data: string | NodeJS.ReadableStream, headers: ifm.IHeaders): Promise<ifm.IHttpClientResponse> {
        if (this._disposed) {
            throw new Error("Client has already been disposed.");
        }

        let info: RequestInfo = this._prepareRequest(verb, requestUrl, headers);
        let response: HttpClientResponse = await this.requestRaw(info, data);

        // Check if it's an authentication challenge
        if (response && response.message && response.message.statusCode === HttpCodes.Unauthorized) {
            let authenticationHandler: ifm.IRequestHandler;

            for (let i = 0; i < this.handlers.length; i++) {
                if (this.handlers[i].canHandleAuthentication(response)) {
                    authenticationHandler = this.handlers[i];
                    break;
                }
            }

            if (authenticationHandler) {
                return authenticationHandler.handleAuthentication(this, info, data);
            }  
            else {
                // We have received an unauthorized response but have no handlers to handle it.
                // Let the response return to the caller.
                return response;
            }
        }

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
            response = await this.requestRaw(info, data);
            redirectsRemaining--;
        }

        return response;
    }

    /**
     * Needs to be called if keepAlive is set to true in request options.
     */
    public dispose() {
        if (this._agent) {
            this._agent.destroy();
        }
        
        this._disposed = true;
    }

    /**
     * Raw request.
     * @param info 
     * @param data 
     */
    public requestRaw(info: ifm.IRequestInfo, data: string | NodeJS.ReadableStream): Promise<ifm.IHttpClientResponse> {
        return new Promise<ifm.IHttpClientResponse>((resolve, reject) => {
            let callbackForResult = function (err: any, res: ifm.IHttpClientResponse) {
                if (err) {
                    reject(err);
                }

                resolve(res);
            };

            this.requestRawWithCallback(info, data, callbackForResult);
        });
    }

    /**
     * Raw request with callback.
     * @param info 
     * @param data 
     * @param onResult 
     */
    public requestRawWithCallback(info: ifm.IRequestInfo, data: string | NodeJS.ReadableStream, onResult: (err: any, res: ifm.IHttpClientResponse) => void): void {
        let socket;
        
        let isDataString = typeof (data) === 'string';
        if (typeof (data) === 'string') {
            info.options.headers["Content-Length"] = Buffer.byteLength(data, 'utf8');
        }

        let callbackCalled: boolean = false;
        let handleResult = (err: any, res: HttpClientResponse) => {
            if (!callbackCalled) {
                callbackCalled = true;
                onResult(err, res);
            }
        };

        let req: http.ClientRequest = info.httpModule.request(info.options, (msg: http.IncomingMessage) => {
            let res: HttpClientResponse = new HttpClientResponse(msg);
            handleResult(null, res);
        });

        req.on('socket', (sock) => {
            socket = sock;
        });

        // If we ever get disconnected, we want the socket to timeout eventually
        req.setTimeout(this._socketTimeout || 3 * 60000, () => {
            if (socket) {
                socket.end();
            }
            handleResult(new Error('Request timeout: ' + info.options.path), null);
        });

        req.on('error', function (err) {
            // err has statusCode property
            // res should have headers
            handleResult(err, null);
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
    }

    private _prepareRequest(method: string, requestUrl: string, headers: ifm.IHeaders): ifm.IRequestInfo {
        const info: ifm.IRequestInfo = <ifm.IRequestInfo>{};

        info.parsedUrl = url.parse(requestUrl);
        const usingSsl: boolean = info.parsedUrl.protocol === 'https:';
        info.httpModule = usingSsl ? https : http;
        const defaultPort: number = usingSsl ? 443 : 80;
        info.options = <http.RequestOptions>{};
        info.options.host = info.parsedUrl.hostname;
        info.options.port = info.parsedUrl.port ? parseInt(info.parsedUrl.port) : defaultPort;
        info.options.path = (info.parsedUrl.pathname || '') + (info.parsedUrl.search || '');
        info.options.method = method;
        info.options.headers = this._mergeHeaders(headers);
        info.options.headers["user-agent"] = this.userAgent;
        info.options.agent = this._getAgent(requestUrl);

        // gives handlers an opportunity to participate
        if (this.handlers) {
            this.handlers.forEach((handler) => {
                handler.prepareRequest(info.options);
            });
        }

        return info;
    }

    private _mergeHeaders(headers: ifm.IHeaders) : ifm.IHeaders {
        const lowercaseKeys = obj => Object.keys(obj).reduce((c, k) => (c[k.toLowerCase()] = obj[k], c), {});

        if (this.requestOptions && this.requestOptions.headers) {
            return Object.assign(
                {},
                lowercaseKeys(this.requestOptions.headers),
                lowercaseKeys(headers)
            );
        }

        return lowercaseKeys(headers || {});
    }

    private _getAgent(requestUrl: string) {
        let agent;
        let proxy = this._getProxy(requestUrl);
        let useProxy = proxy.proxyUrl && proxy.proxyUrl.hostname && !this._isBypassProxy(requestUrl);

        if (this._keepAlive && useProxy) {
            agent = this._proxyAgent;
        }

        if (this._keepAlive && !useProxy) {
            agent = this._agent;
        }

        // if agent is already assigned use that agent.
        if (!!agent) {
            return agent;
        }

        let parsedUrl = url.parse(requestUrl);
        const usingSsl = parsedUrl.protocol === 'https:';
        let maxSockets = 100;
        if (!!this.requestOptions) {
            maxSockets = this.requestOptions.maxSockets || http.globalAgent.maxSockets
        }

        if (useProxy) {
            const agentOptions: tunnel.TunnelOptions = {
                maxSockets: maxSockets,
                keepAlive: this._keepAlive,
                proxy: {
                    proxyAuth: proxy.proxyAuth,
                    host: proxy.proxyUrl.hostname,
                    port: proxy.proxyUrl.port
                },
            };

            let tunnelAgent: Function;
            const overHttps = proxy.proxyUrl.protocol === 'https:';
            if (usingSsl) {
                tunnelAgent = overHttps ? tunnel.httpsOverHttps : tunnel.httpsOverHttp;
            } else {
                tunnelAgent = overHttps ? tunnel.httpOverHttps : tunnel.httpOverHttp;
            }

            agent = tunnelAgent(agentOptions);
            this._proxyAgent = agent;
        }

        // if reusing agent across request and tunneling agent isn't assigned create a new agent
        if (this._keepAlive && !agent) {
            const options = { keepAlive: this._keepAlive, maxSockets: maxSockets };
            agent = usingSsl ? new https.Agent(options) : new http.Agent(options);
            this._agent = agent;
        }

        // if not using private agent and tunnel agent isn't setup then use global agent
        if (!agent) {
            agent = usingSsl ? https.globalAgent : http.globalAgent;
        }

        if (usingSsl && this._ignoreSslError) {
            // we don't want to set NODE_TLS_REJECT_UNAUTHORIZED=0 since that will affect request for entire process
            // http.RequestOptions doesn't expose a way to modify RequestOptions.agent.options
            // we have to cast it to any and change it directly
            agent.options = Object.assign(agent.options || {}, { rejectUnauthorized: false });
        }

        if (usingSsl && this._certConfig) {
            agent.options = Object.assign(agent.options || {}, { ca: this._ca, cert: this._cert, key: this._key, passphrase: this._certConfig.passphrase });
        }

        return agent;
    }

    private _getProxy(requestUrl) {
        const parsedUrl = url.parse(requestUrl);
        let usingSsl = parsedUrl.protocol === 'https:';
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
                proxyAuth = proxyConfig.proxyUsername + ":" + proxyConfig.proxyPassword;
            }
        }

        return { proxyUrl: proxyUrl, proxyAuth: proxyAuth };
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
