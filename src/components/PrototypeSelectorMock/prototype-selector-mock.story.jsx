/**
 * PrototypeSelectorMock stories — visual mock of the prototype picker
 * submenu for CanvasCreateMenu.
 *
 * Scene 1: The panel in its default state (all prototypes listed)
 * Scene 2: Filtering in action
 * Scene 3: A prototype expanded to show its flows
 */
import { useState } from 'react'
import { PrototypeSelectorPanel, ChevronRight } from './PrototypeSelectorMock.jsx'
import styles from './PrototypeSelectorMock.module.css'

/* ═══════════════════════════════════════════════
   Scene 1 — Default state: all prototypes listed
   ═══════════════════════════════════════════════ */

export function DefaultState() {
  const [selected, setSelected] = useState(null)

  return (
    <div className={styles.storyFrame}>
      <div className={styles.storyLabel}>Scene 1 — Prototype selector (default)</div>
      <p className={styles.storyCaption}>
        When the user clicks <strong>Prototype</strong> in the "Add to canvas" menu,
        a submenu opens with a searchable list of all prototypes. Prototypes with
        a single flow are directly selectable. Prototypes with multiple flows
        show a chevron — clicking expands the flow sub-items.
      </p>
      <div className={styles.comparison}>
        <PrototypeSelectorPanel onSelect={setSelected} />
        {selected && (
          <div className={styles.comparisonCol}>
            <div className={styles.comparisonLabel}>Selected</div>
            <code className={styles.storyCaption} style={{ margin: 0 }}>{selected}</code>
          </div>
        )}
      </div>
    </div>
  )
}


/* ═══════════════════════════════════════════════
   Scene 2 — With search filter active
   ═══════════════════════════════════════════════ */

export function FilteredState() {
  return (
    <div className={styles.storyFrame}>
      <div className={styles.storyLabel}>Scene 2 — Filtering prototypes</div>
      <p className={styles.storyCaption}>
        The search input filters prototypes by name. Matching prototypes
        auto-expand to reveal their flows. This reuses the same{' '}
        <code>SearchableList</code> pattern from the Component selector.
      </p>
      <p className={styles.storyCaption}>
        When filtering, all matched prototypes show their flows expanded so
        the user can see exactly which flows matched their query.
      </p>
      <PrototypeSelectorPanel onSelect={() => {}} />
    </div>
  )
}


/* ═══════════════════════════════════════════════
   Scene 3 — Comparison: before/after
   ═══════════════════════════════════════════════ */

export function BeforeAfter() {
  return (
    <div className={styles.storyFrame} style={{ maxWidth: 720 }}>
      <div className={styles.storyLabel}>Scene 3 — Before → After</div>
      <p className={styles.storyCaption}>
        <strong>Before:</strong> clicking "Prototype" in the add menu creates an
        empty prototype widget that the user must then configure manually.
        <br />
        <strong>After:</strong> clicking "Prototype" opens a submenu where the user
        picks a specific prototype and flow — the widget is created pre-configured.
      </p>

      <div className={styles.comparison}>
        <div className={styles.comparisonCol}>
          <div className={styles.comparisonLabel}>Before (current)</div>
          <div className={styles.panel} style={{ opacity: 0.6 }}>
            <div className={styles.menuLabel}>Add to canvas</div>
            <div className={styles.protoHeader}>Sticky Note</div>
            <div className={styles.protoHeader}>Markdown</div>
            <div className={styles.protoHeader}>Prompt</div>
            <div className={styles.protoHeader} style={{ fontWeight: 600 }}>
              Prototype ← adds empty widget
            </div>
            <div className={styles.protoHeader}>Terminal</div>
            <div className={styles.separator} />
            <div className={styles.protoHeader}>
              <span>Component</span>
              <ChevronRight className={styles.chevron} />
            </div>
          </div>
        </div>

        <div className={styles.comparisonCol}>
          <div className={styles.comparisonLabel}>After (proposed)</div>
          <PrototypeSelectorPanel onSelect={() => {}} />
        </div>
      </div>
    </div>
  )
}
