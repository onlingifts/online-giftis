# Specialty banners and administration integration

Eight new decorative category photographs cover keychains, photo gifts, Italian silver, necklaces/accessories, perfumes/incense, hookahs, children's gifts and family gifts. Existing flower, printing, gift-package and birthday artwork completes coverage for all twelve current retail categories. Images are category illustrations; actual product photographs, prices, stock, publication and checkout policies remain API-controlled.

Promotional cards keep their own saved names, including birthday, popular products, artificial rose bouquets and custom gift arrangement. Category names and order remain API-controlled. Classification reads names before legacy keys, so `thermal` means hookahs and `laser` means silver in the current catalogue.

The previous redesign ignored uploaded artwork unless `savedBanners=1` was present. This change records the exact legacy image revisions and replaces only those with boutique defaults. Every new administrator upload (a new versioned URL), new category or new promotion automatically uses its saved Arabic/Turkish image. Custom banner artwork displays without overlaid promotional copy or image cropping. Product pictures and galleries remain live API records. A removed main banner remains hidden. The existing legacy artwork is still accessible with `?savedBanners=1`.

The baseline is deliberately finite: future uploads are never added automatically. It does not require editing frontend code when administration publishes a new versioned URL. If the backend replaces bytes at exactly the same URL without changing `v`, it must invalidate/version the URL to distinguish the replacement; all current saved URLs already include their revision.

## Administration inspection

The retail administration is `https://admin.onlinegiftis.com/`, implemented under `customer-store/admin` and `customer-store/src` inside `onlingifts/onlingifts`, branch `cloudflare-v64`. Its worker and database are separate from the representatives portal. The live login page includes the current product/category/promotion controls. Source inspection and isolated tests confirm:

- Product create/edit: bilingual names/descriptions, price/comparison price, stock, draft/published/hidden state, multiple retail categories, featured/homepage/bestseller/new flags, customization and COD/bank-only policies.
- Arabic/Turkish primary pictures uploaded independently; up to 20 shared gallery pictures, ordering, primary selection and bilingual ALT. Uploads are prepared before publication; failed uploads leave a retriable draft.
- Optional bilingual material/dimensions/colors/box contents/notes, weight, preparation duration, SEO title/description, search terms and slug.
- Independent main banner by language, category CRUD/order/visibility/bilingual images, promotion CRUD/bilingual names/order/category target/images, and per-scope colors.

The storefront now consumes administrator-selected colors through its boutique palette, including homepage, category and product detail; promotional cards can retain their own palette. Known legacy banner revisions receive boutique defaults, while each future upload takes precedence automatically. Backend uploads use new UUID object keys, so the revision comparison is compatible with actual administration behavior.

Forty existing backend regression tests passed on an isolated copy using mock auth/storage and temporary SQLite. Actual admin UI was tested locally against mocked requests for bilingual product creation/publication, category creation and linked promotion creation. No live authenticated save or real record mutation was performed.

## Validation

Static checks on 36 pages, five auth/category unit tests, 30 responsive browser views and the existing bilingual boutique purchase/auth mock suite passed. New management checks cover all twelve specialties in Arabic/Turkish at 390/1440 pixels, new uploaded main/category/promotion images, promo names, image decoding and horizontal overflow: 56 screenshots. All write requests in browser tests are intercepted/mocked; no customer, product, category, order or admin settings were changed in production.

## Artwork provenance

Built-in image generation was used for each separate specialty image. Shared prompt: photorealistic luxury studio still life on ivory satin and warm cream, subtle burgundy/gold accents; landscape 3:1, specialty objects at left, clean right half for live HTML copy; no lettering/logo/watermark. Subjects: personalized keychains; photo frame/mug/plaque; silver necklace/bracelet/ring; fine necklaces/accessories in wine velvet; amber perfumes/oud/incense holder; ornate gold/silver hookahs without smoke; teddy/toy blocks/gift; family frame/mugs/gift. Saved as `assets/boutique-{keychains,photo,silver,jewelry,perfume,hookah,kids,family}-banner.webp`, 2172×724, WebP quality 85. No product data is inferred from generated artwork.

Rollback: revert the specialty-banner merge, or restore branch `backup/storefront-before-specialty-banners-20261012`. The original pre-boutique backup also remains available.
