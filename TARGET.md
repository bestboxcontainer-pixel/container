# Target Website

## Design Reference
https://www.villex-container.de/ (layout/structure reference for the home page: hero,
social-proof strip, container-type category cards, size/modular configurator teaser,
project references, footer link structure). Visual style borrowed: industrial-modern,
navy header/footer, clean product photography. Wording/copy is NOT copied, original text
written for BBC Best Box Containerhandel e.K.

Second pivot (2026-08): storefront was fully disabled (blank page), then re-enabled per
user request as a **container-trading marketing site** (sale/rental of shipping, storage,
office and sanitary containers), homepage structurally inspired by villex-container.de,
secondary pages original/modern (not cloned).

## Brand
- Name: **BBC Best Box Containerhandel e.K.**
- Domain: bestbox-containerhandel.de (placeholder)
- Color palette (refined 2026-08, applied as global design tokens in `globals.css`):
  - Primary / CTA: burnished terracotta `#B8551F`, corten-steel echo, less "construction
    orange" than the first pass, reads more premium
  - Secondary / header-footer: deep ink navy `#0A1D30`, trust, maritime/logistics
  - Accent: pale cool slate `#E9EDF1`; small highlight touches use a muted bronze `--gold
    #C9A876` (finish-line cards, dividers)
  - Buttons/header use soft gradients + backdrop-blur, rounded-2xl/rounded-full instead of
    flat rounded-sm, for a more refined feel than the first (flatter) pass
- Admin back-office picks up the same primary/secondary tokens (shared design system);
  destructive/sale/discount colors were left untouched (semantic red/yellow, unrelated to
  brand hue).
- Header/footer carry a small original SVG "container glyph" mark (`ContainerGlyph.tsx`)
  not a real designed logo yet.

## Scope (2026-08 rebuild)
- **Home page (chosen direction, at `/`)**: hero, stats card, container-type category
  cards, kauf/miete split, "why us", process steps, CTA, mock/original content, no
  literal villex copy. This is the version being iterated on going forward.
- A second homepage draft (`/v2`, hero image-carousel + finish-line gallery, structurally
  closer to villex-container.de) was built for comparison and **not chosen**, left in place
  unlinked/noindexed in case something from it (e.g. `HeroCarousel.tsx`, the finish-line
  concept) is worth reusing later. Safe to delete once no longer needed.
- Secondary pages: `/vermietung` (rental), `/ueber-uns` (about), `/kontakt` (contact).
  `/sortiment` was later replaced by the real category pages (see the redirect in
  `next.config.ts`). Legal pages (`/impressum`, `/datenschutz`, `/agb`, …) use
  `src/content/legal/*.ts`, rewritten for container trading (2026-09) — see the note at
  the top of `de.ts`/`en.ts`; the ElektroG/BattDG appliance content was removed as
  out of scope.
- **Update (2026-09):** the appliance mock catalog has since been fully replaced —
  `scripts/cleanup-old-project.ts` removed the old categories/products, and the live
  catalog (`prisma`-backed, `data/store/*.json`) holds only real container listings.
  Real container photography is in place (`public/images/container`, `public/images/hero`).
  This section is kept as a historical record of the 2026-08 rebuild's starting point.
- English (`/en`) routes exist structurally but currently render the same German copy
  (no translation pass done yet).
