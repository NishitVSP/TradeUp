# White Box Testing Implementation

This document explains how to perform white box testing on the backend modules using conditional, data flow, and loop testing techniques.

## Setup Instructions

1. **Install Dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Run Tests:**
   ```bash
   npm test
   ```

3. **Run with Coverage:**
   ```bash
   npm run test:coverage
   ```

## Modules Tested

### 1. Options Controller (`optionsController.ts`)

**White Box Testing Techniques Applied:**

#### Conditional Testing
- Tests all conditional branches in `getExpiries()`, `getStrikes()`, and `getSpotPrice()`
- Covers both true and false paths for if/else statements
- Tests boundary conditions and edge cases

#### Data Flow Testing
- Traces data flow from input parameters through function logic to output
- Tests data transformations and validations
- Covers error handling paths and exception scenarios

#### Loop Testing (Implicit)
- Tests the for loop in `getStrikes()` that generates strike prices
- Validates loop boundaries (minimum, maximum, and typical values)
- Ensures correct number of iterations

**Test Cases:**
- Valid index with expiries
- Invalid index (404 handling)
- Missing spot price scenarios
- Strike generation with different spot prices
- Error handling for service failures

### 2. Options Simulator (`optionsSimulator.ts`)

**White Box Testing Techniques Applied:**

#### Conditional Testing
- Tests conditional logic in `calculateUpdateInterval()` for different strike distances
- Covers simulation start/stop conditions
- Tests database existence checks

#### Data Flow Testing
- Traces contract addition/removal workflow
- Tests database query and result processing
- Covers LTP calculation and retrieval paths

#### Loop Testing
- Tests `getMultipleContractLTPs()` with different array sizes
- Covers empty arrays, single items, and multiple items
- Tests loop behavior with missing data

**Test Cases:**
- Update interval calculation (500ms, 1000ms, 2000ms)
- Contract watch management
- Database query operations
- Multiple contract processing loops
- Simulation control functions

## White Box Testing Techniques Explained

### 1. Conditional Testing
Tests all decision points in the code:
```typescript
// Example from calculateUpdateInterval
if (strikeDistance <= 5) {
  return 500;  // Test this branch
} else if (strikeDistance <= 10) {
  return 1000; // Test this branch
} else {
  return 2000; // Test this branch
}
```

### 2. Data Flow Testing
Tracks how data moves through the system:
```typescript
// Example from getStrikes
const spotPrice = getIndexSpotPrice(indexName);  // Input
const config = STRIKE_CONFIG[indexName];         // Processing
const atmStrike = Math.round(spotPrice / config.stepSize) * config.stepSize; // Transformation
return { atmStrike, strikes };                   // Output
```

### 3. Loop Testing
Validates loop behavior:
```typescript
// Example from getStrikes
for (let i = -config.range; i <= config.range; i++) {
  strikes.push(atmStrike + i * config.stepSize);
}
// Test: i = -40, i = 0, i = 40 (boundaries)
// Test: Total iterations = 81
```

## Test Coverage Goals

- **Statement Coverage:** Every line of code executed
- **Branch Coverage:** All conditional branches tested
- **Path Coverage:** All execution paths tested
- **Loop Coverage:** All loop variations tested

## Running Specific Tests

```bash
# Run only controller tests
npm test -- optionsController

# Run only simulator tests
npm test -- optionsSimulator

# Run with coverage report
npm run test:coverage
```

## Expected Output

When you run the tests, you should see:
- All tests passing (green checkmarks)
- Coverage report showing percentage of code covered
- Detailed test results for each white box testing technique

## Benefits of This White Box Testing

1. **Early Bug Detection:** Finds bugs in conditional logic and data processing
2. **Code Coverage:** Ensures thorough testing of all code paths
3. **Regression Prevention:** Catches issues when code changes
4. **Documentation:** Tests serve as examples of how code should work
5. **Maintainability:** Makes refactoring safer with comprehensive tests

## Next Steps

1. Install dependencies and run the tests
2. Review coverage reports to identify untested code
3. Add more test cases for edge cases
4. Integrate tests into CI/CD pipeline
5. Update tests when adding new features
