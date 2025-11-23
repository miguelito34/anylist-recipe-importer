/**
 * Collection management utilities
 */

/**
 * Ensure a collection exists, creating it if necessary
 * Returns the collection object
 */
export async function ensureCollection(anylist, collectionName) {
  try {
    // Try to get existing collections first (if method exists)
    let existing = null;
    try {
      if (typeof anylist.getRecipeCollections === 'function') {
        const collections = await anylist.getRecipeCollections();
        existing = collections.find(
          col => col.name.toLowerCase() === collectionName.toLowerCase()
        );
      }
    } catch (e) {
      // Method might not exist or might fail, continue to create
    }

    if (existing) {
      return existing;
    }

    // Create new collection
    const collection = anylist.createRecipeCollection({ name: collectionName });
    await collection.save();
    return collection;
  } catch (error) {
    // If creation fails, it might already exist - try to find it
    // Otherwise, rethrow the error
    if (error.message && error.message.toLowerCase().includes('already exists')) {
      // Try to get it from the list
      try {
        if (typeof anylist.getRecipeCollections === 'function') {
          const collections = await anylist.getRecipeCollections();
          const existing = collections.find(
            col => col.name.toLowerCase() === collectionName.toLowerCase()
          );
          if (existing) {
            return existing;
          }
        }
      } catch (e) {
        // Ignore
      }
    }
    throw error;
  }
}

/**
 * Add a recipe to multiple collections
 */
export async function addRecipeToCollections(anylist, recipeIdentifier, collectionNames) {
  if (!collectionNames || collectionNames.length === 0) {
    return;
  }

  const results = [];

  for (const collectionName of collectionNames) {
    try {
      const collection = await ensureCollection(anylist, collectionName);
      await collection.addRecipe(recipeIdentifier);
      results.push({ name: collectionName, success: true });
    } catch (error) {
      results.push({ 
        name: collectionName, 
        success: false, 
        error: error.message 
      });
    }
  }

  return results;
}

