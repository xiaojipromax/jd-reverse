window=globalThis;
!(() => {
    const origin_log = console.log;
    logToConsole = function (){
        return origin_log(...arguments)
    }
})();
//环境代理
function watch(obj, name) {
    // 用于存储已记录的操作，实现去重
    const loggedOperations = new Set();

    // 辅助函数：限制字符串长度，最长20个字符
    const truncateValue = (value) => {
        const str = String(value);
        return str.length > 20 ? str.substring(0, 20) + '...' : str;
    };

    return new Proxy(obj, {
        get: function (target, property) {
            const value = target[property];
            const type = typeof value;

            // 生成操作唯一标识和日志消息
            let operationId;
            let logMessage;
            // 处理要显示的值（截断处理）
            const displayValue = truncateValue(value);

            if (type === "symbol") {
                const symbolDescription = property.description || 'no description';
                logMessage = `对象=>${name},读取属性: ${symbolDescription} ,这是一个 Symbol 类型的值`;
                operationId = `get:${name}:symbol:${symbolDescription}`;
            } else if (type === "function") {
                const functionName = value.name || 'anonymous';
                // 函数名也进行长度控制
                const displayFunctionName = truncateValue(functionName);
                logMessage = `对象=>${name},读取属性: ${property.toString()} ,这是一个名为 ${displayFunctionName} 的函数`;
                operationId = `get:${name}:function:${property.toString()}:${functionName}`;
            } else {
                logMessage = `对象=>${name},读取属性: ${String(property)} ,值为:${displayValue},类型为:${type}`;
                operationId = `get:${name}:${String(property)}:${type}:${String(value)}`;
            }

            // 检查是否已记录，如果没有则记录并输出
            if (!loggedOperations.has(operationId)) {
                loggedOperations.add(operationId);
                // logToConsole(logMessage);
            }

            return value;
        },
        set: (target, property, newValue, receiver) => {
            const valueType = typeof newValue;

            // 生成操作唯一标识和日志消息
            let operationId;
            let logMessage;
            // 处理要显示的新值（截断处理）
            const displayNewValue = truncateValue(newValue);

            if (valueType === "symbol") {
                const symbolDescription = newValue.description || 'no description';
                logMessage = `对象=>${name},设置属性: ${String(property)},这是一个 Symbol 类型的新值, 描述为: ${symbolDescription}`;
                operationId = `set:${name}:${String(property)}:symbol:${symbolDescription}`;
            } else {
                logMessage = `对象=>${name},设置属性: ${String(property)},值为:${displayNewValue},类型为:${valueType}`;
                operationId = `set:${name}:${String(property)}:${valueType}:${String(newValue)}`;
            }

            // 检查是否已记录，如果没有则记录并输出
            if (!loggedOperations.has(operationId)) {
                loggedOperations.add(operationId);
                // logToConsole(logMessage);
            }

            return Reflect.set(target, property, newValue, receiver);
        }
    });
}


const safeFunction = (function () {
    let initialized = false;
    let myFunction_toString_symbol;
    const set_native = function set_native(func, key, value) {
        Object.defineProperty(func, key, {
            value: value,
            writable: false,
            enumerable: false,
            configurable: false
        });
    };
    return function (func) {
        if (typeof func !== 'function') return;
        if (!initialized) {
            myFunction_toString_symbol = Symbol('functionToString');
            initialized = true;
        }
        const originalToString = func.toString;
        if (!func[myFunction_toString_symbol]) {
            set_native(func, myFunction_toString_symbol, originalToString);
            set_native(func, 'toString', function () {
                return originalToString.call(this);
            });
        }
    };
})();

