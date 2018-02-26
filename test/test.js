const path = require('path')
const extend = require('extend')
const urlModule = require('url')
const Crawler = require('../')

const crawler = new Crawler({
    requestOptions: {
        // // 编码
        // // encoding : 'utf-8',
        // // 限制请求数
        // limitCount: 3,
        // // 超时时间
        // timeout: 30000,
        // // 允许累计错误次数
        // allowErrorCount: 3,
        // // 每条请求至少的间隔时间
        // requestInterval: 800,
    },
    // 文件保存位置
    savePath: path.join(__dirname, '.save'),
    // 抓取最大层级
    maxLevel: 4,
    filter(current) {
        // return ['localhost'].indexOf(urlModule.parse(current.url).hostname) >= 0
        return ['www.gxq168.com', 'static.fujiacf.com'].indexOf(urlModule.parse(current.url).hostname) >= 0
    },
})

crawler.requester.on('error', function(name, type) {
    console.log('requester error', type instanceof Error ? type.message : type, name)
}).on('fail', function(name) {
    console.log('requester fail', name)
})

crawler.on('done', ({ target }) => {
    // const q = extend(true, target, {
    //     parent: null,
    //     children: null,
    // })
    // console.log(q)
    console.log('done', target.url, target.type)
})
// crawler.on('doing', ({ target }) => {
//     console.log('doing', target.url, target.type)
// })
// crawler.on('filtered', ({ target }) => {
//     console.log('filtered', target.url, target.type)
// })
// crawler.on('finish', ({ target }) => {
//     console.log('finish')
// })
// crawler.on('fail', ({ target, error }) => {
//     console.log('fail', target.url, error.message)
// })
// 抓取入口
crawler.run({
    // url: 'http://localhost:3004/',
    url: 'https://www.gxq168.com/',
    // page style script ...
    type: 'page',
}).then(rootItem => {
    /** {
        url,
        type,
        level,
        parent,
        children,
        savePath,
    }
    */
    function fn(item) {
        console.log('—'.repeat(item.level), item.url, item.type)
        item.children.forEach(fn)
    }
    fn(rootItem)
}).catch(err => {
    console.log('Exception', err.stack)
})