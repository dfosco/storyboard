/**
 * PrototypeSelectorMock — visual mock for the prototype selector submenu
 * in the canvas CanvasCreateMenu.
 *
 * Shows a searchable list of prototypes with flow sub-items,
 * reusing the same SearchableList pattern as the Component selector.
 */
import { useState, useMemo } from 'react'
import styles from './PrototypeSelectorMock.module.css'

const MOCK_PROTOTYPES = [
  {
    name: 'Dashboard',
    dirName: 'Dashboard',
    flows: [
      { name: 'Default', route: '/Dashboard' },
      { name: 'Empty State', route: '/Dashboard?flow=Dashboard/empty-state' },
      { name: 'Loading', route: '/Dashboard?flow=Dashboard/loading' },
    ],
  },
  {
    name: 'Repositories',
    dirName: 'Repositories',
    flows: [
      { name: 'Default', route: '/Repositories' },
    ],
  },
  {
    name: 'Security Overview',
    dirName: 'SecurityOverview',
    flows: [
      { name: 'Default', route: '/SecurityOverview' },
      { name: 'Critical Alerts', route: '/SecurityOverview?flow=SecurityOverview/critical-alerts' },
      { name: 'Compliance', route: '/SecurityOverview?flow=SecurityOverview/compliance' },
      { name: 'Dependabot', route: '/SecurityOverview?flow=SecurityOverview/dependabot' },
    ],
  },
  {
    name: 'Settings',
    dirName: 'Settings',
    flows: [
      { name: 'Default', route: '/Settings' },
      { name: 'Billing', route: '/Settings?flow=Settings/billing' },
    ],
  },
  {
    name: 'Pull Request',
    dirName: 'PullRequest',
    flows: [
      { name: 'Open', route: '/PullRequest?flow=PullRequest/open' },
      { name: 'Merged', route: '/PullRequest?flow=PullRequest/merged' },
      { name: 'Review Required', route: '/PullRequest?flow=PullRequest/review-required' },
    ],
  },
  {
    name: 'Actions',
    dirName: 'Actions',
    flows: [
      { name: 'Default', route: '/Actions' },
    ],
  },
  {
    name: 'Projects',
    dirName: 'Projects',
    flows: [
      { name: 'Board View', route: '/Projects?flow=Projects/board-view' },
      { name: 'Table View', route: '/Projects?flow=Projects/table-view' },
    ],
  },
]

export function ChevronRight({ className }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M4.5 2.5L7.5 6L4.5 9.5" />
    </svg>
  )
}

/**
 * The mock panel component showing the prototype selector as it would
 * appear in the CanvasCreateMenu submenu.
 */
export function PrototypeSelectorPanel({ prototypes = MOCK_PROTOTYPES, onSelect }) {
  const [filter, setFilter] = useState('')
  const [expandedProto, setExpandedProto] = useState(null)

  const filtered = useMemo(() => {
    if (!filter.trim()) return prototypes
    const q = filter.toLowerCase()
    return prototypes
      .map((proto) => {
        const nameMatch = proto.name.toLowerCase().includes(q)
        if (nameMatch) return proto
        const matchedFlows = proto.flows.filter(
          (f) => f.name.toLowerCase().includes(q) || f.route.toLowerCase().includes(q),
        )
        if (matchedFlows.length === 0) return null
        return { ...proto, flows: matchedFlows }
      })
      .filter(Boolean)
  }, [prototypes, filter])

  function handleProtoClick(proto) {
    if (proto.flows.length <= 1) {
      onSelect?.(proto.flows[0]?.route || `/${proto.dirName}`)
      return
    }
    setExpandedProto((prev) => (prev === proto.dirName ? null : proto.dirName))
  }

  return (
    <div className={styles.panel}>
      <input
        type="text"
        className={styles.searchInput}
        placeholder="Filter prototypes…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        autoComplete="off"
        spellCheck={false}
      />
      <div className={styles.list}>
        {filtered.length === 0 && (
          <div style={{ padding: '0.75rem 0.55rem', fontSize: '0.75rem', color: 'var(--fgColor-muted, #8b949e)', textAlign: 'center' }}>
            No prototypes found
          </div>
        )}
        {filtered.map((proto) => {
          const isExpanded = expandedProto === proto.dirName || filter.trim().length > 0
          const hasMultipleFlows = proto.flows.length > 1

          return (
            <div key={proto.dirName}>
              <div
                className={`${styles.protoHeader} ${isExpanded && hasMultipleFlows ? styles.active : ''}`}
                onClick={() => handleProtoClick(proto)}
              >
                <span>{proto.name}</span>
                {hasMultipleFlows && (
                  <ChevronRight className={`${styles.chevron} ${isExpanded ? styles.open : ''}`} />
                )}
              </div>

              {hasMultipleFlows && isExpanded && (
                proto.flows.map((flow) => (
                  <div
                    key={flow.route}
                    className={styles.flowItem}
                    onClick={() => onSelect?.(flow.route)}
                  >
                    <span>{flow.name}</span>
                  </div>
                ))
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PrototypeSelectorPanel
