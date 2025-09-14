// In JavaScript, we don't have explicit interfaces, but we can provide JSDoc comments for documentation

/**
 * @typedef {Object} OrderPizzaRequest
 * @property {string} customName
 * @property {string[]} excludedIngredients
 * @property {string[]} excludedTools
 * @property {number} maxCaloriesPerSlice
 * @property {number} maxNumberOfToppings
 * @property {number} minNumberOfToppings
 * @property {boolean} mustBeVegetarian
 */

/**
 * @typedef {Object} Ingredient
 * @property {number} ID
 * @property {string} name
 * @property {number} caloriesPerSlice
 * @property {boolean} vegetarian
 */

/**
 * @typedef {Object} Dough
 * @property {number} ID
 * @property {string} name
 * @property {number} caloriesPerSlice
 */

/**
 * @typedef {Object} Pizza
 * @property {number} id
 * @property {Dough} dough
 * @property {string} name
 * @property {string} tool
 * @property {Ingredient[]} ingredients
 */

/**
 * @typedef {Object} OrderPizzaResponse
 * @property {number} calories
 * @property {Pizza} pizza
 * @property {boolean} vegetarian
 */

module.exports = {
  // Export names for documentation purposes
};
