const parseCss = require('.')

const text = `
    @import url("../../../css/common.css");
    @import "../../../css/common.css";
    .interact .attented {
        background: URL(../images/btn_attented1.gif) no-repeat 0 0;
        background: url(../images/btn_attented1.gif) no-repeat 0 0;
        BACKGROUND: url(../images/btn_attented2.gif) no-repeat 0 0;
        background-image: url("http://xxx.com/images/btn_attented3.gif");
    }
    @font-face {
        font-family: 'pinghei';
        src: url('../font/pinghei.eot');
        src:
            url('../font/pinghei.eot?#iefix') format('embedded-opentype'),
            url('../font/pinghei.woff') format('woff'),
            url('../font/pinghei.ttf') format('truetype'),
            url('../font/pinghei.svg') format('svg');
        font-weight: normal;
        font-style: normal;
    }
`

parseCss(text, (value)=>{
    const {url, type} = value
    return url.toUpperCase()
}).then((text)=>{
    console.log(text)
})