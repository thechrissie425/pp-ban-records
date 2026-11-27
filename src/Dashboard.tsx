import {useQuery} from '@sanity/sdk-react'
import {Badge, Box, Card, Container, Flex, Grid, Heading, Stack, Tab, TabList, TabPanel, Text} from '@sanity/ui'
import {useMemo, useState, type ReactNode} from 'react'

import {buildDashboard, REVERIFY_AFTER_DAYS, type HiddenRow, type LiveRow} from './model'
import {OpenInStudio} from './OpenInStudio'
import {BAN_DASHBOARD_QUERY, DRAFTED_BOOKS_QUERY} from './queries'
import {resources} from './resources'
import {VerifyButton} from './VerifyButton'

type TabId = 'live' | 'hidden' | 'flagged'

export function Dashboard() {
  // One query, typed by TypeGen from the site's schema. Live: it re-renders when a book changes.
  const {data} = useQuery({...resources.production, query: BAN_DASHBOARD_QUERY})
  const dash = useMemo(() => buildDashboard(data), [data])
  // Raw perspective: which books have unpublished drafts (see VerifyButton for why that matters).
  const {data: draftIds} = useQuery({...resources.production, perspective: 'raw', query: DRAFTED_BOOKS_QUERY})
  const drafted = useMemo(() => new Set(draftIds.map((id) => id.replace(/^drafts\./, ''))), [draftIds])
  const [tab, setTab] = useState<TabId>('live')
  const c = dash.counts

  return (
    <Container width={4} padding={4} paddingY={5}>
      <Stack gap={5}>
        <Stack gap={3}>
          <Heading as="h1" size={3}>
            Ban records
          </Heading>
          <Text muted size={1}>
            {c.rows} records on {c.books} books. Live records ({'"'}in effect{'"'}, {'"'}under challenge{'"'}) are due
            for another check {REVERIFY_AFTER_DAYS} days after they were last verified.
          </Text>
        </Stack>

        <Grid gridTemplateColumns={[2, 2, 4]} gap={3}>
          <Stat label="Live records" value={c.live} />
          <Stat label="Due for a re-check" value={c.overdue} tone={c.overdue ? 'caution' : 'positive'} />
          <Stat label="Hidden, waiting" value={c.hidden} tone={c.hidden ? 'caution' : 'positive'} />
          <Stat label="Flagged, nothing shown" value={c.flaggedEmpty} tone={c.flaggedEmpty ? 'critical' : 'positive'} />
        </Grid>

        <TabList gap={2}>
          <Tab id="live-tab" aria-controls="live-panel" label={`Live, oldest check first (${c.live})`} selected={tab === 'live'} onClick={() => setTab('live')} />
          <Tab id="hidden-tab" aria-controls="hidden-panel" label={`Hidden (${c.hidden})`} selected={tab === 'hidden'} onClick={() => setTab('hidden')} />
          <Tab id="flagged-tab" aria-controls="flagged-panel" label={`Flagged, nothing shown (${c.flaggedEmpty})`} selected={tab === 'flagged'} onClick={() => setTab('flagged')} />
        </TabList>

        <TabPanel id="live-panel" aria-labelledby="live-tab" hidden={tab !== 'live'}>
          <Table
            empty="No live records."
            head={['Book', 'Where', 'What', 'Last verified', 'Next check', 'Re-checked the source?']}
            rows={dash.live.map((r) => ({key: r.key, cells: liveCells(r, drafted.has(r.book.id))}))}
          />
        </TabPanel>

        <TabPanel id="hidden-panel" aria-labelledby="hidden-tab" hidden={tab !== 'hidden'}>
          <Stack gap={3}>
            <Text muted size={1}>
              The site never shows these rows. Check each one, then raise its confidence and set a real status, or delete
              it.
            </Text>
            <Table
              empty="Nothing waiting."
              head={['Book', 'Where', 'Why hidden', 'Notes']}
              rows={dash.hidden.map((r) => ({key: r.key, cells: hiddenCells(r)}))}
            />
          </Stack>
        </TabPanel>

        <TabPanel id="flagged-panel" aria-labelledby="flagged-tab" hidden={tab !== 'flagged'}>
          <Stack gap={3}>
            <Text muted size={1}>
              Marked as banned, but with no record the site can show, so the book page falls back to the old generic
              list. Add a checked record, or unflag the book.
            </Text>
            <Table
              empty="Every flagged book has a visible record."
              head={['Book', 'Author', 'Hidden rows']}
              rows={dash.flaggedEmpty.map((b) => ({
                key: b.id,
                cells: [<OpenInStudio key="b" id={b.id} title={b.title} />, <Cell key="a">{b.author}</Cell>, <Cell key="h">{b.hiddenCount || '—'}</Cell>],
              }))}
            />
          </Stack>
        </TabPanel>
      </Stack>
    </Container>
  )
}

