/// <reference path="../typings/index.d.ts" />

import * as rm from 'typed-rest-client/RestClient';
import * as fs from 'fs';
import * as path from 'path';
import * as cm from './common';

let baseUrl: string = 'https://httpbin.org';
let restc: rm.RestClient = new rm.RestClient('rest-samples', 
                                             baseUrl);


export async function run() {
    
    try {
        cm.banner('Rest Samples');

        //
        // Get Resource: strong typing of resource(s) via generics.  
        // In this case httpbin.org has a response structure
        // response.result carries the resource(s)
        //
        cm.heading('get rest obj');
        let restRes: rm.IRestResponse<cm.HttpBinData> = await restc.get<cm.HttpBinData>('get');
        console.log(restRes.statusCode, restRes.result['url']);

        //
        // Create and Update Resource(s)
        // Generics <T,R> are the type sent and the type returned in the body.  Ideally the same in REST service
        //
        interface HelloObj {
            message: string;
        }
        let hello: HelloObj = <HelloObj>{ message: "Hello World!" };
        let options: rm.IRequestOptions = cm.httpBinOptions();

        cm.heading('create rest obj'); 
        let hres: rm.IRestResponse<HelloObj> = await restc.create<HelloObj>('/post', hello, options);
        console.log(hres.result);

        cm.heading('update rest obj');
        hello.message += '!';

        // you can also specify a full url (not relative) per request
        hres = await restc.update<HelloObj>('https://httpbin.org/patch', hello, options);
        console.log(hres.result);

        cm.heading('options rest call');
        let ores: rm.IRestResponse<void> = await restc.options<void>('', options);
        console.log(ores.statusCode);
    }
    catch (err) {
        console.error('Failed: ' + err.message);
    }
}
