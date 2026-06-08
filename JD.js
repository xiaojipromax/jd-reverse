// 先存命令行参数（env.js 会 delete process）
const args = process.argv.slice(2)
const functionId = args[0] || 'pc_search_searchWare'
const bodyJson   = args[1] || JSON.stringify({
    enc: "utf-8", pvid: "placeholder",
    from: "home", area: "0_0_0_0", page: 1, mode: "",
    concise: false, hoverPictures: false, newAdvRepeat: false,
    mixerParam: false, new_interval: true, s: 1
})

require('./env.js')
require('./mode.js')
const CryptoJS = require('crypto-js')

const signParams = {
    appid: "search-pc-java",
    functionId: functionId,
    client: "pc",
    clientVersion: "1.0.0",
    t: Date.now(),
    body: CryptoJS.SHA256(bodyJson).toString()
}

const result = new window.ParamsSign({
    appId: "f06cc",
    preRequest: false,
    onSign: function () {},
    onRequestTokenRemotely: function () {},
    onRequestToken: function (token) {}
})._$sdnmd(signParams)

console.log(JSON.stringify(result))
