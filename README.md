# Typed Rest and Http Client with TypeScript Typings

A lightweight Rest and Http Client optimized for use with TypeScript with generics and async await.

## Status

With 0.9 just published, we believe the API surface for 1.0 has settled.  More testing in progress then we will release 1.0.

## Features

  - Rest and Http Client with typescript generics and async/await/Promises
  - Typings included so no need to acquire separately (great for intellisense and no versioning drift)
  - Basic, Bearer and NTLM Support out of the box
  - Proxy support
  - Certificate support (Self-signed server and client cert)
  - Redirects supported

Intellisense and compile support from typing the REST calls:
![intellisense](./docs/intellisense.png)

## Install the library
```
npm install typed-rest-client --save
```

## Errors

### http
The http client does not throw unless truly exceptional.  A request that successfully executes resulting in a 404, 500 etc... will return a response object with a status code and a body.

See [tests](./test/httptests.ts) for detailed examples.

### rest
The rest client is a high level client which uses the http client.  It's responsibility is to turn a body into a serialized typed object.  

A 200 will be success.  
Redirects (3xx) will be handled for you.  
A 404 will not throw but the result object will be null and the result statusCode will be set.

Other 4xx and 5xx errors will throw.  The status code will be attached to the error object.  If a restfull error object is returned ({ message: xxx}), then the error message will be that.  Otherwise, it will be a generic, "Failed Request: (xxx)".

See [tests](./test/resttests.ts) for detailed examples.

## Samples

See [samples](./samples) for complete coding examples

## Contributing

To contribute to this repository, see the [contribution guide](./CONTRIBUTING.md)

## Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
