import * as restm from 'typed-rest-client/RestClient';

// using httpbin.org.
export interface HttpBinData {
    url: string;
    data: any; 
}

export function banner(title: string): void {
    console.log();
    console.log('=======================================');
    console.log('\t' + title);
    console.log('=======================================');
}

export function heading(title: string): void {
    console.log();
    console.log('> ' + title);
}

//
// Utility functions
//
export async function outputHttpBinResponse(body: string, status?: number) {
    if (status) {
        console.log('status', status);
    }
    
    if (body) {
        let obj = JSON.parse(body.toString());
        console.log('response from ' + obj.url);
        if (obj.data) {
            console.log('data:', obj.data);
        }        
    }
}

export function outputRestResponse(res: restm.IRestResponse<HttpBinData>) {
    console.log('statusCode:' + res.statusCode);

    if (res && res.result) {
        console.log('response from ' + res.result.url);
        if (res.result.data) {
            console.log('data:', res.result.data);
        }
    }    
}


