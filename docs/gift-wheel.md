# Gift wheel

Public links /gift/ and /tr/gift/ share an ivory, burgundy and gold SVG wheel. Configurable outcomes show effective probabilities and conditions; none and respin outcomes are disclosed before spinning. The result is chosen by the API before the animation. Page reload restores account-bound attempts and available awards; pending request keys survive network loss. Reduced motion skips animation. Existing email/password/signup and Google auth are reused; a fixed allowlist returns OAuth callbacks from the existing catalogue login route to the wheel.

Reward selection persists only a code in local storage. The catalogue checkout quotes it with authenticated API requests whenever account/cart changes; stale or failed quotes block reward checkout until corrected or removed. Server totals are authoritative. Wheel benefits replace the first-order member discount, and free gift/shipping benefits are described in the cart. Request IDs survive retries and are bound to the payload; removing/changing a selected code resets a cancelled order intent. No browser storage is trusted for reward entitlement.

The initial campaign is inactive. Campaign setup is in admin → عجلة الحظ. Select the gift product, BOGO products, one-unit 90% products, limits and schedule before enabling. The special link is deliberately noindex; it is shared directly with customers.

## 2026-10-13 participation and display update
- Removed the lower prize catalogue and long campaign information from the wheel page.
- Wedges show the full bilingual outcome names, wrapped with contrasting ink and larger mobile wheel area.
- Participation requires a signed-in account and a site review submitted by that account. The page submits through the existing native review endpoint; any star rating qualifies and publication approval is not required.
- Customer-store management has a dashboard shortcut and a direct /#wheel route, with the wheel second in the navigation and all mobile navigation buttons visible.
