/// <reference path="../typings/index.d.ts" />

import * as rm from 'typed-rest-client/RestClient';
import * as fs from 'fs';
import * as path from 'path';
import * as cm from './common';

let baseUrl: string = 'https://httpbin.org';
let restc: rm.RestClient = new rm.RestClient('rest-samples', 
                                             baseUrl);

//
// This is often not needed.  In this case, using httpbin.org which echos the object
// in the data property of the json.  It's an artifact of sample service used.
// But it's useful to note that we do offer a processing function which is invoked on the returned json.
//
let options: rm.IRequestOptions = <rm.IRequestOptions>{};
options.responseProcessor = (obj: any) => {
    return obj['data'];
}

export async function run() {
    let restRes: rm.IRestResponse<cm.HttpBinData>;
    
    try {
        cm.banner('Rest Samples');
        
        //
        // Get Resource: strong typing of resource(s) via generics.  
        // In this case httpbin.org has a response structure
        // response.result carries the resource(s)
        //
        cm.heading('get rest obj');
        restRes = await restc.get<cm.HttpBinData>('get');
        console.log(restRes.statusCode, restRes.result['url']);

        //
        // Create and Update Resource(s)
        // Generics <T,R> are the type sent and the type returned in the body.  Ideally the same in REST service
        //
        interface HelloObj {
            message: string;
        }
        let hello: HelloObj = <HelloObj>{ message: "Hello World!" };

        cm.heading('create rest obj'); 
        let hres: rm.IRestResponse<HelloObj> = await restc.create<HelloObj, HelloObj>('/post', hello, options);
        console.log(hres.result);

        cm.heading('update rest obj');
        hello.message += '!';
        hres = await restc.update<HelloObj, HelloObj>('/patch', hello, options);
        console.log(hres.result);

        cm.heading('update rest obj');
        // you can also specify a full url (not relative) per request
        hres = await restc.update<HelloObj, HelloObj>('https://httpbin.org/patch', hello, options);
        console.log(hres.result);
    }
    catch (err) {
        console.error('Failed: ' + err.message);
    }
}
