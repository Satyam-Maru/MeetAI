const express = require("express");
const { AccessToken } = require("livekit-server-sdk");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;

// Endpoint to generate token
app.post("/get-token", (req, res) => {
  const { roomName, userName } = req.body;

  const at = new AccessToken(API_KEY, API_SECRET, {
    identity: userName,
  });
  at.addGrant({ roomJoin: true, room: roomName });

  const token = at.toJwt();
  res.json({ token });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
