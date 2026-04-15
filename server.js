import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// HEALTH
app.get("/health", (req, res) => {
  res.json({ status: "Local AI Server Running " });
});

// MAIN API
app.post("/api", (req, res) => {
  let { type, input } = req.body;

  console.log("\n==============================");
  console.log("📩 TYPE:", type);
  console.log("📩 INPUT:", input);

  if (!type) type = "unknown";
  if (!input) input = "";

  const result = localAI(input, type);

  return res.json({ result });
});

// LOCAL AI ROUTER
function localAI(input, type) {
  input = input.toLowerCase();

  if (type === "url") return analyzeURL(input);
  if (type === "email") return analyzeEmail(input);
  if (type === "file") return analyzeFile(input);

  return "❌ Unknown input type";
}

//  URL ANALYZER

function analyzeURL(input) {
  let score = 100;
  let issues = [];

  if (input.includes("@")) {
    score -= 30;
    issues.push("Hidden redirect using '@'");
  }

  if (input.startsWith("http://")) {
    score -= 30;
    issues.push("Not secure (HTTP)");
  }

  if (/bit\.ly|tinyurl|shorturl/.test(input)) {
    score -= 20;
    issues.push("Shortened URL (possible phishing)");
  }

  if (input.split(".").length > 4) {
    score -= 15;
    issues.push("Too many subdomains");
  }

  if (input.length > 80) {
    score -= 10;
    issues.push("Very long URL");
  }

  let risk = getRisk(score);

  return formatOutput("URL", score, risk, issues);
}

// EMAIL ANALYZER

function analyzeEmail(input) {
  let score = 100;
  let issues = [];

  if (/urgent|immediately|action required/.test(input)) {
    score -= 25;
    issues.push("Urgency attack");
  }

  if (/verify|login|update account/.test(input)) {
    score -= 25;
    issues.push("Phishing attempt");
  }

  if (/bank|otp|password|credit card/.test(input)) {
    score -= 30;
    issues.push("Sensitive data request");
  }

  if (/click here|link below/.test(input)) {
    score -= 20;
    issues.push("Suspicious link instruction");
  }

  let risk = getRisk(score);

  return formatOutput("EMAIL", score, risk, issues);
}

//  FILE ANALYZER

function analyzeFile(input) {
  let score = 100;
  let issues = [];

  if (/password|otp|pin/.test(input)) {
    score -= 30;
    issues.push("Sensitive data found");
  }

  if (/confidential|private/.test(input)) {
    score -= 20;
    issues.push("Confidential content");
  }

  if (/verify|login/.test(input)) {
    score -= 20;
    issues.push("Suspicious instructions");
  }

  if (input.length > 5000) {
    score -= 10;
    issues.push("Large document");
  }

  let risk = getRisk(score);

  return formatOutput("FILE", score, risk, issues);
}

// COMMON FUNCTIONS

function getRisk(score) {
  if (score < 40) return "High 🔴";
  if (score < 70) return "Medium 🟡";
  return "Low 🟢";
}

function formatOutput(type, score, risk, issues) {
  return `
 Local AI Analysis

Type: ${type}
Risk: ${risk}
Score: ${score}/100

Issues:
${issues.length ? issues.join("\n") : "No major issues"}
`;
}

app.listen(3000, () => {
  console.log(" Local AI Server running on http://localhost:3000");
});
