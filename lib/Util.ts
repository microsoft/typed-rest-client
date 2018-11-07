// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import * as url from 'url';
import * as path from 'path';

/**
 * creates an url from a request url and optional base url (http://server:8080)
 * @param {string} resource - a fully qualified url or relative path
 * @param {string} baseUrl - an optional baseUrl (http://server:8080)
 * @return {string} - resultant url 
 */
export function getUrl(resource: string, baseUrl?: string): string  {
    if (!baseUrl) {
        return resource;
    }
    else if (!resource) {
        return baseUrl;
    }
    else {
        const base: url.Url = url.parse(baseUrl);
        const resultantUrl: url.Url = url.parse(resource);

        // resource (specific per request) elements take priority
        resultantUrl.protocol = resultantUrl.protocol || base.protocol;
        resultantUrl.auth = resultantUrl.auth || base.auth;
        resultantUrl.host = resultantUrl.host || base.host;

        resultantUrl.pathname = path.posix.resolve(base.pathname, resultantUrl.pathname);

        if (!resultantUrl.pathname.endsWith('/') && resource.endsWith('/')) {
            resultantUrl.pathname += '/';
        }

        return url.format(resultantUrl);
    }
}
