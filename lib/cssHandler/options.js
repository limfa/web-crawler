module.exports = [{
    type: 'decl',
    key: /^background-?/i,
    valueTypes: {
        url: true,
    },
    setType: 'image',
}, {
    type: 'atRule',
    key: /^font-face$/i,
    decls: [{
        key: /^src$/i,
        valueTypes: {
            url: true,
        },
        setType: 'other',
    }],
}, {
    type: 'atRule',
    key: /^import$/i,
    setType: 'style',
    valueTypes: {
        url: true,
        string: true,
    },
}, ]