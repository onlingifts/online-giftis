# Desktop categories, full banner artwork and native reviews

The desktop homepage previously showed only three category shortcuts, while the full catalogue categories were behind a drawer. Category and promotion pictures were cropped to fixed-height frames, and copy overlaid the artwork's product side on Turkish shortcuts. The printing illustration also contained Arabic text.

The homepage now lists every active category returned by the existing catalogue API in a clearly labelled section and navigation anchor. Category ordering/names/images remain controlled by administration. Shared banner cards use a 3:1 image frame with `object-fit:contain`, complete artwork and a separate copy area; catalogue campaign copy is below the image. Desktop hero artwork and text occupy separate columns. Long text wraps without crossing artwork. Uploaded images remain respected. The Turkish printing illustration is a localized sibling at `assets/boutique-print-tr.webp`; actual product photos are unchanged.

The reviews section now renders approved reviews from `/api/store/reviews` and contains a member submission form rather than directing visitors to Google. Empty/error states and controls are bilingual. No sample reviews, ratings or counts are inserted in production. Submitted/edited reviews wait for approval; they do not alter the public count until approved. Google screenshot reviews may be added separately once supplied by the owner.

Artwork was edited with built-in image generation, preserving the original composition and 3:1 frame. Prompt: replace the mug's Arabic name with `Elif`, notebook text with `Her gün yeni bir başlangıç`; preserve mug, notebook, pen, leaves, satin, lighting and positions; no Arabic letters, marketing headline, logo or watermark. The generated PNG was converted to WebP without geometric changes. Original artwork remains available.

Verification covers all active categories and nonoverlapping banner image/copy bounds at 390/1024/1440/1920 in Arabic/Turkish, Turkish print asset selection, review login requirement and pending state, plus existing purchase/auth/gallery checks. Remote mutations are mocked.

Paired customer-store update adds moderated native reviews and resolves the Turkish default image in administration/public metadata. Code rollback requires reverting both merge commits; retain customer reviews rather than dropping the new table.
