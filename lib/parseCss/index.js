const css = require('css')
const options = {
    source: '',
}
let ast = css.parse(`
    @import url("../../../css/common.css");
    @import "../../../css/common.css";
    .interact .attented {
        background: url(../images/btn_attented2.gif) no-repeat 0 0;
        background-image: url(http://xxx.com/images/btn_attented2.gif);
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
`, options)
console.log(JSON.stringify(ast, null, 4))
let str = css.stringify(ast, options)
console.log(str)


// font-face
//     src
//         url
// import
// rule
//     background
//         url
//     background-image
//         url