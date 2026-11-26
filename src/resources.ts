import type {DocumentResource} from '@sanity/sdk-react'

/**
 * The one dataset this app reads. Shared by SanityApp's config, every hook call and the
 * TypeGen config in sanity.cli.ts (`as const` keeps the ids literal, which inference needs).
 * Loaded by the CLI in Node too, so no browser globals here.
 */
export const resources = {
  production: {projectId: 'gu6yig93', dataset: 'production'},
} as const satisfies Record<string, DocumentResource>
