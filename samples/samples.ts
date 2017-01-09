import * as httpSamples from './http';
import * as restSamples from './rest';

async function run() {
    await httpSamples.run();
    await restSamples.run();
}

run();
