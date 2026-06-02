# Rental property photos

Drop photos for each unit into its folder below. The app loads them from `/rentals/<folder>/...`.

| Folder | Property |
|--------|----------|
| `1540-n-15th-st-3f-rear` | 1540 North 15th Street — 3rd Floor Rear, Philadelphia, PA 19121 |
| `1704-w-diamond-st-2f` | 1704 West Diamond Street — 2F, Philadelphia, PA 19121 |
| `1704-w-diamond-st-3f` | 1704 West Diamond Street — 3F, Philadelphia, PA 19121 |
| `2542-cecil-b-moore-ave-2` | 2542 Cecil B. Moore Avenue — Unit 2, Philadelphia, PA 19121 |
| `1711-n-gratz-st-2f` | 1711 North Gratz Street — 2F, Philadelphia, PA 19121 |
| `1036-fillmore-1m` | 1036 Fillmore — 1M, Philadelphia, PA 19124 |
| `2633-kensington-ave-1c` | 2633 Kensington Avenue — 1C, Philadelphia, PA 19125 |

## Recommended filenames

- `cover.jpg` — main card / hero photo
- `gallery-1.jpg`, `gallery-2.jpg`, … — additional photos for the detail view

These map to URLs like:

- `/rentals/1540-n-15th-st-3f-rear/cover.jpg`
- `/rentals/1540-n-15th-st-3f-rear/gallery-1.jpg`

If you use different filenames, we will update `initialRentals` in `src/lib/data.ts` to match.
