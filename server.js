const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;
const DATA_FILE_PATH = process.env.DATA_FILE_PATH || path.join(__dirname, "data.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));

function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { collection: [] };
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
}

app.get("/api/list", (req, res) => {
  const data = readData();
  res.json({
    status: "success",
    count: data.collection.length,
    data: data.collection,
  });
});

app.post("/api/add", (req, res) => {
  const { title, category, description, image, date } = req.body;

  if (!title || !category || !description || !image || !date) {
    return res.status(400).json({
      status: "error",
      message: "Missing required fields: title, category, description, image, date",
    });
  }

  if (!["A", "B", "C"].includes(category)) {
    return res.status(400).json({
      status: "error",
      message: "Category must be A, B, or C",
    });
  }

  const data = readData();
  const id = String(Date.now());
  const newEntry = {
    id,
    title,
    category,
    description,
    image,
    date,
    createdAt: new Date().toISOString(),
  };

  data.collection.push(newEntry);
  writeData(data);

  res.status(201).json({
    status: "success",
    id,
    message: "Entry added",
  });
});

app.delete("/api/delete/:id", (req, res) => {
  const { id } = req.params;
  const data = readData();
  const index = data.collection.findIndex((item) => item.id === id);

  if (index === -1) {
    return res.status(404).json({
      status: "error",
      message: "Entry not found",
    });
  }

  data.collection.splice(index, 1);
  writeData(data);

  res.json({
    status: "success",
    message: "Entry deleted",
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`HOS Archive running at http://localhost:${PORT}`);
});
