const path = require('path')
const fs = require('fs')
const http = require('http')

const DIR = path.join(__dirname, 'html')

module.exports = new Promise((resolve, reject) => {
    const server = http.createServer((request, response)=>{
        let url = request.url == '/'? '/index.html': request.url
        url = path.join(DIR, url)
        if(fs.existsSync(url)){
            fs.createReadStream(url).pipe(response)
        }else{
            response.writeHead(404)
            response.end('404')
        }
    }).on('error', reject).listen(3004, ()=>{
        const {address, port} = server.address()
        console.log(`Listening ${address}:${port}`)
        resolve(server)
    })
})
