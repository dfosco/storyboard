import LoomCommentBox from './LoomCommentBox.jsx'

export function Default() {
  return (
    <LoomCommentBox
      recipientName="Aaron"
      avatarUrl="https://avatars.githubusercontent.com/u/3?v=4"
      timestamp="0:00"
      suggestions={[
        'Great insights on filtering the results,...',
        'Nice job on addressing the check failures,...',
      ]}
    />
  )
}

export function CustomSuggestions() {
  return (
    <LoomCommentBox
      recipientName="Sarah"
      avatarUrl="https://avatars.githubusercontent.com/u/7?v=4"
      timestamp="1:23"
      suggestions={[
        'Love the new design direction,...',
        'The accessibility improvements look solid,...',
        'Could we revisit the color contrast,...',
      ]}
    />
  )
}
