import express from "express";

const app = express();

app.get("/ping", (_req, res) => {
  res.send("pong");
});

app.post("/webhooks/stripe", (_req, res) => {
  res.sendStatus(200);
});

app.listen(3001);
