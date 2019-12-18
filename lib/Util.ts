// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import * as qs from 'qs';
import * as url from 'url';
import * as path from 'path';
import { IRequestQueryParams } from './Interfaces';

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