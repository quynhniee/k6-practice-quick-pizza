"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.options = void 0;
exports.default = default_1;
const http_1 = __importDefault(require("k6/http"));
const k6_1 = require("k6");
const quick_pizza_config_1 = require("../main/config/quick-pizza-config");
const constants_1 = require("../main/common/constants");
exports.options = {
    vus: 1,
    iterations: 1,
    thresholds: {
        'http_req_duration': ['p(95)<3000'],
        'http_req_failed': ['rate<0.05'],
        'checks': ['rate>0.95'],
    },
};
const testCases = {
    minimumValidOrder: {
        customName: "Simple Pizza",
        excludedIngredients: [],
        excludedTools: [],
        maxCaloriesPerSlice: 300,
        maxNumberOfToppings: 1,
        minNumberOfToppings: 1,
        mustBeVegetarian: false,
    },
    maximumValidOrder: {
        customName: "Supreme Loaded Pizza with Extra Everything",
        excludedIngredients: [],
        excludedTools: [],
        maxCaloriesPerSlice: 500,
        maxNumberOfToppings: 10,
        minNumberOfToppings: 8,
        mustBeVegetarian: false,
    },
    strictVegetarianOrder: {
        customName: "Vegan Delight",
        excludedIngredients: ["Pepperoni", "Sausage", "Bacon", "Ham", "Italian Sausage", "Anchovies"],
        excludedTools: [],
        maxCaloriesPerSlice: 250,
        maxNumberOfToppings: 6,
        minNumberOfToppings: 3,
        mustBeVegetarian: true,
    },
    lowCalorieOrder: {
        customName: "Diet Pizza",
        excludedIngredients: ["Cheese"],
        excludedTools: [],
        maxCaloriesPerSlice: 150,
        maxNumberOfToppings: 3,
        minNumberOfToppings: 1,
        mustBeVegetarian: true,
    },
    multipleExclusionsOrder: {
        customName: "Allergy-Safe Pizza",
        excludedIngredients: ["Cheese", "Mushrooms", "Onions", "Green Peppers"],
        excludedTools: ["Scissors"],
        maxCaloriesPerSlice: 200,
        maxNumberOfToppings: 4,
        minNumberOfToppings: 2,
        mustBeVegetarian: false,
    },
};
const invalidTestCases = {
    emptyName: {
        customName: "",
        excludedIngredients: [],
        excludedTools: [],
        maxCaloriesPerSlice: 300,
        maxNumberOfToppings: 5,
        minNumberOfToppings: 2,
        mustBeVegetarian: false,
    },
    negativeCalories: {
        customName: "Invalid Pizza",
        excludedIngredients: [],
        excludedTools: [],
        maxCaloriesPerSlice: -100,
        maxNumberOfToppings: 5,
        minNumberOfToppings: 2,
        mustBeVegetarian: false,
    },
    invalidToppingRange: {
        customName: "Invalid Range Pizza",
        excludedIngredients: [],
        excludedTools: [],
        maxCaloriesPerSlice: 300,
        maxNumberOfToppings: 2,
        minNumberOfToppings: 5,
        mustBeVegetarian: false,
    },
    zeroToppings: {
        customName: "No Toppings Pizza",
        excludedIngredients: [],
        excludedTools: [],
        maxCaloriesPerSlice: 300,
        maxNumberOfToppings: 0,
        minNumberOfToppings: 0,
        mustBeVegetarian: false,
    }
};
function default_1() {
    (0, k6_1.group)('Valid Order Scenarios', () => {
        Object.entries(testCases).forEach(([testName, orderData]) => {
            (0, k6_1.group)(`Test: ${testName}`, () => {
                testValidOrder(orderData, testName);
                (0, k6_1.sleep)(1);
            });
        });
    });
    (0, k6_1.group)('Invalid Order Scenarios', () => {
        Object.entries(invalidTestCases).forEach(([testName, orderData]) => {
            (0, k6_1.group)(`Test: ${testName}`, () => {
                testInvalidOrder(orderData, testName);
                (0, k6_1.sleep)(1);
            });
        });
    });
    (0, k6_1.group)('Edge Case Scenarios', () => {
        testLargePayload();
        testSpecialCharacters();
        (0, k6_1.sleep)(1);
    });
}
function testValidOrder(orderRequest, testName) {
    const url = `${quick_pizza_config_1.BASE_URL}/order-pizza`;
    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        tags: {
            name: 'order-pizza-functional',
            test_case: testName,
        },
    };
    console.log(`Testing valid order: ${testName}`);
    const response = http_1.default.post(url, JSON.stringify(orderRequest), params);
    (0, k6_1.check)(response, {
        [`${testName}: status is 200`]: (r) => r.status === constants_1.HTTP_STATUS.OK,
        [`${testName}: response time acceptable`]: (r) => r.timings.duration < 3000,
        [`${testName}: has response body`]: (r) => r.body !== null && typeof r.body === 'string' && r.body.length > 0,
    });
    if (response.status === constants_1.HTTP_STATUS.OK) {
        try {
            const orderResponse = JSON.parse(response.body);
            (0, k6_1.check)(orderResponse, {
                [`${testName}: has pizza object`]: (r) => r.pizza !== undefined && typeof r.pizza === 'object',
                [`${testName}: has calories`]: (r) => typeof r.calories === 'number' && r.calories > 0,
                [`${testName}: has vegetarian flag`]: (r) => typeof r.vegetarian === 'boolean',
            });
            if (orderRequest.mustBeVegetarian) {
                (0, k6_1.check)(orderResponse, {
                    [`${testName}: vegetarian requirement met`]: (r) => r.vegetarian === true,
                });
            }
            const caloriesPerSlice = orderResponse.calories / 8;
            (0, k6_1.check)(orderResponse, {
                [`${testName}: calories within limit`]: () => caloriesPerSlice <= orderRequest.maxCaloriesPerSlice,
            });
            if (orderRequest.excludedIngredients.length > 0) {
                const ingredientNames = orderResponse.pizza.ingredients.map(i => i.name);
                const hasExcludedIngredient = orderRequest.excludedIngredients.some(excluded => ingredientNames.includes(excluded));
                (0, k6_1.check)(orderResponse, {
                    [`${testName}: excluded ingredients not present`]: () => !hasExcludedIngredient,
                });
            }
            const toppingsCount = orderResponse.pizza.ingredients.length;
            (0, k6_1.check)(orderResponse, {
                [`${testName}: toppings count within range`]: () => toppingsCount >= orderRequest.minNumberOfToppings &&
                    toppingsCount <= orderRequest.maxNumberOfToppings,
            });
        }
        catch (e) {
            console.error(`Failed to parse response for ${testName}: ${e}`);
            (0, k6_1.check)(response, {
                [`${testName}: response is valid JSON`]: () => false,
            });
        }
    }
}
function testInvalidOrder(orderRequest, testName) {
    const url = `${quick_pizza_config_1.BASE_URL}/order-pizza`;
    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        tags: {
            name: 'order-pizza-invalid',
            test_case: testName,
        },
    };
    console.log(`Testing invalid order: ${testName}`);
    const response = http_1.default.post(url, JSON.stringify(orderRequest), params);
    (0, k6_1.check)(response, {
        [`${testName}: returns error status`]: (r) => r.status >= 400 && r.status < 500,
        [`${testName}: fast error response`]: (r) => r.timings.duration < 2000,
        [`${testName}: has error message`]: (r) => r.body !== null && typeof r.body === 'string' && r.body.length > 0,
    });
}
function testLargePayload() {
    const largeNameOrder = {
        customName: "A".repeat(1000),
        excludedIngredients: Array(50).fill("Mushrooms"),
        excludedTools: ["Knife", "Pizza cutter", "Scissors"],
        maxCaloriesPerSlice: 300,
        maxNumberOfToppings: 5,
        minNumberOfToppings: 2,
        mustBeVegetarian: false,
    };
    const url = `${quick_pizza_config_1.BASE_URL}/order-pizza`;
    const response = http_1.default.post(url, JSON.stringify(largeNameOrder));
    (0, k6_1.check)(response, {
        'Large payload: handled appropriately': (r) => r.status === 200 || (r.status >= 400 && r.status < 500),
        'Large payload: reasonable response time': (r) => r.timings.duration < 5000,
    });
}
function testSpecialCharacters() {
    const specialCharOrder = {
        customName: "Pizza 🍕 with émojis & spëcial chârs",
        excludedIngredients: ["Jalapeño", "Piña"],
        excludedTools: [],
        maxCaloriesPerSlice: 300,
        maxNumberOfToppings: 5,
        minNumberOfToppings: 2,
        mustBeVegetarian: false,
    };
    const url = `${quick_pizza_config_1.BASE_URL}/order-pizza`;
    const response = http_1.default.post(url, JSON.stringify(specialCharOrder));
    (0, k6_1.check)(response, {
        'Special chars: handled correctly': (r) => r.status === 200 || r.status === 400,
        'Special chars: response time acceptable': (r) => r.timings.duration < 3000,
    });
}
