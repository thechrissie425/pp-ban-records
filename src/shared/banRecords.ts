// Copied from punk-and-pedagogy-web/lib/data/banRecords.ts by `npm run sync`. Edit it there, not here.

// Ban records: one row per removal, restriction or challenge of a book in one place.
// Kept free of Sanity imports so the same lists and rules drive Studio (option lists,
// validation), the book page, /banned-books and the Banned Book blog cover.
//
// The credibility rule behind all of it: say exactly what happened. A book pulled
// from a school library was "removed", not "banned"; one behind a permission slip
// was "restricted"; one that survived a complaint was "challenged". "Banned" is
// reserved for a record that shows an actual ban (e.g. a national publication ban).

// ── Status ────────────────────────────────────────────────────────────────────

/**
 * Ordered most urgent first: that order is the book-level badge and the sort on
 * /banned-books. "Endangered is more interesting than extinct."
 * `unverified` exists only for rows migrated from the old jurisdiction list, whose
 * status nobody has checked; it never produces a badge.
 */
export const BAN_STATUSES = [
  { value: 'inEffect', title: 'In effect', badge: 'In effect now' },
  { value: 'underChallenge', title: 'Under challenge', badge: 'Under challenge' },
  { value: 'reversed', title: 'Reversed', badge: 'Reversed' },
  { value: 'historical', title: 'Historical', badge: 'Historical' },
  { value: 'unverified', title: 'Unverified (migrated, needs checking)', badge: null },
] as const

export type BanStatus = (typeof BAN_STATUSES)[number]['value']

/** The two tiers that go stale, so they need a `lastVerified` date and get the call to action. */
export const LIVE_STATUSES: readonly BanStatus[] = ['inEffect', 'underChallenge']

export const isLiveStatus = (status: string | null | undefined): boolean =>
  LIVE_STATUSES.includes(status as BanStatus)

const statusRank = (status: string | null | undefined): number => {
  const i = BAN_STATUSES.findIndex((s) => s.value === status)
  return i === -1 ? BAN_STATUSES.length : i
}

export const banStatusTitle = (status: string | null | undefined): string | null =>
  BAN_STATUSES.find((s) => s.value === status)?.title ?? null

// ── Scope ─────────────────────────────────────────────────────────────────────

/**
 * What actually happened, literally. `verb` is the one word the UI may use for it
 * (the cover's tape, the record table): never "banned" unless it was a ban.
 */
export const BAN_SCOPES = [
  { value: 'publicationBan', title: 'Banned from publication and distribution', verb: 'Banned' },
  { value: 'statute', title: 'Removed statewide (state law or state board rule)', verb: 'Removed' },
  { value: 'libraryRemoval', title: 'Removed from school libraries', verb: 'Removed' },
  { value: 'publicLibraryRemoval', title: 'Removed from a public library', verb: 'Removed' },
  { value: 'curriculumRemoval', title: 'Removed from classrooms or required reading', verb: 'Removed' },
  { value: 'restricted', title: 'Restricted (by grade, or parental permission required)', verb: 'Restricted' },
  { value: 'challengeOnly', title: 'Challenged (not removed)', verb: 'Challenged' },
] as const

export type BanScope = (typeof BAN_SCOPES)[number]['value']

export const banScopeTitle = (scope: string | null | undefined): string | null =>
  BAN_SCOPES.find((s) => s.value === scope)?.title ?? null

export const banScopeVerb = (scope: string | null | undefined): string | null =>
  BAN_SCOPES.find((s) => s.value === scope)?.verb ?? null

// ── Who started it / how sure we are ─────────────────────────────────────────

export const BAN_INITIATORS = [
  { value: 'government', title: 'Government or statute' },
  { value: 'schoolBoard', title: 'School board' },
  { value: 'administrator', title: 'Administrator or superintendent' },
  { value: 'challenge', title: 'Parent or community challenge' },
] as const

export const banInitiatorTitle = (by: string | null | undefined): string | null =>
  BAN_INITIATORS.find((s) => s.value === by)?.title ?? null

export const BAN_CONFIDENCE = [
  { value: 'high', title: 'High' },
  { value: 'medium', title: 'Medium' },
  { value: 'low', title: 'Low' },
] as const

// ── Derived ───────────────────────────────────────────────────────────────────

/**
 * A row the site never shows: low confidence, or migrated and never checked. Mirrors the
 * filter in `banRecordsField` (lib/sanity/queries.ts); change both together. The ban-records
 * dashboard (apps/ban-records) lists these as the research queue.
 */
export const isHiddenBanRecord = (record: { status: string | null; confidence: string | null }): boolean =>
  record.confidence === 'low' || record.status === 'unverified'

type Rankable = { status: string | null }

/** Most urgent first; ties keep their Studio order. */
export function sortByUrgency<T extends Rankable>(records: readonly T[]): T[] {
  return [...records].sort((a, b) => statusRank(a.status) - statusRank(b.status))
}

/**
 * The book-level badge: the most urgent status across its records. Null when the
 * book has no records, or only unverified ones: then the page falls back to the
 * old generic "banned & challenged" treatment instead of claiming a status.
 */
export function bookBanStatus(records: readonly Rankable[] | null | undefined): BanStatus | null {
  const top = sortByUrgency(records ?? [])[0]
  const entry = BAN_STATUSES.find((s) => s.value === top?.status)
  return entry && entry.badge ? entry.value : null
}

export const banStatusBadge = (status: string | null | undefined): string | null =>
  BAN_STATUSES.find((s) => s.value === status)?.badge ?? null

/** "Sept 17, 2026" from a Sanity date, or the bare year. Split, don't parse (no timezone drift). */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']
export function banWhen(record: { date: string | null; year: number | null }): string | null {
  if (record.date) {
    const [y, m, d] = record.date.split('-').map(Number)
    return `${MONTHS[m - 1]} ${d}, ${y}`
  }
  return record.year ? String(record.year) : null
}
