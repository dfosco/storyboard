/**
 * TextInput component stories.
 * Showcases Primer TextInput variants used in Storyboard prototypes.
 */
import { TextInput as PrimerTextInput, FormControl } from '@primer/react'

export function Default() {
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 320 }}>
      <FormControl>
        <FormControl.Label>Username</FormControl.Label>
        <PrimerTextInput placeholder="Enter username" block />
      </FormControl>
    </div>
  )
}

export function WithValidation() {
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 320 }}>
      <FormControl>
        <FormControl.Label>Email</FormControl.Label>
        <PrimerTextInput placeholder="you@example.com" type="email" block />
        <FormControl.Caption>We&apos;ll never share your email.</FormControl.Caption>
      </FormControl>
      <FormControl>
        <FormControl.Label>Password</FormControl.Label>
        <PrimerTextInput placeholder="Min 8 characters" type="password" block />
        <FormControl.Validation variant="error">Password is too short</FormControl.Validation>
      </FormControl>
    </div>
  )
}

export function Sizes() {
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 320 }}>
      <PrimerTextInput size="small" placeholder="Small" block />
      <PrimerTextInput size="medium" placeholder="Medium (default)" block />
      <PrimerTextInput size="large" placeholder="Large" block />
    </div>
  )
}
