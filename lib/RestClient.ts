// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import * as fs from 'fs';
import * as http from 'http';
import httpm = require('./HttpClient');
import ifm = require("./Interfaces");
import util = require("./Util");

export interface IRestResponse<T> {
    statusCode: number,
    result: T
}

export interface IRequestOptions {
    // defaults to application/json
    // common versioning is application/json;version=2.1
    acceptHeader?: string,
    // since accept is defaulted, set additional headers if needed
    additionalHeaders?: ifm.IHeaders,

    responseProcessor?: Function
}

export class RestClient {
    client: httpm.HttpClient;
    versionParam: string;

    /**
     * Creates an instance of the RestClient
     * @constructor
     * @param {string} userAgent - userAgent for requests
     * @param {string} baseUrl - (Optional) If not specified, use full urls per request.  If supplied and a function passes a relative url, it will be appended to this
     * @param {ifm.IRequestHandler[]} handlers - handlers are typically auth handlers (basic, bearer, ntlm supplied)
     * @param {number} socketTimeout - default socket timeout.  Can also supply per method
     */
    constructor(userAgent: string,
                baseUrl?: string, 
                handlers?: ifm.IRequestHandler[],
                socketTimeout?: number) {

        this.client = new httpm.HttpClient(userAgent, handlers, socketTimeout);
        if (baseUrl) {
            this._baseUrl = baseUrl;
        }
    }

    private _baseUrl: string;

    /**
     * Gets a resource from an endpoint
     * Be aware that not found returns a null.  Other error conditions reject the promise
     * @param {string} requestUrl - fully qualified or relative url
     * @param {IRequestOptions} requestOptions - (optional) requestOptions object
     */    
    public async get<T>(requestUrl: string, 
                        options?: IRequestOptions): Promise<IRestResponse<T>> {
        
        let url: string = util.getUrl(requestUrl, this._baseUrl);
        let res: httpm.HttpClientResponse = await this.client.get(url, 
                                                                  this._headersFromOptions(options));
        return this._processResponse<T>(res, options);
    }

    /**
     * Deletes a resource from an endpoint
     * Be aware that not found returns a null.  Other error conditions reject the promise
     * @param {string} requestUrl - fully qualified or relative url
     * @param {IRequestOptions} requestOptions - (optional) requestOptions object
     */    
    public async del<T>(requestUrl: string, 
                        options?: IRequestOptions): Promise<IRestResponse<T>> {
        
        let url: string = util.getUrl(requestUrl, this._baseUrl);
        let res: httpm.HttpClientResponse = await this.client.del(url, 
                                                                  this._headersFromOptions(options));
        return this._processResponse<T>(res, options);
    }

    /**
     * Creates resource(s) from an endpoint
     * T type of object sent.  R is response body type.  Ideally these are the same.
     * Be aware that not found returns a null.  Other error conditions reject the promise
     * @param {string} requestUrl - fully qualified or relative url
     * @param {IRequestOptions} requestOptions - (optional) requestOptions object
     */
    public async create<T, R>(requestUrl: string,  
                           resources: any, 
                           options?: IRequestOptions): Promise<IRestResponse<R>> {
        
        let url: string = util.getUrl(requestUrl, this._baseUrl);
        let headers: ifm.IHeaders = this._headersFromOptions(options, true);

        let data: string = JSON.stringify(resources, null, 2);
        let res: httpm.HttpClientResponse = await this.client.post(url, data, headers);
        return this._processResponse<R>(res, options);
    }

    /**
     * Updates resource(s) from an endpoint
     * T type of object sent.  R is response body type.  Ideally these are the same.
     * Be aware that not found returns a null.  Other error conditions reject the promise
     * @param {string} requestUrl - fully qualified or relative url
     * @param {IRequestOptions} requestOptions - (optional) requestOptions object
     */
    public async update<T, R>(requestUrl: string,
                 resources: any, 
                 options?: IRequestOptions): Promise<IRestResponse<R>> {

        let url: string = util.getUrl(requestUrl, this._baseUrl);
        let headers: ifm.IHeaders = this._headersFromOptions(options, true);      
        
        let data: string = JSON.stringify(resources, null, 2);
        let res: httpm.HttpClientResponse = await this.client.patch(url, data, headers);
        return this._processResponse<R>(res, options);
    }

    /**
     * Replaces resource(s) from an endpoint
     * T type of object sent.  R is response body type.  Ideally these are the same.
     * Be aware that not found returns a null.  Other error conditions reject the promise
     * @param {string} requestUrl - fully qualified or relative url
     * @param {IRequestOptions} requestOptions - (optional) requestOptions object
     */
    public async replace<T, R>(requestUrl: string,
                 resources: any, 
                 options?: IRequestOptions): Promise<IRestResponse<R>> {
        
        let url: string = util.getUrl(requestUrl, this._baseUrl);
        let headers: ifm.IHeaders = this._headersFromOptions(options, true);        
        
        let data: string = JSON.stringify(resources, null, 2);
        let res: httpm.HttpClientResponse = await this.client.put(url, data, headers);
        return this._processResponse<R>(res, options);
    }

    public async uploadStream<T, R>(verb: string, 
                                 requestUrl: string, 
                                 stream: NodeJS.ReadableStream, 
                                 options?: IRequestOptions): Promise<IRestResponse<R>> {

        let url: string = util.getUrl(requestUrl, this._baseUrl);
        let headers: ifm.IHeaders = this._headersFromOptions(options, true);

        let res: httpm.HttpClientResponse = await this.client.sendStream(verb, url, stream, headers);
        return this._processResponse<R>(res, options);
    }

    // should move to the consumer
    // public createAcceptHeader(type: string, apiVersion?: string): string {
    //     return type + (apiVersion ? (';' + this.versionParam + '=' + apiVersion) : '');
    // }

    private _headersFromOptions(options: IRequestOptions, contentType?: boolean): ifm.IHeaders {
        options = options || {};
        let headers: ifm.IHeaders = options.additionalHeaders || {};                    
        headers["Accept"] = options.acceptHeader || "application/json";

        if (contentType) {
            headers["Content-Type"] = headers["Content-Type"] || 'application/json; charset=utf-8';
        }

        return headers;        
    }

    private async _processResponse<T>(res: httpm.HttpClientResponse, options: IRequestOptions): Promise<IRestResponse<T>> {
        return new Promise<IRestResponse<T>>(async(resolve, reject) => {
            let rres: IRestResponse<T> = <IRestResponse<T>>{};
            let statusCode: number = res.message.statusCode;
            rres.statusCode = statusCode;

            // not found leads to null obj returned
            if (statusCode == httpm.HttpCodes.NotFound) {    
                resolve(rres);
            }

            let obj: any;

            // get the result from the body
            try {
                let contents: string = await res.readBody();
                if (contents && contents.length > 0) {
                    obj = JSON.parse(contents);
                    if (options && options.responseProcessor) {
                        rres.result = options.responseProcessor(obj);
                    }
                    else {
                        rres.result = obj;
                    }
                }
            }
            catch (err) {
                reject(new Error('Invalid Resource'));
            }

            if (statusCode > 299) {
                let msg: string;

                // if exception/error in body, attempt to get better error
                if (obj && obj.message) {
                    msg = obj.message;
                } else {
                    msg = "Failed request: (" + statusCode + ") " + res.message.url;
                }

                reject(new Error(msg));
            } else {
                resolve(rres);
            }            
        });        
    } 
}
