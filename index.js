const EventEmitter = require('events')
const urlModule = require('url')
const request = require('request-promise')
const htmlHandler = require('./lib/htmlHandler')
const cssHandler = require('./lib/cssHandler')

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

const MAX_LEVEL = 2
const queue = []
const rootItem = {
    url: 'https://www.gxq168.com',
    type: 'page',
    level: 0,
    parent: null,
    children: [],
}

handler(rootItem).then(handlerQueue).then(() => {
    function fn(item) {
        console.log('—'.repeat(item.level), item.url)
        item.children.forEach(fn)
    }
    fn(rootItem)
})

function handler(current) {
    switch (current.type) {
        case 'page':
            return _request(current, htmlHandler)
        case 'style':
            return _request(current, cssHandler)
        case 'image':
    }
    return Promise.resolve()
}

function _request(current, textHandler) {
    return request(current.url).then(text => {
        if (current.level < MAX_LEVEL) {
            const level = current.level + 1
            return textHandler(text, (value) => {
                const item = {
                    url: urlModule.resolve(current.url, value.url),
                    type: value.type,
                    level,
                    parent: current,
                    children: [],
                }
                current.children.push(item)
                queue.push(item)
            })
        }
    }, err => {
        console.error(current.url, err.message)
    }).then(text => {
        // todo
    })
}

const handlerCache = {}

function handlerQueue() {
    let current = queue.shift()
    if (!current) return
    if (current.url in handlerCache) return handlerQueue()
    if (urlModule.parse(current.url).host != 'www.gxq168.com') return handlerQueue()
    console.log(current.url)
    if (current.level > MAX_LEVEL) {
        return handlerQueue()
    }
    handlerCache[current.url] = true
    return handler(current).then(handlerQueue)
}