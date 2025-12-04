/**
 * Live Quiz Service Test Script
 * Use this to verify answer validation and leaderboard updates
 */

const io = require("socket.io-client");

// Configuration
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:3000";
const QUIZ_ID = process.argv[2]; // Pass quiz ID as argument
const NUM_STUDENTS = 3;

if (!QUIZ_ID) {
  console.error("❌ Usage: node test-live-quiz.js <QUIZ_ID>");
  console.error("   Example: node test-live-quiz.js 507f1f77bcf86cd799439011");
  process.exit(1);
}

console.log("🧪 Testing Live Quiz Service");
console.log(`📝 Quiz ID: ${QUIZ_ID}`);
console.log(`👥 Simulating ${NUM_STUDENTS} students`);
console.log("=".repeat(60));

// Mock user data
const mockUsers = [
  { id: "user1", name: "Alice", email: "alice@test.com" },
  { id: "user2", name: "Bob", email: "bob@test.com" },
  { id: "user3", name: "Charlie", email: "charlie@test.com" },
];

// Test state
let sessionCode = null;
let currentQuestion = null;
const studentSockets = [];

// Create host socket
const hostSocket = io(`${API_GATEWAY_URL}`, {
  transports: ["websocket"],
  path: "/socket.io",
});

hostSocket.on("connect", () => {
  console.log("✅ Host connected:", hostSocket.id);

  // Create session
  hostSocket.emit(
    "create-session",
    {
      quizId: QUIZ_ID,
      hostId: "host123",
      settings: {
        timePerQuestion: 30,
        showLeaderboardAfterEach: true,
        allowLateJoin: false,
      },
    },
    (response) => {
      if (response.success) {
        sessionCode = response.sessionCode;
        console.log(`✅ Session created: ${sessionCode}`);
        console.log("=".repeat(60));

        // Connect students
        setTimeout(() => connectStudents(), 1000);
      } else {
        console.error("❌ Failed to create session:", response.error);
        process.exit(1);
      }
    }
  );
});

hostSocket.on("session-started", () => {
  console.log("🚀 Session started!");
});

hostSocket.on("question-started", ({ questionIndex, question }) => {
  console.log(`\n❓ Question ${questionIndex + 1}: ${question.question}`);
  console.log(`   Options: ${question.options.join(", ")}`);
  currentQuestion = question;

  // Students answer after 2 seconds
  setTimeout(() => studentsAnswer(), 2000);
});

hostSocket.on("leaderboard-updated", ({ leaderboard }) => {
  console.log("\n🏆 Leaderboard Updated:");
  leaderboard.slice(0, 5).forEach((entry, i) => {
    console.log(
      `   ${i + 1}. ${entry.userName} - ${entry.score} pts (${
        entry.correctAnswers
      }/${entry.correctAnswers + entry.incorrectAnswers} correct)`
    );
  });
});

// Connect students
function connectStudents() {
  console.log("\n👥 Connecting students...");

  for (let i = 0; i < NUM_STUDENTS; i++) {
    const user = mockUsers[i];
    const socket = io(`${API_GATEWAY_URL}`, {
      transports: ["websocket"],
      path: "/socket.io",
    });

    socket.on("connect", () => {
      console.log(`   ✅ ${user.name} connected`);

      socket.emit(
        "join-session",
        {
          sessionCode,
          userId: user.id,
          userName: user.name,
          userPicture: null,
        },
        (response) => {
          if (response.success) {
            console.log(`   ✅ ${user.name} joined session`);
          } else {
            console.error(`   ❌ ${user.name} failed to join:`, response.error);
          }
        }
      );
    });

    socket.on("session-joined", () => {
      console.log(`   🎉 ${user.name} received session-joined event`);
    });

    socket.on("answer-submitted", ({ isCorrect, points, correctAnswer }) => {
      const icon = isCorrect ? "✅" : "❌";
      console.log(
        `   ${icon} ${user.name}: ${
          isCorrect ? "Correct" : "Incorrect"
        } (+${points} pts)`
      );
      if (!isCorrect) {
        console.log(`      Correct answer was: ${correctAnswer}`);
      }
    });

    socket.on("leaderboard-updated", ({ leaderboard }) => {
      const myRank = leaderboard.findIndex((e) => e.userId === user.id) + 1;
      const myScore = leaderboard.find((e) => e.userId === user.id)?.score || 0;
      console.log(
        `   📊 ${user.name} sees leaderboard - Rank #${myRank}, Score: ${myScore}`
      );
    });

    studentSockets.push({ socket, user });
  }

  // Start quiz after all students join
  setTimeout(() => {
    console.log("\n🚀 Starting quiz...");
    console.log("=".repeat(60));
    hostSocket.emit("start-session", { sessionCode, userId: "host123" });
  }, 3000);
}

// Students submit answers
function studentsAnswer() {
  if (!currentQuestion) return;

  console.log("\n📝 Students answering...");

  studentSockets.forEach(({ socket, user }, index) => {
    // First student gets correct answer, others get wrong answer
    const selectedAnswer =
      index === 0
        ? currentQuestion.options[0] // Assume first option is correct
        : currentQuestion.options[1];

    socket.emit("submit-answer", {
      sessionCode,
      userId: user.id,
      questionId: currentQuestion._id,
      selectedAnswer,
      timeSpent: 5 + index * 2,
    });

    console.log(`   ${user.name} submitted: ${selectedAnswer}`);
  });

  // Move to next question after 5 seconds
  setTimeout(() => {
    console.log("\n➡️ Moving to next question...");
    hostSocket.emit("next-question", { sessionCode, userId: "host123" });
  }, 5000);
}

// Cleanup
process.on("SIGINT", () => {
  console.log("\n\n🛑 Stopping test...");
  hostSocket.disconnect();
  studentSockets.forEach(({ socket }) => socket.disconnect());
  process.exit(0);
});

console.log("\n⏳ Connecting to server...");
