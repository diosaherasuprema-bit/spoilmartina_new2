const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
app.get('/drop-rates', (req, res) => res.sendFile(path.join(__dirname, 'public/drop-rates.html')));

app.listen(PORT, () => console.log(`Martina Collection running on port ${PORT}`));
