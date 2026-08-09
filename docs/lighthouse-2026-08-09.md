# Lighthouse production assessment

Target: <https://hanjhou2000716.github.io/ASML-UIR-EE/>

Run date: 2026-08-09, headless Chrome, Lighthouse categories: performance, accessibility, best-practices.

| Metric | Result |
| --- | ---: |
| Performance | 72/100 |
| Accessibility | 96/100 |
| Best Practices | 96/100 |
| First Contentful Paint | 2.13 s |
| Largest Contentful Paint | 2.13 s |
| Total Blocking Time | 732 ms |
| Cumulative Layout Shift | 0 |

The score is a measured production assessment, not a synthetic readiness or hiring probability. Repeated runs varied from 72–86 because of network/runner variance; the latest run is recorded above. The explicit 90-point target is not yet met. Lazy hydration is in place, but JavaScript execution/TBT remains the primary performance risk and needs a dedicated profiling pass.
