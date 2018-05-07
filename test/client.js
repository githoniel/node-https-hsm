const tls = require('tls')
const fs = require('fs')
const querystring = require('querystring')

const postData = JSON.stringify({
    name: 'Hello World!',
    age: 2046
})

const options = {
    ca: fs.readFileSync('./test/ca-crt.pem'),
    key: fs.readFileSync('./test/client1-key.pem'),
    cert: fs.readFileSync('./test/client1-crt.pem'),
    rejectUnauthorized: true,
    hostname: 'localhost',
    port: 8000,
    path: '/t',
    method: 'POST',
    headers: {
        'content-type': 'application/json;charset=UTF-8'
    }
}

const https = require('https')

const req = https.request(options, (res) => {
    res.on('data', (d) => {
        console.log('body', d.toString())
    })
})

req.on('error', (e) => {
    console.error(e)
})

req.write(postData)

req.end()


// const axios = require('axios')

// axios.post('http://localhost:8000/t',{
//     'name': 'Hello World!',
//     'age': 2046
// })