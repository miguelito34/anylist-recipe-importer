import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Convert time string to seconds
 * Handles formats like "15 minutes", "1 hour", "30 mins", "2 hours 15 minutes"
 */
export function parseTimeToSeconds(timeString) {
  if (!timeString || typeof timeString !== 'string') {
    return null;
  }

  const normalized = timeString.toLowerCase().trim();
  let totalSeconds = 0;

  // Match hours
  const hourMatch = normalized.match(/(\d+)\s*(?:hour|hr|h)(?:s)?/);
  if (hourMatch) {
    totalSeconds += parseInt(hourMatch[1], 10) * 3600;
  }

  // Match minutes
  const minuteMatch = normalized.match(/(\d+)\s*(?:minute|min|m)(?:s)?/);
  if (minuteMatch) {
    totalSeconds += parseInt(minuteMatch[1], 10) * 60;
  }

  // If no matches found, try to parse as just a number (assume minutes)
  if (totalSeconds === 0) {
    const numberMatch = normalized.match(/(\d+)/);
    if (numberMatch) {
      totalSeconds = parseInt(numberMatch[1], 10) * 60; // Default to minutes
    }
  }

  return totalSeconds > 0 ? totalSeconds : null;
}

/**
 * Load recipes from JSON file
 * Handles both single recipe object and array of recipes
 */
export async function loadRecipes(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(data);

    // Normalize to array
    if (Array.isArray(parsed)) {
      return parsed;
    } else if (typeof parsed === 'object' && parsed !== null) {
      return [parsed];
    } else {
      throw new Error('Invalid JSON format: expected object or array');
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in ${filePath}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Save data to JSON file with formatting
 */
export async function saveJson(filePath, data) {
  const jsonString = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, jsonString, 'utf-8');
}

/**
 * Validate recipe has required fields
 */
export function validateRecipe(recipe) {
  const errors = [];

  if (!recipe.name || typeof recipe.name !== 'string' || recipe.name.trim() === '') {
    errors.push('Missing or invalid "name" field');
  }

  if (!recipe.ingredients || !Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
    errors.push('Missing or invalid "ingredients" field (must be non-empty array)');
  }

  if (!recipe.steps || !Array.isArray(recipe.steps) || recipe.steps.length === 0) {
    errors.push('Missing or invalid "steps" field (must be non-empty array)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get data directory path
 */
export function getDataDir() {
  return join(__dirname, '..', 'data');
}

