import {editDocument, publishDocument, useApplyDocumentActions} from '@sanity/sdk-react'
import {Button, Flex, Text} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {useState} from 'react'

import {resources} from './resources'

type Props = {
  bookId: string
  bookTitle: string
  recordKey: string
  place: string
  /** The book already has unpublished draft changes: save into the draft, don't publish. */
  hasDraft: boolean
}

/** Today's date in the editor's own time zone, as Sanity stores a `date` field. */
function today(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * "Mark verified": sets one ban record's `lastVerified` to today. Two clicks on purpose, because the
 * date is a public claim that someone re-checked the source: the second click says the ban is
 * still in effect.
 *
 * The edit and the publish go out as ONE transaction (useApplyDocumentActions batches them), so
 * the site shows the new date at once. A book that already has a pending draft is the exception:
 * publishing it would also push those unrelated changes live, so the date is saved into the draft
 * and the editor publishes from Studio. A ban that is no longer in effect is a status change, not a
 * date, so that's done in Studio (the title opens the book there).
 */
export function VerifyButton({bookId, bookTitle, recordKey, place, hasDraft}: Props) {
  const apply = useApplyDocumentActions()
  const toast = useToast()
  const [step, setStep] = useState<'idle' | 'confirm' | 'saving'>('idle')

  async function verify() {
    setStep('saving')
    const handle = {...resources.production, documentId: bookId, documentType: 'book' as const}
    const edit = editDocument(handle, {set: {[`banRecords[_key=="${recordKey}"].lastVerified`]: today()}})
    try {
      await apply(hasDraft ? edit : [edit, publishDocument(handle)])
      toast.push(
        hasDraft
          ? {status: 'warning', title: `${bookTitle}: saved to draft`, description: 'This book has other unpublished changes. Publish it in Studio to update the site.', duration: 8000}
          : {status: 'success', title: `${bookTitle}: verified today`, description: `${place} is published with today's date.`},
      )
      setStep('idle')
    } catch (err) {
      toast.push({status: 'error', title: 'Could not save', description: (err as Error).message, duration: 10000})
      setStep('confirm')
    }
  }

  if (step === 'idle') {
    return <Button mode="ghost" fontSize={1} padding={2} text="Mark verified" onClick={() => setStep('confirm')} />
  }
  return (
    <Flex gap={2} align="center" wrap="wrap">
      <Text size={1} muted>
        Still in effect?
      </Text>
      <Button
        tone="positive"
        fontSize={1}
        padding={2}
        text={step === 'saving' ? 'Saving…' : hasDraft ? 'Yes, save to draft' : 'Yes, publish'}
        disabled={step === 'saving'}
        onClick={verify}
      />
      <Button mode="bleed" fontSize={1} padding={2} text="Cancel" disabled={step === 'saving'} onClick={() => setStep('idle')} />
    </Flex>
  )
}
