const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

//データベース接続の設定
const dbConfig = {
    uri: process.env.DATABASE_URL,
    charset: 'utf8mb4',
    dateStrings: true,
}

const pool = mysql.createPool(dbConfig);
const FIELDS = ['title', 'making_time', 'serves', 'ingredients', 'cost'];
const toRecipe = (recipe) => ({
    id: recipe.id,
    title: recipe.title,
    making_time: recipe.making_time,
    serves: recipe.serves,
    ingredients: recipe.ingredients,
    cost: String(recipe.cost),
});

async function initDatabase() {
  const [tables] = await pool.query("SHOW TABLES LIKE 'recipes'");
  if (tables.length > 0) return;

  const sql = fs.readFileSync(path.join(__dirname, 'sql', 'create.sql'), 'utf8');
  const conn = await mysql.createConnection({ ...dbConfig, multipleStatements: true });
  await conn.query(sql);
  await conn.end();
}

//recipeからIDを検索
async function findByID(id) {
    if (!/^\d+$/.test(String(id))) return undefined;
    const [rows] = await pool.query('SELECT * FROM recipes WHERE id = ?', [Number(id)]);
    return rows[0];
}

app.use(express.json());

//GET /recipes -> 全てのレシピを取得
app.get('/recipes', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM recipes ORDER BY id');
    res.status(200).json({ recipes: rows.map(toRecipe) });
  } catch (err) {
    next(err);
  }
});

//GET /recipes/:id
app.get('/recipes/:id', async (req, res, next) => {
    try {
        const recipe = await findByID(req.params.id);
        if (!recipe) {
            return res.status(200).json({ message: 'No Recipe found' });
        }
        res.status(200).json({
            message: 'Recipe details by ID',
            recipe: [toRecipe(recipe)],
        });
    } catch (error) {
        next(error);
    }
});

//404 Not Found ハンドリング
app.use((req, res) => {
    res.status(404).json({ message: 'Not Found' }); 
});

//500 Internal Server Error ハンドリング
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal Server Error' });
});

//DELETE /recipes/:id -> レシピを削除
app.delete('/recipes/:id', async (req, res, next) => {
    try {
        const recipe = await findByID(req.params.id);
        if(!recipe) {
            return res.status(200).json({ message: 'No Recipe found' });
        }
        await pool.query('DELETE FROM recipes WHERE id = ?', [recipe.id]);
        res.status(200).json({ message: 'Recipe successfully deleted!' });
    } catch (error) {
        next(error);
    }
});
//データベース初期化とサーバー起動
const PORT = process.env.PORT || 3000;
initDatabase()
    .then(() => app.listen(PORT, () => {
        console.log(`Listening on port ${PORT}`);
    }))
    .catch((error) => {
        console.error('Failed to initialize the database:', error);
        process.exit(1);
    });
