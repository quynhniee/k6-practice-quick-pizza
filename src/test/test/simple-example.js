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
    vus: 2,
    duration: '30s',
    thresholds: {
        'http_req_duration': ['p(95)<2000'],
        'http_req_failed': ['rate<0.1'],
        'checks': ['rate>0.9'],
    },
};
function default_1() {
    const orderRequest = {
        customName: "Simple Test Pizza",
        excludedIngredients: [],
        excludedTools: [],
        maxCaloriesPerSlice: 300,
        maxNumberOfToppings: 5,
        minNumberOfToppings: 2,
        mustBeVegetarian: false,
    };
    const url = `${quick_pizza_config_1.BASE_URL}/order-pizza`;
    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        tags: {
            name: 'simple-order-test',
        },
    };
    const response = http_1.default.post(url, JSON.stringify(orderRequest), params);
    (0, k6_1.check)(response, {
        'status is 200': (r) => r.status === constants_1.HTTP_STATUS.OK,
        'response time < 2000ms': (r) => r.timings.duration < 2000,
        'response has body': (r) => r.body !== null && typeof r.body === 'string' && r.body.length > 0,
    });
    if (response.status === constants_1.HTTP_STATUS.OK) {
        try {
            const orderResponse = JSON.parse(response.body);
            (0, k6_1.check)(orderResponse, {
                'has pizza object': (r) => r.pizza !== undefined,
                'has calories': (r) => typeof r.calories === 'number' && r.calories > 0,
                'has vegetarian flag': (r) => typeof r.vegetarian === 'boolean',
                'pizza has valid ID': (r) => r.pizza && r.pizza.id > 0,
                'pizza has name': (r) => r.pizza && r.pizza.name && r.pizza.name.length > 0,
            });
            console.log(`Ordered pizza: ${orderResponse.pizza.name} (${orderResponse.calories} calories)`);
        }
        catch (e) {
            console.error(`Failed to parse response: ${e}`);
            (0, k6_1.check)(response, {
                'response is valid JSON': () => false,
            });
        }
    }
    (0, k6_1.sleep)(Math.random() + 1);
}
