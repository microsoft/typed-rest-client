// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import ReactDOM from 'react-dom';
import * as httpm from 'typed-rest-client/HttpClient';
import * as restm from 'typed-rest-client/RestClient';

function injectResponse(obj, client) {
    const injectResponseString = 'Received response from: ' + obj.url + ' using ' + client.toUpperCase() + ' client';
    ReactDOM.render((<div className='temp'>{injectResponseString}</div>), 
                    document.getElementById('example-get-with-' + client));
}

function injectFailure(reason, client) {
    const injectFailureString = client + ' failed with reason ' + reason.toString();
    ReactDOM.render((<div className='temp'>{injectFailureString}</div>), 
                    document.getElementById('example-get-with-' + client));
}

function exampleGetWithRest() {
    const client = 'rest';
    const restc = new restm.RestClient('vsts-node-api');
    const response = restc.get('https://httpbin.org/get');
    response.then((res) => {
        try {
            injectResponse(res.result, client);
        }
        catch (err) {
            injectFailure(err, client);
        }
    }, (reason) => {
        injectFailure(reason, client);
    });

    response.catch((reason) => {
        injectFailure(reason, client);
    });
}

function exampleGetWithHttp() {
    const client = 'http';
    const httpc = new httpm.HttpClient('vsts-node-api');
    const response = httpc.get('https://httpbin.org/get');
    response.then((res) => {
        const bodyPromise = res.readBody();
        bodyPromise.then((body) => {
            injectResponse(JSON.parse(body), client);
        }, (reason) => {
            injectFailure(reason, client);
        });
    }, (reason) => {
        injectFailure(reason, client);
    });
    response.catch((reason) => {
        injectFailure(reason, client);
    });
}

  class Example extends React.Component {
    render() {
      return (
        <div className='react-example'>
          <div id='example-get-with-rest'>This should be replaced</div>
          <div id='separator'>--------------------------------------------------------------------------------</div>
          <div id='example-get-with-http'>This should be replaced</div>
        </div>
      );
    }
  }
  
  // ========================================
  
  ReactDOM.render(
    <Example />,
    document.getElementById('root')
  );
  exampleGetWithRest();
  exampleGetWithHttp();