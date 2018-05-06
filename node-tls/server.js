const tls = require('tls');
const fs = require('fs');
const https = require('https')
const express = require('express')
const bodyParser = require('body-parser')

const app = new express()


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: false
}))

app.post('/t', function (req, res) {
    console.log(req.body.name)
    console.log(req.body.age)
    res.send('Hello World!');
})

const options = { 
    key: fs.readFileSync('./node-tls/server-key.pem'), 
    cert: fs.readFileSync('./node-tls/server-crt.pem'), 
    ca: fs.readFileSync('./node-tls/ca-crt.pem'), 
    requestCert: true, 
    rejectUnauthorized: true
}

const server = https.createServer(options, app)

server.listen(8000, () => {
    console.log('server bound');
});