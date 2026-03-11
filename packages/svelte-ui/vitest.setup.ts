import '@testing-library/jest-dom/vitest'

beforeEach(() => {
  window.location.hash = ''
  localStorage.clear()

  // Reset ?mode= param between tests
  const url = new URL(window.location.href)
  url.searchParams.delete('mode')
  window.history.replaceState(null, '', url.toString())
})
