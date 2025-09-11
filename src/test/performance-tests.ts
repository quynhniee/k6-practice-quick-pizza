import http from 'k6/http';
import { check, sleep } from 'k6';
import { Options } from 'k6/options';
import { BASE_URL } from '../main/config/quick-pizza-config';
import { generateOrderPizzaRequest } from '../main/utils/generate-randomly-data';
import { HTTP_STATUS, THRESHOLDS } from '../main/common/constants';

// Performance test configuration with different scenarios
export const options: Options = {
    scenarios: {
        // Baseline load test
        baseline: {
            executor: 'constant-vus',
            vus: 5,
            duration: '5m',
            tags: { test_type: 'baseline' },
        },
        // Gradual ramp-up test
        ramp_up: {
            executor: 'ramping-vus',
            startTime: '5m',
            stages: [
                { duration: '2m', target: 5 },
                { duration: '5m', target: 15 },
                { duration: '5m', target: 25 },
                { duration: '5m', target: 15 },
                { duration: '2m', target: 0 },
            ],
            tags: { test_type: 'ramp_up' },
        },
        // Peak load test
        peak_load: {
            executor: 'constant-vus',
            vus: 30,
            duration: '10m',
            startTime: '24m',
            tags: { test_type: 'peak' },
        },
        // Stress test - push beyond normal capacity
        stress: {
            executor: 'ramping-vus',
            startTime: '34m',
            stages: [
                { duration: '2m', target: 50 },
                { duration: '5m', target: 100 },
                { duration: '2m', target: 150 },
                { duration: '5m', target: 150 },
                { duration: '5m', target: 100 },
                { duration: '2m', target: 0 },
            ],
            tags: { test_type: 'stress' },
        },
        // Spike test - sudden load increase
        spike: {
            executor: 'ramping-vus',
            startTime: '55m',
            stages: [
                { duration: '30s', target: 5 },
                { duration: '30s', target: 100 }, // Sudden spike
                { duration: '2m', target: 100 },
                { duration: '30s', target: 5 },
                { duration: '30s', target: 0 },
            ],
            tags: { test_type: 'spike' },
        },
    },
    thresholds: {
        // Global thresholds
        'http_req_duration': ['p(95)<3000', 'p(99)<5000'],
        'http_req_failed': ['rate<0.05'],
        'checks': ['rate>0.95'],

        // Scenario-specific thresholds
        'http_req_duration{test_type:baseline}': ['p(95)<1500'],
        'http_req_duration{test_type:ramp_up}': ['p(95)<2000'],
        'http_req_duration{test_type:peak}': ['p(95)<2500'],
        'http_req_duration{test_type:stress}': ['p(95)<4000'],
        'http_req_duration{test_type:spike}': ['p(95)<6000'],

        // Error rate thresholds by scenario
        'http_req_failed{test_type:baseline}': ['rate<0.01'],
        'http_req_failed{test_type:ramp_up}': ['rate<0.02'],
        'http_req_failed{test_type:peak}': ['rate<0.03'],
        'http_req_failed{test_type:stress}': ['rate<0.10'],
        'http_req_failed{test_type:spike}': ['rate<0.15'],
    },
};

// Performance test data patterns
const performancePatterns = [
    // 60% simple orders (fast processing)
    {
        weight: 60,
        generator: () => ({
            customName: `Quick Pizza ${__VU}-${__ITER}`,
            excludedIngredients: [],
            excludedTools: [],
            maxCaloriesPerSlice: 300,
            maxNumberOfToppings: 3,
            minNumberOfToppings: 1,
            mustBeVegetarian: false,
        })
    },
    // 25% medium complexity orders
    {
        weight: 25,
        generator: () => generateOrderPizzaRequest()
    },
    // 10% complex orders (more processing)
    {
        weight: 10,
        generator: () => ({
            customName: `Complex Pizza ${__VU}-${__ITER}`,
            excludedIngredients: ["Pepperoni", "Sausage", "Mushrooms"],
            excludedTools: ["Scissors"],
            maxCaloriesPerSlice: 200,
            maxNumberOfToppings: 8,
            minNumberOfToppings: 4,
            mustBeVegetarian: true,
        })
    },
    // 5% edge case orders
    {
        weight: 5,
        generator: () => ({
            customName: `Edge Case Pizza ${__VU}-${__ITER}`,
            excludedIngredients: ["Cheese", "Tomato Sauce", "Pepperoni", "Mushrooms", "Onions"],
            excludedTools: ["Knife", "Scissors"],
            maxCaloriesPerSlice: 150,
            maxNumberOfToppings: 10,
            minNumberOfToppings: 6,
            mustBeVegetarian: true,
        })
    }
];

