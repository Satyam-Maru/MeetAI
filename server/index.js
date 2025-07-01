// server/index.js
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

app.use(cors()); // Allow cross-origin requests

app.get('/api/message', (req, res) => {
  res.json({ message: 'Hi how are you!' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
