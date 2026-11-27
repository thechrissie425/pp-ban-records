import {defineQuery} from 'groq'

/**
 * Every book flagged as banned or carrying any ban record, with ALL its rows: the hidden
 * ones too (low confidence, unverified), because those are the research queue. The site's
 * own query filters them out (`banRecordsField` in lib/sanity/queries.ts); here the same
 * rule is applied in code, from lib/data/banRecords.ts, so the two can't disagree.
 *
 * One GROQ query rather than handles + projections: the dashboard ranks rows across all
 * books (oldest check first), and ban records are array items inside books, not documents.
 */
export const BAN_DASHBOARD_QUERY = defineQuery(`*[_type == "book" && (isBanned == true || count(banRecords) > 0)]
  | order(title asc) {
    _id,
    _type,
    title,
    author,
    isBanned,
    "records": banRecords[] {
      _key,
      status,
      scope,
      confidence,
      year,
      date,
      lastVerified,
      sourceUrl,
      notes,
      "place": jurisdiction->label
    }
  }`)

/**
 * Books with unpublished draft changes (read with perspective "raw"). The "Mark verified" button
 * publishes the book after setting the date, which would also publish any other pending draft
 * changes, so for these books it saves into the draft only and leaves publishing to Studio.
 */
export const DRAFTED_BOOKS_QUERY = defineQuery(`*[_type == "book" && _id in path("drafts.**")]._id`)
