// Test scenarios configuration
export const TEST_SCENARIOS = {
    SMOKE_TEST: 'smoke_test',
    LOAD_TEST: 'load_test',
    STRESS_TEST: 'stress_test',
    SPIKE_TEST: 'spike_test'
};

// HTTP status codes
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
};

// Performance thresholds
export const THRESHOLDS = {
    HTTP_REQ_DURATION: 'http_req_duration<2000', // 95% of requests should complete within 2s
    HTTP_REQ_FAILED: 'http_req_failed<0.1', // Error rate should be less than 10%
    CHECKS: 'checks>0.95' // 95% of checks should pass
};

// Test data
export const PIZZA_INGREDIENTS = [
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

export const PIZZA_TOOLS = [
    'Knife',
    'Pizza cutter',
    'Scissors'
];