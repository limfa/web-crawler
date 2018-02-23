const EventEmitter = require('events')
const urlModule = require('url')
const htmlHandler = require('./lib/htmlHandler')
const cssHandler = require('./lib/cssHandler')
const limitRequest = require('limit-request');
const fs = require('fs-extra')
const path = require('path')
// class Crawler extends EventEmitter {
//     constructor(url, config, parent = null) {
//         this.config = extend({
//             level: 1,
//         }, config || {})
//         // 
//         this.entry = {
//             url,
//             done: false,
//             level: 0,
//             children: [],
//         }
//         // do
//     }
//     run() {
//         return request(url).then(html => {
//             // find url
//             // https://github.com/stevenvachon/broken-link-checker/blob/master/lib/internal/tags.js
//             // clickable links, media, iframes, meta refreshes, stylesheets, scripts, forms, metadata
//             // 
//             a: { href: true },
//             area: { href: true },
//             audio: { src: true },
//             // blockquote: { cite:true },
//             // del:        { cite:true },
//             embed: { src: true },
//             // form:       { action:true },
//             iframe: { /*longdesc:true, */ src: true },
//             img: { /*longdesc:true, */ src: true },
//             input: { src: true }, // type="image"
//             // ins:        { cite:true },
//             link: { href: true },
//             // menuitem:   { icon:true },
//             // meta:       { content:true },
//             object: { data: true },
//             // q:          { cite:true },
//             script: { src: true },
//             source: { src: true },
//             track: { src: true },
//             video: { poster: true, src: true }

//             html
//             css
//             js
//             media

//             // https://github.com/inikulin/parse5
//             // parseHTML
//         });
//     }
//     // handle
//     // res url level config info
//     handle() {}
//     // url filter
//     // url level config info
//     filter() {}
// }

// class CrawlerItem extends EventEmitter{
//     constructor(){}
// }

const request = new limitRequest({
    // 编码
    // encoding : 'utf-8',
    // 限制请求数
    limitCount: 3,
    // 超时时间
    timeout: 30000,
    // 允许累计错误次数
    allowErrorCount: 3,
    // 每条请求至少的间隔时间
    // requestInterval: 800,
});

request.on('error', function(name, type) {
    console.log(type, name);
}).on('fail', function(name) {
    console.log('fail', name);
});

const MAX_LEVEL = 2
const queue = []
const handlerCache = {}

const rootItem = {
    url: 'https://www.gxq168.com',
    type: 'page',
    level: 0,
    parent: null,
    children: [],
}

handler(rootItem).then(() => {
    function fn(item) {
        console.log('—'.repeat(item.level), item.url, item.type)
        item.children.forEach(fn)
    }
    fn(rootItem)
})

function handler(current) {
    if (current.url in handlerCache) {
        return Promise.resolve()
    }
    if (['www.gxq168.com', 'static.fujiacf.com'].indexOf(urlModule.parse(current.url).hostname) == -1) {
        return Promise.resolve()
    }
    if (current.level > MAX_LEVEL) {
        return Promise.resolve()
    }
    console.log(current.url, current.type)
    handlerCache[current.url] = true
    switch (current.type) {
        case 'page':
            return _request(current, htmlHandler)
        case 'style':
            return _request(current, cssHandler)
        case 'image':
            return request.saveImage({
                src: current.url,
                dist: url2saveName(current.url),
            })
    }
    return Promise.resolve()
}

function _request(current, textHandler) {
    const ps = []
    const url = current.url
    return request.getHtml({ url }).then(res => {
        const text = res.body
        if (current.level < MAX_LEVEL) {
            const level = current.level + 1
            return textHandler(text, (value) => {
                const newUrl = urlModule.resolve(url, value.url)
                const item = {
                    url: newUrl,
                    type: value.type,
                    level,
                    parent: current,
                    children: [],
                }
                current.children.push(item)
                ps.push(handler(item))
                return url2saveName(newUrl)
            })
        }
        return text
    }, err => {
        console.error(url, err.message)
    }).then(text => {
        // 保存文件
        const saveName = url2saveName(url)
        const p = fs.ensureFile(saveName).then(() => {
            return fs.writeFile(saveName, text)
        })
        ps.push(p)
    }).then(() => {
        return Promise.all(ps)
    })
}

function url2saveName(url) {
    const q = urlModule.parse(url)
    if (q.pathname.slice(-1) == '/') q.pathname = '/index.html'
    return path.join(__dirname, '_tmp', q.hostname, q.pathname)
}