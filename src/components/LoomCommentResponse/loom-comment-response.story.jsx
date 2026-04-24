import LoomCommentResponse from './LoomCommentResponse.jsx'

export function Default() {
  return (
    <div style={{ padding: '2rem', background: '#f6f8fa', minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
      <LoomCommentResponse />
    </div>
  )
}

export function CustomRecipient() {
  return (
    <div style={{ padding: '2rem', background: '#f6f8fa', minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
      <LoomCommentResponse
        recipientName="Maria"
        avatarUrl="https://avatars.githubusercontent.com/u/8?v=4"
        timestamp="2:34"
        suggestions={[
          'Love the approach you took on the refactor,...',
          'The demo looks great, one thing I noticed...',
        ]}
      />
    </div>
  )
}
