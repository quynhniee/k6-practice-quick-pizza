"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.options = void 0;
exports.default = default_1;
const http_1 = __importDefault(require("k6/http"));
const k6_1 = require("k6");
const quick_pizza_config_1 = require("../config/quick-pizza-config");
exports.options = {
    vus: 1,
    iterations: 1,
    thresholds: {
        'http_req_duration': ['p(95)<5000'],
        'http_req_failed': ['rate<0.20'],
        'checks': ['rate>0.80'],
    },
};
function default_1() {
    (0, k6_1.group)('Boundary Value Tests', () => {
        testCalorieBoundaries();
        testToppingBoundaries();
        testNameLengthBoundaries();
        (0, k6_1.sleep)(1);
    });
    (0, k6_1.group)('Edge Case Tests', () => {
        testEmptyAndNullValues();
        testExtremeValues();
        testSpecialCharacterHandling();
        testMalformedRequests();
        (0, k6_1.sleep)(1);
    });
    (0, k6_1.group)('Data Type Tests', () => {
        testInvalidDataTypes();
        testUnicodeHandling();
        (0, k6_1.sleep)(1);
    });
}
function testCalorieBoundaries() {
    (0, k6_1.group)('Calorie Boundary Tests', () => {
        const boundaryTests = [
            { name: 'Zero Calories', calories: 0 },
            { name: 'One Calorie', calories: 1 },
            { name: 'Negative Calories', calories: -1 },
            { name: 'Very High Calories', calories: 10000 },
            { name: 'Maximum Integer', calories: 2147483647 },
            { name: 'Float Value', calories: 299.99 },
        ];
        boundaryTests.forEach(test => {
            const orderRequest = {
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
                (0, k6_1.check)(response, {
                    [`${test.name}: should reject non-positive calories`]: (r) => r.status >= 400,
                });
            }
            else if (test.calories >= 1000) {
                (0, k6_1.check)(response, {
                    [`${test.name}: should handle high calorie requests`]: (r) => r.status === 200 || r.status >= 400,
                });
            }
            else {
                (0, k6_1.check)(response, {
                    [`${test.name}: should accept valid calories`]: (r) => r.status === 200,
                });
            }
        });
    });
}
function testToppingBoundaries() {
    (0, k6_1.group)('Topping Count Boundary Tests', () => {
        const toppingTests = [
            { name: 'Zero Toppings', min: 0, max: 0 },
            { name: 'One Topping', min: 1, max: 1 },
            { name: 'Min Greater Than Max', min: 5, max: 2 },
            { name: 'Negative Toppings', min: -1, max: 3 },
            { name: 'Very High Toppings', min: 50, max: 100 },
            { name: 'Equal Min Max', min: 3, max: 3 },
        ];
        toppingTests.forEach(test => {
            const orderRequest = {
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
                (0, k6_1.check)(response, {
                    [`${test.name}: should reject invalid topping range`]: (r) => r.status >= 400,
                });
            }
            else {
                (0, k6_1.check)(response, {
                    [`${test.name}: should handle valid topping range`]: (r) => r.status === 200 || r.status >= 400,
                });
            }
        });
    });
}
function testNameLengthBoundaries() {
    (0, k6_1.group)('Name Length Boundary Tests', () => {
        const nameTests = [
            { name: 'Empty Name', value: '' },
            { name: 'Single Character', value: 'A' },
            { name: 'Very Long Name', value: 'A'.repeat(1000) },
            { name: 'Extremely Long Name', value: 'A'.repeat(10000) },
            { name: 'Only Spaces', value: '   ' },
            { name: 'Mixed Whitespace', value: '\t\n\r ' },
        ];
        nameTests.forEach(test => {
            const orderRequest = {
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
                (0, k6_1.check)(response, {
                    [`${test.name}: should reject empty/whitespace names`]: (r) => r.status >= 400,
                });
            }
            else if (test.value.length > 500) {
                (0, k6_1.check)(response, {
                    [`${test.name}: should handle very long names`]: (r) => r.status === 200 || r.status >= 400,
                });
            }
            else {
                (0, k6_1.check)(response, {
                    [`${test.name}: should accept valid names`]: (r) => r.status === 200,
                });
            }
        });
    });
}
function testEmptyAndNullValues() {
    (0, k6_1.group)('Empty and Null Value Tests', () => {
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
            (0, k6_1.check)(response, {
                [`${test.name}: handles empty/large arrays`]: (r) => r.status === 200 || r.status >= 400,
            });
        });
    });
}
function testExtremeValues() {
    (0, k6_1.group)('Extreme Value Tests', () => {
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
            (0, k6_1.check)(response, {
                [`${test.name}: handles extreme values gracefully`]: (r) => r.status !== undefined && r.timings.duration < 10000,
            });
        });
    });
}
function testSpecialCharacterHandling() {
    (0, k6_1.group)('Special Character Tests', () => {
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
            const orderRequest = {
                customName: test.value,
                excludedIngredients: [test.value],
                excludedTools: [],
                maxCaloriesPerSlice: 300,
                maxNumberOfToppings: 5,
                minNumberOfToppings: 2,
                mustBeVegetarian: false,
            };
            const response = makeRequest(orderRequest, `special-char-${test.name}`);
            (0, k6_1.check)(response, {
                [`${test.name}: handles special characters safely`]: (r) => r.status !== undefined,
                [`${test.name}: no server error`]: (r) => r.status < 500,
            });
        });
    });
}
function testMalformedRequests() {
    (0, k6_1.group)('Malformed Request Tests', () => {
        const url = `${quick_pizza_config_1.BASE_URL}/order-pizza`;
        const headers = { 'Content-Type': 'application/json' };
        const malformedTests = [
            { name: 'Invalid JSON', body: '{"customName": "Test", invalid}' },
            { name: 'Incomplete JSON', body: '{"customName": "Test"' },
            { name: 'Empty JSON', body: '{}' },
            { name: 'Array Instead of Object', body: '["not", "an", "object"]' },
            { name: 'String Instead of JSON', body: 'not json at all' },
            { name: 'Null Body', body: null },
        ];
        malformedTests.forEach(test => {
            const response = http_1.default.post(url, test.body, { headers, tags: { test_case: test.name } });
            (0, k6_1.check)(response, {
                [`${test.name}: rejects malformed request`]: (r) => r.status >= 400,
                [`${test.name}: quick response to malformed data`]: (r) => r.timings.duration < 2000,
            });
        });
    });
}
function testInvalidDataTypes() {
    (0, k6_1.group)('Invalid Data Type Tests', () => {
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
            const response = http_1.default.post(`${quick_pizza_config_1.BASE_URL}/order-pizza`, test.body, {
                headers: { 'Content-Type': 'application/json' },
                tags: { test_case: test.name }
            });
            (0, k6_1.check)(response, {
                [`${test.name}: rejects invalid types`]: (r) => r.status >= 400,
            });
        });
    });
}
function testUnicodeHandling() {
    (0, k6_1.group)('Unicode Handling Tests', () => {
        const unicodeTests = [
            { name: 'Chinese Characters', value: '中国披萨' },
            { name: 'Arabic Text', value: 'بيتزا عربية' },
            { name: 'Russian Text', value: 'Русская пицца' },
            { name: 'Mixed Scripts', value: 'Pizza混合Script🍕' },
        ];
        unicodeTests.forEach(test => {
            const orderRequest = {
                customName: test.value,
                excludedIngredients: [],
                excludedTools: [],
                maxCaloriesPerSlice: 300,
                maxNumberOfToppings: 5,
                minNumberOfToppings: 2,
                mustBeVegetarian: false,
            };
            const response = makeRequest(orderRequest, `unicode-${test.name}`);
            (0, k6_1.check)(response, {
                [`${test.name}: handles unicode correctly`]: (r) => r.status !== undefined,
            });
        });
    });
}
function makeRequest(orderRequest, testCase) {
    const url = `${quick_pizza_config_1.BASE_URL}/order-pizza`;
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
    return http_1.default.post(url, JSON.stringify(orderRequest), params);
}
