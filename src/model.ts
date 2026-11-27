import type {BAN_DASHBOARD_QUERY_RESULT} from './sanity.types.production'
import {
  banScopeVerb,
  banStatusTitle,
  banWhen,
  isHiddenBanRecord,
  isLiveStatus,
  sortByUrgency,
} from './shared/banRecords'

/** A live row is due for another check this long after its lastVerified. */
export const REVERIFY_AFTER_DAYS = 90

type Book = BAN_DASHBOARD_QUERY_RESULT[number]
type Row = NonNullable<Book['records']>[number]

export type BookRef = {id: string; title: string; author: string}

export type LiveRow = {
  key: string
  /** The ban record's own `_key` inside the book's `banRecords` array (for edits). */
  recordKey: string
  book: BookRef
  place: string
  status: string
  verb: string | null
  when: string | null
  lastVerified: string | null
  /** Days until the next check is due; negative = overdue; null = never verified. */
  dueInDays: number | null
  sourceUrl: string | null
}

export type HiddenRow = {
  key: string
  book: BookRef
  place: string
  why: string
  status: string
  when: string | null
  notes: string | null
  sourceUrl: string | null
}

export type Dashboard = {
  live: LiveRow[]
  hidden: HiddenRow[]
  /** Flagged as banned, but nothing the site can show: no rows, or only hidden ones. */
  flaggedEmpty: (BookRef & {hiddenCount: number})[]
  counts: {books: number; rows: number; live: number; overdue: number; hidden: number; flaggedEmpty: number}
}

const DAY = 24 * 60 * 60 * 1000

/** Days from `today` to lastVerified + REVERIFY_AFTER_DAYS. Dates are split, not parsed, like banWhen. */
export function dueInDays(lastVerified: string | null, today: Date): number | null {
  if (!lastVerified) return null
  const [y, m, d] = lastVerified.split('-').map(Number)
  const due = Date.UTC(y, m - 1, d) + REVERIFY_AFTER_DAYS * DAY
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((due - now) / DAY)
}

const bookRef = (b: Book): BookRef => ({id: b._id.replace(/^drafts\./, ''), title: b.title, author: b.author})

function hiddenWhy(r: Row): string {
  if (r.status === 'unverified') return 'Unverified: migrated, never checked'
  return 'Low confidence'
}

export function buildDashboard(books: BAN_DASHBOARD_QUERY_RESULT, today = new Date()): Dashboard {
  const live: LiveRow[] = []
  const hidden: HiddenRow[] = []
  const flaggedEmpty: Dashboard['flaggedEmpty'] = []
  let rows = 0

  for (const b of books) {
    const book = bookRef(b)
    const records = b.records ?? []
    rows += records.length
    const visible = records.filter((r) => !isHiddenBanRecord(r))

    for (const r of records) {
      if (isHiddenBanRecord(r)) {
        hidden.push({
          key: `${book.id}:${r._key}`,
          book,
          place: r.place,
          why: hiddenWhy(r),
          status: banStatusTitle(r.status) ?? r.status,
          when: banWhen(r),
          notes: r.notes,
          sourceUrl: r.sourceUrl,
        })
      }
    }

    for (const r of sortByUrgency(visible)) {
      if (!isLiveStatus(r.status)) continue
      live.push({
        key: `${book.id}:${r._key}`,
        recordKey: r._key,
        book,
        place: r.place,
        status: banStatusTitle(r.status) ?? r.status,
        verb: banScopeVerb(r.scope),
        when: banWhen(r),
        lastVerified: r.lastVerified,
        dueInDays: dueInDays(r.lastVerified, today),
        sourceUrl: r.sourceUrl,
      })
    }

    if (b.isBanned && visible.length === 0) {
      flaggedEmpty.push({...book, hiddenCount: records.length})
    }
  }

  // Oldest check first; never-verified rows lead, since they are the most overdue of all.
  live.sort((a, b) => (a.dueInDays ?? -Infinity) - (b.dueInDays ?? -Infinity))
  hidden.sort((a, b) => a.book.title.localeCompare(b.book.title))

  return {
    live,
    hidden,
    flaggedEmpty,
    counts: {
      books: books.length,
      rows,
      live: live.length,
      overdue: live.filter((r) => r.dueInDays === null || r.dueInDays < 0).length,
      hidden: hidden.length,
      flaggedEmpty: flaggedEmpty.length,
    },
  }
}
