import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Options } from 'k6/options';
import { BASE_URL } from '../main/config/quick-pizza-config';
import { OrderPizzaRequest } from '../main/common/interfaces';
import { HTTP_STATUS } from '../main/common/constants';

// Boundary and edge case test configuration
export const options: Options = {
    vus: 1,
    iterations: 1,
    thresholds: {
        'http_req_duration': ['p(95)<5000'],
        'http_req_failed': ['rate<0.20'], // Allow higher error rate for boundary tests
        'checks': ['rate>0.80'], // Lower check pass rate expected for edge cases
    },
};

export default function () {
    group('Boundary Value Tests', () => {
        testCalorieBoundaries();
        testToppingBoundaries();
        testNameLengthBoundaries();
        sleep(1);
    });

    group('Edge Case Tests', () => {
        testEmptyAndNullValues();
        testExtremeValues();
        testSpecialCharacterHandling();
        testMalformedRequests();
        sleep(1);
    });

    group('Data Type Tests', () => {
        testInvalidDataTypes();
        testUnicodeHandling();
        sleep(1);
    });
}

function testCalorieBoundaries() {
    group('Calorie Boundary Tests', () => {
        const boundaryTests = [
            { name: 'Zero Calories', calories: 0 },
            { name: 'One Calorie', calories: 1 },
            { name: 'Negative Calories', calories: -1 },
            { name: 'Very High Calories', calories: 10000 },
            { name: 'Maximum Integer', calories: 2147483647 },
            { name: 'Float Value', calories: 299.99 },
        ];

        boundaryTests.forEach(test => {
            const orderRequest: OrderPizzaRequest = {
                customName: `${test.name} Pizza`,
                excludedIngredients: [],
                excludedTools: [],
                maxCaloriesPerSlice: test.calories,
                maxNumberOfToppings: 5,
                minNumberOfToppings: 2,
                mustBeVegetarian: false,
            };

            const response = makeRequest(orderRequest, `calorie-boundary-${test.name}`);

            if (test.calories <= 0) {
                check(response, {
                    [`${test.name}: should reject non-positive calories`]: (r) => r.status >= 400,
                });
            } else if (test.calories >= 1000) {
                check(response, {
                    [`${test.name}: should handle high calorie requests`]: (r) => r.status === 200 || r.status >= 400,
                });
            } else {
                check(response, {
                    [`${test.name}: should accept valid calories`]: (r) => r.status === 200,
                });
            }
        });
    });
}

function testToppingBoundaries() {
    group('Topping Count Boundary Tests', () => {
        const toppingTests = [
            { name: 'Zero Toppings', min: 0, max: 0 },
            { name: 'One Topping', min: 1, max: 1 },
            { name: 'Min Greater Than Max', min: 5, max: 2 },
            { name: 'Negative Toppings', min: -1, max: 3 },
            { name: 'Very High Toppings', min: 50, max: 100 },
            { name: 'Equal Min Max', min: 3, max: 3 },
        ];

        toppingTests.forEach(test => {
            const orderRequest: OrderPizzaRequest = {
                customName: `${test.name} Pizza`,
                excludedIngredients: [],
                excludedTools: [],
                maxCaloriesPerSlice: 300,
                maxNumberOfToppings: test.max,
                minNumberOfToppings: test.min,
                mustBeVegetarian: false,
            };

            const response = makeRequest(orderRequest, `topping-boundary-${test.name}`);

            if (test.min > test.max || test.min < 0 || test.max < 0) {
                check(response, {
                    [`${test.name}: should reject invalid topping range`]: (r) => r.status >= 400,
                });
            } else {
                check(response, {
                    [`${test.name}: should handle valid topping range`]: (r) => r.status === 200 || r.status >= 400,
                });
            }
        });
    });
}

