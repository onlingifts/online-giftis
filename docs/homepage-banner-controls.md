# Homepage banner selection and main carousel

The desktop Categories button, home Categories link and mobile navigation open the existing full-category drawer. Homepage cards are now one collection capped at three or four, with a default of four ordered active categories. A saved selection can mix category banners and standalone campaign banners; manual order is preserved and missing/hidden categories are omitted. The old campaign grid is hidden to avoid adding another set of banners beyond the cap. Other category banners remain in the full drawer and their category pages.

The hero carousel references the same home/category/campaign images as admin. Missing images are omitted per language without Arabic fallback on Turkish. Administrator choices control enabled slides, order, autoplay and 3–15 second interval. Multiple images show completely in a stable 3:1 contain frame; original single design banner retains its copy. Arrows, dots, pause, keyboard focus, inert inactive links and reduced-motion preferences are supported. Timers stop while hidden, hovered or focused; reloads clean them up.

Validation: static checks and unit tests plus GitHub Actions mocked browser suites at 320/390/1440 and existing desktop checks at 390/1024/1440/1920. No production mutations occur in tests.