//类构造函数
function createConstructor(constructorName, enableStrictMode, propertiesList, prototypeMethods, parentConstructorName) {
    const instancesData = {};
    const constructorFunction = function (element, propertySetter, validationToken) {
        if (enableStrictMode && !(validationToken && validationToken === "JR")) {
            throw new Error("Illegal constructor");
        }

        // 为实例添加Symbol.toStringTag
        Object.defineProperty(this, Symbol.toStringTag, {
            value: constructorName,
            writable: false,
            enumerable: false,
            configurable: false
        });

        // 为实例添加Symbol.toPrimitive
        Object.defineProperty(this, Symbol.toPrimitive, {
            value: function (hint) {
                switch (hint) {
                    case 'number':
                        return this._element ? instancesData[this._element].toString().length : 0;
                    case 'string':
                        return `[${constructorName} Instance]`;
                    default:
                        return `[object ${constructorName}]`;
                }
            },
            writable: false,
            enumerable: false,
            configurable: false
        });

        if (propertySetter && typeof propertySetter === "function") {
            propertySetter(this, instancesData[this._element]);
        }
        const instanceProperties = element && typeof element === "object" ? element : {};
        this._element = Symbol("_element");
        instancesData[this._element] = instanceProperties;
        if (element && typeof element === "object") {
            Object.keys(element).forEach(key => {
                if (!this[key]) {
                    this[key] = element[key];
                }
            });
        }
    };

    // 设置构造函数名称
    Object.defineProperty(constructorFunction, 'name', {value: constructorName});

    // 处理继承关系
    if (parentConstructorName && window[parentConstructorName]) {
        const ParentConstructor = window[parentConstructorName];
        constructorFunction.prototype = Object.create(ParentConstructor.prototype);
        Object.defineProperty(constructorFunction.prototype, 'constructor', {
            value: constructorFunction,
            writable: false,
            enumerable: false,
            configurable: false
        });
    }

    // 为构造函数本身添加Symbol.toStringTag
    Object.defineProperty(constructorFunction, Symbol.toStringTag, {
        value: constructorName,
        writable: false,
        enumerable: false,
        configurable: false
    });

    // 为构造函数本身添加Symbol.toPrimitive
    Object.defineProperty(constructorFunction, Symbol.toPrimitive, {
        value: function (hint) {
            switch (hint) {
                case 'number':
                    return constructorName.length;
                case 'string':
                    return `[Constructor ${constructorName}]`;
                default:
                    return constructorName;
            }
        },
        writable: false,
        enumerable: false,
        configurable: false
    });

    // 添加原型方法
    Object.keys(prototypeMethods).forEach(methodName => {
        constructorFunction.prototype[methodName] = prototypeMethods[methodName];
        if (typeof constructorFunction.prototype[methodName] === "function") {
            safeFunction(constructorFunction.prototype[methodName]);
        }
    });

    // 保护构造函数
    safeFunction(constructorFunction);

    // 挂载到全局
    window[constructorName] = constructorFunction;
    return constructorFunction;
};

// 补Window对象
window = globalThis;
createConstructor('EventTarget', true, [], {});
createConstructor('Node', true, [], {}, 'EventTarget');
createConstructor('WindowProperties', true, [], {}, 'EventTarget')
createConstructor('Window', true, [], {}, 'WindowProperties');
Object.setPrototypeOf(window, Window.prototype);