// Cumulative weights for selection
const cumulativeWeights = performancePatterns.reduce((acc, pattern, index) => {
    acc[index] = (acc[index - 1] || 0) + pattern.weight;
    return acc;
}, {} as Record<number, number>);

function selectOrderPattern() {
    const random = Math.random() * 100;
    for (let i = 0; i < performancePatterns.length; i++) {
        if (random <= cumulativeWeights[i]) {
            return performancePatterns[i].generator();
        }
    }
    return performancePatterns[0].generator(); // fallback
}

export function setup() {
    console.log('Starting performance tests...');
    console.log(`Test scenarios: ${Object.keys(options.scenarios || {}).join(', ')}`);

    // Warm up the API
    const warmupUrl = `${BASE_URL}/health`;
    const warmupResponse = http.get(warmupUrl);

    if (warmupResponse.status !== HTTP_STATUS.OK) {
        console.warn(`API warmup failed: ${warmupResponse.status}`);
    }

    return {
        startTime: new Date().toISOString(),
        testConfig: options.scenarios
    };
}

export default function (data: any) {
    const testType = __ENV.TEST_TYPE || 'baseline';
    const orderRequest = selectOrderPattern();

    // Execute pizza order with performance monitoring
    performanceOrderTest(orderRequest, testType);

    // Variable sleep based on test type to simulate different user behaviors
    let sleepDuration: number;
    switch (testType) {
        case 'baseline':
            sleepDuration = Math.random() * 2 + 1; // 1-3 seconds
            break;
        case 'ramp_up':
            sleepDuration = Math.random() * 1.5 + 0.5; // 0.5-2 seconds
            break;
        case 'peak':
            sleepDuration = Math.random() * 1 + 0.5; // 0.5-1.5 seconds
            break;
        case 'stress':
            sleepDuration = Math.random() * 0.5 + 0.2; // 0.2-0.7 seconds
            break;
        case 'spike':
            sleepDuration = Math.random() * 0.3 + 0.1; // 0.1-0.4 seconds
            break;
        default:
            sleepDuration = Math.random() * 2 + 1;
    }

    sleep(sleepDuration);
}

function performanceOrderTest(orderRequest: any, testType: string) {
    const url = `${BASE_URL}/order-pizza`;

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': `k6-performance-test-${testType}`,
        },
        tags: {
            name: 'order-pizza-performance',
            test_type: testType,
            vu: `${__VU}`,
            iteration: `${__ITER}`,
        },
    };

    // Record request start time for custom metrics
    const startTime = Date.now();

    // Make the API request
    const response = http.post(url, JSON.stringify(orderRequest), params);

    // Record custom timing metric
    const requestDuration = Date.now() - startTime;

    // Performance-focused checks
    const performanceChecks = {
        'response received': (r: any) => r.status !== undefined,
        'status is success or client error': (r: any) => r.status < 500,
        'response time acceptable': (r: any) => {
            // Different thresholds based on test type
            switch (testType) {
                case 'baseline': return r.timings.duration < 1500;
                case 'ramp_up': return r.timings.duration < 2000;
                case 'peak': return r.timings.duration < 2500;
                case 'stress': return r.timings.duration < 4000;
                case 'spike': return r.timings.duration < 6000;
                default: return r.timings.duration < 3000;
            }
        },
        'no server errors': (r: any) => r.status < 500,
    };

    check(response, performanceChecks);

    // Additional checks for successful responses
    if (response.status === HTTP_STATUS.OK) {
        check(response, {
            'valid response structure': (r) => {
                try {
                    const data = JSON.parse(r.body as string);
                    return data.pizza && data.calories && typeof data.vegetarian === 'boolean';
                } catch {
                    return false;
                }
            }
        });
    }

    // Log performance issues
    if (response.timings.duration > 3000) {
        console.warn(`Slow response: ${response.timings.duration}ms for ${testType} (VU: ${__VU}, Iter: ${__ITER})`);
    }

    if (response.status >= 500) {
        console.error(`Server error: ${response.status} for ${testType} (VU: ${__VU}, Iter: ${__ITER})`);
    }
}

export function teardown(data: any) {
    const endTime = new Date().toISOString();
    console.log(`Performance test completed at: ${endTime}`);
    console.log(`Performance test started at: ${data.startTime}`);
    console.log('Performance test scenarios executed:', Object.keys(data.testConfig || {}));
}
