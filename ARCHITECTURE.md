# Architecture

## Runtime flow

```text
Question bank (deployRoleQuestionBanks + explicit role IDs)
        ↓
Unified runtime renderer + legacy data adapter
        ↓
Stable question identity (explicit immutable registry IDs)
        ↓
InterviewState schema v2
        ↓
Progress insights and practice actions
```

The current site remains a modular vanilla-JavaScript application so it can be served directly by GitHub Pages. `js/app.js` owns application lifecycle and role-bank composition, `js/renderer.js` is the shared company/category/question renderer, and `js/legacy-sections.js` is a compatibility adapter for structured legacy records. `js/state.js` owns persistence, migration, analytics and the workspace shell. Styles are served from `assets/app.css` and the generated Tailwind bundle; the page CSP no longer requires inline script or style execution. Runtime UI icons are supplied by the trusted inline SVG registry in `js/icons.js`; new state must never depend on DOM order or question-text digests.

The workspace shell also provides cross-company search, a current-category status filter (all/unmastered/practiced/mastered), and a confirmed local progress reset. Search results retain company, category, and stable question ID context so selecting a result returns to the source card.

## State contract

```js
{
  schemaVersion: 2,
  activeCompanyId: 'asml',
  activeCategoryByCompany: {},
  questions: {
    'benq.tech.spc-purpose': {
      mastered: false,
      attemptedCount: 0,
      practiceCount: 0,
      lastPracticedAt: null
    }
  }
}
```

Corrupt JSON, invalid companies and unavailable browser storage fall back to an in-memory store. Legacy `interview-mastered-*` and `interview-active-company` keys are read once and migrated.

## Adding content

Add a company/category to the structured bank in `deployRoleQuestionBanks()`, keep each question as `[question, answer, tip]`, and add its immutable ID to `roleQuestionIds`. Ensure the category has at least ten questions. The renderer publishes the bank as `window.InterviewQuestionBanks`; the state layer consumes the explicit ID manifest.

Run `npm run validate` before opening a PR. The workflow in `.github/workflows/validate.yml` is the merge gate.

The browser smoke suite covers company/category navigation, cross-company search, status filtering, reset confirmation, keyboard/ARIA behavior, practice sessions, speech fallback, archive state, and axe critical/serious violations. `npm run visual` runs real Chromium at 360, 390, 768, 1024 and 1440px, captures main/BenQ/practice/archive states, and gates visible SVG geometry, tab touch height, sticky layout and horizontal overflow.
