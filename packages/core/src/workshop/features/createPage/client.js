/**
 * Create Page form — Alpine.js component for the Workshop Dev Panel.
 * Handles page name input, validation preview, and API submission.
 */

/**
 * Register the createPageForm Alpine.js data component.
 */
export function registerCreatePageForm(Alpine) {
  Alpine.data('createPageForm', () => ({
    name: '',
    createScene: true,
    template: 'blank',
    submitting: false,
    error: null,
    success: null,

    get pascalName() {
      return this.name
        .replace(/[^a-zA-Z0-9\s_-]/g, '')
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join('')
    },

    get routePreview() {
      return this.pascalName ? `/${this.pascalName}` : ''
    },

    async submit() {
      if (!this.pascalName || this.submitting) return
      this.submitting = true
      this.error = null
      this.success = null

      try {
        // Build API URL with the app's base path
        const basePath = document.querySelector('base')?.getAttribute('href') || '/'
        const apiUrl = basePath.replace(/\/$/, '') + '/_storyboard/workshop/pages'

        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: this.name,
            template: this.template,
            createScene: this.createScene,
          }),
        })
        const data = await res.json()

        if (!res.ok) {
          this.error = data.error || 'Failed to create page'
          return
        }

        this.success = `Created ${data.path}`
        this.name = ''

        // Navigate after HMR picks up the new file
        setTimeout(() => {
          const base = document.querySelector('base')?.href || '/'
          window.location.href = base + data.route.slice(1)
        }, 1500)
      } catch (err) {
        this.error = err.message || 'Network error'
      } finally {
        this.submitting = false
      }
    },
  }))
}
