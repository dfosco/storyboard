/**
 * StoryboardForm component stories.
 * Showcases the form wrapper that buffers input to URL hash on submit.
 */
import { FormControl, Button } from '@primer/react'
import StoryboardForm from './StoryboardForm.jsx'
import TextInput from '../TextInput/TextInput.jsx'
import Textarea from '../Textarea/Textarea.jsx'

export function Default() {
  return (
    <div style={{ padding: '1.5rem', maxWidth: 480 }}>
      <StoryboardForm data="demo">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <FormControl>
            <FormControl.Label>Name</FormControl.Label>
            <TextInput name="name" placeholder="Your name" block />
          </FormControl>
          <FormControl>
            <FormControl.Label>Message</FormControl.Label>
            <Textarea name="message" placeholder="Your message" block />
          </FormControl>
          <Button type="submit">Submit</Button>
        </div>
      </StoryboardForm>
    </div>
  )
}
