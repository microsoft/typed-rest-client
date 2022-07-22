// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { exampleGetWithHttp } from "./httpApi";
import { exampleGetWithRest } from "./restApi";

async function runExampleGetWithRest() {
    const el = document.getElementById('example-get-with-rest');
    el.innerHTML = await exampleGetWithRest();
}

async function runExampleGetWithHttp() {
    const el = document.getElementById('example-get-with-http');
    el.innerHTML = await exampleGetWithHttp();
}

const getHtmlContent = () => {
    return `
        <div className='webpack-example'>
            <div id='example-get-with-rest'>This should be replaced</div>
            <div id='separator'>--------------------------------------------------------------------------------</div>
            <div id='example-get-with-http'>This should be replaced</div>
        </div>`;
}

function run() {
    const rootEl = document.querySelector("#root");
    rootEl.innerHTML = getHtmlContent();

    runExampleGetWithRest();
    runExampleGetWithHttp();
}

run();
