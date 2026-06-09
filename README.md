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
npm install crypto-js
```

### 直接跑 JD.js

```bash
# 默认参数（搜索接口）
node JD.js

# 自定义参数：node JD.js <functionId> <请求体JSON>
node JD.js 'pc_search_searchWare' '{"enc":"utf-8","page":1,"s":1,"keyword":"手机"}'
```

- **输入**：functionId（京东接口名）+ body JSON 字符串（内部会 SHA256 后参与签名）
- **输出**：终端打印完整签名结果 JSON，包含 `h5st`、`sign` 等加密字段

## 环境

- Node.js 16+
- crypto-js

## 注意

- Cookie、pvid、地理代码等隐私字段已替换为 placeholder
- validationToken 为客户自定义值（非原始值）
- 仅供学习研究，请遵守平台使用协议
