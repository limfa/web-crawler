// http://inikulin.github.io/parse5/

const parse5 = require('parse5')
const urlModule = require('url')

const MARKS_OPTION = {
    a: [{
        key: 'href',
        setType: 'page',
    }],
    area: [{
        key: 'href',
        setType: 'page',
    }],
    iframe: [{
        key: 'src',
        setType: 'page',
    }],
    link: [{
        key: 'href',
        attrs: { rel: 'stylesheet' },
        setType: 'style',
    }],
    img: [{
        key: 'src',
        setType: 'image',
    },
    // todo
    // {
    //     key: 'srcset',
    //     setType: 'image',
    // }
    ],
    input: [{
        key: 'src',
        attrs: { type: 'image' },
        setType: 'image',
    }],
    audio: [{
        key: 'src',
        setType: 'audio',
    }],
    script: [{
        key: 'src',
        setType: 'script',
    }],
    video: [{
        key: 'src',
        setType: 'video',
    }, {
        key: 'poster',
        setType: 'image',
    }],
    embed: [{
        key: 'src',
        setType: 'other',
    }],
    object: [{
        key: 'data',
        setType: 'other',
    }],
    source: [{
        key: 'src',
        setType: 'other',
    }],
    track: [{
        key: 'src',
        setType: 'other',
    }],
}
module.exports = (htmlString, replaceCallback) => {
    const document = parse5.parse(htmlString)
    let elements = document.childNodes.map(node => ({ node, level: 0 }))
    const ps = []
    const pushValue = (url, type, callback = () => {}) => {
        const value = { type, url }
        const p = Promise.resolve(replaceCallback(value)).then(newUrl => {
            if (newUrl) {
                return callback(newUrl)
            }
        })
        ps.push(p)
        return p
    }
    while (elements.length > 0) {
        const { node, level } = elements.shift()
        if (node.childNodes && node.childNodes.length > 0) {
            elements.splice(0, 0, ...node.childNodes.map(node => ({ node, level: level + 1 })))
        }

        const markOs = MARKS_OPTION[node.tagName]
        if (markOs) {
            markOs.forEach(markO => {
                if (markO.attrs) {
                    const match = Object.keys(markO.attrs).every(key => {
                        const a = getAttr(node, key)
                        return a && a.value ===  markO.attrs[key]
                    })
                    if (!match) return
                }
                const attr = getAttr(node, markO.key)
                if (attr && isHttpUrl(attr.value)) {
                    pushValue(attr.value, markO.setType, (newUrl) => {
                        attr.value = newUrl
                    })
                }
            })
        }

    }
    return Promise.all(ps).then(() => parse5.serialize(document))
}

function getAttr(node, name) {
    const attr = node.attrs.find(attr => attr.name == name)
    return attr ? attr : null
}

function isHttpUrl(url) {
    const { protocol } = urlModule.parse(url)
    return protocol == 'http:' || protocol == 'https:' || protocol == null
}
