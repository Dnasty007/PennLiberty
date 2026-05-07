# For Owners page imagery

The For Owners page currently uses Unsplash-hosted placeholder photography
sourced from `src/lib/owners.ts`. To swap in real Penn Liberty photography:

1. Drop replacement files in this folder, e.g. `philly-park.jpg`,
   `northern-liberties.jpg`, etc.
2. Update the URLs in `src/lib/owners.ts` to point at the local files
   (e.g. `/owners/philly-park.jpg`).

Recommended sizes:

- Page backdrop: at least 2000px wide, landscape, low-saturation enough
  to read as background.
- Neighborhood tiles: at least 1200px wide, recognizable streetscapes.
- Polaroid: at least 900px wide, square or 4:3.
