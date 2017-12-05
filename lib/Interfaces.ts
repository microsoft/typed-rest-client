export interface IHeaders { [key: string]: any };

export interface IBasicCredentials {
    username: string;
    password: string;
}

export interface IRequestHandler {
    prepareRequest(options: any): void;
    canHandleAuthentication(res: IHttpResponse): boolean;
    handleAuthentication(httpClient, protocol, options, objs, finalCallback): void;
}

export interface IHttpResponse {
    statusCode?: number;
    headers: any;
}

export interface IRequestOptions {
    socketTimeout?: number,
    ignoreSslError?: boolean,
    proxy?: IProxyConfiguration,
    cert?: ICertConfiguration,
    allowRedirects?: boolean, 
    maxRedirects?: number,
    maxSockets?: number,
    keepAlive?: boolean
}

export interface IProxyConfiguration {
    proxyUrl: string;
    proxyUsername?: string;
    proxyPassword?: string;
    proxyBypassHosts?: string[];
}

export interface ICertConfiguration {
    caFile?: string;
    certFile?: string;
    keyFile?: string;
    passphrase?: string;
}