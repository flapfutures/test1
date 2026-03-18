# Large Files (>400KB) — Not in Git

These files exceeded the upload limit and must be obtained from the production VPS or built locally.

## Files:
- `dist/index.cjs` (1083KB)
- `dist/public/assets/index-BpzWBTTq.js` (1366KB)
- `dist/public/images/wallets/bitget.png` (1061KB)

## To restore from VPS (root@104.207.70.184):
```bash
scp -r root@104.207.70.184:/root/flapfutures/dist/index.cjs ./dist/
scp -r root@104.207.70.184:/root/flapfutures/dist/public/assets/index-BpzWBTTq.js ./dist/public/assets/
scp -r root@104.207.70.184:/root/flapfutures/dist/public/images ./dist/public/
```

## To rebuild server:
See `script/build.ts` — run the esbuild command described in `replit.md`.
