const express = require("express");
const fs = require("fs");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

// Limit spam requests
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 min
    max: 30
});
app.use(limiter);

const PORT = process.env.PORT || 3000;
const FILE = "scores.json";

// Create scores.json if it doesn't exist
if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, "[]");

// Helpers
function readScores() {
    return JSON.parse(fs.readFileSync(FILE));
}

function saveScores(scores) {
    fs.writeFileSync(FILE, JSON.stringify(scores, null, 2));
}

// Submit score
app.post("/submit", (req, res) => {
    const { username, score, difficulty } = req.body;

    if (!username || typeof score !== "number") 
        return res.status(400).json({ error: "Invalid data" });
    if (username.length > 15) 
        return res.status(400).json({ error: "Username too long" });
    if (score < 0 || score > 100000000) 
        return res.status(400).json({ error: "Invalid score" });

    const scores = readScores();
    scores.push({ username, score, difficulty, timestamp: Date.now() });
    scores.sort((a,b) => b.score - a.score);
    saveScores(scores.slice(0,50)); // Keep top 50
    res.json({ status: "Score saved" });
});

// Get leaderboard
app.get("/leaderboard", (req, res) => {
    res.json(readScores());
});

// Start server
app.listen(PORT, () => console.log(`Solveile leaderboard running on port ${PORT}`));