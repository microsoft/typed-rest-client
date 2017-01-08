// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import fs = require("fs");
import http = require("http");
import httpm = require('./HttpClient');
import ifm = require("./Interfaces");

export interface IRestClientResponse {
    statusCode: number,
    result: any
}

export class RestClient {
    client: httpm.HttpClient;
    versionParam: string;

    constructor(userAgent: string, handlers?: ifm.IRequestHandler[], socketTimeout?: number, versionParam?: string) {
        // TODO: should we really do this?
        this.versionParam = versionParam || 'api-version';
        this.client = new httpm.HttpClient(userAgent, handlers, socketTimeout);
    }

    public async get(requestUrl: string, 
               apiVersion: string, 
               additionalHeaders?: ifm.IHeaders): Promise<IRestClientResponse> {

        var headers = additionalHeaders || {};                    
        headers["Accept"] = this.createAcceptHeader('application/json', apiVersion);         
        
        let res: httpm.HttpClientResponse = await this.client.get(requestUrl, headers);
        return this._processResponse(res);
    }

    public async del(requestUrl: string, 
               apiVersion: string, 
               additionalHeaders?: ifm.IHeaders): Promise<IRestClientResponse> {

        var headers = additionalHeaders || {};                    
        headers["Accept"] = this.createAcceptHeader('application/json', apiVersion);     
        
        let res: httpm.HttpClientResponse = await this.client.del(requestUrl, headers);
        return this._processResponse(res);
    }

    public async create(requestUrl: string, 
                apiVersion: string, 
                resources: any, 
                additionalHeaders?: ifm.IHeaders): Promise<IRestClientResponse> {
        
        var headers = additionalHeaders || {};                    
        headers["Accept"] = this.createAcceptHeader('application/json', apiVersion);
        headers["Content-Type"] = headers["Content-Type"] || 'application/json; charset=utf-8';        
        
        let data: string = JSON.stringify(resources, null, 2);
        let res: httpm.HttpClientResponse = await this.client.post(requestUrl, data, headers);
        return this._processResponse(res);
    }

    public async update(requestUrl: string, 
                 apiVersion: string, 
                 resources: any, 
                 additionalHeaders?: ifm.IHeaders): Promise<IRestClientResponse> {

        var headers = additionalHeaders || {};                    
        headers["Accept"] = this.createAcceptHeader('application/json', apiVersion);
        headers["Content-Type"] = headers["Content-Type"] || 'application/json; charset=utf-8';        
        
        let data: string = JSON.stringify(resources, null, 2);
        let res: httpm.HttpClientResponse = await this.client.patch(requestUrl, data, headers);
        return this._processResponse(res);
    }

    public async replace(requestUrl: string, 
                 apiVersion: string, 
                 resources: any, 
                 additionalHeaders?: ifm.IHeaders): Promise<IRestClientResponse> {

        var headers = additionalHeaders || {};                    
        headers["Accept"] = this.createAcceptHeader('application/json', apiVersion);
        headers["Content-Type"] = headers["Content-Type"] || 'application/json; charset=utf-8';        
        
        let data: string = JSON.stringify(resources, null, 2);
        let res: httpm.HttpClientResponse = await this.client.put(requestUrl, data, headers);
        return this._processResponse(res);
    }

    public async uploadStream(verb: string, requestUrl: string, apiVersion: string, stream: NodeJS.ReadableStream, additionalHeaders: ifm.IHeaders): Promise<IRestClientResponse> {
        var headers = additionalHeaders || {};
        headers["Accept"] = this.createAcceptHeader('application/json', apiVersion);

        let res: httpm.HttpClientResponse = await this.client.sendStream(verb, requestUrl, stream, headers);
        return this._processResponse(res);
    }

    public createAcceptHeader(type: string, apiVersion?: string): string {
        return type + (apiVersion ? (';' + this.versionParam + '=' + apiVersion) : '');
    }

    private async _processResponse(res: httpm.HttpClientResponse): Promise<IRestClientResponse> {
        return new Promise<IRestClientResponse>(async(resolve, reject) => {
            let rres: IRestClientResponse = <IRestClientResponse>{};
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
                    rres.result = obj;
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
