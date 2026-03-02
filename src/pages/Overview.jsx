import { Text, Button, Flash } from '@primer/react'
import Application from '../templates/Application/Application.jsx'
import styles from "./overview.module.css";
import { useFeatureFlag } from '@dfosco/storyboard-react'

import {
  IssueOpenedIcon,
  GitPullRequestIcon,
  CommentDiscussionIcon,
  ShieldIcon,
  PlayIcon,
  ProjectIcon,
  GraphIcon,
  HomeIcon
} from '@primer/octicons-react'

const topnav = [
  { icon: HomeIcon, label: 'Overview', url: '/', current: true },
  { icon: IssueOpenedIcon, label: 'Organizations', url: '#issues' },
  { icon: GitPullRequestIcon, label: 'People' },
  { icon: CommentDiscussionIcon, label: 'Policies' },
  { icon: PlayIcon, label: 'GitHub Connect' },
  { icon: ProjectIcon, label: 'Code Security', counter: 7 },
  { icon: ShieldIcon, label: 'Billing & Licensing', counter: 12 },
  { icon: GraphIcon, label: 'Settings' },
  { icon: GraphIcon, label: 'Compliance' }
];

function Overview() {
    const showBanner = useFeatureFlag('show-banner')

    return (
      <Application title="Primer" subtitle="React" topnav={topnav}>
          {showBanner && (
            <Flash variant="success" style={{ marginBottom: '12px' }}>
              🚩 Feature flag <strong>show-banner</strong> is enabled! Toggle it in DevTools.
            </Flash>
          )}
          <Text as="h1" className={styles.title} fontSize="larger">Overview</Text>
          <div className={styles.card}>
          <Text as="p" className={styles.cardText} fontSize="medium">This is a card in the overview</Text>
            <Button>Edit</Button>
          </div>
        </Application>
    )
}

export default Overview
