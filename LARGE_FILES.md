# Large Files — Compressed in Repo

The two large dist files are stored compressed (.gz) to fit within git upload limits.
Run `bash setup.sh` after cloning to decompress them automatically.

## Files (compressed in repo):
- `dist/index.cjs.gz` → `dist/index.cjs` (compiled server, 1.1MB)
- `dist/public/assets/index-BpzWBTTq.js.gz` → `dist/public/assets/index-BpzWBTTq.js` (frontend bundle, 1.4MB)

## `dist/public/images/wallets/bitget.png` (1MB wallet logo — not in repo)
Restore from VPS: `scp root@104.207.70.184:/root/flapfutures/dist/public/images/wallets/bitget.png dist/public/images/wallets/`

## Quick start after clone:
```bash
npm install
bash setup.sh
NODE_ENV=production node dist/index.cjs
```
