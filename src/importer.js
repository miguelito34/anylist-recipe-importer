import { parseTimeToSeconds } from './utils.js';
import { addRecipeToCollections } from './collections.js';

/**
 * Import a single recipe to AnyList
 * Returns { success: true, recipeIdentifier } or { success: false, error }
 */
export async function importRecipe(anylist, recipeData) {
  try {
    // Convert time strings to seconds
    const prepTimeSeconds = recipeData.prepTime 
      ? parseTimeToSeconds(recipeData.prepTime) 
      : null;
    const cookTimeSeconds = recipeData.cookTime 
      ? parseTimeToSeconds(recipeData.cookTime) 
      : null;

    // Combine description and notes into note field
    const noteParts = [];
    if (recipeData.description) {
      noteParts.push(recipeData.description);
    }
    if (recipeData.notes) {
      if (noteParts.length > 0) {
        noteParts.push('\n\n---\n\n');
      }
      noteParts.push(recipeData.notes);
    }
    if (recipeData.source) {
      if (noteParts.length > 0) {
        noteParts.push('\n\n');
      }
      noteParts.push(`Source: ${recipeData.source}`);
    }
    const note = noteParts.join('');

    // Prepare ingredients
    const ingredients = recipeData.ingredients.map(ingredient => ({
      rawIngredient: ingredient
    }));

    // Get current timestamp
    const timestamp = Math.floor(Date.now() / 1000);

    // Create recipe
    const recipe = await anylist.createRecipe({
      name: recipeData.name,
      note: note || undefined,
      preparationSteps: recipeData.steps,
      ingredients: ingredients,
      sourceName: recipeData.source || undefined,
      sourceUrl: '',
      servings: recipeData.servings || undefined,
      prepTime: prepTimeSeconds || undefined,
      cookTime: cookTimeSeconds || undefined,
      creationTimestamp: timestamp,
      timestamp: timestamp
    });

    // Save recipe
    await recipe.save();

    // Add to collections if specified
    let collectionResults = [];
    if (recipeData.collections && recipeData.collections.length > 0) {
      collectionResults = await addRecipeToCollections(
        anylist,
        recipe.identifier,
        recipeData.collections
      );
    }

    return {
      success: true,
      recipeIdentifier: recipe.identifier,
      collectionResults
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || String(error)
    };
  }
}

