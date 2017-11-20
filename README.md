# Typed Rest and Http Client with TypeScript Typings

A lightweight Rest and Http Client optimized for use with TypeScript with generics and async await.

## Status

With 0.9 just published, we believe the API surface for 1.0 has settled.  More testing in progress then we will release 1.0.

## Features

  - Rest Client with typescript generics and async/await/Promises
  - Http Client with pipe stream support and async/await/Promises 
  - Typings included so no need to acquire separately (great for intellisense and no versioning drift)

  - Basic, Bearer and NTLM Support out of the box
  - Proxy support
  - Certificate support (Self-signed server and client cert)
  - Layered for Rest or Http use
  - Full Samples and Tests included for usage

```javascript
import * as rm from 'typed-rest-client/RestClient';

let restc: rm.RestClient = new rm.RestClient('rest-samples', 
                                             'https://mystudentapiserver');

let res: rm.IRestResponse<Student> = await restc.get<Student>('/students/5');

console.log(res.statusCode);
console.log(res.result.name);
```

![intellisense](./docs/intellisense.png)

## Install the library
```
npm install typed-rest-client --save
```

## Samples

See [samples](./samples) for complete coding examples

## Contributing

To contribute to this repository, see the [contribution guide](./CONTRIBUTING.md)

## Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
