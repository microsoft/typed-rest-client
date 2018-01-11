import * as httpSamples from './http';
import * as restSamples from './rest';
import * as handlerSamples from './handlers';

async function run() {
    try {
        await httpSamples.run();
        await restSamples.run();
        await handlerSamples.run();
    }
    catch (err) {
        console.error('Failed');
        console.error(err.message);
    }  
}

run();
