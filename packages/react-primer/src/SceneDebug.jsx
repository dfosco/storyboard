import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Text } from '@primer/react'
import { loadFlow } from '@dfosco/storyboard-core'
import styles from './SceneDebug.module.css'

/**
 * Debug component that displays loaded flow data as formatted JSON.
 * Used to verify the loader is working correctly.
 * Reads flow name from URL param (?flow=name, with ?scene= as alias) or uses prop/default.
 */
export default function SceneDebug({ flowName, sceneName } = {}) {
  const [searchParams] = useSearchParams()
  const flowFromUrl = searchParams.get('flow') || searchParams.get('scene')
  const activeFlowName = flowName || sceneName || flowFromUrl || 'default'

  const { data, error } = useMemo(() => {
    try {
      return { data: loadFlow(activeFlowName), error: null }
    } catch (err) {
      return { data: null, error: err.message }
    }
  }, [activeFlowName])

  if (error) {
    return (
      <div className={styles.error}>
        <Text className={styles.errorTitle}>Error loading flow</Text>
        <p className={styles.errorMessage}>{error}</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Flow: {activeFlowName}</h2>
      <pre className={styles.codeBlock}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}
