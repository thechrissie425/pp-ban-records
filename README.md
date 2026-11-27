# Ban Records dashboard

A [Sanity App SDK](https://www.sanity.io/docs/app-sdk) app for the research behind
[Punk & Pedagogy](https://www.punkandpedagogy.com)'s banned-books pages. It runs in the Sanity
Dashboard, next to the Studio, and answers the questions an editor asks before a ban claim goes stale:

| Tab | What it lists | Why |
|---|---|---|
| **Live, oldest check first** | Every record that is `inEffect` or `underChallenge`, sorted by when it is due for another check (90 days after `lastVerified`) | Live claims go stale; the site shows a date on each |
| **Hidden** | Records the site never shows: `confidence: "low"` or `status: "unverified"` | The research queue |
| **Flagged, nothing shown** | Books marked `isBanned` with no record the site can show | Their pages fall back to a generic list |

Each book title opens that book in Studio (`useNavigateToStudioDocument`).

**Research links** (every row): the record's own source, two Google News searches for the book and the place
(the past year, where nothing is itself a finding, and all dates, which can surface a later ruling the record
misses), and the record's research notes, opened under the row. The search uses the core place name ("Pickens
County", not "Pickens County School District"), since news rarely uses an institution's full name.

**Mark verified** (live tab): after re-checking a record's source, two clicks set its `lastVerified` to today.
The edit and a publish go out as one transaction (`useApplyDocumentActions` with `editDocument` +
`publishDocument`), so the site shows the new date at once. A book that already has unpublished draft changes
gets the date in its draft only, because publishing it would push those unrelated edits live too; a second query
with the `raw` perspective finds those books. A ban that's no longer in effect is a status change, made in Studio.

## How it's built

- **One GROQ query** (`src/queries.ts`, via `useQuery`), not handles and projections: ban records are
  array items inside books, and the live list ranks them across every book. The query is live, so a
  record verified in Studio leaves the overdue list without a reload.
- **Types from the site's schema** with TypeGen (`typegen.resources` in `sanity.cli.ts`), so the query
  result is typed with no hand-written interfaces.
- **The same rules as the site.** `src/shared/banRecords.ts` is a copy of the site's
  `lib/data/banRecords.ts`: status ranking, wording (`banScopeVerb`, `banWhen`) and the hidden-row rule
  (`isHiddenBanRecord`). The dashboard can't call a row hidden that the site shows, or the reverse.
- **Sanity UI** for the look, so it feels like the Studio it sits beside.

### Why a copy and not an import

This app was first built inside the site's repo. The Sanity CLI finds its project by walking up the
tree for a Studio's `sanity.config.ts` *before* it looks for an app's `sanity.cli.ts`, so from a
subfolder every command (`dev`, `typegen`, `deploy`) resolved to the site's Studio. `npm run sync`
copies the two shared files instead:

```bash
npm run sync      # src/shared/banRecords.ts and schema.production.json from ../punk-and-pedagogy-web
npm run typegen   # regenerate src/sanity.types.production.ts
```

`SITE_REPO=/path/to/site npm run sync` if the site isn't checked out next to this repo. Run
`npm run typegen` in the site first if its schema changed (that writes its `schema.json`).

## Commands

```bash
npm install
npm run dev        # localhost:3333, opened through the Sanity Dashboard link it prints
npm run typecheck
npm run lint
npm run build
npm run deploy     # deployment.appId is set in sanity.cli.ts, so this updates the deployed app
```

Deployed: [Ban Records in the Sanity Dashboard](https://www.sanity.io/@ox0nwnm1l/application/oeluibkunf44t9myaj6l86fy)
(organization members only).

The dev server only renders inside the Dashboard, and that needs a signed-in Sanity account with
access to the organization.
