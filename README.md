# 🧠 Cognito Learning Hub

<div align="center">

![Cognito Learning Hub](https://img.shields.io/badge/Cognito-Learning%20Hub-6366F1?style=for-the-badge&logo=brain&logoColor=white)

**An AI-Powered Educational Quiz Platform**

[![HackSprint](https://img.shields.io/badge/🏆%20HackSprint-Axis%20College-8B5CF6?style=for-the-badge)](https://axisinstitutes.in)
[![Team](https://img.shields.io/badge/Team-OPTIMISTIC%20MUTANT%20CODERS-EC4899?style=for-the-badge)](https://www.linkedin.com/company/optimistic-mutant-coders/)

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=nodedotjs)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=flat-square&logo=socketdotio)](https://socket.io/)

---

**🎯 Submitted for HackSprint Hackathon at Axis College**

</div>

---

## 📖 About The Project

**Cognito Learning Hub** is a cutting-edge AI-powered educational platform designed to revolutionize how educators create assessments and how students learn. Built with a modern microservices architecture, it leverages Google's Gemini AI to automatically generate quizzes from various content sources.

Whether you're a teacher creating classroom assessments, a corporate trainer developing employee evaluations, or a student looking for interactive study tools, Cognito Learning Hub has you covered.

---

## ✨ Key Features

### 🤖 AI-Powered Quiz Generation
- **Topic-Based Generation**: Enter any topic and get instant quizzes with Gemini 1.5 Flash
- **Document Upload**: Upload PDFs or text files for automatic quiz creation
- **YouTube Integration**: Generate quizzes from educational YouTube videos
- **Adaptive Difficulty**: AI adjusts question complexity based on user performance

### 🎮 Real-Time Multiplayer
- **Live Quiz Sessions**: Host interactive quiz competitions
- **1v1 Duels**: Challenge friends to head-to-head battles
- **Real-Time Leaderboards**: Watch rankings update live with Socket.IO
- **Matchmaking System**: Automatic pairing based on skill levels

### 📹 Video Meeting Service
- **WebRTC Video Calls**: Peer-to-peer video for study groups
- **Screen Sharing**: Share your screen during study sessions
- **Host Controls**: Manage participants and meeting settings
- **In-Call Chat**: Text communication during calls

### 👥 Social Learning
- **Friends System**: Connect with classmates and colleagues
- **Quiz Challenges**: Challenge friends to beat your scores
- **Direct Messaging**: Private conversations
- **Activity Feed**: See what your network is learning
- **Notifications**: Stay updated on challenges and messages

### 🏆 Gamification
- **12+ Achievements**: Unlock badges for milestones
- **XP & Leveling**: Progress through levels as you learn
- **Daily Streaks**: Maintain learning consistency
- **Global Leaderboards**: Compete worldwide
- **Category Rankings**: Top performers by subject

### 🤖 AI Doubt Solver
- **24/7 AI Tutoring**: Get instant help with difficult concepts
- **Context-Aware Responses**: AI understands quiz context
- **Step-by-Step Explanations**: Detailed problem breakdowns

### 📊 Analytics Dashboard
- **Performance Tracking**: Monitor your learning progress
- **Quiz Analytics**: Insights for quiz creators
- **Detailed Reports**: Comprehensive result analysis
- **Progress Visualization**: Charts and graphs

### 🛡️ Moderation System
- **Content Reporting**: Flag inappropriate content
- **Admin Dashboard**: Manage reports and users
- **Appeal System**: Fair dispute resolution
- **Audit Logs**: Track all moderation actions

---

## 🏗️ Architecture

Cognito Learning Hub uses a **microservices architecture** for scalability and maintainability:

```
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway (Port 3000)                  │
│          Central routing, auth, rate limiting, CORS          │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼───────┐    ┌────────▼────────┐   ┌──────▼──────┐
│  Auth Service │    │  Quiz Service    │   │Result Service│
│   Port 3001   │    │   Port 3002      │   │  Port 3003   │
└───────────────┘    └──────────────────┘   └──────────────┘
        │                     │                     │
┌───────▼───────┐    ┌────────▼────────┐   ┌──────▼──────┐
│ Live Service  │    │Meeting Service   │   │Social Service│
│   Port 3004   │    │   Port 3005      │   │  Port 3006   │
└───────────────┘    └──────────────────┘   └──────────────┘
        │                     │
┌───────▼───────┐    ┌────────▼────────┐
│Gamification   │    │  Moderation      │
│   Port 3007   │    │   Port 3008      │
└───────────────┘    └──────────────────┘
```

### Services Overview

| Service | Port | Description |
|---------|------|-------------|
| **API Gateway** | 3000 | Request routing, authentication, rate limiting |
| **Auth Service** | 3001 | User authentication, JWT, Google OAuth |
| **Quiz Service** | 3002 | Quiz CRUD, AI generation with Gemini |
| **Result Service** | 3003 | Scores, leaderboards, analytics |
| **Live Service** | 3004 | Real-time multiplayer with Socket.IO |
| **Meeting Service** | 3005 | WebRTC video calls |
| **Social Service** | 3006 | Friends, messaging, notifications |
| **Gamification Service** | 3007 | Achievements, XP, streaks |
| **Moderation Service** | 3008 | Reports, admin tools, appeals |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18.3 | UI Framework |
| Vite | Build Tool & Dev Server |
| Tailwind CSS | Utility-First Styling |
| Framer Motion | Animations |
| Socket.IO Client | Real-Time Communication |
| Recharts | Data Visualization |
| React Router DOM | Client-Side Routing |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js 20+ | Runtime Environment |
| Express 5 | Web Framework |
| MongoDB + Mongoose | Database |
| Redis | Caching & Sessions |
| Bull | Job Queue |
| Socket.IO | WebSocket Server |
| WebRTC | Video Calls |
| JWT + bcryptjs | Authentication |
| Google Gemini API | AI Quiz Generation |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- MongoDB
- Redis (optional, for caching)
- Google Cloud API Key (for Gemini AI)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/priyanshu-1006/Cognito-Learning-Hub.git
   cd Cognito-Learning-Hub
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Install Microservices Dependencies**
   ```bash
   cd ../microservices/api-gateway
   npm install
   cd ../shared
   npm install
   # Repeat for other services as needed
   ```

4. **Configure Environment Variables**
   ```bash
   # Create .env files for each service
   cp microservices/api-gateway/.env.example microservices/api-gateway/.env
   # Edit with your configuration
   ```

5. **Start the Development Servers**
   ```bash
   # Terminal 1: Frontend
   cd frontend
   npm run dev

   # Terminal 2: API Gateway
   cd microservices/api-gateway
   npm run dev
   ```

---

## 📁 Project Structure

```
Cognito-Learning-Hub/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Route pages
│   │   ├── context/         # React context providers
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Utility functions
│   │   └── config/          # Configuration files
│   └── public/              # Static assets
│
└── microservices/           # Backend microservices
    ├── api-gateway/         # Central API gateway
    ├── auth-service/        # Authentication service
    ├── quiz-service/        # Quiz management & AI
    ├── result-service/      # Results & analytics
    ├── live-service/        # Real-time features
    ├── meeting-service/     # Video calls
    ├── social-service/      # Social features
    ├── gamification-service/# Achievements & XP
    ├── moderation-service/  # Content moderation
    └── shared/              # Shared utilities
```

---

## 🎯 HackSprint - Axis College

This project was developed for the **HackSprint Hackathon** at **Axis College**. 

### About HackSprint
HackSprint is a hackathon event organized by Axis College that challenges students to build innovative solutions using cutting-edge technologies. Our team chose to tackle the education sector by creating an AI-powered learning platform.

### Our Solution
We identified key challenges in modern education:
- Time-consuming quiz creation for educators
- Lack of engaging, interactive learning tools
- Limited access to personalized tutoring
- Difficulty in tracking learning progress

Cognito Learning Hub addresses all these challenges with AI automation, gamification, and social learning features.

---

## 👥 Team OPTIMISTIC MUTANT CODERS

We are a team of passionate developers from **Axis College** participating in HackSprint.

<div align="center">

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Team%20Page-0A66C2?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/company/optimistic-mutant-coders/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/priyanshu-1006/Cognito-Learning-Hub)

</div>

---

## 🔮 Future Roadmap

- [ ] Mobile App (React Native)
- [ ] Advanced AI Analytics
- [ ] Voice-Based Quiz Taking
- [ ] AR/VR Learning Experiences
- [ ] Multi-Language Support
- [ ] Offline Mode
- [ ] Enterprise SSO Integration

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- **Axis College** for organizing HackSprint
- **Google** for the Gemini AI API
- All the open-source libraries that made this possible

---

<div align="center">

**Made with ❤️ by Team OPTIMISTIC MUTANT CODERS**

*For HackSprint at Axis College*

</div>