function liveCells(r: LiveRow, hasDraft: boolean): ReactNode[] {
  return [
    <OpenInStudio key="b" id={r.book.id} title={r.book.title} />,
    <Cell key="p">{r.place}</Cell>,
    <Cell key="w">
      {[r.verb, r.when].filter(Boolean).join(', ')} <Badge tone={r.status === 'In effect' ? 'critical' : 'caution'}>{r.status}</Badge>
    </Cell>,
    <Cell key="v">{r.lastVerified ?? 'Never'}</Cell>,
    <Cell key="d">
      <Due days={r.dueInDays} />
    </Cell>,
    <Box key="v" paddingY={1}>
      <VerifyButton bookId={r.book.id} bookTitle={r.book.title} recordKey={r.recordKey} place={r.place} hasDraft={hasDraft} />
    </Box>,
  ]
}

function hiddenCells(r: HiddenRow): ReactNode[] {
  return [
    <OpenInStudio key="b" id={r.book.id} title={r.book.title} />,
    <Cell key="p">
      {r.place}
      {r.when ? `, ${r.when}` : ''}
    </Cell>,
    <Cell key="y">{r.why}</Cell>,
    <Cell key="n" muted>
      {r.notes ?? ''}
      {r.sourceUrl ? (
        <>
          {' '}
          <a href={r.sourceUrl} target="_blank" rel="noreferrer">
            Source
          </a>
        </>
      ) : null}
    </Cell>,
  ]
}

function Due({days}: {days: number | null}) {
  if (days === null) return <Badge tone="critical">Never verified</Badge>
  if (days < 0) return <Badge tone="critical">{-days} days overdue</Badge>
  if (days <= 14) return <Badge tone="caution">In {days} days</Badge>
  return <Text size={1} muted>In {days} days</Text>
}

function Stat({label, value, tone = 'default'}: {label: string; value: number; tone?: 'default' | 'positive' | 'caution' | 'critical'}) {
  return (
    <Card padding={4} radius={3} tone={tone} border>
      <Stack gap={3}>
        <Text size={1} muted>
          {label}
        </Text>
        <Heading as="p" size={4}>
          {value}
        </Heading>
      </Stack>
    </Card>
  )
}

function Cell({children, muted}: {children: ReactNode; muted?: boolean}) {
  return (
    <Box paddingY={2}>
      <Text size={1} muted={muted}>
        {children}
      </Text>
    </Box>
  )
}

/** A plain grid table: Sanity UI has no table primitive. */
function Table({head, rows, empty}: {head: string[]; rows: {key: string; cells: ReactNode[]}[]; empty: string}) {
  const columns = `minmax(12rem, 2fr) repeat(${head.length - 1}, minmax(8rem, 1fr))`
  if (!rows.length) {
    return (
      <Card padding={4} radius={3} border>
        <Text muted>{empty}</Text>
      </Card>
    )
  }
  return (
    <Card radius={3} border overflow="auto">
      <Box style={{display: 'grid', gridTemplateColumns: columns, columnGap: '1rem', padding: '0.5rem 1rem'}}>
        {head.map((h) => (
          <Box key={h} paddingY={2}>
            <Text size={1} weight="semibold">
              {h}
            </Text>
          </Box>
        ))}
        {rows.map((r) => (
          <Flex key={r.key} style={{display: 'contents'}}>
            {r.cells}
          </Flex>
        ))}
      </Box>
    </Card>
  )
}
