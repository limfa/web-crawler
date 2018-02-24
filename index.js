const EventEmitter = require('events')
const urlModule = require('url')
const htmlHandler = require('./lib/htmlHandler')
const cssHandler = require('./lib/cssHandler')
const limitRequest = require('limit-request');
const fs = require('fs-extra')
const path = require('path')
const extend = require('extend')

class Crawler extends EventEmitter {
    constructor(options) {
        super()
        this.options = extend(true, {
            requestOptions: {
                limitCount: 3,
                timeout: 30000,
                allowErrorCount: 3,
            },
            savePath: path.join(process.cwd(), '.save'),
            maxLevel: 1,
            filter: () => true,
        }, options)

        this.requester = new limitRequest(options.requestOptions)
        this._doneCache = {}
    }

    _url2savePath(url) {
        const q = urlModule.parse(url)
        if (q.pathname.slice(-1) == '/') q.pathname = '/index.html'
        return fixPath(path.join(this.options.savePath, q.hostname, q.pathname))
    }

    _handler(current) {
        if (current.url in this._doneCache) {
            return Promise.resolve()
        }
        return Promise.resolve(this.options.filter(current)).then(bool => {
            if (!bool) {
                rm4arr(current.parent.children, current)
                this.emit('filtered', current)
                return Promise.resolve()
            }

            if (current.level > this.options.maxLevel) {
                return Promise.resolve()
            }
            this._doneCache[current.url] = true
            this.emit('doing', current)
            switch (current.type) {
                case 'page':
                    return this._request(current, htmlHandler)
                case 'style':
                    return this._request(current, cssHandler)
                case 'script':
                    return this.requester.getHtml({ url: current.url }).then(res => {
                        return saveFile(this._url2savePath(current.url), res.body)
                    })
                case 'image':
                default:
                    let dist = this._url2savePath(current.url)
                    return fs.ensureFile(dist).then(() => {
                        return this.requester.saveStream({
                            src: current.url,
                            dist,
                        })
                    })

            }
            return Promise.resolve()
        })
    }

    _request(current, textHandler) {
        const ps = []
        const url = current.url
        return this.requester.getHtml({ url }).then(res => {
            const text = res.body
            if (current.level < this.options.maxLevel) {
                const level = current.level + 1
                const parentDirname = path.dirname(current.savePath)
                return textHandler(text, (value) => {
                    const newUrl = urlModule.resolve(url, value.url)
                    const item = {
                        url: newUrl,
                        type: value.type,
                        level,
                        parent: current,
                        children: [],
                        savePath: this._url2savePath(newUrl),
                    }
                    current.children.push(item)
                    ps.push(this._handler(item))
                    return fixPath(path.relative(parentDirname, item.savePath))
                })
            }
            return text
        }, err => {
            console.error(url, err.message)
        }).then(text => {
            const p = saveFile(this._url2savePath(url), text)
            ps.push(p)
        }).then(() => {
            return Promise.all(ps)
        })
    }

    run(rootItem) {
        rootItem = extend({
            type: 'page',
            level: 0,
            parent: null,
            children: [],
            savePath: this._url2savePath(rootItem.url),
        }, rootItem)

        return this._handler(rootItem).then(() => {
            this.emit('finish', rootItem)
            return rootItem
        })
    }
}

module.exports = Crawler

function saveFile(saveName, text) {
    return fs.ensureFile(saveName).then(() => {
        return fs.writeFile(saveName, text)
    })
}

function fixPath(p) {
    return p.replace(/\\/g, '/')
}

function rm4arr(arr, item){
    let i = arr.indexOf(item)
    arr.splice(i, 1)
}