// 补Document
// HTMLDocument -> HTMLDocument -> Document -> Node -> EventTarget -> Object
// HTMLAllCollection -> HTMLAllCollection -> Object    document.all的原型链
createConstructor('Document', true, [], {
    createElement: function (tag){
        if(tag == 'script'){
            // [修复1] 去掉 readyState，mode.js 检测到无 readyState 会走 onload 路径
            return watch(new HTMLScriptElement({}, null, 'JR'), `document.createElement${tag}`)
        }
        // console.log(`===>document.createElement(${tag})`)
    },
    createEvent: function (tag){
        // console.log(`===>document.createEvent(${tag})`)
    },
    getElementsByTagName: function(tag){
        // console.log(`===>document.getElementsByTagName(${tag})`)
        // [修复2] 返回 document.head，否则 mode.js 的 appendChild 无目标
        if(tag == 'head'){
            return [document.head]
        }
        return []
    }

}, 'Node');
createConstructor('HTMLDocument', true, [], {}, 'Document');
createConstructor('HTMLAllCollection', true, [], {})
createConstructor('Element', true, [], {
    getAttribute: function(name){
        // console.log(`===>element.getAttribute(${name})`)
    }
}, 'Node');
createConstructor('HTMLElement', true, [], {}, 'Element');
createConstructor('HTMLHtmlElement', true, [], {}, 'HTMLElement');
createConstructor('HTMLScriptElement', true, [], {}, 'HTMLElement');
createConstructor('HTMLHeadElement', true, [], {}, 'HTMLElement');
createConstructor('HTMLBodyElement', true, [], {}, 'HTMLElement');
document = new HTMLDocument({
    all: watch(new HTMLAllCollection({}, null, 'JR'), 'document.all'),
    documentElement: watch(new HTMLHtmlElement({}, null, 'JR'), 'document.documentElement'),
    // 替换成你自己的京东Cookie（浏览器F12 → Application → Cookies → 搜索.jd.com）
    cookie: 'unpl=JF8EAIBnNSttCExQUE9XGRRAGA5XDA4LGBQGbm9VU1VdTFFWGFVLEBl7XlVdWhRKEB9uZxRUX1NPUQ4ZAysiE0xeUllbCk8UMzw3XQEZGh8ERklbdRoXSl9SW10ISxEzX2QFZF1Ze1EDHgoTFBNNbVVuWjh7JwNqYwBcWWhKZAQrMhoiEw; __jdu=47499727; __jdv=229668127|baidu-search|t_262767352_baidusearch|cpc|9603741117_0_a65ded37abb2cb2b2409a69464b2fa38|1780293433131; areaId=12; shshshfpa=acc528aa-a6c2-9e79-d894-f7ae1df83e7d-1780293498; shshshfpx=acc528aa-a6c2-9e79-d894-f7ae1df83e7d-1780293498; PCSYCityID=CN_320000_321200_0; TrackID=1c14gjAHQYfZNfllgc02IIeSbyNAlnoW7wtpLtBtcB17M8HlxRH99UCQSeCCLcMjLsloBASozdd8hA-TajwmPdxEkEuYAYjG133ZddspibPI; pinId=G7Cva4vfFLMCnFMAeIYnhQ; pin=jd_IVaCmDVVzFKG; unick=jd_lj77tnr0z6uu3e; ceshi3.com=000; _tp=jfDYMaDj6n44n0WfKJ%2FirA%3D%3D; wlfstk_smdl=1mo4tywiqx74nbk55aa6ri3pqsgcicyj; mail_times=4%2C1%2C1780293539105; umc_count=1; o2State=; is_avif=onAVIF; cid=9; ipLoc-djd=12-959-3405-40181; __jdc=143920055; shshshfpb=BApXWJu-AgftAM4a6VIVwzWpdntmmPo-nBsJoM7do9xJ1PdZfQq_gkznmqB3MKaBYVK4ny6vnsaxlI-0zufkHsY4uO1u2psHP2R8; 3AB9D23F7A4B3CSS=jdd03JIODCFCFN3FWPHP7NBYGW26DKGBFPB4JTQ5MEKBHQKCESGJBHVP6WIITH7YE6RJISE53OBVZPSBG33WKR534CDDB7IAAAAM6QKEHVLQAAAAACCYYN46ZC7HUREX; 3AB9D23F7A4B3C9B=JIODCFCFN3FWPHP7NBYGW26DKGBFPB4JTQ5MEKBHQKCESGJBHVP6WIITH7YE6RJISE53OBVZPSBG33WKR534CDDB7I; __jda=143920055.47499727.1780293269.1780306168.1780321752.3',
    head: watch(new HTMLHeadElement({childElementCount: 50}, null, 'JR'), 'document.head'),
    body: watch(new HTMLBodyElement({
        childElementCount: 24,
        'innerHTML': ''
    }, null, 'JR'), 'document.body'),
    referrer: 'https://www.jd.com/',
}, null, "JR")
window.document = document
// 补Storage对象
createConstructor('Storage', true, [], {})
localStorage = watch(new Storage({
    getItem: function(key){
        // console.log(`===>localStorage.getItem(${key})`)
    },
    setItem: function(key, value){
        // console.log(`===>localStorage.setItem(${key}, ${value})`)
    },

}, null, 'JR'), 'localStorage')
window.localStorage = localStorage
// 补Navigator
createConstructor('Navigator', true, [], {}, 'WindowProperties');
navigator = new Navigator({}, null, 'JR')
window.navigator = navigator

// 补Location
createConstructor('Location', true, [], {}, 'WindowProperties');
location = new Location({
    "ancestorOrigins": {},
    // 替换成你自己的搜索URL（浏览器复制即可）
    "href": "https://search.jd.com/Search?keyword=iphone&enc=utf-8&pvid=371b279618b340a7a4d42639a6943c63&themeColor=&from=home&spmTag=YTAyMTkuYjAwMjM1Ni5jMDAwMDcxNjMuNiU0MDE3ODAyOTM1ODI4NzIlMjM0NzQ5OTcyNyUyMzIxMjY2MzU1MjQ",
    "origin": "https://search.jd.com",
    "protocol": "https:",
    "host": "search.jd.com",
    "hostname": "search.jd.com",
    "port": "",
    "pathname": "/Search",
    "search": "?keyword=iphone&enc=utf-8&pvid=371b279618b340a7a4d42639a6943c63&themeColor=&from=home&spmTag=YTAyMTkuYjAwMjM1Ni5jMDAwMDcxNjMuNiU0MDE3ODAyOTM1ODI4NzIlMjM0NzQ5OTcyNyUyMzIxMjY2MzU1MjQ",
    "hash": ""
}, null, 'JR')
window.location = location

// 补Screen
createConstructor('Screen', true, [], {}, 'WindowProperties');
screen = new Screen({}, null, 'JR')
window.screen = screen

// 补History
createConstructor('History', true, [], {}, 'WindowProperties');
history = new History({}, null, 'JR')
window.history = history

// 挂代理与删除node监测点
window = watch(window, 'window')
document = watch(document, 'document')
screen = watch(screen, 'screen')
navigator = watch(navigator, 'navigator')
location = watch(location, 'location')
history = watch(history, 'history')
history = watch(history, 'localStorage')

delete global
// delete Buffer
delete process
delete __filename
delete __dirname

