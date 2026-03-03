import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("coffee_v2.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    method TEXT NOT NULL,
    coffee_grams REAL NOT NULL,
    ratio REAL NOT NULL,
    grind_clicks INTEGER NOT NULL,
    temp_c INTEGER NOT NULL,
    total_time_seconds INTEGER NOT NULL,
    sensory_profile TEXT,
    coffee_details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS pours (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    start_time_seconds INTEGER NOT NULL,
    water_grams REAL NOT NULL,
    notes TEXT,
    FOREIGN KEY (recipe_id) REFERENCES recipes (id) ON DELETE CASCADE
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/recipes", (req, res) => {
    const method = req.query.method;
    let recipes;
    if (method) {
      recipes = db.prepare("SELECT * FROM recipes WHERE method = ? ORDER BY created_at DESC").all(method);
    } else {
      recipes = db.prepare("SELECT * FROM recipes ORDER BY created_at DESC").all();
    }
    
    // Attach pours to each recipe and parse JSON fields
    const recipesWithPours = recipes.map(recipe => {
      const pours = db.prepare("SELECT * FROM pours WHERE recipe_id = ? ORDER BY start_time_seconds ASC").all(recipe.id);
      return { 
        ...recipe, 
        pours,
        sensory_profile: recipe.sensory_profile ? JSON.parse(recipe.sensory_profile) : undefined,
        coffee_details: recipe.coffee_details ? JSON.parse(recipe.coffee_details) : undefined
      };
    });
    
    res.json(recipesWithPours);
  });

  app.get("/api/recipes/:id", (req, res) => {
    const recipe = db.prepare("SELECT * FROM recipes WHERE id = ?").get(req.params.id);
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });
    
    const pours = db.prepare("SELECT * FROM pours WHERE recipe_id = ? ORDER BY start_time_seconds ASC").all(recipe.id);
    res.json({ 
      ...recipe, 
      pours,
      sensory_profile: recipe.sensory_profile ? JSON.parse(recipe.sensory_profile) : undefined,
      coffee_details: recipe.coffee_details ? JSON.parse(recipe.coffee_details) : undefined
    });
  });

  app.post("/api/recipes", (req, res) => {
    const { name, method, coffee_grams, ratio, grind_clicks, temp_c, total_time_seconds, pours, sensory_profile, coffee_details } = req.body;
    
    const insertRecipe = db.prepare(`
      INSERT INTO recipes (name, method, coffee_grams, ratio, grind_clicks, temp_c, total_time_seconds, sensory_profile, coffee_details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const insertPour = db.prepare(`
      INSERT INTO pours (recipe_id, name, start_time_seconds, water_grams, notes)
      VALUES (?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction((recipeData, poursData) => {
      const info = insertRecipe.run(
        recipeData.name, 
        recipeData.method, 
        recipeData.coffee_grams, 
        recipeData.ratio, 
        recipeData.grind_clicks, 
        recipeData.temp_c, 
        recipeData.total_time_seconds,
        recipeData.sensory_profile ? JSON.stringify(recipeData.sensory_profile) : null,
        recipeData.coffee_details ? JSON.stringify(recipeData.coffee_details) : null
      );
      const recipeId = info.lastInsertRowid;
      
      for (const pour of poursData) {
        insertPour.run(recipeId, pour.name, pour.start_time_seconds, pour.water_grams, pour.notes);
      }
      return recipeId;
    });

    try {
      const id = transaction({ name, method, coffee_grams, ratio, grind_clicks, temp_c, total_time_seconds, sensory_profile, coffee_details }, pours || []);
      res.status(201).json({ id });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/recipes/:id", (req, res) => {
    const { name, method, coffee_grams, ratio, grind_clicks, temp_c, total_time_seconds, pours, sensory_profile, coffee_details } = req.body;
    const recipeId = req.params.id;

    const updateRecipe = db.prepare(`
      UPDATE recipes 
      SET name = ?, method = ?, coffee_grams = ?, ratio = ?, grind_clicks = ?, temp_c = ?, total_time_seconds = ?, sensory_profile = ?, coffee_details = ?
      WHERE id = ?
    `);

    const deletePours = db.prepare("DELETE FROM pours WHERE recipe_id = ?");
    const insertPour = db.prepare(`
      INSERT INTO pours (recipe_id, name, start_time_seconds, water_grams, notes)
      VALUES (?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction((recipeData, poursData) => {
      updateRecipe.run(
        recipeData.name, 
        recipeData.method, 
        recipeData.coffee_grams, 
        recipeData.ratio, 
        recipeData.grind_clicks, 
        recipeData.temp_c, 
        recipeData.total_time_seconds,
        recipeData.sensory_profile ? JSON.stringify(recipeData.sensory_profile) : null,
        recipeData.coffee_details ? JSON.stringify(recipeData.coffee_details) : null,
        recipeId
      );
      
      deletePours.run(recipeId);
      
      for (const pour of poursData) {
        insertPour.run(recipeId, pour.name, pour.start_time_seconds, pour.water_grams, pour.notes);
      }
    });

    try {
      transaction({ name, method, coffee_grams, ratio, grind_clicks, temp_c, total_time_seconds, sensory_profile, coffee_details }, pours || []);
      res.status(200).json({ id: recipeId });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/recipes/:id", (req, res) => {
    db.prepare("DELETE FROM recipes WHERE id = ?").run(req.params.id);
    res.status(204).send();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
