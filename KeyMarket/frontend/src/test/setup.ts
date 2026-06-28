import '@testing-library/jest-dom';

// Мок для window.matchMedia (требуется Ant Design)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // устаревший метод
    removeListener: () => {}, // устаревший метод
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});