import '@testing-library/jest-dom/vitest'

// jsdom doesn't implement matchMedia — stub it for modules that call it at
// import time (e.g. themeStore.ts).
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() { return false },
  })
}

// Reset URL hash and localStorage between tests
beforeEach(() => {
  window.location.hash = ''
  localStorage.clear()
})
