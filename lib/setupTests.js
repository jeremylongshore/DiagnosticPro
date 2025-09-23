import "@testing-library/jest-dom";
// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});
// Mock IntersectionObserver
class MockIntersectionObserver {
    root = null;
    rootMargin = "";
    thresholds = [];
    constructor() { }
    disconnect() { }
    observe() { }
    unobserve() { }
    takeRecords() {
        return [];
    }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.IntersectionObserver = MockIntersectionObserver;
