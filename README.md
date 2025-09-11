# k6 Pizza API Test Suite

This repository contains comprehensive k6 test scenarios for testing a pizza ordering API. The test suite includes various types of performance, functional, and boundary tests.

## Test Structure

```
src/
├── main/
│   ├── common/
│   │   ├── constants.ts       # Test constants and configuration
│   │   └── interfaces.ts      # TypeScript interfaces
│   ├── config/
│   │   └── quick-pizza-config.ts  # API configuration
│   └── utils/
│       └── generate-randomly-data.ts  # Data generation utilities
└── test/
    ├── order-pizza.ts         # Main comprehensive test scenarios
    ├── functional-tests.ts    # Functional API behavior tests
    ├── performance-tests.ts   # Performance-focused tests
    └── boundary-tests.ts      # Boundary and edge case tests
```

## Test Scenarios

### 1. Main Test Suite (`order-pizza.ts`)

Comprehensive test with multiple execution scenarios:

- **Smoke Test**: 1 VU for 1 minute - Basic functionality verification
- **Load Test**: Ramp up to 10 VUs - Normal expected load
- **Stress Test**: Ramp up to 30 VUs - Beyond normal capacity
- **Spike Test**: Sudden spike to 50 VUs - Traffic surge simulation

**Features:**

- Mixed order types (70% valid, 15% vegetarian, 10% restricted, 5% invalid)
- Business rule validation
- Performance thresholds
- Error handling verification

### 2. Functional Tests (`functional-tests.ts`)

Focused on API behavior and business logic:

- **Valid Order Scenarios**: Various pizza configurations
- **Invalid Order Scenarios**: Error handling verification
- **Edge Cases**: Large payloads, special characters
- **Business Rules**: Vegetarian requirements, calorie limits, ingredient exclusions

**Test Cases:**

- Minimum and maximum valid orders
- Strict vegetarian orders
- Low-calorie diet pizzas
- Multiple ingredient/tool exclusions
- Invalid input validation

### 3. Performance Tests (`performance-tests.ts`)

Comprehensive performance testing with multiple scenarios:

- **Baseline**: 5 VUs for 5 minutes
- **Ramp Up**: Gradual increase to 25 VUs
- **Peak Load**: 30 VUs for 10 minutes
- **Stress**: Up to 150 VUs
- **Spike**: Sudden jump to 100 VUs

**Performance Patterns:**

- 60% simple orders (fast processing)
- 25% medium complexity orders
- 10% complex orders (more processing)
- 5% edge case orders

### 4. Boundary Tests (`boundary-tests.ts`)

Testing edge cases and boundaries:

- **Calorie Boundaries**: Zero, negative, extreme values
- **Topping Boundaries**: Min/max ranges, invalid combinations
- **Name Length**: Empty, very long, special characters
- **Data Types**: Invalid types, malformed JSON
- **Unicode**: International characters, emojis

## Quick Start

### Prerequisites

1. Install k6: https://k6.io/docs/getting-started/installation/
2. Install Node.js and npm
3. Install dependencies: `npm install`

### Running Tests

```bash
# Install dependencies
npm install

# Check k6 installation
npm run check

# Run all tests
npm test

# Individual test types
npm run test:smoke          # Quick smoke test
npm run test:load           # Load test
npm run test:stress         # Stress test
npm run test:functional     # Functional tests
npm run test:boundary       # Boundary tests
npm run test:performance    # Performance tests

# Clean old reports
npm run clean
```

### Using the Test Runner Script

```bash
# Make script executable (if not already)
chmod +x scripts/run-tests.sh

# Run individual test types
./scripts/run-tests.sh smoke
./scripts/run-tests.sh load
./scripts/run-tests.sh functional
./scripts/run-tests.sh all

# View help
./scripts/run-tests.sh help
```

## Test Configuration

### Environment Variables

- `TEST_TYPE`: Specify test type (smoke, load, stress, spike)
- `BASE_URL`: Override API base URL (default: https://quickpizza.grafana.com/api)

### Performance Thresholds

- **Response Time**: 95th percentile < 2s (varies by test type)
- **Error Rate**: < 5% for most scenarios
- **Check Success Rate**: > 95%

### Scenario-Specific Thresholds

- Smoke: p(95) < 1000ms
- Load: p(95) < 2000ms
- Stress: p(95) < 3000ms
- Spike: p(95) < 5000ms

## API Testing Coverage

### Order Pizza API (`/order-pizza`)

**Request Structure:**

```typescript
{
  customName: string;
  excludedIngredients: string[];
  excludedTools: string[];
  maxCaloriesPerSlice: number;
  maxNumberOfToppings: number;
  minNumberOfToppings: number;
  mustBeVegetarian: boolean;
}
```

**Response Structure:**

```typescript
{
  calories: number;
  pizza: {
    id: number;
    name: string;
    dough: {
      ID: number;
      name: string;
      caloriesPerSlice: number;
    }
    tool: string;
    ingredients: Array<{
      ID: number;
      name: string;
      caloriesPerSlice: number;
      vegetarian: boolean;
    }>;
  }
  vegetarian: boolean;
}
```

### Validation Checks

- Status code verification
- Response time validation
- Response structure validation
- Business rule compliance:
  - Vegetarian requirement enforcement
  - Calorie limit adherence
  - Ingredient exclusion compliance
  - Topping count validation

### Error Scenarios

- Empty/invalid pizza names
- Negative calorie limits
- Invalid topping ranges (min > max)
- Malformed JSON requests
- Large payload handling
- Special character processing

## Reports and Monitoring

Test results are saved in the `reports/` directory with timestamps:

- JSON format for detailed analysis
- Metrics include response times, error rates, throughput
- Check success rates and custom business logic validation

### Sample Metrics

- `http_req_duration`: Request response times
- `http_req_failed`: Error rate percentage
- `checks`: Validation check success rate
- `iterations`: Total test iterations completed
- `vus`: Virtual users active during test

## Customization

### Adding New Test Scenarios

1. Create new test file in `src/test/`
2. Import necessary modules and interfaces
3. Define test configuration and scenarios
4. Add to test runner script

### Modifying Test Data

- Update `src/main/utils/generate-randomly-data.ts` for random data generation
- Modify test case objects in individual test files
- Adjust constants in `src/main/common/constants.ts`

### Performance Tuning

- Adjust VU counts and duration in scenario configurations
- Modify thresholds based on performance requirements
- Update sleep intervals to simulate different user behaviors

## Best Practices

1. **Start Small**: Begin with smoke tests before running larger scenarios
2. **Monitor Resources**: Watch system resources during stress tests
3. **Analyze Results**: Review reports for performance bottlenecks
4. **Iterative Testing**: Run tests regularly during development
5. **Environment Consistency**: Use consistent test environments
6. **Data Variety**: Mix different types of requests for realistic testing

## Troubleshooting

### Common Issues

- **k6 not found**: Install k6 from https://k6.io/docs/getting-started/installation/
- **TypeScript errors**: Run `npm run build` to compile
- **Permission denied**: Make script executable with `chmod +x scripts/run-tests.sh`
- **High error rates**: Check API availability and reduce load

### Performance Tips

- Use appropriate VU counts for your system
- Monitor memory usage during long-running tests
- Consider distributed testing for very high loads
- Use tags for better result analysis

## Integration

This test suite can be integrated into CI/CD pipelines:

- Run smoke tests on every deployment
- Schedule regular performance tests
- Set up alerts based on threshold violations
- Generate trend reports for performance monitoring
