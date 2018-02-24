// http://postcss.org/

const postcss = require('postcss');
const postcssValueParser = require('postcss-value-parser');
const isHttpUrl = require('../isHttpUrl')

const RULE_OPTION = require('./options')
const URL_REG = /^url$/i

module.exports = (argText, replaceCallback) => {
    const ps = []
    const pushValue = (url, type, callback = () => {}) => {
        if (!isHttpUrl(url)) return Promise.resolve()
        const value = { type, url }
        const p = Promise.resolve(replaceCallback(value)).then(newUrl => {
            if (newUrl) {
                return callback(newUrl)
            }
        })
        ps.push(p)
        return p
    }
    const root = postcss.parse(argText, { from: '', to: '' })
    RULE_OPTION.forEach(ruleO => {
        if (ruleO.type == 'decl' && ruleO.valueTypes) {
            if (ruleO.valueTypes.url) {
                root.walkDecls(ruleO.key, (decl) => {
                    const valueAst = postcssValueParser(decl.value)
                    valueAst.walk(node => {
                        if (node.type == 'function' && URL_REG.test(node.value)) {
                            node.nodes.forEach(subNode => {
                                pushValue(subNode.value, ruleO.setType, newUrl => {
                                    subNode.value = newUrl
                                    decl.value = postcssValueParser.stringify(valueAst)
                                })
                            })
                        }
                    })
                })
            }
        } else if (ruleO.type == 'atRule') {
            if (ruleO.valueTypes) {
                root.walkAtRules(ruleO.key, (atRules) => {
                    const valueAst = postcssValueParser(atRules.params)
                    const node = valueAst.nodes[0]
                    if (node.type == 'function' && URL_REG.test(node.value)) {
                        if (ruleO.valueTypes.url) {
                            node.nodes.forEach(subNode => {
                                pushValue(subNode.value, ruleO.setType, newUrl => {
                                    subNode.value = newUrl
                                    atRules.params = postcssValueParser.stringify(valueAst)
                                })
                            })
                        }
                    } else if (node.type == 'string') {
                        if (ruleO.valueTypes.string) {
                            pushValue(node.value, ruleO.setType, newUrl => {
                                node.value = newUrl
                                atRules.params = postcssValueParser.stringify(valueAst)
                            })
                        }
                    }
                })
            }
            if (ruleO.decls && ruleO.decls.length > 0) {
                root.walkAtRules(ruleO.key, (atRules) => {
                    ruleO.decls.forEach(ruleDeclO => {
                        if (ruleDeclO.valueTypes.url) {
                            atRules.walkDecls(ruleDeclO.key, (decl) => {
                                const valueAst = postcssValueParser(decl.value)
                                valueAst.walk(node => {
                                    if (node.type == 'function' && URL_REG.test(node.value)) {
                                        node.nodes.forEach(subNode => {
                                            pushValue(subNode.value, ruleDeclO.setType, newUrl => {
                                                subNode.value = newUrl
                                                decl.value = postcssValueParser.stringify(valueAst)
                                            })
                                        })
                                    }
                                })
                            })
                        }
                    })
                })
            }
        }
    })

    return Promise.all(ps).then(() => root.toResult().css)
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