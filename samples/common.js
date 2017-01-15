"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
function banner(title) {
    console.log();
    console.log('=======================================');
    console.log('\t' + title);
    console.log('=======================================');
}
exports.banner = banner;
function heading(title) {
    console.log();
    console.log('> ' + title);
}
exports.heading = heading;
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
exports.outputHttpBinResponse = outputHttpBinResponse;
//
// This is often not needed.  In this case, using httpbin.org which echos the object
// in the data property of the json.  It's an artifact of sample service used.
// But it's useful to note that we do offer a processing function which is invoked on the returned json.
//
function httpBinOptions() {
    let options = {};
    options.responseProcessor = (obj) => {
        return obj['data'];
    };
    return options;
}
exports.httpBinOptions = httpBinOptions;
