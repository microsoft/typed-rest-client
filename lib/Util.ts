import * as url from 'url';

/**
 * creates an url from a request url and optional base url (http://server:8080)
 * @param {string} requestUrl - a fully qualified url or relative url
 * @param {string} baseUrl - an optional baseUrl (http://server:8080)
 * @return {string} - resultant url 
 */
export function getUrl(requestUrl: string, baseUrl?: string): string  {
    if (!baseUrl) {
        return requestUrl;
    }

    let base: url.Url = url.parse(baseUrl);

    // requestUrl (specific per request) always wins
    let combined: url.Url = url.parse(requestUrl);
    combined.protocol = combined.protocol || base.protocol;
    combined.auth = combined.auth || base.auth;
    combined.host = combined.host || base.host;
    // path from requestUrl always wins

    let res: string = url.format(combined);
    return res;
}
