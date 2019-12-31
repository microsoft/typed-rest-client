# node-ntlm, NTLM authentication and Samba LM/NT hash library

## Introduction

This library converts passwords into the LAN Manager (LM) and
NT Hashes used by SMB/CIFS servers.  It was written to populate
the sambaLMPassword and sambaNTPassword values in an LDAP directory
for use with Samba.

In addition, the library also provides helper methods for encoding
and decoding the headers used during NTLM HTTP authentication.  This
functionality should presently be considered experimental.

## Installation

     npm install ntlm

## NTLM Usage

NTLM HTTP Authentication headers are Base64-encoded packed structures of
three basic varieties.  Type 1 & 3 are sent from the client to the server,
and Type 2 is from server to client. With the `request` and `agentkeepalive` libraries:

```javascript
// npm install ntlm request agentkeepalive

var url = "https://.../ews/exchange.asmx"
  , domain = ...
  , username = ...
  , password = ...

var ntlm = require('ntlm')
  , ntlmrequest = require('request').defaults({
    agentClass: require('agentkeepalive').HttpsAgent
  });

ntlmrequest(url, {
  headers: {
    'Authorization': ntlm.challengeHeader(hostname, domain),
  }
}, function(err, res) {
  ntlmrequest(url, {
    headers: {
      'Authorization': ntlm.responseHeader(res, url, domain, username, password)
    }
  }, function (err, res, body) {
    console.log(body);
  });
});
```

## Hash Usage

```javascript
var lmhash = require('smbhash').lmhash;
var nthash = require('smbhash').nthash;

var pass = 'pass123';
console.log('LM Hash: ' + lmhash(pass));
console.log('NT Hash: ' + nthash(pass));
```

This produces output:

```
LM Hash: 4FB7D301186E0EB3AAD3B435B51404EE
NT Hash: 5FBC3D5FEC8206A30F4B6C473D68AE76
```

## References

     The NTLM Authentication Protocol and Security Support Provider
     Copyright (C) 2003, 2006 Eric Glass
     http://davenport.sourceforge.net/ntlm.html

     NTLM Authentication Scheme for HTTP
     Ronald Tschalaer / 17. June 2003
     http://www.innovation.ch/personal/ronald/ntlm.html
