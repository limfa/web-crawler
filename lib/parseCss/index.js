const postcss = require('postcss');
const postcssValueParser = require('postcss-value-parser');

const URL_REG = /^url$/i
const BACKGROUND_REG = /^background-?/i
const IMPORT_REG = /^import$/i

module.exports = (argText, replaceCallback)=>{
    const ps = []
    const pushValue = (url, type, callback = ()=>{})=>{
        const value = {type, url}
        const p = Promise.resolve(replaceCallback(value)).then(newUrl=>{
            if(newUrl){
                return callback(newUrl)
            }
        })
        ps.push(p)
        return p
    }
    const root = postcss.parse(argText, { from: '', to: '' })
    root.walkDecls(BACKGROUND_REG, (decl) => {
        const valueAst = postcssValueParser(decl.value)
        valueAst.walk(node=>{
            if(node.type!='function'&&!URL_REG.test(node.value))return
            node.nodes.forEach(subNode=>{
                pushValue(subNode.value, 'image', newUrl=>{
                    subNode.value = newUrl
                    decl.value = postcssValueParser.stringify(valueAst)
                })
            })
        })
    })
    root.walkAtRules(/^font-face$/i, (atRules) => {
        atRules.walkDecls(/^src$/i, (decl)=>{
            const valueAst = postcssValueParser(decl.value)
            valueAst.walk(node=>{
                if(node.type!='function'&&!URL_REG.test(node.value))return
                Promise.all(
                    node.nodes.map(subNode=>{
                        pushValue(subNode.value, 'other', newUrl=>{
                            subNode.value = newUrl
                        })
                    })
                ).then(()=>{
                    decl.value = postcssValueParser.stringify(valueAst)
                })
            })
        })
    })
    root.walkAtRules(IMPORT_REG, (atRules) => {
        const valueAst = postcssValueParser(atRules.params)
        valueAst.walk(node=>{
            if(node.type=='function'){
                node.nodes.forEach(subNode=>{
                    pushValue(subNode.value, 'other', newUrl=>{
                        subNode.value = newUrl
                        atRules.params = postcssValueParser.stringify(valueAst)
                    })
                })
            }else if(node.type=='string'){
                pushValue(node.value, 'other', newUrl=>{
                    node.value = newUrl
                    atRules.params = postcssValueParser.stringify(valueAst)
                })
            }
        })
    })
    return Promise.all(ps).then(()=>root.toResult().css)
}

// font-face
//     src
//         url
// import
// rule
//     background
//         url
//     background-image
//         url