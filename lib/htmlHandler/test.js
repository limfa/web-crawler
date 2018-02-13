const htmlHander = require('.')
const htmlString = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"/>
    <title>Document</title>
</head>
<body>
    <a href="http://xxx.com">link</a>
    <a HREF="./xxx.com">link</a>
    <area shape="" coords="" href="xxxfff" alt=""/>
    <link rel="references" href="vvv"/>
    <link rel="stylesheet" href="vvv"/>
    <iframe src="http://fdxv/" frameborder="0"></iframe>
    <video src="bbbbbbb" poster="aaaaa"></video>
    <img srcset="//static.fujiacf.com/web/index/img/partner/jxjr.png?v=1.2.3.0 1x, //static.fujiacf.com/web/index/img/partner/jxjr@2x.png?v=1.2.3.0 2x" src="//static.fujiacf.com/web/index/img/partner/jxjr.png?v=1.2.3.0" width="182">
</body>
</html>
`

// const fs = require('fs')
// const path = require('path')
// const htmlString = fs.readFileSync(path.join(__dirname, './testHtml.html')).toString()

htmlHander(htmlString, (value) => {
    const { url, type } = value
    return url.toUpperCase()
}).then((text) => {
    console.log(text)
})