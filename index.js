const EventEmitter = require('events')
const request = require('request-promise')
const { extend } = require('underscore')
const { parse: parseHTML } = require('parse5')

class Crawler extends EventEmitter {
    constructor(url, config, parent = null) {
        this.config = extend({
            level: 1,
        }, config || {})
        // 
        this.entry = {
            url,
            done: false,
            level: 0,
            children: [],
        }
        // do
    }
    run() {
        return request(url).then(html => {
            // find url
            // https://github.com/stevenvachon/broken-link-checker/blob/master/lib/internal/tags.js
            // clickable links, media, iframes, meta refreshes, stylesheets, scripts, forms, metadata
            // 
            a: { href: true },
            area: { href: true },
            audio: { src: true },
            // blockquote: { cite:true },
            // del:        { cite:true },
            embed: { src: true },
            // form:       { action:true },
            iframe: { /*longdesc:true, */ src: true },
            img: { /*longdesc:true, */ src: true },
            input: { src: true }, // type="image"
            // ins:        { cite:true },
            link: { href: true },
            // menuitem:   { icon:true },
            // meta:       { content:true },
            object: { data: true },
            // q:          { cite:true },
            script: { src: true },
            source: { src: true },
            track: { src: true },
            video: { poster: true, src: true }

            // https://github.com/inikulin/parse5
            // parseHTML
        });
    }
    // handle
    // res url level config info
    handle() {}
    // url filter
    // url level config info
    filter() {}
}

// class CrawlerItem extends EventEmitter{
//     constructor(){}
// }