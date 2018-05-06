const fs = require('fs')
const https = require('https')
const Express = require('express')
const bodyParser = require('body-parser')

const app = new Express()


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: false
}))

app.post('/t', (req, res) => {
    console.log(req.body.name)
    console.log(req.body.age)
    res.send('Hello World!')
})

const options = {
    key: fs.readFileSync('./test/server-key.pem'),
    cert: fs.readFileSync('./test/server-crt.pem'),
    ca: fs.readFileSync('./test/ca-crt.pem'),
    requestCert: true,
    rejectUnauthorized: true
}

const server = https.createServer(options, app)

server.listen(8000, () => {
    console.log('server bound')
})