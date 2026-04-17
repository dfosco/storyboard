/**
 * "What's driving changes" — two side-by-side leaderboards showing
 * repos with the biggest decrease / increase in findings over 30 days.
 */

/* ── Data ─────────────────────────────────────────── */

const improved = [
  { repo: 'copilot-service',     was: 22572, now: 21865, trend: [22572, 22500, 22410, 22350, 22280, 22200, 22100, 21950, 21865] },
  { repo: 'config-service',      was: 4268,  now: 3979,  trend: [4268, 4230, 4190, 4140, 4100, 4060, 4020, 3990, 3979] },
  { repo: 'identity-provider',   was: 3968,  now: 3748,  trend: [3968, 3940, 3910, 3870, 3840, 3810, 3780, 3760, 3748] },
  { repo: 'billing-api',         was: 3377,  now: 3186,  trend: [3377, 3350, 3330, 3300, 3270, 3240, 3220, 3200, 3186] },
  { repo: 'classroom-api',       was: 3463,  now: 3277,  trend: [3463, 3440, 3420, 3390, 3360, 3330, 3310, 3290, 3277] },
  { repo: 'projects-v2-api',     was: 2318,  now: 2144,  trend: [2318, 2300, 2280, 2250, 2220, 2200, 2180, 2160, 2144] },
  { repo: 'advisory-db',         was: 3339,  now: 3187,  trend: [3339, 3310, 3290, 3270, 3250, 3230, 3210, 3195, 3187] },
  { repo: 'marketplace-api',     was: 4777,  now: 4629,  trend: [4777, 4750, 4730, 4710, 4690, 4670, 4650, 4640, 4629] },
  { repo: 'analytics-pipeline',  was: 1756,  now: 1613,  trend: [1756, 1740, 1720, 1700, 1680, 1660, 1640, 1625, 1613] },
  { repo: 'pages-build',         was: 1961,  now: 1819,  trend: [1961, 1940, 1920, 1900, 1880, 1860, 1840, 1830, 1819] },
]

const concern = [
  { repo: 'github',                  was: 73741, now: 78602, trend: [73741, 74200, 74800, 75500, 76200, 76900, 77500, 78100, 78602] },
  { repo: 'codespaces',              was: 31414, now: 33861, trend: [31414, 31800, 32100, 32500, 32900, 33200, 33500, 33700, 33861] },
  { repo: 'github-enterprise',       was: 49795, now: 51667, trend: [49795, 50000, 50300, 50600, 50900, 51100, 51300, 51500, 51667] },
  { repo: 'code-scanning',           was: 13648, now: 15325, trend: [13648, 13900, 14100, 14400, 14700, 14900, 15100, 15200, 15325] },
  { repo: 'security-products',       was: 17531, now: 18604, trend: [17531, 17700, 17900, 18000, 18200, 18300, 18400, 18500, 18604] },
  { repo: 'dependabot-core',         was: 12211, now: 12878, trend: [12211, 12300, 12400, 12500, 12600, 12700, 12750, 12820, 12878] },
  { repo: 'actions-runner',          was: 27312, now: 27795, trend: [27312, 27400, 27450, 27500, 27550, 27600, 27680, 27740, 27795] },
  { repo: 'accessibility-scanner',   was: 3834,  now: 4127,  trend: [3834, 3870, 3910, 3950, 3990, 4020, 4060, 4100, 4127] },
  { repo: 'discussions-service',     was: 4675,  now: 4955,  trend: [4675, 4710, 4750, 4790, 4830, 4870, 4900, 4930, 4955] },
  { repo: 'secret-scanning-service', was: 2490,  now: 2664,  trend: [2490, 2520, 2540, 2560, 2580, 2600, 2620, 2645, 2664] },
]

/* ── Styles ───────────────────────────────────────── */

