import {defineCliConfig} from 'sanity/cli'

import {resources} from './src/resources'

export default defineCliConfig({
  app: {
    organizationId: 'ox0nwnm1l',
    entry: './src/App.tsx',
    title: 'Ban Records',
  },
  // From the first deploy (2026-11-25); later deploys are `npm run deploy -- --yes`.
  deployment: {appId: 'oeluibkunf44t9myaj6l86fy'},
  typegen: {
    resources: [
      {
        ...resources.production,
        // The site's Studio schema, copied in by `npm run sync`.
        schema: './schema.production.json',
        generates: './src/sanity.types.production.ts',
      },
    ],
  },
})
