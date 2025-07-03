# Testing Guide

This document provides comprehensive information about the testing setup and strategies for the FLUX.1 Image Generator with LoRA Training System.

## 🧪 Testing Overview

Our testing strategy covers:
- **Unit Tests**: Individual functions and components
- **Integration Tests**: API routes and database interactions
- **Hook Tests**: Custom React hooks with real-time subscriptions
- **Mocking**: External services (Supabase, FAL AI, File system)

## 📁 Test Structure

```
__tests__/
├── api/                    # API route tests
│   └── training/
│       ├── create.test.ts     # Training job creation
│       ├── upload.test.ts     # Image upload handling
│       ├── webhook.test.ts    # Webhook processing
│       ├── submit.test.ts     # Training submission
│       └── create-zip.test.ts # ZIP file creation
├── hooks/                  # Custom hooks tests
│   └── useTrainingJobs.test.tsx
├── lib/                    # Library/utility tests
│   └── supabase.test.ts      # Supabase configuration
├── components/             # React component tests
│   └── [component].test.tsx
└── utils/                  # Utility function tests
    └── [utility].test.ts
```

## 🛠️ Test Configuration

### Jest Configuration (`jest.config.js`)
- **Environment**: `jsdom` for React component testing
- **Setup**: Custom setup file with mocks and global configurations
- **Coverage**: Comprehensive coverage reporting
- **Module Mapping**: Path aliases for clean imports

### Setup File (`jest.setup.js`)
- **Global Mocks**: FormData, File, Blob, URL APIs
- **Environment Variables**: Test-specific configuration
- **Browser APIs**: ResizeObserver, IntersectionObserver, matchMedia
- **Console Management**: Noise reduction during tests

## 🚀 Running Tests

### Basic Commands
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI/CD
npm run test:ci
```

### Specific Test Categories
```bash
# API route tests only
npm run test:api

# Hook tests only
npm run test:hooks

# Library tests only
npm run test:lib

# Component tests only
npm run test:components

# Verbose output
npm run test:verbose
```

## 📊 Test Coverage

Our tests aim for comprehensive coverage across:

### API Routes (`__tests__/api/`)
- ✅ **POST /api/training/create** - Training job creation
  - Valid job creation with all parameters
  - Default value handling
  - Input validation (name, steps, trigger_word)
  - Database error handling
  - JSON parsing errors

- ✅ **GET /api/training/create** - Fetch training jobs
  - Successful data retrieval with related images
  - Database connection errors
  - Empty result handling

- ✅ **POST /api/training/upload** - Image upload
  - Multi-file upload with captions
  - File type validation (images only)
  - File size limits (10MB max)
  - Storage upload errors
  - Database insertion errors
  - Training job validation

- ✅ **POST /api/training/webhook** - Webhook processing
  - Successful training completion
  - Failed training handling
  - In-progress status updates
  - Missing request_id validation
  - Database update errors
  - Invalid JSON payload handling

### Hooks (`__tests__/hooks/`)
- ✅ **useTrainingJobs** - Training job management
  - Initial state and loading
  - CRUD operations (create, fetch, delete)
  - Real-time Supabase subscriptions
  - Error handling and network failures
  - File upload with FormData
  - ZIP creation and training submission

### Library (`__tests__/lib/`)
- ✅ **Supabase Configuration** - Database client setup
  - Client creation with proper configuration
  - TypeScript interface validation
  - Environment variable handling
  - Method availability verification

## 🎯 Testing Strategies

### 1. **Mocking Strategy**
```typescript
// Supabase client mocking
const mockSupabaseAdmin = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    // ... chainable methods
  })),
}

// Global fetch mocking
global.fetch = jest.fn()
```

### 2. **Error Scenarios**
- Network timeouts and connection failures
- Database constraint violations
- Invalid input validation
- File system errors
- Malformed API responses

### 3. **Edge Cases**
- Empty datasets
- Large file uploads
- Concurrent operations
- Real-time subscription cleanup
- Partial data scenarios

### 4. **Integration Testing**
- API route to database interactions
- File upload to storage integration
- Webhook to database updates
- Real-time subscription handling

## 🔧 Mock Implementations

### File System Mocks
```typescript
// FormData with proper append/get methods
global.FormData = class FormData {
  constructor() { this.data = new Map() }
  append(key, value) { /* implementation */ }
  get(key) { /* implementation */ }
}

