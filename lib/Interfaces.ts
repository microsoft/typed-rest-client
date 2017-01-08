export interface IHeaders {[key: string]: any};

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