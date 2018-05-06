const forge = require('../node-forge')
const http = require('../node-forge/http')
const net = require('net')
const fs = require('fs')

var socket = new net.Socket()

var client = forge.tls.createConnection({
    server: false,
    caStore: [fs.readFileSync('./node-tls/ca-crt.pem').toString()],
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
    connected: function (connection) {
        console.log('[tls] connected');
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
        const requestString = request.toString()
        client.prepare(requestString);
        client.prepare(body);
        // client.prepare('POST /t HTTP/1.0\r\n\r\n');
    },
    tlsDataReady: function (connection) {
        // encrypted data is ready to be sent to the server
        var data = connection.tlsData.getBytes();
        socket.write(data, 'binary'); // encoding should be 'binary'
    },
    dataReady: function (connection) {
        // clear data from the server is ready
        var data = connection.data.getBytes();
        console.log('[tls] data received from the server: ' + data);
    },
    closed: function () {
        console.log('[tls] disconnected');
    },
    error: function (connection, error) {
        console.log('[tls] error', error);
    }
});

socket.on('connect', function () {
    console.log('[socket] connected');
    client.handshake();
});
socket.on('data', function (data) {
    client.process(data.toString('binary')); // encoding should be 'binary'
});
socket.on('end', function () {
    console.log('[socket] disconnected');
});

socket.connect(8000, '127.0.0.1');