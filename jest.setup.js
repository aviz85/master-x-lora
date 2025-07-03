import '@testing-library/jest-dom'

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.FAL_KEY = 'test-fal-key'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'

// Mock Web APIs that are not available in Node.js
global.Request = class Request {
  constructor(input, init = {}) {
    Object.defineProperty(this, 'url', {
      value: typeof input === 'string' ? input : input.url,
      writable: false
    })
    this.method = init.method || 'GET'
    this.headers = new Map(Object.entries(init.headers || {}))
    this.body = init.body
    this._bodyInit = init.body
  }
  
  async json() {
    if (typeof this.body === 'string') {
      return JSON.parse(this.body)
    }
    return this.body
  }
  
  async text() {
    return typeof this.body === 'string' ? this.body : JSON.stringify(this.body)
  }
  
  async formData() {
    return this.body
  }
}

global.Response = class Response {
  constructor(body, init = {}) {
    this.body = body
    this.status = init.status || 200
    this.statusText = init.statusText || 'OK'
    this.headers = new Map(Object.entries(init.headers || {}))
    this.ok = this.status >= 200 && this.status < 300
  }
  
  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body
  }
  
  async text() {
    return typeof this.body === 'string' ? this.body : JSON.stringify(this.body)
  }
  
  static json(data, init = {}) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init.headers,
      },
    })
  }
}

global.Headers = class Headers extends Map {
  constructor(init) {
    super()
    if (init) {
      if (Array.isArray(init)) {
        init.forEach(([key, value]) => this.set(key, value))
      } else if (typeof init === 'object') {
        Object.entries(init).forEach(([key, value]) => this.set(key, value))
      }
    }
  }
  
  append(name, value) {
    const existing = this.get(name)
    this.set(name, existing ? `${existing}, ${value}` : value)
  }
  
  get(name) {
    return super.get(name.toLowerCase())
  }
  
  set(name, value) {
    return super.set(name.toLowerCase(), value)
  }
  
  has(name) {
    return super.has(name.toLowerCase())
  }
  
  delete(name) {
    return super.delete(name.toLowerCase())
  }
}

// Mock fetch globally
global.fetch = jest.fn()

// Mock FormData
global.FormData = class FormData {
  constructor() {
    this.data = new Map()
  }
  
  append(key, value) {
    if (this.data.has(key)) {
      const existing = this.data.get(key)
      this.data.set(key, Array.isArray(existing) ? [...existing, value] : [existing, value])
    } else {
      this.data.set(key, value)
    }
  }
  
  get(key) {
    const value = this.data.get(key)
    return Array.isArray(value) ? value[0] : value
  }
  
  getAll(key) {
    const value = this.data.get(key)
    return Array.isArray(value) ? value : value ? [value] : []
  }
  
  has(key) {
    return this.data.has(key)
  }
  
  set(key, value) {
    this.data.set(key, value)
  }
  
  delete(key) {
    this.data.delete(key)
  }
  
  entries() {
    const entries = []
    for (const [key, value] of this.data) {
      if (Array.isArray(value)) {
        value.forEach(v => entries.push([key, v]))
      } else {
        entries.push([key, value])
      }
    }
    return entries[Symbol.iterator]()
  }
  
  keys() {
    return this.data.keys()
  }
  
  values() {
    const values = []
    for (const value of this.data.values()) {
      if (Array.isArray(value)) {
        values.push(...value)
      } else {
        values.push(value)
      }
    }
    return values[Symbol.iterator]()
  }
  
  [Symbol.iterator]() {
    return this.entries()
  }
}

// Mock File API
global.File = class File {
  constructor(bits, name, options = {}) {
    this.bits = bits
    this.name = name
    this.size = bits.reduce((acc, bit) => acc + (bit.length || 0), 0)
    this.type = options.type || ''
    this.lastModified = options.lastModified || Date.now()
  }
  
  async text() {
    return this.bits.join('')
  }
  
  async arrayBuffer() {
    const text = await this.text()
    const buffer = new ArrayBuffer(text.length)
    const view = new Uint8Array(buffer)
    for (let i = 0; i < text.length; i++) {
      view[i] = text.charCodeAt(i)
    }
    return buffer
  }
}

// Mock Blob API
global.Blob = class Blob {
  constructor(parts = [], options = {}) {
    this.parts = parts
    this.size = parts.reduce((acc, part) => acc + (part.length || 0), 0)
    this.type = options.type || ''
  }
  
  async text() {
    return this.parts.join('')
  }
  
  async arrayBuffer() {
    const text = await this.text()
    const buffer = new ArrayBuffer(text.length)
    const view = new Uint8Array(buffer)
    for (let i = 0; i < text.length; i++) {
      view[i] = text.charCodeAt(i)
    }
    return buffer
  }
}

// Mock URL API
global.URL = class URL {
  constructor(url, base) {
    if (base) {
      this.href = new URL(base).href + url
    } else {
      this.href = url
    }
    this.origin = 'http://localhost:3000'
    this.protocol = 'http:'
    this.host = 'localhost:3000'
    this.hostname = 'localhost'
    this.port = '3000'
    this.pathname = url.includes('://') ? url.split('/').slice(3).join('/') : url
    this.search = ''
    this.hash = ''
  }
  
  static createObjectURL(blob) {
    return 'blob:http://localhost:3000/mock-blob-url'
  }
  
  static revokeObjectURL(url) {
    // Mock implementation
  }
}

// Mock crypto for UUID generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'mock-uuid-1234'),
    getRandomValues: jest.fn((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256)
      }
      return array
    }),
  },
})

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Suppress console.log, console.warn, and console.error during tests unless explicitly needed
const originalConsole = { ...console }
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}

// Restore console for specific tests if needed
global.restoreConsole = () => {
  global.console = originalConsole
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}))

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
  // Reset fetch mock
  if (global.fetch) {
    global.fetch.mockClear()
  }
}) 