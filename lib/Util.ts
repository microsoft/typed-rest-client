// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import * as qs from 'qs';
import * as url from 'url';
import * as path from 'path';
import zlib = require('zlib');
import { IRequestQueryParams, IHttpClientResponse } from './Interfaces';
import { searchRegExpToReplaceSpecialChars } from './Constants';

/**
 * creates an url from a request url and optional base url (http://server:8080)
 * @param {string} resource - a fully qualified url or relative path
 * @param {string} baseUrl - an optional baseUrl (http://server:8080)
 * @param {IRequestOptions} options - an optional options object, could include QueryParameters e.g.
 * @return {string} - resultant url
 */
export function getUrl(resource: string, baseUrl?: string, queryParams?: IRequestQueryParams): string  {
    const pathApi = path.posix || path;
    let requestUrl = '';

    if (!baseUrl) {
        requestUrl = resource;
    }
    else if (!resource) {
        requestUrl = baseUrl;
    }
    else {
        const base: url.Url = url.parse(baseUrl);
        const resultantUrl: url.Url = url.parse(resource);

        // resource (specific per request) elements take priority
        resultantUrl.protocol = resultantUrl.protocol || base.protocol;
        resultantUrl.auth = resultantUrl.auth || base.auth;
        resultantUrl.host = resultantUrl.host || base.host;

        resultantUrl.pathname = pathApi.resolve(base.pathname, resultantUrl.pathname);

        if (!resultantUrl.pathname.endsWith('/') && resource.endsWith('/')) {
            resultantUrl.pathname += '/';
        }

        requestUrl = url.format(resultantUrl);
    }

    return queryParams ?
        getUrlWithParsedQueryParams(requestUrl, queryParams):
        requestUrl;
}

/**
 *
 * @param {string} requestUrl
 * @param {IRequestQueryParams} queryParams
 * @return {string} - Request's URL with Query Parameters appended/parsed.
 */
function getUrlWithParsedQueryParams(requestUrl: string, queryParams: IRequestQueryParams): string {
    const url: string  = requestUrl.replace(/\?$/g, ''); // Clean any extra end-of-string "?" character
    const parsedQueryParams: string = qs.stringify(queryParams.params, buildParamsStringifyOptions(queryParams));

    return `${url}${parsedQueryParams}`;
}

/**
 * Build options for QueryParams Stringifying.
 *
 * @param {IRequestQueryParams} queryParams
 * @return {object}
 */
function buildParamsStringifyOptions(queryParams: IRequestQueryParams): any  {
    let options: any = {
        addQueryPrefix: true,
        delimiter: (queryParams.options || {}).separator || '&',
        allowDots: (queryParams.options || {}).shouldAllowDots || false,
        arrayFormat: (queryParams.options || {}).arrayFormat || 'repeat',
        encodeValuesOnly: (queryParams.options || {}).shouldOnlyEncodeValues || true
    }

    return options;
}

/**
 * Decompress/Decode gzip encoded JSON
 * Using Node.js built-in zlib module
 *
 * @param {Buffer} buffer
 * @param {string} charset? - optional; defaults to 'utf-8'
 * @return {Promise<string>}
 */
export async function decompressGzippedContent(buffer: Buffer, charset?: string): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
        zlib.gunzip(buffer, function (error, buffer) {
            if (error) {
                reject(error);
            }

            resolve(buffer.toString(charset || 'utf-8'));
        });
    })
}

/**
 * Builds a RegExp to test urls against for deciding
 * wether to bypass proxy from an entry of the
 * environment variable setting NO_PROXY
 *
 * @param {string} bypass
 * @return {RegExp}
 */
export function buildProxyBypassRegexFromEnv(bypass : string) : RegExp {
    // check if expression starts with asterisk and replace it with .*
    if (bypass && bypass.startsWith("*")) {
        bypass = bypass.replace("*", ".*");
    }

    // replace all . symbols in string by \. because point is a special character
    const safeRegex = (bypass || "").replace(searchRegExpToReplaceSpecialChars, '\\$1');

    return new RegExp(safeRegex, 'i');
}

/**
 * Obtain Response's Content Charset.
 * Through inspecting `content-type` response header.
 * It Returns 'utf-8' if NO charset specified/matched.
 *
 * @param {IHttpClientResponse} response
 * @return {string} - Content Encoding Charset; Default=utf-8
 */
export function obtainContentCharset (response: IHttpClientResponse) : string {
  // Find the charset, if specified.
  // Search for the `charset=CHARSET` string, not including `;,\r\n`
  // Example: content-type: 'application/json;charset=utf-8'
  // |__ matches would be ['charset=utf-8', 'utf-8', index: 18, input: 'application/json; charset=utf-8']
  // |_____ matches[1] would have the charset :tada: , in our example it's utf-8
  // However, if the matches Array was empty or no charset found, 'utf-8' would be returned by default.
  const nodeSupportedEncodings = ['ascii', 'utf8', 'utf16le', 'ucs2', 'base64', 'binary', 'hex'];
  const contentType: string = response.message.headers['content-type'] || '';
  const matches: (RegExpMatchArray|null) = contentType.match(/charset=([^;,\r\n]+)/i);

  return (matches && matches[1] && nodeSupportedEncodings.indexOf(matches[1]) != -1) ? matches[1] : 'utf-8';
}