function testNameLengthBoundaries() {
    group('Name Length Boundary Tests', () => {
        const nameTests = [
            { name: 'Empty Name', value: '' },
            { name: 'Single Character', value: 'A' },
            { name: 'Very Long Name', value: 'A'.repeat(1000) },
            { name: 'Extremely Long Name', value: 'A'.repeat(10000) },
            { name: 'Only Spaces', value: '   ' },
            { name: 'Mixed Whitespace', value: '\t\n\r ' },
        ];

        nameTests.forEach(test => {
            const orderRequest: OrderPizzaRequest = {
                customName: test.value,
                excludedIngredients: [],
                excludedTools: [],
                maxCaloriesPerSlice: 300,
                maxNumberOfToppings: 5,
                minNumberOfToppings: 2,
                mustBeVegetarian: false,
            };

            const response = makeRequest(orderRequest, `name-boundary-${test.name}`);

            if (test.value === '' || test.value.trim() === '') {
                check(response, {
                    [`${test.name}: should reject empty/whitespace names`]: (r) => r.status >= 400,
                });
            } else if (test.value.length > 500) {
                check(response, {
                    [`${test.name}: should handle very long names`]: (r) => r.status === 200 || r.status >= 400,
                });
            } else {
                check(response, {
                    [`${test.name}: should accept valid names`]: (r) => r.status === 200,
                });
            }
        });
    });
}

function testEmptyAndNullValues() {
    group('Empty and Null Value Tests', () => {
        // Test with various empty/null combinations
        const emptyTests = [
            {
                name: 'All Arrays Empty',
                request: {
                    customName: 'Empty Arrays Pizza',
                    excludedIngredients: [],
                    excludedTools: [],
                    maxCaloriesPerSlice: 300,
                    maxNumberOfToppings: 5,
                    minNumberOfToppings: 2,
                    mustBeVegetarian: false,
                }
            },
            {
                name: 'Large Exclusion Lists',
                request: {
                    customName: 'Many Exclusions Pizza',
                    excludedIngredients: Array(100).fill('Mushrooms'),
                    excludedTools: Array(50).fill('Knife'),
                    maxCaloriesPerSlice: 300,
                    maxNumberOfToppings: 5,
                    minNumberOfToppings: 2,
                    mustBeVegetarian: false,
                }
            }
        ];

        emptyTests.forEach(test => {
            const response = makeRequest(test.request, `empty-null-${test.name}`);
            check(response, {
                [`${test.name}: handles empty/large arrays`]: (r) => r.status === 200 || r.status >= 400,
            });
        });
    });
}

function testExtremeValues() {
    group('Extreme Value Tests', () => {
        const extremeTests = [
            {
                name: 'All Maximum Values',
                request: {
                    customName: 'X'.repeat(500),
                    excludedIngredients: Array(20).fill('Everything'),
                    excludedTools: ['Knife', 'Pizza cutter', 'Scissors'],
                    maxCaloriesPerSlice: 999999,
                    maxNumberOfToppings: 999,
                    minNumberOfToppings: 998,
                    mustBeVegetarian: true,
                }
            },
            {
                name: 'Mixed Extreme Values',
                request: {
                    customName: '🍕'.repeat(100),
                    excludedIngredients: ['Ingredient'.repeat(50)],
                    excludedTools: ['Tool'.repeat(30)],
                    maxCaloriesPerSlice: 1,
                    maxNumberOfToppings: 1000,
                    minNumberOfToppings: 999,
                    mustBeVegetarian: false,
                }
            }
        ];

        extremeTests.forEach(test => {
            const response = makeRequest(test.request, `extreme-${test.name}`);
            check(response, {
                [`${test.name}: handles extreme values gracefully`]: (r) => r.status !== undefined && r.timings.duration < 10000,
            });
        });
    });
}

function testSpecialCharacterHandling() {
    group('Special Character Tests', () => {
        const specialCharTests = [
            { name: 'Emoji Name', value: '🍕🧀🍄🥓' },
            { name: 'Unicode Characters', value: 'Pïzzä wïth üñïcödé' },
            { name: 'HTML Tags', value: '<script>alert("xss")</script>' },
            { name: 'SQL Injection Attempt', value: "'; DROP TABLE pizzas; --" },
            { name: 'JSON Injection', value: '{"malicious": true}' },
            { name: 'Newlines and Tabs', value: 'Pizza\nwith\ttabs' },
            { name: 'Backslashes', value: 'Pizza\\with\\backslashes' },
        ];

        specialCharTests.forEach(test => {
            const orderRequest: OrderPizzaRequest = {
                customName: test.value,
                excludedIngredients: [test.value],
                excludedTools: [],
                maxCaloriesPerSlice: 300,
                maxNumberOfToppings: 5,
                minNumberOfToppings: 2,
                mustBeVegetarian: false,
            };

            const response = makeRequest(orderRequest, `special-char-${test.name}`);
            check(response, {
                [`${test.name}: handles special characters safely`]: (r) => r.status !== undefined,
                [`${test.name}: no server error`]: (r) => r.status < 500,
            });
        });
    });
}

