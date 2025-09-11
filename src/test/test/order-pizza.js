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
const quick_pizza_config_1 = require("../main/config/quick-pizza-config");
const generate_randomly_data_1 = require("../main/utils/generate-randomly-data");
const constants_1 = require("../main/common/constants");
exports.options = {
    scenarios: {
        smoke_test: {
            executor: 'constant-vus',
            vus: 1,
            duration: '1m',
            tags: { test_type: 'smoke' },
        },
        load_test: {
            executor: 'ramping-vus',
            stages: [
                { duration: '2m', target: 10 },
                { duration: '5m', target: 10 },
                { duration: '2m', target: 0 },
            ],
            tags: { test_type: 'load' },
        },
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
        spike_test: {
            executor: 'ramping-vus',
            stages: [
                { duration: '1m', target: 5 },
                { duration: '1m', target: 50 },
                { duration: '3m', target: 50 },
                { duration: '1m', target: 5 },
                { duration: '1m', target: 0 },
            ],
            tags: { test_type: 'spike' },
        },
    },
    thresholds: {
        'http_req_duration': [constants_1.THRESHOLDS.HTTP_REQ_DURATION],
        'http_req_failed': [constants_1.THRESHOLDS.HTTP_REQ_FAILED],
        'checks': [constants_1.THRESHOLDS.CHECKS],
        'http_req_duration{test_type:smoke}': ['p(95)<1000'],
        'http_req_duration{test_type:load}': ['p(95)<2000'],
        'http_req_duration{test_type:stress}': ['p(95)<3000'],
        'http_req_duration{test_type:spike}': ['p(95)<5000'],
    },
};
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
        minNumberOfToppings: 5,
        mustBeVegetarian: false,
    }
};
function setup() {
    console.log('Starting pizza ordering tests...');
    const healthCheck = http_1.default.get(`${quick_pizza_config_1.BASE_URL}/health`);
    if (healthCheck.status !== constants_1.HTTP_STATUS.OK) {
        console.warn(`API health check failed: ${healthCheck.status}`);
    }
    return { timestamp: new Date().toISOString() };
}
function default_1(data) {
    const testType = __ENV.TEST_TYPE || 'load';
    let orderRequest;
    const iteration = __ITER % 100;
    if (iteration < 70) {
        orderRequest = (0, generate_randomly_data_1.generateOrderPizzaRequest)();
    }
    else if (iteration < 85) {
        orderRequest = testData.vegetarianOrder;
    }
    else if (iteration < 95) {
        orderRequest = testData.restrictedOrder;
    }
    else {
        orderRequest = testData.invalidOrder;
    }
    orderPizzaTest(orderRequest, testType);
    (0, k6_1.sleep)(Math.random() * 2 + 1);
}
function orderPizzaTest(orderRequest, testType) {
    const url = `${quick_pizza_config_1.BASE_URL}/order-pizza`;
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
    const response = http_1.default.post(url, JSON.stringify(orderRequest), params);
    const isValidRequest = orderRequest.customName !== "" &&
        orderRequest.maxCaloriesPerSlice > 0 &&
        orderRequest.minNumberOfToppings <= orderRequest.maxNumberOfToppings;
    if (isValidRequest) {
        (0, k6_1.check)(response, {
            'status is 200': (r) => r.status === constants_1.HTTP_STATUS.OK,
            'response time < 2000ms': (r) => r.timings.duration < 2000,
            'response has body': (r) => r.body !== null && typeof r.body === 'string' && r.body.length > 0,
        });
        if (response.status === constants_1.HTTP_STATUS.OK) {
            try {
                const orderResponse = JSON.parse(response.body);
                (0, k6_1.check)(orderResponse, {
                    'response has pizza': (r) => r.pizza !== undefined,
                    'response has calories': (r) => r.calories !== undefined && r.calories > 0,
                    'response has vegetarian flag': (r) => typeof r.vegetarian === 'boolean',
                    'pizza has valid ID': (r) => r.pizza && r.pizza.id > 0,
                    'pizza has name': (r) => r.pizza && r.pizza.name !== undefined && r.pizza.name.length > 0,
                    'pizza has dough': (r) => r.pizza && r.pizza.dough !== undefined,
                    'pizza has ingredients': (r) => r.pizza && Array.isArray(r.pizza.ingredients),
                });
                if (orderRequest.mustBeVegetarian) {
                    (0, k6_1.check)(orderResponse, {
                        'vegetarian order returns vegetarian pizza': (r) => r.vegetarian === true,
                    });
                }
                if (orderRequest.maxCaloriesPerSlice > 0) {
                    (0, k6_1.check)(orderResponse, {
                        'calories per slice within limit': (r) => {
                            const caloriesPerSlice = r.calories / 8;
                            return caloriesPerSlice <= orderRequest.maxCaloriesPerSlice;
                        }
                    });
                }
                if (orderRequest.excludedIngredients.length > 0) {
                    (0, k6_1.check)(orderResponse, {
                        'excluded ingredients not present': (r) => {
                            const ingredientNames = r.pizza.ingredients.map(i => i.name);
                            return !orderRequest.excludedIngredients.some(excluded => ingredientNames.includes(excluded));
                        }
                    });
                }
            }
            catch (e) {
                console.error(`Failed to parse response: ${e}`);
                (0, k6_1.check)(response, {
                    'response is valid JSON': () => false,
                });
            }
        }
    }
    else {
        (0, k6_1.check)(response, {
            'status is 4xx for invalid request': (r) => r.status >= 400 && r.status < 500,
            'error response time < 1000ms': (r) => r.timings.duration < 1000,
        });
    }
    if (response.status >= 400) {
        console.log(`Error ${response.status}: ${response.body}`);
    }
}
function teardown(data) {
    console.log(`Test completed at: ${new Date().toISOString()}`);
    console.log(`Test started at: ${data.timestamp}`);
}
