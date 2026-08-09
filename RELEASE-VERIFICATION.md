# Release verification

Release commit: `6ae09f0` on `main` (PR #48 merged).

CI and Pages completed successfully:

- Validate workflow: `31319594024`
- GitHub Pages deployment: `31319593395`

Production URL: <https://hanjhou2000716.github.io/ASML-UIR-EE/>

Real Chromium checks after deployment passed at 360px and 1440px: HTTP 200, strict CSP without `unsafe-inline`, zero page errors, zero inline style attributes, no horizontal overflow, SVG renderer present, archive drawer inert while closed, and BenQ category switching rendered the expected questions.

Lighthouse production assessment (run after commit `6ae09f0`):

| Category | Score |
| --- | ---: |
| Performance | 93 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |

Observed metrics: CLS `0.00015`, FCP `1.59s`, LCP `2.09s`, TBT `232ms`, DOM nodes `785`.
