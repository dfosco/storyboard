import Application from '../templates/Application/Application.jsx'
import { useSceneData } from '@dfosco/storyboard-react'

import {
  IssueOpenedIcon,
  CodeIcon,
  GitPullRequestIcon,
  CommentDiscussionIcon,
  ShieldIcon,
  PlayIcon,
  ProjectIcon,
  GraphIcon,
  SmileyIcon,
  PersonIcon,
  MentionIcon
} from '@primer/octicons-react'

const topnav = [
  { icon: CodeIcon, label: 'Code', url: '/' },
  { icon: IssueOpenedIcon, label: 'Issues', counter: 10, url: '#issues', current: true },
  { icon: GitPullRequestIcon, label: 'Pull Requests', counter: 3 },
  { icon: CommentDiscussionIcon, label: 'Discussions' },
  { icon: PlayIcon, label: 'Actions' },
  { icon: ProjectIcon, label: 'Projects', counter: 7 },
  { icon: ShieldIcon, label: 'Security', counter: 12 },
  { icon: GraphIcon, label: 'Insights' }
];

const sidenav = [
  { icon: IssueOpenedIcon, label: 'Open issues', url: '' },
  { icon: SmileyIcon, label: 'Your issues', url: '' },
  { icon: PersonIcon, label: 'Assigned to you', url: '', current: true },
  { icon: MentionIcon, label: 'Mentioning you', url: '' }
]

function Issues() {
  const user = useSceneData('user')

  return (
    <Application title="Primer" subtitle="React" topnav={topnav} sidenav={sidenav}>
      <h2>Issues</h2>
      <p style={{ color: 'var(--fgColor-muted)', marginTop: 'var(--base-size-8)' }}>
        This is a Primer-styled page with scene data, top navigation, and a sidebar.
        {user?.name && <> Logged in as <strong>{user.name}</strong>.</>}
      </p>
    </Application>
  )
}

export default Issues
