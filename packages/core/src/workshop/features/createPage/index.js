/**
 * Pages feature — create new pages from the Workshop Dev Panel.
 *
 * Each workshop feature exports a standard interface:
 *   - name:          Feature identifier (matches config key in workshop.features)
 *   - label:         Display name for the menu item
 *   - icon:          Emoji or HTML for the menu icon
 *   - overlayId:     Unique ID for the overlay (used by x-if in mount.js)
 *   - serverSetup:   Called by the server plugin to register API routes
 *   - clientSetup:   Called by mount.js to register Alpine components
 *   - overlayHtml:   Returns the overlay HTML string for the create form
 */

export { createPagesHandler as serverSetup } from './server.js'
export { registerCreatePageForm as clientSetup } from './client.js'

export const name = 'createPage'
export const label = 'Create page'
export const icon = '📄'
export const overlayId = 'createPage'

export function overlayHtml() {
  return `
    <div class="sb-workshop-modal sb-bg ba sb-b-default br3 sb-shadow" x-data="createPageForm">
      <div class="flex items-center justify-between ph4 pv3 bb sb-b-muted">
        <h2 class="ma0 f5 fw6 sb-fg">Create page</h2>
        <button class="sb-workshop-close-btn bg-transparent bn br2 sb-fg-muted pointer" @click="$dispatch('close-overlay')" aria-label="Close">&times;</button>
      </div>
      <div class="pa4" @close-overlay.window="closeOverlay()">
        <label class="db mb1 fw5 sb-fg f6" for="sb-workshop-page-name">Page name</label>
        <input class="sb-input w-100 ph3 pv2 br2 f6 db mb2" id="sb-workshop-page-name" type="text"
               placeholder="e.g. Dashboard, User Settings" autocomplete="off" spellcheck="false"
               x-model="name" @keydown.enter="submit()" />

        <div class="mb3 f7 sb-fg-muted lh-copy" x-show="routePreview">
          Route: <code class="dib ph1 sb-bg-muted br1 code sb-fg" x-text="routePreview"></code>
        </div>

        <label class="flex items-center mb3 pointer sb-fg f6">
          <input type="checkbox" class="mr2" x-model="createScene" />
          Create scene file
        </label>

        <template x-if="error">
          <div class="mb3 ph3 pv2 br2 sb-fg-danger f7 sb-error-bg" x-text="error"></div>
        </template>
        <template x-if="success">
          <div class="mb3 ph3 pv2 br2 sb-fg-success f7" x-text="success"></div>
        </template>

        <div class="flex justify-end">
          <button class="sb-workshop-btn sb-workshop-btn-secondary mr2" @click="$dispatch('close-overlay')">Cancel</button>
          <button class="sb-workshop-btn sb-workshop-btn-primary" @click="submit()" :disabled="!pascalName || submitting"
                  x-text="submitting ? 'Creating…' : 'Create'"></button>
        </div>
      </div>
    </div>
  `
}
