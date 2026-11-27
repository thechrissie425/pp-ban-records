import {useNavigateToStudioDocument} from '@sanity/sdk-react/dashboard'
import {Button} from '@sanity/ui'
import {Suspense} from 'react'

import {resources} from './resources'

/** The site's embedded Studio, the only registered Studio since 2026-11-27. */
const PREFERRED_STUDIO = 'https://www.punkandpedagogy.com/studio'

type Props = {id: string; title: string}

function NavigateButton({id, title}: Props) {
  const {navigateToStudioDocument} = useNavigateToStudioDocument(
    {...resources.production, documentId: id, documentType: 'book'},
    PREFERRED_STUDIO,
  )
  return (
    <Button
      mode="bleed"
      padding={2}
      text={title}
      onClick={navigateToStudioDocument}
      title="Open this book in Studio"
      style={{textAlign: 'left'}}
    />
  )
}

/** A book title that opens the book in Studio. The hook can suspend, so it gets its own boundary. */
export function OpenInStudio(props: Props) {
  return (
    <Suspense fallback={<Button mode="bleed" padding={2} text={props.title} disabled />}>
      <NavigateButton {...props} />
    </Suspense>
  )
}
