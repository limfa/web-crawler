const css = require('css')
const OPTIONS = {
    source: '',
}

const GET_URL_REG = (noG = false) => (new RegExp('\\burl\\(([\'"])?(.*?)\\1\\)', `i${noG?'':'g'}`))
const IMPORT_REG = /^import$/i
const FONTFACE_REG = /^font-face$/i
const SRC_REG = /^src$/i
const RULE_REG = /^rule$/i
const BGIMG_REG = /^background(?:-image)?$/i

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
    let ast = css.parse(argText, OPTIONS)
    ast.stylesheet.rules.forEach(rule => {
        if (IMPORT_REG.test(rule.type)) {
            let url = rule.import
            let reg = GET_URL_REG()
            let q = reg.exec(rule.import)
            let callback = newUrl=>(rule.import = `"${newUrl}"`)
            if (q && q[2]) {
                url = q[2]
            } else {
                reg = /^(['"])(.*?)\1/
                q = reg.exec(rule.import)
                if (q && q[2]) {
                    url = q[2]
                }
            }
            if (url) {
                pushValue(url, 'style', callback)
            }
        } else if (FONTFACE_REG.test(rule.type)) {
            rule.declarations.forEach(dec => {
                if (SRC_REG.test(dec.property)) {
                    const reg = GET_URL_REG()
                    let q
                    function fn(){
                        if (q = reg.exec(dec.value)) {
                            if (q[2]) {
                                return pushValue(q[2], 'other', newUrl=>{
                                    const oLength = q[0].length
                                    let u = `url("${newUrl}")`
                                    dec.value = dec.value.slice(0, reg.lastIndex - oLength) + u + dec.value.slice(reg.lastIndex)
                                    reg.lastIndex = lastIndex = u.length - oLength + reg.lastIndex
                                    return fn()
                                })
                            }
                            return fn()
                        }
                    }
                    fn()
                }
            })
        } else if (RULE_REG.test(rule.type)) {
            rule.declarations.forEach(dec => {
                if (BGIMG_REG.test(dec.property)) {
                    let reg = GET_URL_REG()
                    let q = reg.exec(dec.value)
                    if (q && q[2]) {
                        pushValue(q[2], 'image', newUrl=>{
                            dec.value = dec.value.replace(reg, `url("${newUrl}")`)
                        })
                    }
                }
            })
        }
    })
    return Promise.all(ps).then(()=>css.stringify(ast, OPTIONS))
}

// console.log(JSON.stringify(ast, null, 4))
// let str = css.stringify(ast, OPTIONS)
// console.log(str)


// font-face
//     src
//         url
// import
// rule
//     background
//         url
//     background-image
//         url