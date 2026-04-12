/**
 * storyboard update:flag <key> <value> — Update a feature flag in storyboard.config.json.
 *
 * Usage:
 *   storyboard update:flag show-banner false
 *   storyboard update:flag debug-mode true
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const key = process.argv[3]
const rawValue = process.argv[4]

if (!key || rawValue === undefined) {
  console.error('Usage: storyboard update:flag <key> <value>')
  console.error('Example: storyboard update:flag show-banner false')
  process.exit(1)
}

// Parse value: "true"/"false" → boolean, numbers → number, else string
let value
if (rawValue === 'true') value = true
else if (rawValue === 'false') value = false
else if (!isNaN(rawValue) && rawValue !== '') value = Number(rawValue)
else value = rawValue

const configPath = resolve(process.cwd(), 'storyboard.config.json')

let config
try {
  config = JSON.parse(readFileSync(configPath, 'utf8'))
} catch (err) {
  console.error(`Failed to read storyboard.config.json: ${err.message}`)
  process.exit(1)
}

if (!config.featureFlags) config.featureFlags = {}
const prev = config.featureFlags[key]
config.featureFlags[key] = value

writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n')
console.log(`[storyboard] featureFlags.${key}: ${JSON.stringify(prev)} → ${JSON.stringify(value)}`)
