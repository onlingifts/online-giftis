# Google review selection

Ten customer-provided Google screenshots captured 2026-10-12 supply the names, five-star ratings and text in assets/google-reviews-data.js. The first five are assigned to Arabic; the other five are translated faithfully into Turkish. Original Arabic text and source-image filenames remain in the dataset. Muhammad's collapsed review is explicitly an excerpt; no hidden ending was invented. Relative screenshot dates are omitted instead of turning them into invented publication dates. Arabic author names stay as shown in their source.

The curated cards identify Google and label translations. They do not claim verified purchases, a Google-wide score, a total number of Google reviews or a live Google integration. CSS monograms are initials, not invented portraits. They are separate from moderated member reviews; both native language views now show only comments in the current locale. Native summary reflects the displayed language-specific selection, not Google's cards. Submission, login and approval behavior remain intact.

Validation: static theme checks, JavaScript syntax and GitHub Actions responsive browser suite. The existing desktop suite checks five Google cards for each language at 390, 1024, 1440 and 1920 pixels, captures the review section, and still checks native guest/login/pending behavior with mocked POST requests only.
