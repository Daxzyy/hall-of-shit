const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";
const DATA_FILE_PATH = process.env.DATA_FILE_PATH || "data.json";

const GITHUB_API_BASE = "https://api.github.com";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));

function assertGithubConfig() {
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    throw new Error(
      "Missing GitHub config. Set GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO env vars."
    );
  }
}

function githubHeaders() {
  return {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "hos-archive-app",
  };
}

async function getDataFile() {
  assertGithubConfig();

  const url = `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${DATA_FILE_PATH}?ref=${GITHUB_BRANCH}`;
  const res = await fetch(url, { headers: githubHeaders() });

  if (res.status === 404) {
    return { collection: [], sha: null };
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API error (${res.status}): ${body}`);
  }

  const json = await res.json();
  const decoded = Buffer.from(json.content, "base64").toString("utf-8");
  const parsed = JSON.parse(decoded);

  return { collection: parsed.collection || [], sha: json.sha };
}

async function putDataFile(collection, sha, commitMessage) {
  assertGithubConfig();

  const url = `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${DATA_FILE_PATH}`;
  const content = JSON.stringify({ collection }, null, 2);
  const encoded = Buffer.from(content, "utf-8").toString("base64");

  const body = {
    message: commitMessage,
    content: encoded,
    branch: GITHUB_BRANCH,
  };

  if (sha) {
    body.sha = sha;
  }

  const res = await fetch(url, {
    method: "PUT",
    headers: { ...githubHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`GitHub API error (${res.status}): ${errBody}`);
  }

  return res.json();
}

app.get("/api/list", async (req, res) => {
  try {
    const { collection } = await getDataFile();
    res.json({
      status: "success",
      count: collection.length,
      data: collection,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.post("/api/add", async (req, res) => {
  try {
    const { title, category, description, image, date } = req.body;

    if (!title || !category || !description || !image || !date) {
      return res.status(400).json({
        status: "error",
        message: "Missing required fields: title, category, description, image, date",
      });
    }

    const cat = String(category).trim();

    if (!cat) {
      return res.status(400).json({
        status: "error",
        message: "Category cannot be empty",
      });
    }

    const { collection, sha } = await getDataFile();

    const id = String(Date.now());
    const newEntry = {
      id,
      title,
      category: cat,
      description,
      image,
      date,
      createdAt: new Date().toISOString(),
    };

    collection.push(newEntry);

    await putDataFile(collection, sha, `Add entry: ${title} (${id})`);

    res.status(201).json({
      status: "success",
      id,
      message: "Entry added",
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.delete("/api/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { collection, sha } = await getDataFile();

    const index = collection.findIndex((item) => item.id === id);

    if (index === -1) {
      return res.status(404).json({
        status: "error",
        message: "Entry not found",
      });
    }

    collection.splice(index, 1);

    await putDataFile(collection, sha, `Delete entry: ${id}`);

    res.json({
      status: "success",
      message: "Entry deleted",
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`HOS Archive running at http://localhost:${PORT}`);
});
