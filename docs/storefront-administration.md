# Saved administration controls

The paired customer-store Worker change makes effective banner artwork available to public and admin clients, and persists five homepage sections plus bilingual banner copy in the existing settings table. This update consumes those API fields; defaults remain compatible with older API responses.

`assets/home-layout.js` selects products using the saved automatic/category/manual mode, limit and manual order. Missing or unpublished records do not render. `assets/home.js` applies section visibility/order/headings and hero copy, respects homepage/featured product flags, and uses the saved category artwork for shortcut cards. `assets/boutique-presentation.js` honors effective artwork, including explicit hidden images; product-category campaigns use the same artwork as administration. Raw catalogue prices, stock, media, payment and customization are unchanged.

Changed HTML files refresh the shared script/style cache versions; `scripts/generate-product-pages.mjs` preserves those versions on future product generation. Tests cover manual selection, hidden sections, featured/category/personalized/flower filters, bilingual titles, image modes and 320/390/1440 browser views. Browser requests are intercepted; no orders, accounts, or admin records are changed.

Deploy the customer-store Worker update first, then this storefront update. Revert the paired merge commits to roll back code while preserving administrator-saved settings.
