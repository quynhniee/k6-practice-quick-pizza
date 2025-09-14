import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL } from "../config/quick-pizza-config.js";
import { HTTP_STATUS } from "../common/constants.js";

// Simple example test configuration
export const options = {
  vus: 2,
  duration: "30s",
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.1"],
    checks: ["rate>0.9"],
  },
};

export default function () {
  // Simple pizza order request
  const orderRequest = {
    customName: "Simple Test Pizza",
    excludedIngredients: [],
    excludedTools: [],
    maxCaloriesPerSlice: 300,
    maxNumberOfToppings: 5,
    minNumberOfToppings: 2,
    mustBeVegetarian: false,
  };

  const url = `${BASE_URL}/order-pizza`;

  const params = {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    tags: {
      name: "simple-order-test",
    },
  };

  // Make the API request
  const response = http.post(url, JSON.stringify(orderRequest), params);

  // Basic checks
  check(response, {
    "status is 200": (r) => r.status === HTTP_STATUS.OK,
    "response time < 2000ms": (r) => r.timings.duration < 2000,
    "response has body": (r) =>
      r.body !== null && typeof r.body === "string" && r.body.length > 0,
  });

  // If successful, parse and validate response
  if (response.status === HTTP_STATUS.OK) {
    try {
      const orderResponse = JSON.parse(response.body);

      check(orderResponse, {
        "has pizza object": (r) => r.pizza !== undefined,
        "has calories": (r) => typeof r.calories === "number" && r.calories > 0,
        "has vegetarian flag": (r) => typeof r.vegetarian === "boolean",
        "pizza has valid ID": (r) => r.pizza && r.pizza.id > 0,
        "pizza has name": (r) =>
          r.pizza && r.pizza.name && r.pizza.name.length > 0,
      });

      console.log(
        `Ordered pizza: ${orderResponse.pizza.name} (${orderResponse.calories} calories)`
      );
    } catch (e) {
      console.error(`Failed to parse response: ${e}`);
      check(response, {
        "response is valid JSON": () => false,
      });
    }
  }

  // Wait 1-2 seconds between requests
  sleep(Math.random() + 1);
}
