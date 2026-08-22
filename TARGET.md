# Target Website

## Design Reference
https://www.villex-container.de/ (layout/structure reference for the home page: hero,
social-proof strip, container-type category cards, size/modular configurator teaser,
project references, footer link structure). Visual style borrowed: industrial-modern,
navy header/footer, clean product photography. Wording/copy is NOT copied — original text
written for BBC Best Box Containerhandel e.K.

Second pivot (2026-08): storefront was fully disabled (blank page), then re-enabled per
user request as a **container-trading marketing site** (sale/rental of shipping, storage,
office and sanitary containers), homepage structurally inspired by villex-container.de,
secondary pages original/modern (not cloned).

## Brand
- Name: **BBC Best Box Containerhandel e.K.**
- Domain: bestbox-containerhandel.de (placeholder)
- Color palette (refined 2026-08, applied as global design tokens in `globals.css`):
  - Primary / CTA: burnished terracotta `#B8551F` — corten-steel echo, less "construction
    orange" than the first pass, reads more premium
  - Secondary / header-footer: deep ink navy `#0A1D30` — trust, maritime/logistics
  - Accent: pale cool slate `#E9EDF1`; small highlight touches use a muted bronze `--gold
    #C9A876` (finish-line cards, dividers)
  - Buttons/header use soft gradients + backdrop-blur, rounded-2xl/rounded-full instead of
    flat rounded-sm, for a more refined feel than the first (flatter) pass
- Admin back-office picks up the same primary/secondary tokens (shared design system);
  destructive/sale/discount colors were left untouched (semantic red/yellow, unrelated to
  brand hue).
- Header/footer carry a small original SVG "container glyph" mark (`ContainerGlyph.tsx`) —
  not a real designed logo yet.

## Scope (2026-08 rebuild)
- **Home page (chosen direction, at `/`)**: hero, stats card, container-type category
  cards, kauf/miete split, "why us", process steps, CTA — mock/original content, no
  literal villex copy. This is the version being iterated on going forward.
- A second homepage draft (`/v2`, hero image-carousel + finish-line gallery, structurally
  closer to villex-container.de) was built for comparison and **not chosen** — left in place
  unlinked/noindexed in case something from it (e.g. `HeroCarousel.tsx`, the finish-line
  concept) is worth reusing later. Safe to delete once no longer needed.
- Secondary pages (original, not cloned): `/sortiment` (container types), `/vermietung`
  (rental), `/ueber-uns` (about), `/kontakt` (contact, form present but not wired to a
  backend yet). Legal pages (`/impressum`, `/datenschutz`, `/agb`) re-enabled using the
  existing rebranded `src/content/legal/*.ts` content — NOTE: that legal prose still
  describes a home-appliance business in places (narrative sections only, not the
  company-identity fields) and should be rewritten for container trading before real-world
  legal use; see the note at the top of `de.ts`/`en.ts`.
- Content is static/mock (no live product database wiring) — the admin's existing
  Product/Category catalog still holds the old appliance mock catalog and is untouched.
- No real container photography/video available — hero currently uses stat callouts (v1)
  or a stylized gradient rotation (v2), not real images.
- English (`/en`) routes exist structurally but currently render the same German copy
  (no translation pass done yet).
