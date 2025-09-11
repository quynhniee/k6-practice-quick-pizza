

export interface OrderPizzaRequest {
    customName: string;
    excludedIngredients: string[];
    excludedTools: string[];
    maxCaloriesPerSlice: number;
    maxNumberOfToppings: number;
    minNumberOfToppings: number;
    mustBeVegetarian: boolean;
}

interface Ingredient {
    ID: number;
    name: string;
    caloriesPerSlice: number;
    vegetarian: boolean;
}

interface Dough {
    ID: number;
    name: string;
    caloriesPerSlice: number;
}

export interface Pizza {
    id: number;
    dough: Dough;
    name: string;
    tool: string;
    ingredients: Ingredient[];
}

export interface OrderPizzaResponse {
    calories: number;
    pizza: Pizza;
    vegetarian: boolean;
}
