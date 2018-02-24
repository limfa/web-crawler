const path = require('path')
const express = require('express')
const app = express()
app.use(express.static(path.join(__dirname, 'html')))
const server = app.listen(3004, ()=>{
    const host = server.address().address
    const port = server.address().port
    console.log('listening at http://%s:%s', host, port)
})