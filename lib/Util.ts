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

    let base: url.Url = url.parse(baseUrl);

    // resource (specific per request) eliments take priority
    let resultantUrl: url.Url = url.parse(resource);
    resultantUrl.protocol = resultantUrl.protocol || base.protocol;
    resultantUrl.auth = resultantUrl.auth || base.auth;
    resultantUrl.host = resultantUrl.host || base.host;

    let basePathComponent: string = base.pathname === '/' ? '' : base.pathname;
    resultantUrl.pathname = path.posix.resolve(basePathComponent, resultantUrl.pathname);

    let res: string = url.format(resultantUrl);

    return res;
}
