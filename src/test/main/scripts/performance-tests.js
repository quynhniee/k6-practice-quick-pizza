"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.options = void 0;
exports.setup = setup;
exports.default = default_1;
exports.teardown = teardown;
const http_1 = __importDefault(require("k6/http"));
const k6_1 = require("k6");
const quick_pizza_config_1 = require("../config/quick-pizza-config");
const generate_randomly_data_1 = require("../utils/generate-randomly-data");
const constants_1 = require("../common/constants");
exports.options = {
    scenarios: {
        baseline: {
            executor: 'constant-vus',
            vus: 5,
            duration: '5m',
            tags: { test_type: 'baseline' },
        },
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
        peak_load: {
            executor: 'constant-vus',
            vus: 30,
            duration: '10m',
            startTime: '24m',
            tags: { test_type: 'peak' },
        },
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
        spike: {
            executor: 'ramping-vus',
            startTime: '55m',
            stages: [
                { duration: '30s', target: 5 },
                { duration: '30s', target: 100 },
                { duration: '2m', target: 100 },
                { duration: '30s', target: 5 },
                { duration: '30s', target: 0 },
            ],
            tags: { test_type: 'spike' },
        },
    },
    thresholds: {
        'http_req_duration': ['p(95)<3000', 'p(99)<5000'],
        'http_req_failed': ['rate<0.05'],
        'checks': ['rate>0.95'],
        'http_req_duration{test_type:baseline}': ['p(95)<1500'],
        'http_req_duration{test_type:ramp_up}': ['p(95)<2000'],
        'http_req_duration{test_type:peak}': ['p(95)<2500'],
        'http_req_duration{test_type:stress}': ['p(95)<4000'],
        'http_req_duration{test_type:spike}': ['p(95)<6000'],
        'http_req_failed{test_type:baseline}': ['rate<0.01'],
        'http_req_failed{test_type:ramp_up}': ['rate<0.02'],
        'http_req_failed{test_type:peak}': ['rate<0.03'],
        'http_req_failed{test_type:stress}': ['rate<0.10'],
        'http_req_failed{test_type:spike}': ['rate<0.15'],
    },
};
const performancePatterns = [
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
    {
        weight: 25,
        generator: () => (0, generate_randomly_data_1.generateOrderPizzaRequest)()
    },
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
const cumulativeWeights = performancePatterns.reduce((acc, pattern, index) => {
    acc[index] = (acc[index - 1] || 0) + pattern.weight;
    return acc;
}, {});
function selectOrderPattern() {
    const random = Math.random() * 100;
    for (let i = 0; i < performancePatterns.length; i++) {
        if (random <= cumulativeWeights[i]) {
            return performancePatterns[i].generator();
        }
    }
    return performancePatterns[0].generator();
}
function setup() {
    console.log('Starting performance tests...');
    console.log(`Test scenarios: ${Object.keys(exports.options.scenarios || {}).join(', ')}`);
    const warmupUrl = `${quick_pizza_config_1.BASE_URL}/health`;
    const warmupResponse = http_1.default.get(warmupUrl);
    if (warmupResponse.status !== constants_1.HTTP_STATUS.OK) {
        console.warn(`API warmup failed: ${warmupResponse.status}`);
    }
    return {
        startTime: new Date().toISOString(),
        testConfig: exports.options.scenarios
    };
}
function default_1(data) {
    const testType = __ENV.TEST_TYPE || 'baseline';
    const orderRequest = selectOrderPattern();
    performanceOrderTest(orderRequest, testType);
    let sleepDuration;
    switch (testType) {
        case 'baseline':
            sleepDuration = Math.random() * 2 + 1;
            break;
        case 'ramp_up':
            sleepDuration = Math.random() * 1.5 + 0.5;
            break;
        case 'peak':
            sleepDuration = Math.random() * 1 + 0.5;
            break;
        case 'stress':
            sleepDuration = Math.random() * 0.5 + 0.2;
            break;
        case 'spike':
            sleepDuration = Math.random() * 0.3 + 0.1;
            break;
        default:
            sleepDuration = Math.random() * 2 + 1;
    }
    (0, k6_1.sleep)(sleepDuration);
}
function performanceOrderTest(orderRequest, testType) {
    const url = `${quick_pizza_config_1.BASE_URL}/order-pizza`;
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
    const startTime = Date.now();
    const response = http_1.default.post(url, JSON.stringify(orderRequest), params);
    const requestDuration = Date.now() - startTime;
    const performanceChecks = {
        'response received': (r) => r.status !== undefined,
        'status is success or client error': (r) => r.status < 500,
        'response time acceptable': (r) => {
            switch (testType) {
                case 'baseline': return r.timings.duration < 1500;
                case 'ramp_up': return r.timings.duration < 2000;
                case 'peak': return r.timings.duration < 2500;
                case 'stress': return r.timings.duration < 4000;
                case 'spike': return r.timings.duration < 6000;
                default: return r.timings.duration < 3000;
            }
        },
        'no server errors': (r) => r.status < 500,
    };
    (0, k6_1.check)(response, performanceChecks);
    if (response.status === constants_1.HTTP_STATUS.OK) {
        (0, k6_1.check)(response, {
            'valid response structure': (r) => {
                try {
                    const data = JSON.parse(r.body);
                    return data.pizza && data.calories && typeof data.vegetarian === 'boolean';
                }
                catch (_a) {
                    return false;
                }
            }
        });
    }
    if (response.timings.duration > 3000) {
        console.warn(`Slow response: ${response.timings.duration}ms for ${testType} (VU: ${__VU}, Iter: ${__ITER})`);
    }
    if (response.status >= 500) {
        console.error(`Server error: ${response.status} for ${testType} (VU: ${__VU}, Iter: ${__ITER})`);
    }
}
function teardown(data) {
    const endTime = new Date().toISOString();
    console.log(`Performance test completed at: ${endTime}`);
    console.log(`Performance test started at: ${data.startTime}`);
    console.log('Performance test scenarios executed:', Object.keys(data.testConfig || {}));
}
