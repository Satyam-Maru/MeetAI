// server/index.js
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

// app.use(cors()); // Allow cross-origin requests
app.use(cors({
  origin: 'https://your-frontend.vercel.app',
}));


app.get('/api/message', (req, res) => {
  res.json({ message: 'Deployed Successfully On Render + Vercel'});
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
