const express = require('express');
const app = express();

app.get('/recipes', (req, res) => {
    res.status(200).json({recipes: [{id: 1, title: 'tes'}] })
});

app.use((req,res) => res.status(404).json({message: 'Not Found'}));
app.listen(process.env.PORT || 3000);
