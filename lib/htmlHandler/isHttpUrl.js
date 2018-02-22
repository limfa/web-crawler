const urlModule = require('url')
module.exports = (url) => {
    const { protocol } = urlModule.parse(url)
    return protocol == 'http:' || protocol == 'https:' || protocol == null
}