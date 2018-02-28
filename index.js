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
                allowErrorCount: 1,
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
        const search = (q.search ? '!' + filenamify(decodeURIComponent(q.search)) : '')
        const name = q.pathname + search
        return fixPath(path.join(this.options.savePath, q.hostname, name))
    }

    _handler(current) {
        const main = () => {
            this._doneCache[current.url] = current
            return Promise.resolve(this.options.filter(current)).then(bool => {
                if (!bool) {
                    current.filtered()
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
                        return fs.ensureFile(current.savePath).then(() => {
                            current.doing()
                            return this.requester.saveStream({
                                src: current.url,
                                dist: current.savePath,
                            }).then(() => {
                                current.success()
                                this.emit('done', { target: current })
                            }, (error) => {
                                current.error(error)
                                this.emit('fail', { target: current, error })
                            })
                        })
                }
                return
            })
        }
        const cacheOrigin = this._doneCache[current.url]
        if (cacheOrigin) {
            if (!Item.isResultStatus(cacheOrigin)) {
                return new Promise((resolve, reject) => {
                    let fn = e => {
                        if (!Item.isResultStatus(cacheOrigin)) {
                            cacheOrigin.once('statusChanged', fn)
                        } else {
                            if (cacheOrigin.status === Item.ERROR) {
                                return main().then(resolve, reject)
                            }
                            resolve()
                        }
                    }
                    cacheOrigin.once('statusChanged', fn)
                })
            } else if (cacheOrigin.status !== Item.ERROR) {
                current.cached(cacheOrigin)
                return Promise.resolve()
            }
        }
        return main()
    }

    _request(current, textHandler) {
        const ps = []
        const url = current.url
        current.doing()
        return this.requester.getHtml({ url, encoding: null }).then(res => {
            current.success()
            const text = res.body
            const level = current.level + 1
            const parentDirname = path.dirname(current.savePath)
            try {
                return textHandler(text, (value) => {
                    const newUrl = urlModule.resolve(url, value.url)
                    const item = new Item({
                        url: newUrl,
                        type: value.type,
                        level,
                        parent: current,
                        savePath: this._url2savePath(newUrl),
                    })

                    current.children.push(item)
                    ps.push(this._handler(item))
                    return fixPath(path.relative(parentDirname, item.savePath))
                }).then(text => {
                    const p = saveFile(current.savePath, text).then(() => {
                        this.emit('done', { target: current })
                    })
                    ps.push(p)
                })
            } catch (error) {
                this.emit('fail', { target: current, error })
            }
        }, error => {
            current.error(error)
            this.emit('fail', { target: current, error })
        }).then(() => {
            return Promise.all(ps)
        })
    }

    run(rootItem) {
        rootItem.savePath = this._url2savePath(rootItem.url)
        this.rootItem = new Item(rootItem)

        return this._handler(this.rootItem).then(() => {
            this.emit('finish', { target: this.rootItem })
            return this.rootItem
        })
    }
}

class Item extends EventEmitter {
    constructor(args) {
        super()
        this.setMaxListeners(100)

        this._status = Item.WAITING
        extend(this, {
            type: 'page',
            level: 0,
            parent: null,
            children: [],
            savePath: null,
            cacheOrigin: null,
            errorMessage: null,
        }, args)
    }

    get status() {
        return this._status
    }

    set status(status) {
        this._status = status
        this.emit('statusChanged', { target: this })
    }

    doing() {
        if (this.status !== Item.WAITING) throw new Error(`invalid status "${this.status}", can't set status "doing"`)
        this.status = Item.DOING
        this.emit('status.doing', { target: this })
    }

    cached(cacheOrigin) {
        if (this.status !== Item.WAITING) throw new Error(`invalid status "${this.status}", can't set status "cached"`)
        this.status = Item.CACHED
        this.cacheOrigin = cacheOrigin
        this.emit('status.cached', { target: this })
    }

    filtered() {
        if (this.status !== Item.WAITING) throw new Error(`invalid status "${this.status}", can't set status "filtered"`)
        this.status = Item.FILTERED
        this.emit('status.filtered', { target: this })
    }

    error(error) {
        if (this.status !== Item.DOING) throw new Error(`invalid status "${this.status}", can't set status "error"`)
        this.status = Item.ERROR
        this.errorMessage = error
        this.emit('status.error', { target: this })
    }

    success() {
        if (this.status !== Item.DOING) throw new Error(`invalid status "${this.status}", can't set status "success"`)
        this.status = Item.SUCCESS
        this.emit('status.success', { target: this })
    }
}
Item.WAITING = 'WAITING'
Item.DOING = 'DOING'
Item.CACHED = 'CACHED'
Item.ERROR = 'ERROR'
Item.SUCCESS = 'SUCCESS'
Item.FILTERED = 'FILTERED'
Item.isResultStatus = (item) => {
    return item.status !== Item.WAITING && item.status !== Item.DOING
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