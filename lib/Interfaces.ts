import http = require("http");
import url = require("url");

export interface IHeaders {[key: string]: any};

export interface IBasicCredentials {
    username: string;
    password: string;
}

export interface IRequestOptions {
    headers: IHeaders;
}

export interface IHttpClient {
    options(requestUrl: string, additionalHeaders?: IHeaders): Promise<IHttpClientResponse>;
    get(requestUrl: string, additionalHeaders?: IHeaders): Promise<IHttpClientResponse>;
    del(requestUrl: string, additionalHeaders?: IHeaders): Promise<IHttpClientResponse>;
    post(requestUrl: string, data: string, additionalHeaders?: IHeaders): Promise<IHttpClientResponse>;
    patch(requestUrl: string, data: string, additionalHeaders?: IHeaders): Promise<IHttpClientResponse>;
    put(requestUrl: string, data: string, additionalHeaders?: IHeaders): Promise<IHttpClientResponse>;        
    sendStream(verb: string, requestUrl: string, stream: NodeJS.ReadableStream, additionalHeaders?: IHeaders): Promise<IHttpClientResponse>;
    request(verb: string, requestUrl: string, data: string | NodeJS.ReadableStream, headers: IHeaders): Promise<IHttpClientResponse>;
    requestRaw(info: IRequestInfo, data: string | NodeJS.ReadableStream): Promise<IHttpClientResponse>;
}

export interface IRequestHandler {
    prepareRequest(options: http.RequestOptions): void;
    canHandleAuthentication(res: IHttpClientResponse): boolean;
    handleAuthentication(httpClient: IHttpClient, reqInfo: IRequestInfo, objs): Promise<IHttpClientResponse>;
}

export interface IHttpClientResponse {

    message: http.IncomingMessage;
    readBody(): Promise<string>;
}

export interface IRequestInfo {
    options: http.RequestOptions;
    parsedUrl: url.Url;
    httpModule: any;
}
