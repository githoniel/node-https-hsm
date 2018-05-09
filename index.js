const forge = require('./node-forge')
const http = require('./node-forge/http')
const net = require('net')

const response = http.createResponse()

module.exports = {
    forge,
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
    request: async function httpsHSM({
        host = 'localhost',
        port = 443,
        method = 'POST',
        path = '/',
        headers,
        body,
        getCA,
        getCert,
        rsaSign,
        debug = false
    }) {
        const socket = new net.Socket()

        const cert = await getCert()
        const caStore = await getCA()

        return new Promise((resolve, reject) => {
            const client = forge.tls.createConnection({
                server: false,
                caStore,
                getCertificate() {
                    if (typeof cert === 'string') {
                        // PEM string
                        if (debug) {
                            console.log(`Client Certificate: ${cert}`)
                        }
                        return cert
                    } else {
                        // CRT Buffer
                        const crt = cert.toString('binary')
                        const bytes = forge.util.createBuffer(crt)
                        const asn1 = forge.asn1.fromDer(bytes)
                        const certObject = forge.pki.certificateFromAsn1(asn1, true)
                        const pem = forge.pki.certificateToPem(certObject)
                        if (debug) {
                            console.log(`Client Certificate: ${cert}`)
                        }
                        return pem
                    }
                },
                async getSignature(c, b, callback) {
                    const hash = forge.pki.rsa.emsaPkcs1v15encode(c.session.sha256)
                    if (debug) {
                        console.log(`Client Certificate PKCS1#1.5 SHA256 HASH: ${hash}`)
                    }
                    const sign = await rsaSign(hash)
                    if (debug) {
                        console.log(`Client Certificate Signature: ${sign}`)
                    }
                    callback(c, sign)
                },
                connected() {
                    const bodyString = JSON.stringify(body)
                    if (debug) {
                        console.log('[tls] connected')
                    }
                    const request = http.createRequest({
                        method,
                        path,
                        headers,
                        body: bodyString
                    })
                    const requestString = request.toString()
                    client.prepare(requestString)
                    if (bodyString) {
                        client.prepare(bodyString)
                    }
                },
                tlsDataReady(connection) {
                    const data = connection.tlsData.getBytes()
                    if (debug) {
                        console.log(`[tls] data send to the server: ${data}`)
                    }
                    socket.write(data, 'binary')
                },
                dataReady(connection) {
                    if (debug) {
                        console.log(`[tls] data received from the server: ${connection.data}`)
                    }
                    if (!response.headerReceived) {
                        response.readHeader(connection.data)
                    }
                    if (!response.bodyReceived) {
                        response.readBody(connection.data)
                    }
                    if (!response.bodyReceived) {
                        return
                    }
                    resolve(response)
                    socket.destroy()
                },
                closed() {
                    if (debug) {
                        console.log('[tls] disconnected')
                    }
                },
                error(connection, error) {
                    if (debug) {
                        console.log('[tls] error', error)
                    }
                    socket.destroy()
                    reject(error)
                }
            })

            socket.on('connect', () => {
                if (debug) {
                    console.log('[socket] connected')
                    client.handshake()
                }
            })
            socket.on('data', (data) => {
                client.process(data.toString('binary')) // encoding should be 'binary'
            })
            socket.on('end', () => {
                if (debug) {
                    console.log('[socket] disconnected')
                }
            })

            socket.connect(port, host)
        })
    }
}