# Category banner image fit

Customer screenshot showed the flower banner displayed as a small centered image inside a forced 3:1 rectangle. Category cards (homepage and full category drawer) and the category campaign image now retain the source image's own aspect ratio at full card width. Height follows the intrinsic ratio with contain fitting, preserving all artwork without horizontal letterboxing or distortion. Main hero carousel retains its separate stable frame.

All shared stylesheet references and the SEO generator use cache version 20261013-banner-fit1. Existing responsive CI additionally checks natural/rendered flower image aspect ratios and captures the reported card in AR/TR at 390/1024/1440/1920 pixels. No banner files, admin settings or product data are changed.
