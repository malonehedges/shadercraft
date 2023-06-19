import express from "express";
import { readFile } from "fs";
import { watch } from "chokidar";

const app = express();
const port = 3000;
const shaderPath = "./shader.glsl";

app.use(express.static("public"));

app.get("/", (_req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

const sendShader = (res) => {
  readFile(shaderPath, "utf-8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return;
    }

    res.write(`data: ${JSON.stringify(data)}\n\n`);
  });
};

app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders(); // flush the headers to establish SSE with client

  let watcher = watch(shaderPath);

  watcher.on("change", (_filePath) => {
    sendShader(res);
  });

  sendShader(res);

  req.on("close", () => {
    watcher.close();
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
