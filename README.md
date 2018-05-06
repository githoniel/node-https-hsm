# node-https-hsm

Nodejs's native https is a wrap of OpenSSL. If you want to use HSM(hardware security module), you need to use openSSL's `SetEngine` function and you need to write C code.

This lib is based on [node-forge](https://github.com/digitalbazaar/forge) (A pure JS implementation of TLS via Nodejs `net.socket`). You can make Certificate Signature by RSA in JS. This in a very common use in bank's USBkey.

## node-forge

the original `node-forge` current does not support Tls v1.2 but this lib does and I had made PR to it.Once node-forge support Tls v1.2 I will use  original `node-forge`

## API

```js
/**
 * HTTPS Request，call hardware security module to make Certificate Signature
 * @param {Object} options
 * @property {string} host A domain name or IP address of the server to issue the request to. Default: 'localhost'
 * @property {number} port Port of remote server, default 443
 * @property {string} method A string specifying the HTTP request method. Default: 'POST'.
 * @property {path} path Request path. Should include query string if any. E.G. '/index.html?page=12'.Default: '/'.
 * @property {Object} headers An object containing request headers.
 * @property {Object} body An object containing request body.
 * @property {function} getCA get Array of CA cert string in PEM format, support Async
 * @property {function} getCert get client cert string in PEM format or client cert Buffer in CRT format, support Async
 * @property {function} rsaSign get Certificate Signature in Buffer format，only support RSA
 * @property {Boolean} debug debug mode will console.log more info. Default: false
 */
module.exports = async function httpsHSM
```

## Example

```js
const fs = require('fs')
const forge = require('../node-forge')

const httpsHSM = require('../')

httpsHSM({
    host: '127.0.0.1',
    port: 8000,
    path: '/t',
    headers: {
        'content-type': 'application/json;charset=UTF-8'
    },
    body: {
        name: 'Hello World!',
        age: 2046
    },
    async getCA() {
        return [fs.readFileSync('./test/ca-crt.pem').toString()]
    },
    async getCert() {
        return fs.readFileSync('./test/client1-crt.pem').toString()
    },
    async rsaSign(b) {
        const privateKeyStr = fs.readFileSync('./test/client1-key.pem').toString()
        const privateKey = forge.pki.privateKeyFromPem(privateKeyStr)
        return privateKey.sign(b, null)
    },
    debug: false
}).then((r) => {
    console.log(r)
}, (e) => {
    console.error(e)
})
```
