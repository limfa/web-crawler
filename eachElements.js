const { parse: parseHTML } = require('parse5')

/**
 * parse html string, and callback each element
 */
module.exports = (htmlString, callback)=>{
    const document = parseHTML(htmlString)
    let elements = document.childNodes.map(node=>({node, level: 0}))
    const ps = []
    while(elements.length > 0){
        const {node, level} = elements.shift()
        if(node.childNodes && node.childNodes.length > 0){
            elements.splice(0, 0, ...node.childNodes.map(node=>({node, level: level + 1})))
        }
        ps.push(callback({node, level}))
    }
    return Promise.all(ps).then(()=>document)
}


