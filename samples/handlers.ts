import * as hm from 'typed-rest-client/Handlers'
import * as cm from './common';

export async function run() {
    cm.banner('Handler Samples');
    
    let bh: hm.BasicCredentialHandler = new hm.BasicCredentialHandler('johndoe', 'password');
    let ph: hm.PersonalAccessTokenCredentialHandler = 
        new hm.PersonalAccessTokenCredentialHandler('scbfb44vxzku5l4xgc3qfazn3lpk4awflfryc76esaiq7aypcbhs');
    let nh: hm.NtlmCredentialHandler = new hm.NtlmCredentialHandler('johndoe', 'password');
    // These handlers would then be passed to the constructors of the http or rest modules
}



