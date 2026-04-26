# Pilot 108 E2E (Playwright + BrowserStack)

Design-first criteria: `e2e/design-matrix.md`, `medmate-bdd/design/docs/DESIGN.md`, `screen-map-108.md`.

**Visual contract:** for G1-G4, H1-H6, S1, and E1-E4 screens covered in `pilot108-design.spec.ts`, the **expected UI** in automation is whatever is committed as Playwright `toHaveScreenshot` PNGs (see `design-matrix.md` → “Playwright golden snapshots”). H6 uses `?designMockFinalized=1` on `/pilot108/individual` (local finalized preview, no draft API). Pen files in `e2e/baselines/pen/` are a separate **design reference** for humans, not asserted byte-for-byte in CI.

## Local (Chromium, mobile viewport)

```powershell
cd Med_STT_UI\mvp-app
npm install
npx playwright install chromium
npm run test:e2e
```

Playwright starts `next dev` on `http://127.0.0.1:3000` unless a server is already running (`reuseExistingServer` when not in CI).

Auth for `/pilot108/*` uses cookie `auth_token` via `e2e/.auth/user.json` (matches middleware cookie check). The suite also **mocks** `GET /auth/me` and (on the mock-checklist test) roster / `thong-tin` APIs so a dummy cookie does not hit the real backend and trigger `logout()` on 401.

### Update visual baselines (golden = design contract)

After you **intentionally** change layout/colors/fonts for a screen covered by `pilot108-design.spec.ts`, refresh the committed goldens so CI matches the new design:

```powershell
# Design suite only (recommended)
npm run test:e2e -- e2e/pilot108-design.spec.ts --update-snapshots

# Or entire chromium-local suite
npm run test:e2e -- --update-snapshots
```

Outputs follow `playwright.config.js` `snapshotPathTemplate`, e.g.  
`e2e/__screenshots__/chromium-local/pilot108-design.spec.ts-snapshots/*.png`. Commit those PNGs with the UI change.

**BrowserStack:** goldens live under `e2e/__screenshots__/browserstack-chrome/...` (different renderer). If BS is your source of truth for visuals, run `npm run test:e2e:bs:design -- --update-snapshots` and commit that folder too; otherwise treat **chromium-local** snapshots as the canonical regression baseline.

## P108 routes covered by design goldens

- `/pilot108` — H1 Quick Capture Home + FAB.
- `/pilot108/team-setup?step=g1|g2|g3a|g3b|g4` — G1-G4 onboarding/team setup.
- `/pilot108/stt-upload` — H2 Recording Active visual shell (technical upload controls are collapsed under debug).
- `/pilot108/processing?state=upload|transcribing|identifying|formatting|success|silence|error|notasks|offline` — H3 and E1-E4 states.
- `/pilot108/individual?mockChecklist=1` — H4 Draft To-Do.
- `/pilot108/individual?designMockFinalized=1` — H6 Finalized List visual state.
- `/pilot108/team` — S1 Team Management.

Deploy note: these routes are in `Med_STT_UI/mvp-app` (Cloud Run scripts `deploy-med-stt-ui*.ps1`). `admin.medmate.io.vn` may point at the separate `medmate-admin-fe`; updating these local routes does not change that domain until the correct service is deployed.

## Live backend — tài khoản app thật (không mock API)

Project Playwright **`chromium-live`** (`e2e/pilot108-design.live.spec.ts`) gọi **`POST {E2E_API_URL|NEXT_PUBLIC_API_URL|default}/auth/login`** với email/password, lấy `access_token`, gắn cookie `auth_token` rồi chạy UI **trùng BE** với app (roster / thông tin / me đều thật).

**Cách 1 — email + password (khuyến nghị):**

```powershell
cd Med_STT_UI\mvp-app
$env:E2E_EMAIL = "ban@example.com"
$env:E2E_PASSWORD = "mat-khau-cua-ban"
# Tuỳ chọn: trỏ tới staging BE
# $env:E2E_API_URL = "https://your-backend.example.com"
npm run test:e2e:live
```

**Cách 2 — JWT có sẵn** (copy từ DevTools → Application → Local Storage `auth_token` sau khi đăng nhập):

```powershell
$env:E2E_AUTH_TOKEN = "eyJ..."
npm run test:e2e:live
```

- **`E2E_API_URL`**: base URL backend (không có slash cuối). Nếu không set, dùng `NEXT_PUBLIC_API_URL` trong môi trường shell, rồi mới tới default trong `lib/apiClient.ts`.
- **`PLAYWRIGHT_BASE_URL`**: nếu app không chạy ở `http://127.0.0.1:3000`, set cho khớp cookie.
- Suite **`npm run test:e2e`** (project `chromium-local`) **không** chạy file `*.live.spec.ts` — vẫn mock như cũ, phù hợp CI.

## BrowserStack Automate + local app

**Cursor / VS Code “BrowserStack” plugin:** tiện đăng nhập tài khoản và bật **BrowserStack Local**; Playwright trong repo **không gọi plugin** mà dùng biến môi trường + CDP (`playwright.config.js`). Cách chạy thực tế vẫn là các lệnh `npm` bên dưới (plugin chỉ hỗ trợ bạn mở tunnel / copy key).

1. Set environment variables (PowerShell):

   ```powershell
   $env:BROWSERSTACK_USERNAME = "<your_username>"
   $env:BROWSERSTACK_ACCESS_KEY = "<your_access_key>"
   ```

2. Start **BrowserStack Local** so the remote browser can reach your machine (same tunnel as `browserstack.local: true` in caps). Use the [BrowserStack Local](https://www.browserstack.com/docs/automate/selenium/local-testing-introduction) app or CLI for your OS.

3. Run the app on **127.0.0.1:3000** (Playwright `webServer` can do this for `npm run test:e2e`).

4. Run on BrowserStack:

   - **Chỉ design** (`design-matrix.md` + `pilot108-design.spec.ts`, cùng profile **Pixel 7** như local):

     ```powershell
     npm run test:e2e:bs:design
     ```

   - **Toàn bộ E2E mock** (design + BDD, không `*.live.spec.ts`):

     ```powershell
     npm run test:e2e:bs
     ```

   Lần đầu trên BS, ảnh chụp so sánh nằm ở `e2e/__screenshots__/browserstack-chrome/` (khác thư mục `chromium-local`). Nếu cần baseline mới trên cloud:

   ```powershell
   npm run test:e2e:bs:design -- --update-snapshots
   ```

   Workers khi có `BROWSERSTACK_USERNAME`: **1** (theo `playwright.config.js`).

Optional: `BROWSERSTACK_BUILD_NAME`, `BROWSERSTACK_LOCAL_IDENTIFIER` if you run multiple Local tunnels.

## Pen design exports

Reference PNGs from `pen-stt-108.pen` are in `e2e/baselines/pen/` (`VtdW0` H4, `aySV0` FAB, `9Jw8L` H2). **CI** compares the app to **Playwright** files under `e2e/__screenshots__/` (see design matrix). Pen PNGs stay for **manual** cross-check vs Pencil — they do not need to match snapshot bytes exactly.

## `browserstack.yml`

Metadata mirror for username/access key / local flag; primary Automate wiring is `playwright.config.js` (CDP `wss://cdp.browserstack.com/playwright?caps=...`).
