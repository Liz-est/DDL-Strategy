# FAQ

A: pnpm install 报错 `Cannot find matching keyid: ${JSON.stringify({ signatures, keys })}`

Q: 先运行 `COREPACK_INTEGRITY_KEYS=0 corepack prepare` 再执行 `pnpm install`。
