import {SanityApp} from '@sanity/sdk-react'
import {Flex, Spinner} from '@sanity/ui'
import {Suspense} from 'react'

import {Dashboard} from './Dashboard'
import {resources} from './resources'
import {SanityUI} from './SanityUI'

function Loading() {
  return (
    <Flex justify="center" align="center" height="fill" padding={6}>
      <Spinner />
    </Flex>
  )
}

export default function App() {
  return (
    <SanityUI>
      <SanityApp config={[resources.production]} fallback={<Loading />}>
        <Suspense fallback={<Loading />}>
          <Dashboard />
        </Suspense>
      </SanityApp>
    </SanityUI>
  )
}