// File constructor for upload testing
global.File = class File {
  constructor(bits, name, options = {}) {
    this.bits = bits
    this.name = name
    this.size = bits.reduce((acc, bit) => acc + (bit.length || 0), 0)
    this.type = options.type || ''
  }
}
```

### Supabase Real-time Mocks
```typescript
const mockChannel = {
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
}

mockSupabase.channel.mockReturnValue(mockChannel)
```

## 📈 Coverage Reports

Test coverage includes:
- **Statements**: Line-by-line execution coverage
- **Branches**: Conditional logic coverage
- **Functions**: Function execution coverage
- **Lines**: Source code line coverage

Coverage reports are generated in:
- **Console**: Summary during test runs
- **HTML**: Detailed report in `coverage/` directory
- **LCOV**: For CI/CD integration

## 🚨 Testing Best Practices

### 1. **Test Organization**
- Group related tests with `describe` blocks
- Use descriptive test names that explain the scenario
- Follow AAA pattern: Arrange, Act, Assert

### 2. **Mock Management**
- Clear mocks between tests with `beforeEach`
- Use specific mocks for each test scenario
- Verify mock calls with proper parameters

### 3. **Async Testing**
- Use `await` with async operations
- Use `waitFor` for React state updates
- Handle promise rejections properly

### 4. **Error Testing**
- Test both success and failure scenarios
- Verify error messages and status codes
- Test edge cases and boundary conditions

## 🔍 Debugging Tests

### Common Issues
1. **Mock not working**: Ensure mock is defined before import
2. **Async timeout**: Increase timeout or use proper async patterns
3. **State updates**: Use `act()` wrapper for React state changes
4. **Console errors**: Check jest.setup.js for proper mocking

### Debug Commands
```bash
# Run specific test file
npm test -- create.test.ts

# Run with verbose output
npm run test:verbose

# Run single test
npm test -- --testNamePattern="should create job"
```

## 🎯 Future Testing Enhancements

### Planned Additions
- **E2E Tests**: Full user workflow testing
- **Performance Tests**: Load testing for file uploads
- **Visual Regression**: UI component testing
- **Security Tests**: Authentication and authorization

### Integration Opportunities
- **GitHub Actions**: Automated testing on PR/push
- **Codecov**: Coverage tracking and reporting
- **Playwright**: Browser automation testing
- **Storybook**: Component isolation testing

## 📝 Writing New Tests

### Template for API Route Tests
```typescript
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/your-route/route'

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: mockSupabaseAdmin,
}))

describe('/api/your-route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should handle success case', async () => {
    // Arrange
    const mockData = { /* test data */ }
    mockSupabaseAdmin.from().insert().mockResolvedValue({
      data: mockData,
      error: null,
    })

    // Act
    const request = new NextRequest('http://localhost:3000/api/your-route', {
      method: 'POST',
      body: JSON.stringify({ /* request body */ }),
    })
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})
```

### Template for Hook Tests
```typescript
import { renderHook, act } from '@testing-library/react'
import { useYourHook } from '@/hooks/useYourHook'

describe('useYourHook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useYourHook())
    
    expect(result.current.loading).toBe(false)
    expect(result.current.data).toEqual([])
  })

  it('should handle async operations', async () => {
    const { result } = renderHook(() => useYourHook())

    await act(async () => {
      await result.current.performAction()
    })

    expect(result.current.loading).toBe(false)
  })
})
```

## 🎉 Conclusion

This comprehensive testing setup ensures:
- **Reliability**: Catch bugs before they reach production
- **Maintainability**: Safe refactoring with test coverage
- **Documentation**: Tests serve as living documentation
- **Confidence**: Deploy with assurance in code quality

Run `npm run test:coverage` to see the current test coverage and identify areas for improvement! 