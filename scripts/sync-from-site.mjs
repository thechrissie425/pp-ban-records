#!/usr/bin/env node
/**
 * Copy the two things this app shares with the Punk & Pedagogy site, from a checkout of
 * punk-and-pedagogy-web next to this one (or SITE_REPO=/path):
 *
 *   lib/data/banRecords.ts  → src/shared/banRecords.ts   the status ranking, wording and the
 *                                                         "hidden row" rule, so the dashboard and
 *                                                         the site never disagree
 *   schema.json             → schema.production.json      the Studio schema extract, for TypeGen
 *                                                         (`npm run typegen` in the site writes it)
 *
 * Both copies are committed so this repo builds on its own. Run `npm run sync` after either
 * changes in the site, then `npm run typegen`.
 *
 * Why copies and not an import: the Sanity CLI finds a project by walking up for a Studio's
 * sanity.config.ts before an app's sanity.cli.ts, so an app inside the site's repo resolves
 * to the site's Studio (dev, typegen and deploy would all act on it).
 */
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const appRoot = path.resolve(here, '..')
const site = path.resolve(process.env.SITE_REPO ?? path.join(appRoot, '..', 'punk-and-pedagogy-web'))

const copies = [
  ['lib/data/banRecords.ts', 'src/shared/banRecords.ts'],
  ['schema.json', 'schema.production.json'],
]

for (const [from, to] of copies) {
  const src = path.join(site, from)
  if (!fs.existsSync(src)) {
    console.error(`Missing ${src}. Set SITE_REPO, or run \`npm run typegen\` in the site for schema.json.`)
    process.exit(1)
  }
  let body = fs.readFileSync(src, 'utf8')
  if (to.endsWith('.ts')) {
    body = `// Copied from punk-and-pedagogy-web/${from} by \`npm run sync\`. Edit it there, not here.\n\n${body}`
  }
  fs.writeFileSync(path.join(appRoot, to), body)
  console.log(`${from} → ${to}`)
}
