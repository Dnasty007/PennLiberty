# For Owners page imagery

Local assets served at `/owners/...`:

| File | Use |
|------|-----|
| `owners-1.jpg` | Landscape — page shell backdrop + metro coverage panel |
| `owners-2.jpg` | Portrait — cycle in dev; prefer landscape for coverage panel |
| `owners-3.jpg` | Page shell + metro coverage (dev **Next page image**) |

Wired in `src/lib/siteImagery.ts` and passed from `App.tsx` into `OwnersSection`.

To replace a photo, swap the file in this folder (keep the same name) or update the paths in `siteImagery.ts`.

Recommended sizes:

- `owners-1.jpg`: at least 2000px wide, landscape
- `owners-2.jpg`: at least 1400px wide; portrait or landscape both work with `object-cover`
