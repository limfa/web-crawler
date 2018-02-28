// http://inikulin.github.io/parse5/

const parse5 = require('parse5')
const isHttpUrl = require('../isHttpUrl')
const urlModule = require('url')

const MARKS_OPTION = require('./options')

module.exports = (htmlString, replaceCallback) => {
    const document = parse5.parse(htmlString)
    let elements = document.childNodes.map(node => ({ node, level: 0 }))
    let queue = elements.slice()
    while (elements.length > 0) {
        const { node, level } = elements.shift()
        if (node.childNodes && node.childNodes.length > 0) {
            let childNodes = node.childNodes.map(node => ({ node, level: level + 1 }))
            elements.push(...childNodes)
            queue = queue.concat(childNodes)
        }
    }

    // 查找 base.href
    let baseUrl = ''
    for (let i = 0; i < queue.length; ++i) {
        const { node } = queue[i]
        if (node.tagName == 'base') {
            const attr = getAttr(node, 'href')
            baseUrl = attr.value
            break
        }
    }

    const ps = []
    const pushValue = (url, type, callback = () => {}) => {
        if (!isHttpUrl(url)) return Promise.resolve()
        if(baseUrl) url = urlModule.resolve(baseUrl, url)
        const value = { type, url }
        const p = Promise.resolve(replaceCallback(value)).then(newUrl => {
            if (newUrl) {
                return callback(newUrl)
            }
        })
        ps.push(p)
        return p
    }

    queue.forEach(({ node, level }) => {
        const markOs = MARKS_OPTION[node.tagName]
        if (markOs) {
            markOs.forEach(markO => {
                if (markO.attrs) {
                    const match = Object.keys(markO.attrs).every(key => {
                        const a = getAttr(node, key)
                        return a && a.value === markO.attrs[key]
                    })
                    if (!match) return
                }
                const attr = getAttr(node, markO.key)
                if (attr) {
                    if (markO.handler) {
                        let p = Promise.resolve(markO.handler(attr.value, node))
                        p = p.then(({ values, getNewValue }) => {
                            return Promise.all(values.map(v => {
                                return pushValue(...v)
                            })).then(getNewValue)
                        }).then(newValue => {
                            attr.value = newValue
                        })
                        ps.push(p)
                        return
                    }
                    return pushValue(attr.value, markO.setType, (newUrl) => {
                        attr.value = newUrl
                    })
                }
            })
        }
    })
    return Promise.all(ps).then(() => {
        return parse5.serialize(document)
    })
}

function getAttr(node, name) {
    const attr = node.attrs.find(attr => attr.name == name)
    return attr ? attr : null
}