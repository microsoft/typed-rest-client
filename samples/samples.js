/// <reference path="../typings/index.d.ts" />
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const httpm = require("typed-rest-client/HttpClient");
const restm = require("typed-rest-client/RestClient");
const fs = require("fs");
const path = require("path");
const cm = require("./common");
let sampleFilePath = path.join(process.cwd(), 'httpClientStreamSample.txt');
let httpc = new httpm.HttpClient('vsts-node-api');
let restc = new restm.RestClient('vsts-http');
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        let restRes;
        try {
            //--------------------------------------
            // HttpClient
            //--------------------------------------
            //
            // Http get.  Can await get response.
            // The response offers a message (IncomingMessage) and
            // an awaitable readBody() which reads the stream to end
            //
            cm.heading('get request output body');
            let res = yield httpc.get('https://httpbin.org/get');
            let status = res.message.statusCode;
            let body = yield res.readBody();
            outputHttpBinResponse(body, status);
            //
            // Http get request reading body to end in a single line
            //
            cm.heading('get request in a single line');
            body = yield (yield httpc.get('https://httpbin.org/get')).readBody();
            outputHttpBinResponse(body);
            //
            // Http get piping to another stream
            // response message is an IncomingMessage which is a stream
            //
            cm.heading('get request and pipe stream');
            let file = fs.createWriteStream(sampleFilePath);
            (yield httpc.get('https://httpbin.org/get')).message.pipe(file);
            body = fs.readFileSync(sampleFilePath).toString();
            outputHttpBinResponse(body);
            // DELETE request
            cm.heading('delete request');
            res = yield httpc.del('https://httpbin.org/delete');
            body = yield res.readBody();
            outputHttpBinResponse(body, status);
            let b = 'Hello World!';
            // POST request
            cm.heading('post request');
            res = yield httpc.post('https://httpbin.org/post', b);
            body = yield res.readBody();
            outputHttpBinResponse(body, status);
            // PATCH request
            cm.heading('patch request');
            res = yield httpc.patch('https://httpbin.org/patch', b);
            body = yield res.readBody();
            outputHttpBinResponse(body, status);
            // GET not found
            cm.heading('get not found');
            res = yield httpc.get('https://httpbin.org/status/404');
            body = yield res.readBody();
            outputHttpBinResponse(body, status);
            //--------------------------------------
            // RestClient
            //--------------------------------------
            cm.heading('get rest obj');
            restRes = yield restc.get('https://httpbin.org/get', '1.0-preview');
            outputRestResponse(restRes);
            let obj = { message: "Hello World!" };
            cm.heading('create rest obj');
            restRes = yield restc.create('https://httpbin.org/post', '1.0-preview', obj);
            outputRestResponse(restRes);
            cm.heading('update rest obj');
            restRes = yield restc.update('https://httpbin.org/patch', '1.0-preview', obj);
            outputRestResponse(restRes);
        }
        catch (err) {
            console.error('Failed: ' + err.message);
        }
    });
}
exports.run = run;
//
// Utility functions
//
function outputHttpBinResponse(body, status) {
    return __awaiter(this, void 0, void 0, function* () {
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
    });
}
function outputRestResponse(res) {
    console.log('statusCode:' + res.statusCode);
    if (res && res.result) {
        console.log('response from ' + res.result.url);
        if (res.result.data) {
            console.log('data:', res.result.data);
        }
    }
}
run();
