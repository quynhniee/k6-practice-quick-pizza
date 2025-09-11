import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Options } from 'k6/options';
import { BASE_URL } from '../config/quick-pizza-config';
import { OrderPizzaRequest, OrderPizzaResponse } from '../common/interfaces';
import { HTTP_STATUS, THRESHOLDS } from '../common/constants';

// Functional test configuration
export const options: Options = {
    vus: 1,
    iterations: 1,
    thresholds: {
        'http_req_duration': ['p(95)<3000'],
        'http_req_failed': ['rate<0.05'],
        'checks': ['rate>0.95'],
    },
};

// Test data for functional scenarios
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
        minNumberOfToppings: 5, // min > max
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

export default function () {
    // Test valid scenarios
    group('Valid Order Scenarios', () => {
        Object.entries(testCases).forEach(([testName, orderData]) => {
            group(`Test: ${testName}`, () => {
                testValidOrder(orderData, testName);
                sleep(1);
            });
        });
    });

    // Test invalid scenarios
    group('Invalid Order Scenarios', () => {
        Object.entries(invalidTestCases).forEach(([testName, orderData]) => {
            group(`Test: ${testName}`, () => {
                testInvalidOrder(orderData, testName);
                sleep(1);
            });
        });
    });

    // Test edge cases
    group('Edge Case Scenarios', () => {
        testLargePayload();
        testSpecialCharacters();
        sleep(1);
    });
}

function testValidOrder(orderRequest: OrderPizzaRequest, testName: string) {
    const url = `${BASE_URL}/order-pizza`;

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
    const response = http.post(url, JSON.stringify(orderRequest), params);

    // Basic checks for valid orders
    check(response, {
        [`${testName}: status is 200`]: (r) => r.status === HTTP_STATUS.OK,
        [`${testName}: response time acceptable`]: (r) => r.timings.duration < 3000,
        [`${testName}: has response body`]: (r) => r.body !== null && typeof r.body === 'string' && r.body.length > 0,
    });

    if (response.status === HTTP_STATUS.OK) {
        try {
            const orderResponse: OrderPizzaResponse = JSON.parse(response.body as string);

            // Structural validation
            check(orderResponse, {
                [`${testName}: has pizza object`]: (r) => r.pizza !== undefined && typeof r.pizza === 'object',
                [`${testName}: has calories`]: (r) => typeof r.calories === 'number' && r.calories > 0,
                [`${testName}: has vegetarian flag`]: (r) => typeof r.vegetarian === 'boolean',
            });

            // Business rule validation
            if (orderRequest.mustBeVegetarian) {
                check(orderResponse, {
                    [`${testName}: vegetarian requirement met`]: (r) => r.vegetarian === true,
                });
            }

            // Calorie validation
            const caloriesPerSlice = orderResponse.calories / 8;
            check(orderResponse, {
                [`${testName}: calories within limit`]: () => caloriesPerSlice <= orderRequest.maxCaloriesPerSlice,
            });

            // Ingredient exclusions validation
            if (orderRequest.excludedIngredients.length > 0) {
                const ingredientNames = orderResponse.pizza.ingredients.map(i => i.name);
                const hasExcludedIngredient = orderRequest.excludedIngredients.some(excluded =>
                    ingredientNames.includes(excluded)
                );

                check(orderResponse, {
                    [`${testName}: excluded ingredients not present`]: () => !hasExcludedIngredient,
                });
            }

            // Topping count validation
            const toppingsCount = orderResponse.pizza.ingredients.length;
            check(orderResponse, {
                [`${testName}: toppings count within range`]: () =>
                    toppingsCount >= orderRequest.minNumberOfToppings &&
                    toppingsCount <= orderRequest.maxNumberOfToppings,
            });

        } catch (e) {
            console.error(`Failed to parse response for ${testName}: ${e}`);
            check(response, {
                [`${testName}: response is valid JSON`]: () => false,
            });
        }
    }
}

function testInvalidOrder(orderRequest: OrderPizzaRequest, testName: string) {
    const url = `${BASE_URL}/order-pizza`;

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
    const response = http.post(url, JSON.stringify(orderRequest), params);

    check(response, {
        [`${testName}: returns error status`]: (r) => r.status >= 400 && r.status < 500,
        [`${testName}: fast error response`]: (r) => r.timings.duration < 2000,
        [`${testName}: has error message`]: (r) => r.body !== null && typeof r.body === 'string' && r.body.length > 0,
    });
}

function testLargePayload() {
    // Test with a very large custom name
    const largeNameOrder: OrderPizzaRequest = {
        customName: "A".repeat(1000), // Very long name
        excludedIngredients: Array(50).fill("Mushrooms"), // Large exclusion list
        excludedTools: ["Knife", "Pizza cutter", "Scissors"],
        maxCaloriesPerSlice: 300,
        maxNumberOfToppings: 5,
        minNumberOfToppings: 2,
        mustBeVegetarian: false,
    };

    const url = `${BASE_URL}/order-pizza`;
    const response = http.post(url, JSON.stringify(largeNameOrder));

    check(response, {
        'Large payload: handled appropriately': (r) => r.status === 200 || (r.status >= 400 && r.status < 500),
        'Large payload: reasonable response time': (r) => r.timings.duration < 5000,
    });
}

function testSpecialCharacters() {
    // Test with special characters and unicode
    const specialCharOrder: OrderPizzaRequest = {
        customName: "Pizza 🍕 with émojis & spëcial chârs",
        excludedIngredients: ["Jalapeño", "Piña"],
        excludedTools: [],
        maxCaloriesPerSlice: 300,
        maxNumberOfToppings: 5,
        minNumberOfToppings: 2,
        mustBeVegetarian: false,
    };

    const url = `${BASE_URL}/order-pizza`;
    const response = http.post(url, JSON.stringify(specialCharOrder));

    check(response, {
        'Special chars: handled correctly': (r) => r.status === 200 || r.status === 400,
        'Special chars: response time acceptable': (r) => r.timings.duration < 3000,
    });
}