const s = {
  root: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
    background: 'var(--bgColor-default, #fff)',
    color: 'var(--fgColor-default, #1f2328)',
    padding: 32,
    width: 1320,
  },
  h2: { fontSize: 20, fontWeight: 600, margin: 0 },
  subtitle: {
    fontSize: 14,
    color: 'var(--fgColor-muted, #656d76)',
    margin: '4px 0 24px',
  },
  grid: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 24 },
  panel: {
    border: '1px solid var(--borderColor-default, #d1d9e0)',
    borderRadius: 12,
    padding: '20px 24px',
    overflow: 'hidden',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 16,
    fontWeight: 600,
    margin: 0,
  },
  panelSub: {
    fontSize: 13,
    color: 'var(--fgColor-muted, #656d76)',
    margin: '4px 0 16px',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed' },
  th: {
    textAlign: 'left',
    fontWeight: 600,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'var(--fgColor-muted, #656d76)',
    padding: '0 8px 10px',
    borderBottom: '1px solid var(--borderColor-muted, #d1d9e0)',
  },
  thNum: { textAlign: 'right' },
  td: {
    padding: '10px 8px',
    borderBottom: '1px solid var(--borderColor-muted, rgba(208,215,222,0.5))',
    verticalAlign: 'middle',
  },
  rank: {
    color: 'var(--fgColor-muted, #656d76)',
    width: 28,
    textAlign: 'center',
  },
  repoLink: {
    color: 'var(--fgColor-accent, #0969da)',
    textDecoration: 'none',
    fontWeight: 500,
  },
  numCell: { textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
  changeBadge: (direction) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 2,
    fontWeight: 600,
    fontSize: 12,
    padding: '2px 8px',
    borderRadius: 12,
    fontVariantNumeric: 'tabular-nums',
    ...(direction === 'down'
      ? { color: 'var(--fgColor-danger, #cf222e)', background: 'var(--bgColor-danger-muted, #ffebe9)' }
      : { color: 'var(--fgColor-success, #1a7f37)', background: 'var(--bgColor-success-muted, #dafbe1)' }),
  }),
  sparkCell: { width: 100, padding: '6px 0' },
}

/* ── Helpers ──────────────────────────────────────── */

const fmt = (n) => n.toLocaleString('en-US')

function ChangeCell({ was, now, direction }) {
  const diff = Math.abs(was - now)
  const arrow = direction === 'down' ? '↓' : '↑'
  return (
    <td style={{ ...s.td, textAlign: 'right' }}>
      <span style={s.changeBadge(direction)}>
        {arrow}&nbsp;{fmt(diff)}
      </span>
    </td>
  )
}

function SvgSparkline({ data, color, width = 80, height = 24 }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pad = 2
  const points = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (width - pad * 2)
      const y = pad + (1 - (v - min) / range) * (height - pad * 2)
      return `${x},${y}`
    })
    .join(' ')
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Sparkline({ data, direction }) {
  const color = direction === 'down'
    ? 'var(--fgColor-success, #1a7f37)'
    : 'var(--fgColor-danger, #cf222e)'
  return (
    <td style={{ ...s.td, ...s.sparkCell }}>
      <SvgSparkline data={data} color={color} />
    </td>
  )
}

/* ── Panel component ─────────────────────────────── */

function LeaderboardPanel({ title, subtitle, icon, iconColor, rows, direction }) {
  return (
    <div style={s.panel}>
      <h3 style={{ ...s.panelHeader, color: iconColor }}>
        <span>{icon}</span> {title}
      </h3>
      <p style={s.panelSub}>{subtitle}</p>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th} />
            <th style={s.th}>Repository</th>
            <th style={{ ...s.th, ...s.thNum }}>30 days ago</th>
            <th style={{ ...s.th, ...s.thNum }}>Now</th>
            <th style={{ ...s.th, ...s.thNum }}>Change</th>
            <th style={s.th}>Trend</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.repo}>
              <td style={{ ...s.td, ...s.rank }}>{i + 1}</td>
              <td style={s.td}>
                <a href="#" style={s.repoLink}>{r.repo}</a>
              </td>
              <td style={{ ...s.td, ...s.numCell }}>{fmt(r.was)}</td>
              <td style={{ ...s.td, ...s.numCell }}>{fmt(r.now)}</td>
              <ChangeCell was={r.was} now={r.now} direction={direction} />
              <Sparkline data={r.trend} direction={direction} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Exported story ──────────────────────────────── */

export function WhatsChanging() {
  return (
    <div style={s.root}>
      <h2 style={s.h2}>What&rsquo;s driving changes</h2>
      <p style={s.subtitle}>
        Repos and rules with the biggest changes in findings over the last 30 days.
      </p>
      <div style={s.grid}>
        <LeaderboardPanel
          title="Most improved repos"
          subtitle="Largest decrease in findings over last 30 days"
          icon="↑"
          iconColor="var(--fgColor-success, #1a7f37)"
          rows={improved}
          direction="down"
        />
        <LeaderboardPanel
          title="Causes for concern"
          subtitle="Largest increase in findings over last 30 days"
          icon="↓"
          iconColor="var(--fgColor-danger, #cf222e)"
          rows={concern}
          direction="up"
        />
      </div>
    </div>
  )
}
