"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PIZZA_TOOLS = exports.PIZZA_INGREDIENTS = exports.THRESHOLDS = exports.HTTP_STATUS = exports.TEST_SCENARIOS = void 0;
exports.TEST_SCENARIOS = {
    SMOKE_TEST: 'smoke_test',
    LOAD_TEST: 'load_test',
    STRESS_TEST: 'stress_test',
    SPIKE_TEST: 'spike_test'
};
exports.HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
};
exports.THRESHOLDS = {
    HTTP_REQ_DURATION: 'http_req_duration<2000',
    HTTP_REQ_FAILED: 'http_req_failed<0.1',
    CHECKS: 'checks>0.95'
};
exports.PIZZA_INGREDIENTS = [
    'Tomato Sauce',
    'Cheese',
    'Pepperoni',
    'Mushrooms',
    'Onions',
    'Sausage',
    'Bacon',
    'Black Olives',
    'Green Peppers',
    'Pineapple',
    'Spinach',
    'Feta Cheese',
    'Anchovies',
    'Italian Sausage',
    'Ham',
    'Bell Peppers'
];
exports.PIZZA_TOOLS = [
    'Knife',
    'Pizza cutter',
    'Scissors'
];
