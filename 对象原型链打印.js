function dumpProtoChain(obj) {
    const chain = [];
    let curr = obj;

    // 显式判断 !== null / !== undefined，避免 Boolean(document.all) === false 的坑
    while (curr !== null && curr !== undefined) {
        chain.push(curr.constructor?.name || "(no constructor)");
        curr = Object.getPrototypeOf(curr);
    }

    console.log(chain.join(" -> "));
}
