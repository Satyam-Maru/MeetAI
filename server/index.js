const express = require("express");
const cors = require("cors");
const { AccessToken } = require("livekit-server-sdk");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello render')
})

app.post("/get-token", async (req, res) => {
  const { room, username } = req.body;

  if (!room || !username) {
    return res.status(400).json({ error: "Missing room or username" });
  }

  const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity: username,
  });

  at.addGrant({
    roomJoin: true,
    room,
    canPublish: true,
    canSubscribe: true,
  });

  const token = await at.toJwt();
  res.json({ token });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Token server running on port ${PORT}`);
});
