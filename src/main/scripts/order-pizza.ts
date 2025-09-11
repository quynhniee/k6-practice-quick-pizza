import http from 'k6/http';
import { check, sleep } from 'k6';
import { Options } from 'k6/options';
import { BASE_URL } from '../config/quick-pizza-config';
import { generateOrderPizzaRequest } from '../utils/generate-randomly-data';
import { OrderPizzaRequest, OrderPizzaResponse } from '../common/interfaces';
import { HTTP_STATUS, THRESHOLDS } from '../common/constants';

// Test configuration
export const options: Options = {
    scenarios: {
        // Smoke test - minimal load to verify basic functionality
        smoke_test: {
            executor: 'constant-vus',
            vus: 1,
            duration: '1m',
            tags: { test_type: 'smoke' },
        },
        // Load test - normal expected load
        load_test: {
            executor: 'ramping-vus',
            stages: [
                { duration: '2m', target: 10 }, // Ramp up
                { duration: '5m', target: 10 }, // Steady state
                { duration: '2m', target: 0 },  // Ramp down
            ],
            tags: { test_type: 'load' },
        },
        // Stress test - beyond normal capacity
        stress_test: {
            executor: 'ramping-vus',
            stages: [
                { duration: '2m', target: 10 },
                { duration: '5m', target: 20 },
                { duration: '2m', target: 30 },
                { duration: '5m', target: 30 },
                { duration: '2m', target: 0 },
            ],
            tags: { test_type: 'stress' },
        },
        // Spike test - sudden traffic increase
        spike_test: {
            executor: 'ramping-vus',
            stages: [
                { duration: '1m', target: 5 },
                { duration: '1m', target: 50 }, // Spike
                { duration: '3m', target: 50 },
                { duration: '1m', target: 5 },
                { duration: '1m', target: 0 },
            ],
            tags: { test_type: 'spike' },
        },
    },
    thresholds: {
        'http_req_duration': [THRESHOLDS.HTTP_REQ_DURATION],
        'http_req_failed': [THRESHOLDS.HTTP_REQ_FAILED],
        'checks': [THRESHOLDS.CHECKS],
        // Scenario-specific thresholds
        'http_req_duration{test_type:smoke}': ['p(95)<1000'],
        'http_req_duration{test_type:load}': ['p(95)<2000'],
        'http_req_duration{test_type:stress}': ['p(95)<3000'],
        'http_req_duration{test_type:spike}': ['p(95)<5000'],
    },
};

// Test data for different scenarios
const testData = {
    validOrder: {
        customName: "Delicious Margherita",
        excludedIngredients: [],
        excludedTools: [],
        maxCaloriesPerSlice: 300,
        maxNumberOfToppings: 5,
        minNumberOfToppings: 2,
        mustBeVegetarian: false,
    },
    vegetarianOrder: {
        customName: "Veggie Supreme",
        excludedIngredients: ["Pepperoni", "Sausage", "Bacon"],
        excludedTools: [],
        maxCaloriesPerSlice: 250,
        maxNumberOfToppings: 6,
        minNumberOfToppings: 3,
        mustBeVegetarian: true,
    },
    restrictedOrder: {
        customName: "Allergy-Friendly Pizza",
        excludedIngredients: ["Cheese", "Mushrooms", "Onions"],
        excludedTools: ["Scissors"],
        maxCaloriesPerSlice: 200,
        maxNumberOfToppings: 3,
        minNumberOfToppings: 1,
        mustBeVegetarian: false,
    },
    invalidOrder: {
        customName: "",
        excludedIngredients: [],
        excludedTools: [],
        maxCaloriesPerSlice: -1,
        maxNumberOfToppings: 0,
        minNumberOfToppings: 5, // min > max (invalid)
        mustBeVegetarian: false,
    }
};

// Setup function - runs once per VU
export function setup() {
    console.log('Starting pizza ordering tests...');

    // Verify API availability
    const healthCheck = http.get(`${BASE_URL}/health`);
    if (healthCheck.status !== HTTP_STATUS.OK) {
        console.warn(`API health check failed: ${healthCheck.status}`);
    }

    return { timestamp: new Date().toISOString() };
}

