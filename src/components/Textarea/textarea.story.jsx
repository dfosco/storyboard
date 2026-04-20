/**
 * Textarea component stories.
 * Showcases Primer Textarea variants used in Storyboard prototypes.
 */
import { Textarea as PrimerTextarea, FormControl } from '@primer/react'

export function Default() {
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 320 }}>
      <FormControl>
        <FormControl.Label>Description</FormControl.Label>
        <PrimerTextarea placeholder="Enter a description…" block />
      </FormControl>
    </div>
  )
}

export function WithValidation() {
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 320 }}>
      <FormControl>
        <FormControl.Label>Bio</FormControl.Label>
        <PrimerTextarea placeholder="Tell us about yourself" rows={4} block />
        <FormControl.Caption>Markdown is supported.</FormControl.Caption>
      </FormControl>
    </div>
  )
}

export function Disabled() {
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 320 }}>
      <FormControl disabled>
        <FormControl.Label>Locked field</FormControl.Label>
        <PrimerTextarea value="This field is read-only" block />
      </FormControl>
    </div>
  )
}
