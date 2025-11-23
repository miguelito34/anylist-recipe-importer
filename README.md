# AnyList Recipe Importer

A Node.js CLI tool that batch imports recipes into the AnyList app from JSON files. Perfect for digitizing recipes from cookbook photos and importing them in bulk.

## Features

- ✅ Batch import recipes from JSON files
- ✅ Flexible JSON format (single recipe or array)
- ✅ Automatic collection management (creates collections if needed)
- ✅ Recipe validation before import
- ✅ Error logging and archiving
- ✅ Progress tracking with emoji indicators
- ✅ Dry-run mode for testing

## Workflow

1. **Digitize Recipes**: Photograph cookbook pages and send them to Claude (or another AI) for digitization
2. **Get JSON**: Claude returns structured JSON for each recipe (or array of recipes)
3. **Add to recipes.json**: Paste the JSON into `data/recipes.json`
4. **Run Import**: Execute the CLI tool to import all recipes to AnyList
5. **Review Results**: Successfully imported recipes are archived; failed ones are logged separately

## Installation

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd anylist-recipe-importer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up credentials:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add your AnyList credentials:
   ```
   ANYLIST_EMAIL=your-email@example.com
   ANYLIST_PASSWORD=your-password
   ```

## Usage

### Basic Import

Import all recipes from `data/recipes.json`:

```bash
npm start
# or
node src/index.js
```

### Dry Run

Validate recipes without importing:

```bash
node src/index.js --dry-run
```

### Verbose Mode

Show detailed error messages:

```bash
node src/index.js --verbose
```

## Recipe JSON Format

The tool accepts either a single recipe object or an array of recipes:

**Single Recipe:**
```json
{
  "name": "Chicken Parmesan",
  "source": "The Italian Cookbook",
  "collections": ["Entrees", "Italian"],
  "description": "A classic Italian-American dish",
  "notes": "Serve with pasta and marinara sauce",
  "servings": "4 servings",
  "prepTime": "15 minutes",
  "cookTime": "30 minutes",
  "ingredients": [
    "2 tablespoons olive oil",
    "1 pound chicken breast, cubed",
    "1 teaspoon kosher salt"
  ],
  "steps": [
    "Preheat oven to 375°F.",
    "Season the chicken with salt and pepper.",
    "Heat oil in a skillet over medium-high heat.",
    "Cook until internal temperature reaches 165°F."
  ]
}
```

**Array of Recipes:**
```json
[
  {
    "name": "Recipe 1",
    "ingredients": [...],
    "steps": [...]
  },
  {
    "name": "Recipe 2",
    "ingredients": [...],
    "steps": [...]
  }
]
```

### Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Recipe title |
| `source` | string | No | Cookbook or source name |
| `collections` | string[] | No | Categories like "Soups", "Desserts" |
| `description` | string | No | Recipe description/intro |
| `notes` | string | No | Additional tips or variations |
| `servings` | string | No | Yield (e.g., "4 servings") |
| `prepTime` | string | No | Prep time (e.g., "15 minutes") |
| `cookTime` | string | No | Cook time (e.g., "30 minutes") |
| `ingredients` | string[] | Yes | List of ingredients |
| `steps` | string[] | Yes | Preparation steps |

## File Structure

```
anylist-recipe-importer/
├── .env                    # AnyList credentials (gitignored)
├── .env.example            # Template for credentials
├── .gitignore
├── package.json
├── README.md
├── src/
│   ├── index.js            # Main entry point / CLI
│   ├── importer.js         # Core import logic
│   ├── collections.js      # Collection management
│   └── utils.js            # Helper functions
└── data/
    ├── recipes.json        # Recipes waiting to be imported
    ├── imported.json       # Successfully imported recipes (archive)
    └── errors.json         # Failed imports with error messages
```

## How It Works

1. **Load Recipes**: Reads from `data/recipes.json` (supports single object or array)
2. **Validate**: Checks that each recipe has required fields (`name`, `ingredients`, `steps`)
3. **Authenticate**: Logs into AnyList using credentials from `.env`
4. **Import**: For each recipe:
   - Converts time strings to seconds
   - Combines description and notes
   - Creates recipe in AnyList
   - Adds to specified collections (creates if needed)
5. **Archive**: 
   - Successful imports → `data/imported.json`
   - Failed imports → `data/errors.json`
   - Clears `recipes.json` after successful run

## Example Output

```
📖 Found 5 recipe(s) to import

🔐 Logging into AnyList...
✅ Connected

[1/5] Importing: Chicken Parmesan
   ✅ Recipe saved
   📁 Added to: Entrees
   📁 Added to: Italian

[2/5] Importing: Tomato Soup
   ✅ Recipe saved
   📁 Added to: Soups

[3/5] Importing: Invalid Recipe
   ❌ Failed: Missing required field "ingredients"

══════════════════════════════════════════════════
✅ Successfully imported: 4
❌ Failed: 1 (see data/errors.json)
══════════════════════════════════════════════════
```

## Error Handling

- **Missing credentials**: Exits with clear error message
- **Invalid JSON**: Exits with parsing error details
- **Missing required fields**: Skips recipe, logs to `errors.json`
- **API failures**: Logs to `errors.json` with full error details
- **Collection creation failures**: Logs warning, continues with recipe import

## Notes

- The `anylist` package stores encrypted credentials in `~/.anylist_credentials` by default
- Time fields are automatically converted from strings like "15 minutes" to seconds
- Collections are created on-demand if they don't exist
- The API is unofficial and reverse-engineered, so errors are handled gracefully

## License

ISC
