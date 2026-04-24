/**
 * TextInput component stories.
 * Showcases the Storyboard TextInput wrapper that integrates with StoryboardForm.
 */
import { FormControl } from '@primer/react'
import TextInput from './TextInput.jsx'

export function Default() {
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 320 }}>
      <FormControl>
        <FormControl.Label>Username</FormControl.Label>
        <TextInput placeholder="Enter username" block />
      </FormControl>
    </div>
  )
}

export function WithValidation() {
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 320 }}>
      <FormControl>
        <FormControl.Label>Email</FormControl.Label>
        <TextInput placeholder="you@example.com" type="email" block />
        <FormControl.Caption>We&apos;ll never share your email.</FormControl.Caption>
      </FormControl>
      <FormControl>
        <FormControl.Label>Password</FormControl.Label>
        <TextInput placeholder="Min 8 characters" type="password" block />
        <FormControl.Validation variant="error">Password is too short</FormControl.Validation>
      </FormControl>
    </div>
  )
}

export function Sizes() {
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 320 }}>
      <TextInput size="small" placeholder="Small" block />
      <TextInput size="medium" placeholder="Medium (default)" block />
      <TextInput size="large" placeholder="Large" block />
    </div>
  )
}
