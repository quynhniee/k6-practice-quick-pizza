"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOrderPizzaRequest = void 0;
const randomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
const randomTool = () => {
    const tools = [
        'Knife',
        'Pizza cutter',
        'Scissors',
    ];
    return tools[randomInt(0, tools.length - 1)];
};
const randomIngredient = () => {
    const ingredients = [
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
    ];
    return ingredients[randomInt(0, ingredients.length - 1)];
};
const generateOrderPizzaRequest = () => {
    const customName = `Custom Pizza ${randomInt(1, 1000)}`;
    const excludedIngredients = new Array(randomInt(0, 3)).fill(null).map(() => randomIngredient());
    const excludedTools = randomTool();
    const maxCaloriesPerSlice = randomInt(200, 500);
    const maxNumberOfToppings = randomInt(1, 5);
    const minNumberOfToppings = randomInt(0, maxNumberOfToppings);
    const mustBeVegetarian = Math.random() > 0.5;
    return {
        customName,
        excludedIngredients,
        excludedTools: [excludedTools],
        maxCaloriesPerSlice,
        maxNumberOfToppings,
        minNumberOfToppings,
        mustBeVegetarian,
    };
};
exports.generateOrderPizzaRequest = generateOrderPizzaRequest;
