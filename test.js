const parse5 = require('parse5')
const eachElements = require('./eachElements')

eachElements(`
   a=1;
   b=2;
`, ({node, level})=>{
    if(node.tagName=='h2'){
        node.attrs.push({
            name: 'id',
            value: 'h2',
        })
        node.childNodes.push({
            nodeName: '#text',
            value: 'ffuck',
        })
    }
    if(node.tagName=='a'){
        let href = node.attrs.find(v=>v.name=='href')
        href.value = 'www.baidu.com'
    }
    // console.log('-'.repeat(level), )
}).then(doc=>{
    let q = parse5.serialize(doc)
    console.log(q)
})