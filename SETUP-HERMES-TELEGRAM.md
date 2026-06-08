# Penn Liberty rentals via Hermes + Telegram (WSL)

Text Hermes on Telegram while driving (or from your phone) to add/remove rentals and push live to **pennlibertyre.com** — no full zip.

## What you need

- **Hermes Agent** installed in WSL (you already have this)
- **Telegram bot** from [@BotFather](https://t.me/BotFather)
- **Node.js** in WSL (`node -v` should work)
- **`.env.deploy`** in the project with GoDaddy FTP credentials (same as Cursor uses on Windows)

## One-time setup (~15 min)

### 1. Open WSL and go to the project

```bash
cd /mnt/c/Users/Pennl/OneDrive/Documents/Playground/penn-liberty-site
npm install   # if not done in WSL before
```

`.env.deploy` on the Windows side is the same file WSL reads via `/mnt/c/...` — no copy needed if it's already there.

Test FTP from WSL:

```bash
npm run rentals:list
npm run rentals:deploy   # dry-run feel: should say "Uploaded rentals.json"
```

### 2. Install the Penn Liberty Hermes skill

```bash
mkdir -p ~/.hermes/skills
ln -sf "$(pwd)/hermes-skills/penn-liberty-rentals" ~/.hermes/skills/penn-liberty-rentals
```

Set project path in Hermes config (if WSL path differs):

```bash
hermes config set skills.config.penn-liberty-rentals.project_path "$(pwd)"
```

Enable the skill in `~/.hermes/config.yaml` under `skills.enabled` (add `penn-liberty-rentals` to the list), or load it when chatting with the skills toolset.

### 3. Tell Hermes about Penn Liberty

Append to `~/.hermes/AGENTS.md` (create if missing):

```markdown
## Penn Liberty Real Estate
- Website: https://pennlibertyre.com
- Rental updates: use skill `penn-liberty-rentals`
- Repo: /mnt/c/Users/Pennl/OneDrive/Documents/Playground/penn-liberty-site
- FTP deploy is configured in .env.deploy — never commit or share passwords
- Listing changes do NOT need a full site zip
```

Optional personality in `~/.hermes/SOUL.md`:

```markdown
For Penn Liberty rental tasks: be concise, confirm before push unless user said "push live", and always return the live URL after deploy.
```

### 4. Configure Telegram gateway

```bash
hermes gateway setup
```

Or manually in `~/.hermes/.env`:

```bash
TELEGRAM_BOT_TOKEN=your-token-from-botfather
TELEGRAM_ALLOWED_USERS=your-numeric-telegram-id
```

Find your Telegram user ID: message [@userinfobot](https://t.me/userinfobot).

### 5. Start the gateway

Foreground test:

```bash
hermes gateway
```

DM your bot: *"List Penn Liberty rentals"*

If it works, install as a background service:

```bash
hermes gateway install
hermes gateway start
```

On WSL2, keep gateway running when PC is on. For true 24/7 while away from home, later move Hermes to a small VPS.

---

## Example Telegram messages

**Remove rented unit:**
> Glenloch at 5316 is rented. Remove it and push live.

**Add new property with photos:**
> New rental: 456 Oak St Unit 2F, $1,400/mo, 2 bed 1 bath, Temple area. Move-in June 1. Here are 6 photos. Add it and push to the website.

Send photos as **attachments** in the same chat (or follow up with images after the text).

**List inventory:**
> What rentals are live on pennlibertyre.com?

---

## What happens under the hood

1. Hermes loads the `penn-liberty-rentals` skill
2. Saves your photos → `rentals-incoming/staging/<slug>/`
3. Runs `npm run rentals:stage-photos`
4. Writes JSON → `rentals-incoming/<slug>.json`
5. Runs `npm run rentals:add` + `npm run rentals:publish`
6. Replies with live link

## Commands reference

| npm script | Purpose |
|------------|---------|
| `rentals:list` | Show all units |
| `rentals:remove -- <slug>` | Remove from JSON |
| `rentals:add -- <file.json>` | Add to JSON |
| `rentals:stage-photos -- <slug> <dir>` | Prepare photo folder |
| `rentals:deploy` | FTP upload `rentals.json` only |
| `rentals:push-photos -- <slug>` | FTP upload `Rentals/<slug>/` |
| `rentals:publish -- <slug>` | Photos (if any) + JSON |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| WSL not running | Start Ubuntu from Start menu, then `hermes gateway start` |
| FTP 530 auth | Update `.env.deploy` password in cPanel |
| Skill not found | Re-run symlink step; check `~/.hermes/skills/penn-liberty-rentals/SKILL.md` exists |
| Photos don't show | Run `npm run rentals:push-photos -- <slug>`; check `public/Rentals/<slug>/` |
| Old listing still visible | Hard refresh; check `https://pennlibertyre.com/rentals.json` |

## Security

- Only your Telegram user ID in `TELEGRAM_ALLOWED_USERS`
- Never set `GATEWAY_ALLOW_ALL_USERS=true` (bot can run terminal commands)
- Rotate FTP password if it was ever shared in chat
