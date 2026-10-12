# Luxury boutique preview — PR #36

Branch: `design/luxury-boutique-ar-tr-preview`.
Review only: do not merge or deploy. No backend, customer, inventory or order records are changed.

## Result

- Shared ivory, burgundy and gold presentation for Arabic and Turkish home, catalogue, favorites, generated/dynamic product details, cart, address, payment and customer membership.
- Independent responsive campaign images and live HTML copy. Decorative campaign imagery never replaces real product photographs, names, prices or stock.
- Desktop: centered brand, compact navigation/search, wide satin/rose hero, three category banners, six real product cards, reviews link and light footer.
- Mobile: bouquet hero, three photo category tiles, four service icons, two-column products and fixed five-item navigation. Full category screen uses saved category names and actual product photos.
- Product gallery, stock-limited quantity selection, persistent favorites, customization designer and delivery/returns/reviews accordions.
- Cart retains uploads and price calculations. Three stages present cart, required province/district/address and available payment methods. Bank-transfer receipt remains required. Empty carts are viewable and cannot submit.
- Membership keeps login, registration, provider availability, benefits, notifications and logout; adds links to existing tracking, favorites and support.
- Generated SEO pages and the generator both include the new shared stylesheet and UI enhancement.

## Reference comparison

Acceptance references: the approved desktop boutique image and the twelve-screen mobile montage from 2026-10-12. Compared rendered screenshots repeatedly and corrected clipped bottom navigation, hidden fifth/sixth desktop products, narrow product detail columns, missing icons, Turkish hero placement and a favorite button obscured by the language switch.

Compared at 320, 390 and 1440 pixels in Arabic and Turkish; existing responsive checks also cover 360, 430 and 768 pixels. Full-page and viewport images are produced by the browser check. Screenshot filenames encode page, width and language; cart/address/payment/login/register/member screenshots use only synthetic identities and intercepted responses.

Intentional differences from the mockups:

- Online Gifts brand, Turkish delivery context, real Turkish-lira prices and current catalogue replace mock-brand/sample content.
- Product photos and availability come from the existing catalogue, so card imagery/counts vary with inventory.
- The storefront does not expose individual customer reviews or rating aggregates. No testimonial names, quotes, stars or rating counts are invented; review links lead to the existing Google review page.
- Payments remain the existing cash-on-delivery and configured bank transfer. Mock card/wallet methods, coupons, saved address management and account order-history screens are not fabricated. Existing order tracking remains available.
- Homepage campaign uses the reference-derived local art for this preview. `?savedBanners=1` shows the currently saved homepage banner instead. Saved banner deletion, category visibility and saved occasion banners remain respected. No saved server configuration was edited.
- Extra occasion/member-offer/how-to content is retained in an expandable section to keep the primary view close to the reference.

This is a close implementation of the visual direction, not a pixel-identical reproduction of raster mockups. The reference campaign assets were recreated; typography, real catalogue content and supported checkout/account capabilities produce visible differences.

## Validation

- `node scripts/check-themes.mjs`: 36 pages, inline script syntax, unique IDs, schema JSON and sitemap consistency.
- `node --test scripts/check-auth.mjs scripts/check-home-categories.mjs`: five tests (rotating refresh, network failure, rejected session, all saved categories and independent banner/deletion behavior).
- `node scripts/check-themes-browser.cjs`: 30 responsive views, Turkish search, new product routes/images, personalization, cash-on-delivery totals/order flow, stale cart removal, deleted product, register tabs and category outage.
- `node scripts/check-boutique-browser.cjs`: bilingual screenshots; actual saved categories; gallery, quantity, favorites; address validation; bank totals and required receipt; single submission on double click; mocked login/member/logout.
- `git diff --check`, standalone JS syntax checks.

All browser remote requests are intercepted. Read-only catalogue/category fixture downloads are the only live API reads. Orders and authentication are fulfilled locally in the tests. No live order is placed, no real account is created or signed into, and no production data is mutated.

## Run locally

Serve the repository on port 8765, install the pinned Playwright version from CI and its Chromium browser, then run both browser scripts. Optional: put read-only catalogue/category JSON in `/tmp/og-products.json` and `/tmp/og-categories.json`. `OG_BROWSER_PATH` selects an existing Chromium executable; `OG_SCREENSHOT_DIR` chooses the boutique screenshot directory.

CI repeats the checks and uploads `theme-previews` as an Actions artifact. The PR workflow has read-only repository permissions and contains no deploy step. The production generation workflow remains restricted to `main`.

## Campaign assets

Built-in ImageGen produced `assets/boutique-hero-desktop.webp`, `assets/boutique-hero-mobile.webp` and `assets/boutique-print.webp`. Prompts: reproduce the desktop ivory-satin/red-rose/gift-box composition without text or logos; reproduce the mobile blush-wrapped red bouquet on the left with ivory copy space; reproduce the custom-printing ivory mug/notebook/gold-pen vignette with copy space. Headings, labels and controls are real localized HTML.
