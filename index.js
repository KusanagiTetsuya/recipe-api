const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// データベース接続の設定
const dbConfig = {
    uri: process.env.DATABASE_URL,
    charset: 'utf8mb4',
    dateStrings: true,
}

const pool = mysql.createPool(dbConfig);
const toRecipe = (recipe) => ({
    id: recipe.id,
    title: recipe.title,
    making_time: recipe.making_time,
    serves: recipe.serves,
    ingredients: recipe.ingredients,
    cost: String(recipe.cost),
});

//recipeからIDを検索
async function findByID(id) {
    if (!/^\d+$/.test(String(id))) return undefined;
    const [rows] = await pool.query('SELECT * FROM recipes WHERE id = ?', [Number(id)]);
    return rows[0];
}

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

app.use((req, res) => {
    res.status(404).json({ message: 'Not Found' }); 
});

const PORT = process.env.PORT || 3000;
initDatabase()
    .then(() => app.listen(PORT, () => {
        console.log(`Listening on port ${PORT}`);
    }))
    .catch((error) => {
        console.error('Failed to initialize the database:', error);
        process.exit(1);
    });

