import dotenv from 'dotenv';
import AnyList from 'anylist';
import { loadRecipes, saveJson, validateRecipe, getDataDir } from './utils.js';
import { importRecipe } from './importer.js';
import { join } from 'path';
import fs from 'fs/promises';

// Load environment variables
dotenv.config();

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isVerbose = args.includes('--verbose');

// Get file paths
const dataDir = getDataDir();
const recipesPath = join(dataDir, 'recipes.json');
const importedPath = join(dataDir, 'imported.json');
const errorsPath = join(dataDir, 'errors.json');

/**
 * Ensure data directory exists
 */
async function ensureDataDir() {
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

/**
 * Load existing imported recipes or return empty array
 */
async function loadImported() {
  try {
    const data = await fs.readFile(importedPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * Load existing errors or return empty array
 */
async function loadErrors() {
  try {
    const data = await fs.readFile(errorsPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * Main import function
 */
async function main() {
  try {
    // Validate credentials
    const email = process.env.ANYLIST_EMAIL;
    const password = process.env.ANYLIST_PASSWORD;

    if (!email || !password) {
      console.error('❌ Error: Missing AnyList credentials');
      console.error('   Please set ANYLIST_EMAIL and ANYLIST_PASSWORD in .env file');
      process.exit(1);
    }

    // Ensure data directory exists
    await ensureDataDir();

    // Load recipes
    let recipes;
    try {
      recipes = await loadRecipes(recipesPath);
    } catch (error) {
      console.error(`❌ Error loading recipes: ${error.message}`);
      process.exit(1);
    }

    if (recipes.length === 0) {
      console.log('📖 No recipes found in recipes.json');
      return;
    }

    console.log(`📖 Found ${recipes.length} recipe(s) to import\n`);

    let any = null;
    if (isDryRun) {
      console.log('🔍 DRY RUN MODE - No recipes will be imported\n');
    } else {
      console.log('🔐 Logging into AnyList...');
      any = new AnyList({ email, password });
      await any.login();
      console.log('✅ Connected\n');
    }

    // Track results
    const successful = [];
    const failed = [];
    const existingImported = await loadImported();
    const existingErrors = await loadErrors();

    // Process each recipe
    for (let i = 0; i < recipes.length; i++) {
      const recipe = recipes[i];
      const index = i + 1;

      console.log(`[${index}/${recipes.length}] Importing: ${recipe.name || 'Unnamed Recipe'}`);

      // Validate recipe
      const validation = validateRecipe(recipe);
      if (!validation.isValid) {
        const errorMsg = `Missing required fields: ${validation.errors.join(', ')}`;
        console.log(`   ❌ Failed: ${errorMsg}`);
        failed.push({
          recipe,
          error: errorMsg
        });
        continue;
      }

      if (isDryRun) {
        console.log('   ✅ Would import (dry run)');
        successful.push(recipe);
      } else {
        // Import recipe
        const result = await importRecipe(any, recipe);

        if (result.success) {
          console.log('   ✅ Recipe saved');
          
          // Show collection results
          if (result.collectionResults && result.collectionResults.length > 0) {
            for (const collResult of result.collectionResults) {
              if (collResult.success) {
                console.log(`   📁 Added to: ${collResult.name}`);
              } else if (isVerbose) {
                console.log(`   ⚠️  Failed to add to collection "${collResult.name}": ${collResult.error}`);
              }
            }
          }

          successful.push(recipe);
        } else {
          console.log(`   ❌ Failed: ${result.error}`);
          failed.push({
            recipe,
            error: result.error
          });
        }
      }

      console.log(''); // Empty line between recipes
    }

    // Cleanup
    if (any) {
      any.teardown();
    }

    // Archive results
    if (successful.length > 0) {
      const allImported = [...existingImported, ...successful];
      await saveJson(importedPath, allImported);
    }

    if (failed.length > 0) {
      const allErrors = [...existingErrors, ...failed];
      await saveJson(errorsPath, allErrors);
    }

    // Clear recipes.json if we had any successful imports
    if (successful.length > 0 && !isDryRun) {
      await saveJson(recipesPath, []);
    }

    // Display summary
    console.log('══════════════════════════════════════════════════');
    console.log(`✅ Successfully imported: ${successful.length}`);
    if (failed.length > 0) {
      console.log(`❌ Failed: ${failed.length} (see data/errors.json)`);
    }
    console.log('══════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    if (isVerbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run main function
main();

