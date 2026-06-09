# jd-reverse

京东搜索接口签名逆向，基于 ParamsSign SDK 的 `_$sdnmd` 方法实现 h5st 参数生成。

## 签名流程

1. 组装 signParams：`appid` / `functionId` / `client` / `clientVersion` / `t` / `SHA256(body)`
2. 传入 `window.ParamsSign` 实例的 `_$sdnmd()` 方法
3. SDK 内部过环境检测 + 加密逻辑，返回完整签名结果

## 文件

| 文件 | 说明 |
|------|------|
| `JD.js` | 签名入口，CLI 可跑，`require()` 可复用 |
| `env.js` | 京东浏览器环境模拟（`window` / `navigator` / `document` 等） |
| `mode.js` | ParamsSign SDK（脱敏版），约 1.5 万行混淆代码 |
| `环境代理.js` | 调试用代理环境，可拦截/修改 window 属性访问 |
| `对象原型链打印.js` | 工具脚本，打印对象原型链结构 |

## 用法

```bash
# 安装依赖
npm install crypto-js

# 默认测试（pc_search_searchWare）
node JD.js

# 指定 functionId 和 body
node JD.js 'pc_search_searchWare' '{"enc":"utf-8","page":1,"s":1}'
```

```js
// 作为模块引用
const sign = require('./JD.js');
const result = sign.sign('pc_search_searchWare', JSON.stringify(body));
```

## 环境

- Node.js 16+
- crypto-js

## 注意

- Cookie、pvid、地理代码等隐私字段已替换为 placeholder
- validationToken 为客户自定义值（非原始值）
- 仅供学习研究，请遵守平台使用协议
