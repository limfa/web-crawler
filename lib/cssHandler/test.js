const cssHander = require('.')
const css = `
    .interact .attented {
        background: URL("../images/btn_a tten,ted1.gif") no-repeat 0 0;
        background: url(../images/btn_attented1.gif) no-repeat 0 0;
        BACKGROUND: url(../images/btn_attented2.gif) no-repeat 0 0;
        background-image: url("http://xxx.com/images/btn_attented3.gif");
    }
    @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
        .topic-depository .banner {
            background-image: url(../img/topic/20170728/banner@2x.jpg);
        }
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
    @import url("../../../css/common1.css");
    @import "../../../css/common2.css";
    body{
        overflow: scroll;
    }
    /*xxx.x.x.x..*/
`

// const fs = require('fs')
// const path = require('path')

// const css = fs.readFileSync(path.join(__dirname, './testStyle.css')).toString()

cssHander(css, (value)=>{
    console.log(value)
    const {url, type} = value
    return url.toUpperCase()
}).then((text)=>{
    console.log(text)
})



// console.log(root.toResult().css)

    // .then(result => {
    //     // console.log(result.css)
    // }, err => {
    //     console.log(err)
    // });