/**
 * Textarea component stories.
 * Showcases the Storyboard Textarea wrapper that integrates with StoryboardForm.
 */
import { FormControl } from '@primer/react'
import Textarea from './Textarea.jsx'

export function Default() {
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 320 }}>
      <FormControl>
        <FormControl.Label>Description</FormControl.Label>
        <Textarea placeholder="Enter a description…" block />
      </FormControl>
    </div>
  )
}

export function WithValidation() {
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 320 }}>
      <FormControl>
        <FormControl.Label>Bio</FormControl.Label>
        <Textarea placeholder="Tell us about yourself" rows={4} block />
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
        <Textarea value="This field is read-only" block />
      </FormControl>
    </div>
  )
}
