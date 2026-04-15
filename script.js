let currentType = "url";
let fileText = "";
let chart;

function setType(type) {
  currentType = type;
  const area = document.getElementById("inputArea");

  if (type === "url") {
    area.innerHTML = `<input id="dataInput" placeholder="Enter URL">`;
  }

  if (type === "email") {
    area.innerHTML = `<textarea id="dataInput" placeholder="Enter Email"></textarea>`;
  }

  if (type === "file") {
    area.innerHTML = `
    <input type="file" id="fileInput" hidden onchange="readFile(event)" />

    <div class="upload-box" onclick="document.getElementById('fileInput').click()">
      <i class="fa-solid fa-upload"></i> Upload Document
    </div>

    <p id="fileName">No file selected</p>
  `;
  }
}
function readFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  document.getElementById("fileName").innerText = "📄 " + file.name;

  const reader = new FileReader();

  reader.onload = (e) => {
    fileText = e.target.result;
    console.log("📄 File Loaded:", fileText.substring(0, 100));
  };

  reader.readAsText(file);
}

async function callAI(input) {
  try {
    const res = await fetch("http://localhost:3000/api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: currentType,
        input: input,
      }),
    });

    const data = await res.json();
    return data.result;
  } catch (err) {
    console.log("⚠️ AI server down");
    throw err; // important
  }
}

async function analyze() {
  let input =
    currentType === "file"
      ? fileText
      : document.getElementById("dataInput").value;

  if (!input) return alert("Enter data");

  let text = input.toLowerCase();

  let score = 100;
  let issues = [];

  // LOCAL ANALYSIS
  if (currentType === "url") {
    console.log("🔗 URL Local AI");

    if (!input.startsWith("https")) {
      score -= 30;
      issues.push("Not secure (HTTP)");
    }

    if (input.includes("@")) {
      score -= 30;
      issues.push("Hidden redirect");
    }
  } else if (currentType === "email") {
    console.log("📧 Email Local AI");

    if (/urgent|verify/.test(text)) {
      score -= 30;
      issues.push("Phishing keywords");
    }
  } else if (currentType === "file") {
    console.log("📄 File Local AI");

    if (/password|otp/.test(text)) {
      score -= 30;
      issues.push("Sensitive data");
    }
  }

  let danger = 100 - score;

  //  SHOW LOCAL RESULT FIRST (NO WAIT)
  document.getElementById("output").innerHTML = `
    <h3>Score: ${score}/100</h3>
    <b>Type:</b> ${currentType.toUpperCase()}<br><br>
    <b>Issues:</b><br>
    ${issues.length ? issues.join("<br>") : "No major issues"}<br><br>
    <b>AI Analysis:</b><br>
    🧠 Local AI result (instant)
  `;

  generateChart(score, danger);

  // BACKGROUND AI
  try {
    let ai = await callAI(input);

    // UPDATE ONLY IF SUCCESS
    document.getElementById("output").innerHTML += `
      <br><br><b>Advanced AI:</b><br>${ai}
    `;
  } catch (e) {
    console.log("⚠️ Server not available, skipped");
  }
}

function generateChart(safe, danger) {
  const ctx = document.getElementById("chart");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Safe", "Danger"],
      datasets: [
        {
          data: [safe, danger],
          backgroundColor: ["#22c55e", "#ef4444"],
          hoverBackgroundColor: ["#16a34a", "#dc2626"],
          borderColor: "#111827",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      animation: {
        animateScale: true,
        animateRotate: true,
        duration: 1000,
      },

      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#ffffff", // dark UI ke liye
            font: {
              size: 14,
              weight: "bold",
            },
            padding: 15,
          },
        },

        tooltip: {
          callbacks: {
            label: function (context) {
              let total = context.dataset.data.reduce((a, b) => a + b, 0);
              let value = context.raw;
              let percentage = ((value / total) * 100).toFixed(1);
              return `${context.label}: ${value} (${percentage}%)`;
            },
          },
        },
      },
    },
  });
}

function generateLocalAIText(type, issues, score) {
  let risk = score < 40 ? "High 🔴" : score < 70 ? "Medium 🟡" : "Low 🟢";

  let explanation = "";

  if (type === "url") {
    explanation =
      "This URL may be unsafe due to structural or security issues.";
  } else if (type === "email") {
    explanation = "This email shows signs of phishing or manipulation tactics.";
  } else if (type === "file") {
    explanation = "This file may contain sensitive or suspicious content.";
  }

  return `
Risk Level: ${risk}<br>
Security Score: ${score}/100<br><br>

Issues Found:<br>
${issues.length ? issues.join("<br>") : "No major issues"}<br><br>

Explanation:<br>
${explanation}<br><br>

Recommendation:<br>
- Avoid interacting if suspicious<br>
- Verify source<br>
- Stay secure
`;
}

function goToPage() {
  window.location.href = "password/index.html";
}

setType("url");
