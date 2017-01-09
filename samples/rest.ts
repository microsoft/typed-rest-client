/// <reference path="../typings/index.d.ts" />

import * as rm from 'typed-rest-client/RestClient';
import * as fs from 'fs';
import * as path from 'path';
import * as cm from './common';

let restc: rm.RestClient = new rm.RestClient('vsts-http');

export async function run() {
    let restRes: rm.IRestResponse<cm.HttpBinData>;
    

    try {
        cm.heading('get rest obj');
        restRes = await restc.get<cm.HttpBinData>('https://httpbin.org/get', '1.0-preview');
        cm.outputRestResponse(restRes);

        interface HelloObj {
            message: string;
        }
        let obj: HelloObj = <HelloObj>{ message: "Hello World!" };

        cm.heading('create rest obj');
        let hres: rm.IRestResponse<HelloObj> = await restc.create<HelloObj>('https://httpbin.org/post', '1.0-preview', obj);        
        cm.outputRestResponse(restRes);

        cm.heading('update rest obj');
        hres = await restc.update<HelloObj>('https://httpbin.org/patch', '1.0-preview', obj);
        cm.outputRestResponse(restRes);     
    }
    catch (err) {
        console.error('Failed: ' + err.message);
    }
}
