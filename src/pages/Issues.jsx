import { Link } from 'react-router-dom'
import { Avatar, Label, Stack, StateLabel, Text } from '@primer/react'
import { useSceneData, useRecords } from '@dfosco/storyboard-react'
import Application from '../templates/Application/Application.jsx'

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
  CheckIcon,
} from '@primer/octicons-react'

const topnav = [
  { icon: CodeIcon, label: 'Code', url: '/' },
  { icon: IssueOpenedIcon, label: 'Issues', counter: 10, url: '/Issues', current: true },
  { icon: GitPullRequestIcon, label: 'Pull Requests', counter: 3 },
  { icon: CommentDiscussionIcon, label: 'Discussions' },
  { icon: PlayIcon, label: 'Actions' },
  { icon: ProjectIcon, label: 'Projects', counter: 7 },
  { icon: ShieldIcon, label: 'Security', counter: 12 },
  { icon: GraphIcon, label: 'Insights' },
]

const sidenav = [
  { icon: IssueOpenedIcon, label: 'Open issues', url: '', current: true },
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

function IssueRow({ issue }) {
  const Icon = statusIcon[issue.status] || IssueOpenedIcon
  const isDone = issue.status === 'done' || issue.status === 'cancelled'

  return (
    <Link
      to={`/Issues/${issue.id}`}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--base-size-12)',
        padding: 'var(--base-size-8) var(--base-size-16)',
        textDecoration: 'none',
        color: 'inherit',
        borderBottom: '1px solid var(--borderColor-default)',
      }}
    >
      <span style={{ paddingTop: 2, color: isDone ? 'var(--fgColor-done)' : 'var(--fgColor-success)' }}>
        <Icon size={16} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text as="span" style={{ fontWeight: 600, fontSize: 'var(--text-body-size-medium)' }}>
          {issue.title}
        </Text>
        <div style={{ display: 'flex', gap: 'var(--base-size-4)', marginTop: 'var(--base-size-4)', flexWrap: 'wrap', alignItems: 'center' }}>
          <Text as="span" style={{ fontSize: 'var(--text-caption-size)', color: 'var(--fgColor-muted)' }}>
            {issue.identifier}
          </Text>
          {(issue.labels || []).map((label) => (
            <Label key={label} size="small">{label}</Label>
          ))}
        </div>
      </div>
      {issue.assigneeAvatar && (
        <Avatar src={issue.assigneeAvatar} size={20} alt={issue.assignee} />
      )}
    </Link>
  )
}

function Issues() {
  const user = useSceneData('user')
  const issues = useRecords('issues')

  const openIssues = issues.filter((i) => i.status !== 'done' && i.status !== 'cancelled')
  const closedIssues = issues.filter((i) => i.status === 'done' || i.status === 'cancelled')

  return (
    <Application title="Primer" subtitle="React" topnav={topnav} sidenav={sidenav}>
      <div style={{ maxWidth: 960 }}>
        <Stack direction="horizontal" gap="condensed" align="center" style={{ marginBottom: 'var(--base-size-16)' }}>
          <StateLabel status="issueOpened">{openIssues.length} Open</StateLabel>
          <span style={{ fontSize: 'var(--text-caption-size)', color: 'var(--fgColor-muted)', display: 'flex', alignItems: 'center', gap: 'var(--base-size-4)' }}>
            <CheckIcon size={16} /> {closedIssues.length} Closed
          </span>
        </Stack>

        <div style={{ border: '1px solid var(--borderColor-default)', borderRadius: 'var(--borderRadius-medium)', overflow: 'hidden' }}>
          {openIssues.map((issue) => (
            <IssueRow key={issue.id} issue={issue} />
          ))}
          {closedIssues.map((issue) => (
            <IssueRow key={issue.id} issue={issue} />
          ))}
          {issues.length === 0 && (
            <p style={{ padding: 'var(--base-size-32)', textAlign: 'center', color: 'var(--fgColor-muted)' }}>
              No issues found.
            </p>
          )}
        </div>
      </div>
    </Application>
  )
}

export default Issues
