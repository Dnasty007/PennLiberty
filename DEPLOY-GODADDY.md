# Deploy Penn Liberty to GoDaddy

This site is a **static React app**. After `npm run build`, upload everything inside the `dist/` folder to GoDaddy.

## Updating rentals (usually no full zip)

Rental listings load from **`rentals.json`** at runtime. For add/remove/price/status changes, upload only that file (~few KB). See **[UPDATE-RENTALS.md](./UPDATE-RENTALS.md)**.

Use a **full zip** when you change site code, design, or many static assets.

## Before you upload

1. **Production build** (run in project folder):
   ```bash
   npm run build
   ```
2. Optional env vars — create `.env.production` before building if you use them:
   - `VITE_BUILDIUM_RENTAL_APPLICATION_URL` — Buildium apply link for Rentals
   - `VITE_GEOAPIFY_API_KEY` — address autocomplete on For Owners

3. **AI chat on For Owners** uses `/api/owner-chat` (Vercel serverless). That API **does not run** on plain GoDaddy static hosting unless you host the API elsewhere and proxy to it. The rest of the site works without it.

## GoDaddy cPanel (most common)

1. Log in at [godaddy.com](https://www.godaddy.com) → **My Products** → your **Web Hosting** → **Manage** → **cPanel** (or **File Manager**).
2. Open **`public_html`** (root for `pennlibertyre.com`).
3. **Back up** anything already there (download old `index.html` etc.).
4. Delete old site files in `public_html` **except** folders you still need (e.g. `cgi-bin`). Do not delete `.htaccess` if you merge — the new build includes one.
5. Upload **all files and folders inside `dist/`** — not the `dist` folder itself:
   - `index.html` → directly in `public_html`
   - `assets/` folder
   - `backgrounds/`, `branding/`, `rentals-hero/`, etc.
6. Wait for upload to finish (images can take several minutes).
7. Visit **https://pennlibertyre.com** (hard refresh: Ctrl+Shift+R).

### FTP (alternative)

- Host: `ftp.yourdomain.com` (or IP from cPanel)
- User/password: cPanel FTP account
- Remote path: `/public_html`
- Upload local `dist/*` contents

## Domain only on GoDaddy (hosting elsewhere)

If the site is hosted on Vercel/Netlify but the **domain** is on GoDaddy:

1. GoDaddy → Domain → **DNS**
2. Point **A** record `@` to your host’s IP, or **CNAME** `www` to your host (e.g. `cname.vercel-dns.com`)
3. Remove conflicting old A/CNAME records.

## Rental QR codes

Generate print-ready QR images for **every rental** plus **all rentals**:

```bash
npm run qr:generate
```

Output lands in `qr-codes/` — open `qr-codes/index.html` to preview or print. URL list is in `rental-qr-urls.txt`.

| QR | URL | Opens |
|---|---|---|
| **All Rentals** | `https://pennlibertyre.com/rentals` | Full rentals browse page |
| **Each unit** | `https://pennlibertyre.com/rentals/{slug}` | That unit’s detail view |

**Wrong (always lands on home):** `https://pennlibertyre.com`

After deploying, scan-test one “all rentals” QR and one unit QR before printing signs.

## After go-live checklist

- [ ] Home, Rentals, About, Contact load
- [ ] QR code for a rental opens that unit’s detail view
- [ ] Light/Dark backdrop images show
- [ ] Contact form / rental application emails (EmailJS)
- [ ] Mobile layout and swipe between pages
- [ ] SSL enabled in cPanel (Let’s Encrypt / AutoSSL)

## Updating the site later

```bash
npm run build
```

Re-upload **only changed files** in `dist/`, or replace the full `public_html` contents for a clean deploy.
