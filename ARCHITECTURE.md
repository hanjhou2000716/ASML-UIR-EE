# Architecture

## Runtime flow

```text
Question bank (deployRoleQuestionBanks)
        ↓
DOM renderer (company/category sections)
        ↓
Stable question identity (company.category.content-digest)
        ↓
InterviewState schema v2
        ↓
Progress insights and practice actions
```

The current site remains a modular vanilla-JavaScript application so it can be served directly by GitHub Pages. `index.html` owns the existing content renderer; `js/state.js` owns persistence, migration, analytics and the workspace shell. New state must never depend on DOM order.

The workspace shell also provides cross-company search, a current-category status filter (all/unmastered/practiced/mastered), and a confirmed local progress reset. Search results retain company, category, and stable question ID context so selecting a result returns to the source card.

## State contract

```js
{
  schemaVersion: 2,
  activeCompanyId: 'asml',
  activeCategoryByCompany: {},
  questions: {
    'benq.tech.content-digest': {
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

Add a company/category to the structured bank in `deployRoleQuestionBanks()`, keep each question as `[question, answer, tip]`, and ensure the category has at least ten questions. The renderer publishes the bank as `window.InterviewQuestionBanks`; the state layer derives stable IDs from company, category and prompt content.

Run `npm run validate` before opening a PR. The workflow in `.github/workflows/validate.yml` is the merge gate.

The browser smoke suite covers company/category navigation, cross-company search, status filtering, reset confirmation, keyboard/ARIA behavior, practice sessions, speech fallback, archive state, and axe critical/serious violations.
