const forge = require('../node-forge')
const http = require('../node-forge/http')
const fs = require('fs')
const net = require('net')

const client = http.createClient({
    url: 'https://127.0.0.1:8000',
    socketPool: {
        createSocket() {
            return new net.Socket()
        }
    },
    caCerts: [fs.readFileSync('./node-tls/ca-crt.pem').toString()],
    getCertificate() {
        return fs.readFileSync('./node-tls/client1-crt.pem').toString()
    },
    //   getPrivateKey() {
    //       return fs.readFileSync('./node-tls/client1-key.pem').toString()
    //   },
    //   getCertificate: function(connection, hint) {
    //     var crt = fs.readFileSync('./maohj1.crt', 'binary')
    //     var bytes = forge.util.createBuffer(crt)
    //     var asn1 = forge.asn1.fromDer(bytes)
    //     var cert = forge.pki.certificateFromAsn1(asn1, true)
    //     // cert.sign('xxx', forge.md.sha256.create())
    //     var pem = forge.pki.certificateToPem(cert)
    //     return pem
    //   },
    getSignature(c, b, callback) {
        var privateKey = fs.readFileSync('./node-tls/client1-key.pem').toString()
        privateKey = forge.pki.privateKeyFromPem(privateKey)
        b = privateKey.emsaPkcs1v15encode(c.session.sha256)
        b = privateKey.sign(b, null);
        callback(c, b)
    },
    persistCookies: false,
    prime: true,
})

const body = JSON.stringify({
    'name': 'Hello World!',
    'age': 2046
})
const request = http.createRequest({
    method: 'POST',
    path: '/t',
    headers: {
        'content-type': 'application/json;charset=UTF-8'
    },
    body
})

client.send({
    request,
    bodyReady() {
        debugger
    },
    error() {
        debugger
    }
})