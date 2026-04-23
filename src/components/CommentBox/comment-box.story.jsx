import CommentBox from './CommentBox.jsx'

export function Default() {
  return (
    <div style={{ padding: '2rem', maxWidth: 460 }}>
      <CommentBox
        recipientName="Aaron"
        avatarUrl="https://avatars.githubusercontent.com/u/3?v=4"
        timestamp="0:00"
        suggestions={[
          'Great insights on filtering the results,...',
          'Nice job on addressing the check failures,...',
        ]}
      />
    </div>
  )
}

export function NoSuggestions() {
  return (
    <div style={{ padding: '2rem', maxWidth: 460 }}>
      <CommentBox
        recipientName="Sarah"
        avatarUrl="https://avatars.githubusercontent.com/u/7?v=4"
        timestamp="2:34"
        suggestions={[]}
      />
    </div>
  )
}

export function SingleSuggestion() {
  return (
    <div style={{ padding: '2rem', maxWidth: 460 }}>
      <CommentBox
        recipientName="Marcus"
        avatarUrl="https://avatars.githubusercontent.com/u/12?v=4"
        timestamp="1:15"
        suggestions={['Love the new design direction!']}
      />
    </div>
  )
}
