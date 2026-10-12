# Boutique catalogue, category and gallery completion

Follow-up to the published PR #36, based on production `e39c93af3099b1acd0fa1bd67510d9c4b7ec43ee`. The owner likes the visual direction and requested the missing product presentation, categories, outside/inside photos and banners to be completed against the same desktop/mobile references.

Changes:
- Add a shared bilingual category presentation module and dedicated text-free gift/occasion campaign assets. Category titles, descriptions and links remain real HTML populated from current category metadata.
- Replace old embedded-text campaign images in the boutique category/occasion views with consistent art and live localized copy. `savedBanners=1` still shows configured legacy category banners; no server configuration is edited.
- Show flowers and personalized-product collections from the actual catalogue on home, alongside existing featured products. No sellable product, stock quantity or price is invented.
- Show full-width photographic category cards on both home and catalogue category screens, ordered to make flowers/gifts/printing easier to find. Every available saved category remains accessible.
- Compact product cards use current localized short names, whole product photos, separate favorite/cart controls and stock-limited real cart actions. Home cart controls route through the real product into the existing customization-aware cart. Checkout still validates required personalization and payment policy.
- Product detail galleries include the actual primary image plus unique saved gallery images. Add keyboard-accessible full-size viewing, scrollable thumbnails and clearer title/price/details grouping. No synthetic images replace actual product/gallery photographs.
- Rating stars/counts are rendered only if explicit rating aggregates are provided by the catalogue. No sample ratings or review counts are fabricated.
- Generated pages and the generator load the same shared presentation module. Script/style cache versions are advanced for the already published site.

Validation:
- Static syntax, unique IDs, schema and sitemap checks across 36 pages.
- Five auth/category regression tests.
- Existing 30 responsive browser views and complete checkout regressions.
- Expanded bilingual screenshots at 320/390/1440, including category campaign pages; bank receipt, login/logout, gallery selection/full-size zoom, stock-limited catalogue quick-add and Turkish home quick-add.
- All test requests to remote services are intercepted; no actual order or authentication mutation.
- Visual review corrected legacy favourite positioning and product-card spacing collisions.

Campaign art uses the built-in ImageGen tool. Assets: `assets/boutique-gifts.webp` and `assets/boutique-occasions.webp`. Prompts: ivory gift boxes with burgundy bows on warm satin and blank right copy space; blush/ivory occasion gifts and champagne balloons with blank right copy space. These are decorative campaign backgrounds, not product listings.

The existing pre-redesign backup at `backup/storefront-before-luxury-20261012` / `9ce4d76c09b2936ab8de8c72c604061f2f33b270` remains the original rollback source. Production customers/orders/data are outside this change.
