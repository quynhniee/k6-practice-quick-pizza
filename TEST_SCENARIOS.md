# k6 Pizza API Test Scenarios Summary

## Overview

This comprehensive k6 test suite provides thorough testing coverage for a pizza ordering API with multiple test scenarios designed to validate functionality, performance, and reliability.

## Test Files Created

### 1. **order-pizza.ts** - Main Comprehensive Test Suite

**Purpose**: Multi-scenario performance testing with realistic load patterns

**Scenarios:**

- 🔍 **Smoke Test**: 1 VU × 1min - Basic functionality validation
- 📈 **Load Test**: Ramp 0→10→0 VUs over 9min - Normal expected load
- 🔥 **Stress Test**: Ramp 0→30→0 VUs over 16min - Beyond normal capacity
- ⚡ **Spike Test**: 5→50→5 VUs with sudden spikes - Traffic surge simulation

**Test Data Distribution:**

- 70% Valid random orders
- 15% Vegetarian orders
- 10% Restricted diet orders
- 5% Invalid orders (error handling)

**Key Features:**

- Business rule validation (vegetarian, calories, exclusions)
- Performance thresholds by scenario type
- Comprehensive response validation
- Error logging and debugging

---

### 2. **functional-tests.ts** - API Behavior Validation

**Purpose**: Detailed functional testing of API business logic

**Test Categories:**

- ✅ **Valid Order Scenarios**

  - Minimum valid order (1 topping)
  - Maximum valid order (10 toppings)
  - Strict vegetarian requirements
  - Low-calorie diet orders
  - Multiple exclusions handling

- ❌ **Invalid Order Scenarios**

  - Empty pizza names
  - Negative calorie values
  - Invalid topping ranges (min > max)
  - Zero toppings constraint

- 🎯 **Edge Case Testing**
  - Large payload handling (1000+ character names)
  - Special characters and emoji support
  - Unicode international characters

**Validation Checks:**

- Response structure integrity
- Business rule compliance
- Error message appropriateness
- Response time boundaries

---

### 3. **performance-tests.ts** - Multi-Pattern Load Testing

**Purpose**: Comprehensive performance testing with realistic user patterns

**Test Scenarios:**

- 📊 **Baseline**: 5 VUs × 5min - Performance baseline
- 📈 **Ramp Up**: Gradual increase to 25 VUs over 19min
- 🎯 **Peak Load**: 30 VUs × 10min - Maximum expected load
- 🔥 **Stress**: Up to 150 VUs over 21min - Breaking point testing
- ⚡ **Spike**: Sudden 5→100 VU jump - Traffic spike handling

**Load Patterns:**

- 60% Simple orders (fast processing)
- 25% Medium complexity orders
- 10% Complex orders (heavy processing)
- 5% Edge case orders (boundary testing)

**Performance Metrics:**

- Response time percentiles (p95, p99)
- Error rate thresholds by scenario
- Throughput measurements
- Resource utilization patterns

---

### 4. **boundary-tests.ts** - Edge Case and Limit Testing

**Purpose**: Validate API behavior at boundaries and with invalid inputs

**Test Categories:**

- 🔢 **Boundary Value Testing**

  - Calorie limits: 0, 1, negative, extreme values
  - Topping counts: min/max ranges, invalid combinations
  - Name lengths: empty, single char, 1000+ characters

- 🚫 **Invalid Input Handling**

  - Malformed JSON requests
  - Wrong data types (strings for numbers)
  - Null/undefined values
  - Array vs object type mismatches

- 🌍 **Character Set Testing**

  - Unicode characters (Chinese, Arabic, Russian)
  - Special characters and symbols
  - HTML/SQL injection attempts
  - Emoji and mixed script support

- 📦 **Payload Testing**
  - Large request payloads
  - Deeply nested objects
  - Array size limitations
  - Memory usage patterns

---

### 5. **simple-example.ts** - Getting Started Example

**Purpose**: Basic example for new users to understand k6 testing

**Features:**

- Simple 2 VU × 30s test
- Basic pizza order request
- Essential response validation
- Clear code comments
- Minimal configuration

---

## Quick Start Commands

```bash
# Setup
npm install
npm run build

# Individual test types
npm run test:smoke      # 1 minute smoke test
npm run test:functional # Detailed API validation
npm run test:load       # Standard load test
npm run test:performance # Comprehensive performance suite
npm run test:boundary   # Edge case testing

# All tests
npm test                # Complete test suite

# Using script directly
./scripts/run-tests.sh smoke
./scripts/run-tests.sh all
```

## Test Execution Strategy

### Development Phase

1. **Start with smoke tests** - Verify basic functionality
2. **Run functional tests** - Validate API behavior
3. **Execute boundary tests** - Check edge cases

### Pre-Production

1. **Load testing** - Verify normal capacity
2. **Performance testing** - Comprehensive load patterns
3. **Stress testing** - Find breaking points

### Production Monitoring

1. **Regular smoke tests** - Health monitoring
2. **Scheduled load tests** - Performance regression detection
3. **Spike tests** - Traffic surge preparedness

## API Validation Coverage

### Request Validation

- ✅ Required fields presence
- ✅ Data type validation
- ✅ Value range checking
- ✅ Business rule enforcement
- ✅ Malformed input handling

### Response Validation

- ✅ HTTP status codes
- ✅ Response time limits
- ✅ JSON structure integrity
- ✅ Business data accuracy
- ✅ Error message clarity

### Performance Validation

- ✅ Response time thresholds
- ✅ Error rate limits
- ✅ Throughput measurements
- ✅ Concurrent user handling
- ✅ Resource utilization

## Reporting and Analysis

### Metrics Collected

- **Performance**: Response times, throughput, error rates
- **Functional**: Check pass rates, validation results
- **Business**: Order success rates, rule compliance
- **System**: Resource usage, failure patterns

### Output Formats

- JSON reports for detailed analysis
- Console output for real-time monitoring
- Tagged metrics for filtering and analysis
- Timestamped results for trend analysis

## Customization Guide

### Adding New Scenarios

1. Create new test file in `src/test/`
2. Define scenario configuration
3. Implement test logic with validations
4. Add to test runner script

### Modifying Load Patterns

- Adjust VU counts and durations
- Change ramp patterns for different load curves
- Modify sleep intervals for user behavior simulation
- Update thresholds based on requirements

### Extending Validation

- Add new business rule checks
- Implement custom performance metrics
- Create scenario-specific validations
- Add integration with monitoring systems

This test suite provides a solid foundation for testing pizza ordering APIs with k6, covering functional correctness, performance characteristics, and edge case handling.
