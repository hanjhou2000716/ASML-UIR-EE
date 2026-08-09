# Quality and release gates

## Local gates

Run `npm ci`, then `npm run validate`, `npm run a11y`, and `npm run visual`. The visual command launches real Chromium at 360, 390, 768, 1024, and 1440px and compares the main, BenQ, practice, and archive states with the committed PNG snapshots in `tests/visual-baselines/`. Use `npm run visual:update` only after reviewing an intentional UI change.

The accessibility gate loads axe through the local test server so the production CSP remains strict. It fails on any critical or serious violation at both 360px and 1440px.

## Production verification

After GitHub Pages deploys, verify the production URL with Chromium at mobile and desktop widths: HTTP 200, no page errors, no horizontal overflow, no inline style attributes, strict CSP, rendered SVG icons, working company/category switching, archive inert state, and the BenQ question-bank counts.

For a performance assessment, run Lighthouse against the deployed URL and record Performance, Accessibility, Best Practices, FCP, LCP, TBT, and CLS in the release note. CLS must remain below 0.1; the implementation has no arbitrary delayed initialization and does not inject runtime CSS.
