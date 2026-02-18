import { useNavigate } from 'react-router-dom'
import { Card, Divider, Text, View } from 'reshaped'
import styles from './AppSidebar.module.css'

const navItems = [
  { label: 'Overview', path: '/Dashboard' },
  { label: 'Issues', path: '/issues' },
  { label: 'Projects', path: '/Dashboard' },
  { label: 'Views', path: '/Dashboard' },
]

function str(v) { return typeof v === 'string' ? v : '' }

export default function AppSidebar({ orgName, activePage, userInfo }) {
  const navigate = useNavigate()

  return (
    <Card padding={4}>
      <View direction="column" gap={2}>
        <Text variant="featured-3" weight="bold">
          {str(orgName) || '—'}
        </Text>
        <Divider />
        <nav>
          <View direction="column" gap={0}>
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`${styles.navItem} ${activePage === item.label ? styles.active : ''}`}
                onClick={() => navigate(item.path)}
              >
                <Text variant="body-3" weight={activePage === item.label ? 'bold' : 'regular'}>
                  {item.label}
                </Text>
              </button>
            ))}
          </View>
        </nav>
        {userInfo && (
          <>
            <Divider />
            <View direction="column" gap={1} paddingTop={1}>
              <Text variant="caption-1" color="neutral-faded">{str(userInfo.name) || '—'}</Text>
              <Text variant="caption-1" color="neutral-faded">{str(userInfo.role) || '—'}</Text>
            </View>
          </>
        )}
      </View>
    </Card>
  )
}
