# Updating rentals

Inventory lives in **`public/rentals.json`**. The live site loads it at runtime.

## Easiest: ask Cursor

In Cursor chat, say things like:

- *"Remove 5316 Glenloch from rentals and push live."*
- *"Add this rental: [address, price, beds, baths, description] and deploy."*
- *"List current rentals."*

Cursor edits the JSON (or `rentals-incoming/*.json`), runs the CLI, and pushes if FTP is configured.

## One-time FTP setup (enables auto-push)

1. Copy `.env.deploy.example` → `.env.deploy`
2. Fill in GoDaddy cPanel FTP host, username, password
3. Never commit `.env.deploy` (already gitignored)

Then:

```bash
npm run rentals:deploy
```

uploads only `rentals.json` (~15 KB) — no zip.

## Commands

| Command | What it does |
|---------|----------------|
| `npm run rentals:list` | Show all units |
| `npm run rentals:remove -- <slug>` | Remove a unit |
| `npm run rentals:add -- rentals-incoming/unit.json` | Add from a JSON file |
| `npm run rentals:validate` | Check JSON is valid |
| `npm run rentals:push` | FTP upload `rentals.json` to GoDaddy |
| `npm run rentals:push-photos -- <slug>` | FTP upload `public/Rentals/<slug>/` |
| `npm run rentals:stage-photos -- <slug> <dir>` | Copy staged images into `public/Rentals/<slug>/` |
| `npm run rentals:publish -- <slug>` | Push photos (if any) + `rentals.json` |
| `npm run rentals:deploy` | Validate + push JSON |

## Telegram + Hermes (mobile)

See **[SETUP-HERMES-TELEGRAM.md](./SETUP-HERMES-TELEGRAM.md)** — text your Hermes bot from your phone to add/remove listings and push live.

### Remove (rented)

```bash
npm run rentals:remove -- 5316-glenloch-st-3f
npm run rentals:push
```

### Add (new unit)

1. Copy `rentals-incoming/TEMPLATE.json` → `rentals-incoming/my-unit.json`
2. Fill in fields (or have Cursor fill it)
3. Upload photos to GoDaddy: `public_html/Rentals/<slug>/`
4. Run:

```bash
npm run rentals:add -- rentals-incoming/my-unit.json
npm run rentals:deploy
```

`id` is auto-assigned if omitted.

## Manual fallback (no FTP)

Edit `public/rentals.json` → upload that one file in cPanel → hard refresh.

## QR codes (new slug only)

```bash
npm run qr:generate
```

## Full zip (rare)

Only for code/design changes — not for add/remove listings.
