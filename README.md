web crawler

save html file and it's resource



request queue [
    request item {
        url: 
        level: 
        type: affirmed from source
            page style script image video audio other
    }
]

request one
    case "page"
        parse html // http://inikulin.github.io/parse5
            https://github.com/stevenvachon/broken-link-checker/blob/master/lib/internal/tags.js
            a: { href: true },
            area: { href: true },
            iframe: { src: true },
                mark "page"

            link: { href: true }, rel=stylesheet
                mark "style"

            img: { src: true },
            input: { src: true }, type=image
            video: { poster: true }
                mark "image"
            audio: { src: true },
                mark "audio"
            script: { src: true },
                mark "script"
            video: { src: true }
                mark "video"
            embed: { src: true },
            object: { data: true },
            source: { src: true },
            track: { src: true },
                mark "other"

            notice. <base> {href: true}
    case "style"
        parse css // https://github.com/reworkcss/css
            background: {url: true}
            background-image: {url: true}
                mark "image"
            import: true
                mark "style"
            font-face: {src: true}
                mark "other"
    other

缓存
并发
超时
错误重试