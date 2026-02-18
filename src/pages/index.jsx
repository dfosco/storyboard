import { Stack, Text, Button } from '@primer/react'
import { CheckIcon } from '@primer/octicons-react'
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
  HomeIcon
} from '@primer/octicons-react'

const topnav = [
  { icon: HomeIcon, label: 'Home', url: '/', current: true },
  { icon: IssueOpenedIcon, label: 'Issues', url: '/Issues' },
  { icon: GitPullRequestIcon, label: 'Pull Requests' },
  { icon: CommentDiscussionIcon, label: 'Discussions' },
  { icon: PlayIcon, label: 'Actions' },
  { icon: ProjectIcon, label: 'Projects' },
  { icon: ShieldIcon, label: 'Security' },
  { icon: GraphIcon, label: 'Insights' },
];

function Home() {
  const user = useSceneData('user')

  return (
    <Application title="Storyboard" subtitle="Example" topnav={topnav}>
      <div style={{ maxWidth: 600, width: '100%' }}>
        <Text as="h1" style={{ marginBottom: 'var(--base-size-16)' }}>
          Welcome{user?.name ? `, ${user.name}` : ''}
        </Text>
        <Text as="p" style={{ marginBottom: 'var(--base-size-16)', color: 'var(--fgColor-muted)' }}>
          This is a Storyboard prototype. Edit pages in <code>src/pages/</code> and
          data files in <code>src/data/</code> to build your prototype.
        </Text>
        <Stack direction="horizontal" gap="condensed">
          <Button as="a" href="/Issues" variant="primary">
            <CheckIcon /> View Issues (Primer)
          </Button>
          <Button as="a" href="/issues">
            View Issues (Reshaped)
          </Button>
        </Stack>
      </div>
    </Application>
  )
}

export default Home