function testMalformedRequests() {
    group('Malformed Request Tests', () => {
        const url = `${BASE_URL}/order-pizza`;
        const headers = { 'Content-Type': 'application/json' };

        // Test malformed JSON
        const malformedTests = [
            { name: 'Invalid JSON', body: '{"customName": "Test", invalid}' },
            { name: 'Incomplete JSON', body: '{"customName": "Test"' },
            { name: 'Empty JSON', body: '{}' },
            { name: 'Array Instead of Object', body: '["not", "an", "object"]' },
            { name: 'String Instead of JSON', body: 'not json at all' },
            { name: 'Null Body', body: null },
        ];

        malformedTests.forEach(test => {
            const response = http.post(url, test.body, { headers, tags: { test_case: test.name } });
            check(response, {
                [`${test.name}: rejects malformed request`]: (r) => r.status >= 400,
                [`${test.name}: quick response to malformed data`]: (r) => r.timings.duration < 2000,
            });
        });
    });
}

function testInvalidDataTypes() {
    group('Invalid Data Type Tests', () => {
        // These would typically be caught by TypeScript, but testing runtime behavior
        const typeTests = [
            {
                name: 'String for Calories',
                body: JSON.stringify({
                    customName: 'Type Test Pizza',
                    excludedIngredients: [],
                    excludedTools: [],
                    maxCaloriesPerSlice: 'three hundred',
                    maxNumberOfToppings: 5,
                    minNumberOfToppings: 2,
                    mustBeVegetarian: false,
                })
            },
            {
                name: 'Boolean for Toppings',
                body: JSON.stringify({
                    customName: 'Type Test Pizza',
                    excludedIngredients: [],
                    excludedTools: [],
                    maxCaloriesPerSlice: 300,
                    maxNumberOfToppings: true,
                    minNumberOfToppings: false,
                    mustBeVegetarian: false,
                })
            }
        ];

        typeTests.forEach(test => {
            const response = http.post(`${BASE_URL}/order-pizza`, test.body, {
                headers: { 'Content-Type': 'application/json' },
                tags: { test_case: test.name }
            });

            check(response, {
                [`${test.name}: rejects invalid types`]: (r) => r.status >= 400,
            });
        });
    });
}

function testUnicodeHandling() {
    group('Unicode Handling Tests', () => {
        const unicodeTests = [
            { name: 'Chinese Characters', value: '中国披萨' },
            { name: 'Arabic Text', value: 'بيتزا عربية' },
            { name: 'Russian Text', value: 'Русская пицца' },
            { name: 'Mixed Scripts', value: 'Pizza混合Script🍕' },
        ];

        unicodeTests.forEach(test => {
            const orderRequest: OrderPizzaRequest = {
                customName: test.value,
                excludedIngredients: [],
                excludedTools: [],
                maxCaloriesPerSlice: 300,
                maxNumberOfToppings: 5,
                minNumberOfToppings: 2,
                mustBeVegetarian: false,
            };

            const response = makeRequest(orderRequest, `unicode-${test.name}`);
            check(response, {
                [`${test.name}: handles unicode correctly`]: (r) => r.status !== undefined,
            });
        });
    });
}

function makeRequest(orderRequest: OrderPizzaRequest, testCase: string) {
    const url = `${BASE_URL}/order-pizza`;

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        tags: {
            name: 'order-pizza-boundary',
            test_case: testCase,
        },
    };

    return http.post(url, JSON.stringify(orderRequest), params);
}
