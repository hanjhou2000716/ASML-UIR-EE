# Lighthouse production assessment

Target: <https://hanjhou2000716.github.io/ASML-UIR-EE/>

Run date: 2026-08-09, headless Chrome, Lighthouse categories: performance, accessibility, best-practices.

| Metric | Result |
| --- | ---: |
| Performance | 86/100 |
| Accessibility | 96/100 |
| Best Practices | 96/100 |
| First Contentful Paint | 1.91 s |
| Largest Contentful Paint | 1.91 s |
| Total Blocking Time | 427 ms |
| Cumulative Layout Shift | 0 |

The score is a measured production assessment, not a synthetic readiness or hiring probability. Repeated runs varied from 72–86 because of network/runner variance; the latest run is recorded above. The explicit 90-point target is not yet met. Category-level lazy rendering reduced initial DOM/style work, but style/layout remains the primary performance cost and needs a dedicated profiling pass.
