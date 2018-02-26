const EventEmitter = require('events')
const urlModule = require('url')
const htmlHandler = require('./lib/htmlHandler')
const cssHandler = require('./lib/cssHandler')
const limitRequest = require('limit-request');
const fs = require('fs-extra')
const path = require('path')
const extend = require('extend')
const filenamify = require('filenamify')

class Crawler extends EventEmitter {
    constructor(options) {
        super()
        this.options = extend(true, {
            requestOptions: {
                limitCount: 10,
                timeout: 10000,
                allowErrorCount: 2,
            },
            savePath: path.join(process.cwd(), '.save'),
            maxLevel: 1,
            filter: () => true,
        }, options)

        this.requester = new limitRequest(this.options.requestOptions)
        this._doneCache = {}
    }

    _url2savePath(url) {
        const q = urlModule.parse(url)
        if (q.pathname.slice(-1) == '/') q.pathname += 'index.html'
        const name = q.pathname + (q.search ? '!' + filenamify(q.search) : '')
        return fixPath(path.join(this.options.savePath, q.hostname, name))
    }

    _handler(current) {
        if (current.url in this._doneCache) {
            return Promise.resolve()
        }
        this._doneCache[current.url] = true
        return Promise.resolve(this.options.filter(current)).then(bool => {
            if (!bool) {
                if (current.parent) rm4arr(current.parent.children, current)
                this.emit('filtered', { target: current })
                return
            }

            if (current.level > this.options.maxLevel) {
                return
            }
            this.emit('doing', { target: current })
            switch (current.type) {
                case 'page':
                    return this._request(current, htmlHandler)
                case 'style':
                    return this._request(current, cssHandler)
                case 'script':
                case 'image':
                default:
                    let dist = this._url2savePath(current.url)
                    return fs.ensureFile(dist).then(() => {
                        return this.requester.saveStream({
                            src: current.url,
                            dist,
                        }).then(() => {
                            this.emit('done', { target: current })
                        }, (error) => {
                            this.emit('fail', { target: current, error })
                        })
                    })
            }
            return
        })
    }

    _request(current, textHandler) {
        const ps = []
        const url = current.url
        return this.requester.getHtml({ url, encoding: null }).then(res => {
            const text = res.body
            if (current.level < this.options.maxLevel) {
                const level = current.level + 1
                const parentDirname = path.dirname(current.savePath)
                try {
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
                } catch (error) {
                    this.emit('error', { target: current, error })
                }
            }
            return text
        }, error => {
            this.emit('fail', { target: current, error })
            return ''
        }).then(text => {
            const p = saveFile(this._url2savePath(url), text).then(() => {
                this.emit('done', { target: current })
            })
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
            this.emit('finish', { target: rootItem })
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

function rm4arr(arr, item) {
    let i = arr.indexOf(item)
    arr.splice(i, 1)
}