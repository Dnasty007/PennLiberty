---
name: penn-liberty-rentals
description: Add, remove, or update Penn Liberty rental listings and push live to pennlibertyre.com via FTP (no full zip).
version: 1.0.0
author: Penn Liberty
metadata:
  hermes:
    tags: [Real Estate, Rentals, Deploy, FTP]
    config:
      - key: skills.config.penn-liberty-rentals.project_path
        description: Absolute path to penn-liberty-site repo
        default: "/mnt/c/Users/Pennl/OneDrive/Documents/Playground/penn-liberty-site"
        prompt: Path to penn-liberty-site on this machine
---

# Penn Liberty — Live Rental Updates

Manage rental inventory for **https://pennlibertyre.com** without rebuilding the site.

Listings live in `public/rentals.json`. The live site loads that file at runtime. FTP credentials are in `.env.deploy` (gitignored).

**Project path:** use `skills.config.penn-liberty-rentals.project_path` from config, or `${HERMES_SKILL_DIR}/../..` if this skill is symlinked from the repo.

Always `cd` to the project path before running commands.

## When to Use

- User says a unit is rented → remove and push live
- User sends property details and/or photos → add listing and push live
- User asks to list current rentals or verify live inventory
- User is on Telegram/mobile and wants a hands-free deploy

## Safety Rules

1. **Confirm before push** unless the user explicitly said "push live" / "deploy" / "put on the website"
2. Never commit or print `.env.deploy` passwords
3. Never upload dummy/test listings without labeling them DEMO and confirming removal after test
4. Validate JSON before every deploy: `npm run rentals:validate`

## Quick Commands

| Task | Command |
|------|---------|
| List rentals | `npm run rentals:list` |
| Remove rented unit | `npm run rentals:remove -- <slug>` then `npm run rentals:deploy` |
| Add from JSON file | `npm run rentals:add -- rentals-incoming/<file>.json` |
| Stage photos | `npm run rentals:stage-photos -- <slug> <source-dir>` |
| Push JSON only | `npm run rentals:deploy` |
| Push photos + JSON | `npm run rentals:publish -- <slug>` |

## Add a New Rental (with photos from Telegram)

When the user sends images (e.g. 6 photos) and property details:

### 1. Gather details

Required: **address**, **price**, **beds**, **baths**, **area/neighborhood**, **description**

Optional: available date, deposit, MLS, sqft, property type, highlights

### 2. Choose a slug

Lowercase, hyphenated from address, e.g. `456-oak-st-2f`. Must be unique — run `npm run rentals:list` first.

### 3. Save photos

Save all received images to:

```
rentals-incoming/staging/<slug>/
```

Use the `terminal` tool. If Hermes downloaded Telegram attachments elsewhere, copy them into that folder.

### 4. Stage photos

```bash
cd <project_path>
npm run rentals:stage-photos -- <slug> rentals-incoming/staging/<slug>
```

Note the gallery paths printed (e.g. `/Rentals/<slug>/cover.jpg`).

### 5. Create listing JSON

Copy `rentals-incoming/TEMPLATE.json` → `rentals-incoming/<slug>.json` and fill in fields. Set `image` to the cover path and `gallery` to all staged paths.

### 6. Add + publish

```bash
npm run rentals:add -- rentals-incoming/<slug>.json
npm run rentals:publish -- <slug>
```

### 7. Reply to user

Include:
- Live URL: `https://pennlibertyre.com/rentals/<slug>`
- Total rental count
- Remind them to hard refresh if checking on desktop

## Remove a Rented Unit

```bash
cd <project_path>
npm run rentals:remove -- <slug>
npm run rentals:deploy
```

Tell the user it's live. Photos on the server can stay (orphaned) — only remove the JSON entry unless they ask to delete photos too.

## Pitfalls

- **WSL path:** Project is usually at `/mnt/c/Users/Pennl/OneDrive/Documents/Playground/penn-liberty-site`
- **FTP auth fails:** User must update `.env.deploy` — username is `rentals-push@pennlibertyre.com`
- **Site still shows old listing:** User may need hard refresh; verify `https://pennlibertyre.com/rentals.json` has the change
- **New property, no photos folder:** `rentals:publish` skips photos and only pushes JSON — use placeholder `/branding/liberty-head-grey.png` if photos aren't ready

## Verification

```bash
curl -s https://pennlibertyre.com/rentals.json | head -c 500
npm run rentals:list
```

Confirm slug appears (or is gone) and count matches expectation.