// Main test function
export default function (data: any) {
    const testType = __ENV.TEST_TYPE || 'load';

    // Choose test scenario based on iteration
    let orderRequest: OrderPizzaRequest;
    const iteration = __ITER % 100;

    if (iteration < 70) {
        // 70% valid orders
        orderRequest = generateOrderPizzaRequest();
    } else if (iteration < 85) {
        // 15% vegetarian orders
        orderRequest = testData.vegetarianOrder;
    } else if (iteration < 95) {
        // 10% restricted orders
        orderRequest = testData.restrictedOrder;
    } else {
        // 5% invalid orders (to test error handling)
        orderRequest = testData.invalidOrder;
    }

    // Execute the pizza order test
    orderPizzaTest(orderRequest, testType);

    // Random sleep between 1-3 seconds to simulate user behavior
    sleep(Math.random() * 2 + 1);
}

function orderPizzaTest(orderRequest: OrderPizzaRequest, testType: string) {
    const url = `${BASE_URL}/order-pizza`;

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        tags: {
            name: 'order-pizza',
            test_type: testType,
        },
    };

    // Make the API request
    const response = http.post(url, JSON.stringify(orderRequest), params);

    // Basic response checks
    const isValidRequest = orderRequest.customName !== "" &&
        orderRequest.maxCaloriesPerSlice > 0 &&
        orderRequest.minNumberOfToppings <= orderRequest.maxNumberOfToppings;

    if (isValidRequest) {
        // Checks for valid requests
        check(response, {
            'status is 200': (r) => r.status === HTTP_STATUS.OK,
            'response time < 2000ms': (r) => r.timings.duration < 2000,
            'response has body': (r) => r.body !== null && typeof r.body === 'string' && r.body.length > 0,
        });

        // Parse and validate response body for successful requests
        if (response.status === HTTP_STATUS.OK) {
            try {
                const orderResponse: OrderPizzaResponse = JSON.parse(response.body as string);

                check(orderResponse, {
                    'response has pizza': (r) => r.pizza !== undefined,
                    'response has calories': (r) => r.calories !== undefined && r.calories > 0,
                    'response has vegetarian flag': (r) => typeof r.vegetarian === 'boolean',
                    'pizza has valid ID': (r) => r.pizza && r.pizza.id > 0,
                    'pizza has name': (r) => r.pizza && r.pizza.name !== undefined && r.pizza.name.length > 0,
                    'pizza has dough': (r) => r.pizza && r.pizza.dough !== undefined,
                    'pizza has ingredients': (r) => r.pizza && Array.isArray(r.pizza.ingredients),
                });

                // Validate business rules
                if (orderRequest.mustBeVegetarian) {
                    check(orderResponse, {
                        'vegetarian order returns vegetarian pizza': (r) => r.vegetarian === true,
                    });
                }

                if (orderRequest.maxCaloriesPerSlice > 0) {
                    check(orderResponse, {
                        'calories per slice within limit': (r) => {
                            const caloriesPerSlice = r.calories / 8; // Assuming 8 slices per pizza
                            return caloriesPerSlice <= orderRequest.maxCaloriesPerSlice;
                        }
                    });
                }

                // Check excluded ingredients
                if (orderRequest.excludedIngredients.length > 0) {
                    check(orderResponse, {
                        'excluded ingredients not present': (r) => {
                            const ingredientNames = r.pizza.ingredients.map(i => i.name);
                            return !orderRequest.excludedIngredients.some(excluded =>
                                ingredientNames.includes(excluded)
                            );
                        }
                    });
                }

            } catch (e) {
                console.error(`Failed to parse response: ${e}`);
                check(response, {
                    'response is valid JSON': () => false,
                });
            }
        }
    } else {
        // Checks for invalid requests - should return error
        check(response, {
            'status is 4xx for invalid request': (r) => r.status >= 400 && r.status < 500,
            'error response time < 1000ms': (r) => r.timings.duration < 1000,
        });
    }

    // Log errors for debugging
    if (response.status >= 400) {
        console.log(`Error ${response.status}: ${response.body}`);
    }
}

// Teardown function - runs once after all VUs complete
export function teardown(data: any) {
    console.log(`Test completed at: ${new Date().toISOString()}`);
    console.log(`Test started at: ${data.timestamp}`);
}

