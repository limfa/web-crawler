const path = require('path')
const urlModule = require('url')
const Crawler = require('../')

const crawler = new Crawler({
    requestOptions: {
        // 编码
        // encoding : 'utf-8',
        // 限制请求数
        limitCount: 3,
        // 超时时间
        timeout: 30000,
        // 允许累计错误次数
        allowErrorCount: 3,
        // 每条请求至少的间隔时间
        // requestInterval: 800,
    },
    // 文件保存位置
    savePath: path.join(__dirname, '.save'),
    // 抓取最大层级
    maxLevel: 3,
    filter(current) {
        return ['localhost'].indexOf(urlModule.parse(current.url).hostname) >= 0
    },
})

crawler.requester.on('error', function(name, type) {
    console.log(type, name)
}).on('fail', function(name) {
    console.log('fail', name)
})

crawler.on('doing', current => {
    console.log('doing', current.url, current.type)
}).on('filtered', current => {
    console.log('filtered', current.url, current.type)
}).on('finish', rootItem => {
    console.log('finish')
})

// 抓取入口
crawler.run({
    url: 'http://localhost:3004/',
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
})