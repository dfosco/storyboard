import { Link } from 'react-router-dom'
import { Avatar, Label, Stack, StateLabel, Text } from '@primer/react'
import {
  IssueOpenedIcon,
  IssueClosedIcon,
  SkipIcon,
  CodeIcon,
  GitPullRequestIcon,
  CommentDiscussionIcon,
  ShieldIcon,
  PlayIcon,
  ProjectIcon,
  GraphIcon,
  SmileyIcon,
  PersonIcon,
  MentionIcon,
} from '@primer/octicons-react'
import { useSceneData, useRecord } from '@dfosco/storyboard-react'
import Application from '../../templates/Application/Application.jsx'

const topnav = [
  { icon: CodeIcon, label: 'Code', url: '/' },
  { icon: IssueOpenedIcon, label: 'Issues', counter: 10, url: '/primer-issues', current: true },
  { icon: GitPullRequestIcon, label: 'Pull Requests', counter: 3 },
  { icon: CommentDiscussionIcon, label: 'Discussions' },
  { icon: PlayIcon, label: 'Actions' },
  { icon: ProjectIcon, label: 'Projects', counter: 7 },
  { icon: ShieldIcon, label: 'Security', counter: 12 },
  { icon: GraphIcon, label: 'Insights' },
]

const sidenav = [
  { icon: IssueOpenedIcon, label: 'Open issues', url: '/primer-issues' },
  { icon: SmileyIcon, label: 'Your issues', url: '' },
  { icon: PersonIcon, label: 'Assigned to you', url: '' },
  { icon: MentionIcon, label: 'Mentioning you', url: '' },
]

const statusIcon = {
  todo: IssueOpenedIcon,
  in_progress: IssueOpenedIcon,
  done: IssueClosedIcon,
  cancelled: SkipIcon,
}

const statusLabels = {
  todo: 'Open',
  in_progress: 'In Progress',
  done: 'Closed',
  cancelled: 'Cancelled',
}

