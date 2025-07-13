import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock IndexedDB for tests with proper implementation
const mockIDBRequest = {
  result: null,
  error: null,
  onsuccess: null,
  onerror: null,
  readyState: 'done',
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}

const mockIDBDatabase = {
  name: 'test-db',
  version: 1,
  objectStoreNames: [],
  transaction: vi.fn(() => mockIDBTransaction),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}

const mockIDBTransaction = {
  objectStore: vi.fn(() => mockIDBObjectStore),
  abort: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  mode: 'readonly',
  db: mockIDBDatabase,
  error: null,
}

const mockIDBObjectStore = {
  add: vi.fn(() => mockIDBRequest),
  put: vi.fn(() => mockIDBRequest),
  get: vi.fn(() => mockIDBRequest),
  delete: vi.fn(() => mockIDBRequest),
  clear: vi.fn(() => mockIDBRequest),
  count: vi.fn(() => mockIDBRequest),
  getAll: vi.fn(() => mockIDBRequest),
  getAllKeys: vi.fn(() => mockIDBRequest),
  index: vi.fn(),
  createIndex: vi.fn(),
  deleteIndex: vi.fn(),
}

global.indexedDB = {
  open: vi.fn(() => {
    const request = { ...mockIDBRequest }
    setTimeout(() => {
      request.result = mockIDBDatabase
      if (request.onsuccess) request.onsuccess({ target: request })
    }, 0)
    return request
  }),
  deleteDatabase: vi.fn(() => mockIDBRequest),
  databases: vi.fn(() => Promise.resolve([])),
  cmp: vi.fn(),
}

// Mock IDBKeyRange
global.IDBKeyRange = {
  bound: vi.fn(),
  only: vi.fn(),
  lowerBound: vi.fn(),
  upperBound: vi.fn(),
}

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}
global.localStorage = localStorageMock

// Mock sessionStorage
global.sessionStorage = { ...localStorageMock }

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mocked-url')
global.URL.revokeObjectURL = vi.fn()

// Mock Blob
global.Blob = vi.fn().mockImplementation((content, options) => ({
  size: content ? content.reduce((acc, item) => acc + item.length, 0) : 0,
  type: options?.type || '',
  arrayBuffer: vi.fn(() => Promise.resolve(new ArrayBuffer(0))),
  text: vi.fn(() => Promise.resolve('')),
  stream: vi.fn(),
  slice: vi.fn(),
}))

// Mock File
global.File = vi.fn().mockImplementation((bits, name, options) => ({
  ...new global.Blob(bits, options),
  name,
  lastModified: Date.now(),
  webkitRelativePath: '',
}))

// Mock FileReader
global.FileReader = vi.fn().mockImplementation(() => ({
  readAsText: vi.fn(function() {
    setTimeout(() => {
      this.result = 'mocked file content'
      if (this.onload) this.onload({ target: this })
    }, 0)
  }),
  readAsDataURL: vi.fn(),
  readAsArrayBuffer: vi.fn(),
  readAsBinaryString: vi.fn(),
  abort: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  result: null,
  error: null,
  readyState: 0,
  onload: null,
  onerror: null,
  onabort: null,
  onloadstart: null,
  onloadend: null,
  onprogress: null,
}))

// Mock window.confirm and window.alert
global.confirm = vi.fn(() => true)
global.alert = vi.fn()

// Mock crypto for UUID generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mocked-uuid-' + Math.random().toString(36).substr(2, 9)),
    getRandomValues: vi.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    }),
  },
})

// Mock createPortal for React portals
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom')
  return {
    ...actual,
    createPortal: (children) => children,
  }
})

// Setup DOM environment
import { beforeEach } from 'vitest'

beforeEach(() => {
  // Clear document body
  document.body.innerHTML = ''
  
  // Add a div to render into
  const div = document.createElement('div')
  div.setAttribute('id', 'root')
  document.body.appendChild(div)
})
