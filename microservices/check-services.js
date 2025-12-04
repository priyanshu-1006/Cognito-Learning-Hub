/**
 * Service Health Check Script
 * Verifies all microservices are reachable
 */

const https = require("https");
const http = require("http");

const services = {
  "API Gateway": "https://api-gateway-w9ln.onrender.com/health",
  "Auth Service": "https://auth-service-3iig.onrender.com/health",
  "Quiz Service": "https://quiz-service-xhw5.onrender.com/health",
  "Result Service": "https://result-service-tcnw.onrender.com/health",
  "Live Service": "https://live-service-qemg.onrender.com/health",
  "Meeting Service": "https://meeting-service-sbve.onrender.com/health",
  "Social Service": "https://social-service-yxub.onrender.com/health",
  "Gamification Service": "https://gamification-service.onrender.com/health",
  "Moderation Service": "https://moderation-service-2ovd.onrender.com/health",
};

async function checkService(name, url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === "https:" ? https : http;

    const startTime = Date.now();
    const req = client.get(url, { timeout: 10000 }, (res) => {
      const duration = Date.now() - startTime;
      let data = "";

      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        const status = res.statusCode === 200 ? "✅" : "❌";
        console.log(
          `${status} ${name.padEnd(25)} - ${res.statusCode} (${duration}ms)`
        );
        resolve({
          name,
          status: res.statusCode,
          duration,
          healthy: res.statusCode === 200,
        });
      });
    });

    req.on("error", (err) => {
      const duration = Date.now() - startTime;
      console.log(
        `❌ ${name.padEnd(25)} - ERROR: ${err.message} (${duration}ms)`
      );
      resolve({
        name,
        status: "ERROR",
        duration,
        healthy: false,
        error: err.message,
      });
    });

    req.on("timeout", () => {
      req.destroy();
      console.log(`⏱️  ${name.padEnd(25)} - TIMEOUT (>10s)`);
      resolve({ name, status: "TIMEOUT", healthy: false });
    });
  });
}

async function checkAllServices() {
  console.log("\n🔍 Checking Cognito Learning Hub Microservices...\n");
  console.log("=".repeat(70));

  const results = [];
  for (const [name, url] of Object.entries(services)) {
    const result = await checkService(name, url);
    results.push(result);
  }

  console.log("=".repeat(70));

  const healthy = results.filter((r) => r.healthy).length;
  const total = results.length;

  console.log(`\n📊 Summary: ${healthy}/${total} services healthy\n`);

  if (healthy < total) {
    console.log("⚠️  Issues detected:");
    results
      .filter((r) => !r.healthy)
      .forEach((r) => {
        console.log(`   • ${r.name}: ${r.error || r.status}`);
      });
    console.log("");
  }

  return results;
}

checkAllServices();
