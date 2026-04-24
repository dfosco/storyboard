/**
 * Button pattern components for the canvas.
 * Each named export becomes a draggable widget.
 */
import { Button, ButtonGroup } from '@primer/react'

export function PrimaryButtons() {
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 280 }}>      
      <ButtonGroup>
        <Button variant="primary" size="large">Save changes</Button>
        <Button variant="primary" size="medium">Submit</Button>
        <Button variant="primary" size="small">OK</Button>
      </ButtonGroup>
    </div>
  )
}

export function DangerButtons() {
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 280 }}>
      <ButtonGroup>
        <Button variant="danger" size="large">Delete</Button>
        <Button variant="danger" size="medium">Remove</Button>
        <Button variant="danger" size="small">Clear</Button>
      </ButtonGroup>
    </div>
  )
}