const priorityLabels = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export default function IssueDetail() {
  const issue = useRecord('issues', 'id')
  const user = useSceneData('user')

  if (!issue) {
    return (
      <Application title="Primer" subtitle="React" topnav={topnav} sidenav={sidenav}>
        <div style={{ textAlign: 'center', padding: 'var(--base-size-64) var(--base-size-16)' }}>
          <h2>Issue not found</h2>
          <p style={{ color: 'var(--fgColor-muted)', marginTop: 'var(--base-size-8)' }}>
            The issue you're looking for doesn't exist.
          </p>
          <Link to="/primer-issues" style={{ color: 'var(--fgColor-accent)' }}>← Back to all issues</Link>
        </div>
      </Application>
    )
  }

  const Icon = statusIcon[issue.status] || IssueOpenedIcon
  const isDone = issue.status === 'done' || issue.status === 'cancelled'

  return (
    <Application title="Primer" subtitle="React" topnav={topnav} sidenav={sidenav}>
      <div style={{ display: 'flex', gap: 'var(--base-size-32)', alignItems: 'flex-start', maxWidth: 960 }}>

        {/* Issue body */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--base-size-8)', marginBottom: 'var(--base-size-16)', fontSize: 'var(--text-caption-size)', color: 'var(--fgColor-muted)' }}>
            <Link to="/primer-issues" style={{ color: 'var(--fgColor-muted)', textDecoration: 'none' }}>Issues</Link>
            <span>›</span>
            <span>{issue.identifier}</span>
          </div>

          {/* Title + status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--base-size-8)', marginBottom: 'var(--base-size-8)' }}>
            <span style={{ color: isDone ? 'var(--fgColor-done)' : 'var(--fgColor-success)' }}>
              <Icon size={24} />
            </span>
            <h1 style={{ fontSize: 'var(--text-title-size-medium)', fontWeight: 600, margin: 0 }}>
              {issue.title}
            </h1>
          </div>

          <div style={{ marginBottom: 'var(--base-size-16)' }}>
            <StateLabel status={isDone ? 'issueClosed' : 'issueOpened'}>
              {statusLabels[issue.status] || issue.status}
            </StateLabel>
          </div>

          {/* Description */}
          {issue.description && (
            <p style={{ color: 'var(--fgColor-muted)', marginBottom: 'var(--base-size-24)', lineHeight: 1.5 }}>
              {issue.description}
            </p>
          )}

          {/* Acceptance Criteria */}
          {issue.acceptanceCriteria?.length > 0 && (
            <div style={{ marginBottom: 'var(--base-size-24)' }}>
              <h3 style={{ fontSize: 'var(--text-body-size-medium)', fontWeight: 600, marginBottom: 'var(--base-size-8)' }}>
                Acceptance Criteria
              </h3>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--fgColor-default)' }}>
                {issue.acceptanceCriteria.map((item, i) => (
                  <li key={i} style={{ marginBottom: 'var(--base-size-4)', lineHeight: 1.5 }}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Technical Notes */}
          {issue.technicalNotes?.length > 0 && (
            <div style={{ marginBottom: 'var(--base-size-24)' }}>
              <h3 style={{ fontSize: 'var(--text-body-size-medium)', fontWeight: 600, marginBottom: 'var(--base-size-8)' }}>
                Technical Notes
              </h3>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--fgColor-default)' }}>
                {issue.technicalNotes.map((item, i) => (
                  <li key={i} style={{ marginBottom: 'var(--base-size-4)', lineHeight: 1.5 }}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Activity */}
          <div style={{ borderTop: '1px solid var(--borderColor-default)', paddingTop: 'var(--base-size-16)', marginTop: 'var(--base-size-16)' }}>
            <h3 style={{ fontSize: 'var(--text-body-size-medium)', fontWeight: 600, marginBottom: 'var(--base-size-12)' }}>
              Activity
            </h3>
            <Stack gap="normal">
              {(issue.activity || []).map((entry, i) => (
                <div key={i} style={{ display: 'flex', gap: 'var(--base-size-12)', alignItems: 'flex-start' }}>
                  <Avatar src={entry.avatar} size={32} alt={entry.user} />
                  <div>
                    <Text as="span" style={{ fontWeight: 600 }}>{entry.user}</Text>
                    <Text as="span" style={{ color: 'var(--fgColor-muted)' }}>
                      {entry.type === 'created' && ' created the issue'}
                      {entry.type === 'comment' && ':'}
                    </Text>
                    {entry.body && (
                      <p style={{ color: 'var(--fgColor-muted)', margin: 'var(--base-size-4) 0 0', lineHeight: 1.5 }}>
                        {entry.body}
                      </p>
                    )}
                    <Text as="span" style={{ fontSize: 'var(--text-caption-size)', color: 'var(--fgColor-muted)' }}>
                      {entry.time}
                    </Text>
                  </div>
                </div>
              ))}
            </Stack>
          </div>
        </div>

        {/* Properties sidebar */}
        <div style={{
          width: 240,
          flexShrink: 0,
          border: '1px solid var(--borderColor-default)',
          borderRadius: 'var(--borderRadius-medium)',
          padding: 'var(--base-size-16)',
        }}>
          <Text as="p" style={{ fontSize: 'var(--text-caption-size)', color: 'var(--fgColor-muted)', fontWeight: 600, marginBottom: 'var(--base-size-12)' }}>
            Properties
          </Text>
          <div style={{ borderTop: '1px solid var(--borderColor-default)', paddingTop: 'var(--base-size-12)' }}>
            <Stack gap="normal">
              <div>
                <Text as="p" style={{ fontSize: 'var(--text-caption-size)', color: 'var(--fgColor-muted)' }}>Status</Text>
                <Text as="p">{statusLabels[issue.status] || issue.status}</Text>
              </div>
              <div>
                <Text as="p" style={{ fontSize: 'var(--text-caption-size)', color: 'var(--fgColor-muted)' }}>Priority</Text>
                <Text as="p" style={{ textTransform: 'capitalize' }}>{priorityLabels[issue.priority] || issue.priority}</Text>
              </div>
              <div>
                <Text as="p" style={{ fontSize: 'var(--text-caption-size)', color: 'var(--fgColor-muted)' }}>Assignee</Text>
                {issue.assignee ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--base-size-8)' }}>
                    <Avatar src={issue.assigneeAvatar} size={20} alt={issue.assignee} />
                    <Text as="span">{issue.assignee}</Text>
                  </div>
                ) : (
                  <Text as="p" style={{ color: 'var(--fgColor-muted)' }}>Unassigned</Text>
                )}
              </div>
              <div>
                <Text as="p" style={{ fontSize: 'var(--text-caption-size)', color: 'var(--fgColor-muted)' }}>Labels</Text>
                <div style={{ display: 'flex', gap: 'var(--base-size-4)', flexWrap: 'wrap' }}>
                  {(issue.labels || []).map((label) => (
                    <Label key={label} size="small">{label}</Label>
                  ))}
                </div>
              </div>
              {issue.project && (
                <div>
                  <Text as="p" style={{ fontSize: 'var(--text-caption-size)', color: 'var(--fgColor-muted)' }}>Project</Text>
                  <Text as="p">{issue.project}</Text>
                </div>
              )}
              {issue.estimate && (
                <div>
                  <Text as="p" style={{ fontSize: 'var(--text-caption-size)', color: 'var(--fgColor-muted)' }}>Estimate</Text>
                  <Text as="p">{issue.estimate} points</Text>
                </div>
              )}
            </Stack>
          </div>
        </div>

      </div>
    </Application>
  )
}
