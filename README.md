# AICSM

客服系統專案管理 + 企業健檢平台（Next.js 16 / Prisma 7 / PostgreSQL）。

- 後台 `/admin`：公司管理（含 issue、企業健檢檢核、購買功能）、行業別管理（多層檢核項目與權重）、產品模組管理
- 電視牆 `/tv`：公開頁面，自動輪播每家公司（健康度、購買模組、未結 issue、最新健檢未完成項目）
- 資料表一律 `AICSM_` 開頭

## Render 部署

- Build Command：`npm install && npx prisma generate && npm run build`
- Start Command：`npx prisma migrate deploy && npm run start`
- 環境變數：`DATABASE_URL`、`ADMIN_USERNAME`、`ADMIN_PASSWORD`、`SESSION_SECRET`、`NODE_VERSION=22.17.0`

第一次登入後台後，到「總覽」按「初始化基礎資料」，會補齊行業別、模組、公司與各行業健檢項目（冪等，可重複按）。
