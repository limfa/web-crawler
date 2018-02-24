const srcset = require('srcset')

module.exports = {
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
        {
            key: 'srcset',
            handler(value) {
                let ast = srcset.parse(value)
                let values = ast.map(v => {
                    return [v.url, 'image', newUrl => (v.url = newUrl)]
                })
                return {
                    values,
                    getNewValue: () => srcset.stringify(ast),
                }
            },
        }
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