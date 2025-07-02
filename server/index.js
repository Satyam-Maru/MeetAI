const express = require('express');
const cors = require('cors');
const { AccessToken } = require('livekit-server-sdk');

const app = express();
app.use(cors());
app.use(express.json());
require("dotenv").config();

app.post('/get-token', async (req, res) => {
  const { roomName, identity } = req.body;

  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    { identity }
  );

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });

  res.json({ token: await token.toJwt() });
  console.log('token', token)
});

app.get('/', (req, res) => {
    res.send('hello livekit backend')
})

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Token server running on port ${PORT}`);
});
