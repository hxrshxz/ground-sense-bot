# PS CHOSEN - SIH25066 (Development of an Al-driven ChatBOT for INGRES as a virtuall assistant)

This README provides an overview of the project, including team details, relevant links, tasks completed, tech stack, key features, and steps to run the project locally.

## Team Details

**Team Name:** Mercury

**Team Leader:** [@hxrshxz](https://github.com/hxrshxz)

**Team Members:**

- **Harsh** - 2024UIC3571 - [@hxrshxz](https://github.com/hxrshxz)
- **Anushka** - 2024UIC3570 - [@anushkaaaaaaaa](https://github.com/anushkaaaaaaaa)
- **Kunal** - 2024UIC3509 - [@kunal-595](https://github.com/kunal-595)
- **Anvay** - 2024UIC3580 - [@AnvayKharb](https://github.com/AnvayKharb)
- **Priyanshu** - 2024UIC3506 - [@Priyanshu-rgbb](https://github.com/Priyanshu-rgbb)
- **Himanshi** - 2025UEE4486 - [@hiiiimaaaanshiiii](https://github.com/hiiiimaaaanshiiii)

## Project Links

- **SIH Presentation:** [Internal PPT Mercury (PDF)](files/Internal_PPT_Mercury.pdf)
- **Video Demonstration:** [Watch Video](https://youtu.be/TrgzAlbYNBg)
- **Live Deployment:** [View Deployment](https://ground-sense-bot.vercel.app/)
- **Source Code:** [GitHub Repository](https://github.com/hxrshxz/ground-sense-bot)

---

## ✅ Tasks Accomplished

Our team successfully designed, developed, and deployed a full-stack solution with the following key accomplishments:

- [x] **Task 1: Core AI Chatbot Interface & UX**
  - Developed a dynamic, responsive, and intuitive chat interface using **React** and **TypeScript**, ensuring a seamless user experience on both desktop and mobile devices.

- [x] **Task 2: Dynamic Data Visualization Engine**
  - Engineered a powerful component-based rendering system that allows the AI to generate and display rich, interactive visualizations—including **line charts, bar charts, pie charts, and specialized data cards**—directly within the chat conversation.

- [x] **Task 3: Structured AI Response Service**
  - Designed a sophisticated service that maps natural language queries to predefined, structured AI responses. This allows for the delivery of rich, multi-component data dossiers instead of just plain text, providing a superior analytical experience.

- [x] **Task 4: Multi-Modal, Voice, and Multilingual Support**
  - Implemented an "Analyze Map" feature for multi-modal input and integrated **voice recognition** for hands-free interaction. Added support for multiple Indian regional languages to enhance accessibility.

- [x] **Task 5: Scalable Go Backend Architecture**
  - Built a robust, production-ready backend in **Go (Golang)** featuring a RESTful API, JWT-based authentication, rate limiting, and secure middleware. The entire backend is containerized with **Docker** for seamless deployment and scalability.

---

## 🛠️ Technology Stack

This project leverages a modern, high-performance technology stack chosen for scalability, developer experience, and powerful AI capabilities.

### 🌐 Frontend
- **React & Vite**
  > For a blazing-fast, component-based user interface.
- **TypeScript**
  > To ensure code quality, maintainability, and type safety.
- **Tailwind CSS**
  > For rapid, utility-first styling and a clean design system.
- **Chart.js & Recharts**
  > For creating beautiful, interactive, and data-rich charts and graphs.
- **Framer Motion**
  > To provide fluid animations and an engaging user experience.

### ⚙️ Backend
- **Go (Golang)**
  > Chosen for its exceptional performance, concurrency, and suitability for building scalable microservices and APIs.
- **PostgreSQL**
  > A powerful, open-source object-relational database system known for its reliability and robustness.
- **Docker**
  > Used to containerize the Go application and its database services, ensuring consistent and reproducible deployments.

### 🧠 Artificial Intelligence
- **Google Gemini**
  > Leveraged for its advanced natural language understanding, contextual reasoning, and ability to generate structured data for our visualization engine.

---

## ✨ Key Features

Our solution is packed with features designed to meet and exceed the requirements of the problem statement.

| Feature | Description |
| :--- | :--- |
| 💬 **Conversational Data Querying** | Ask complex questions in plain English or regional languages and get instant, accurate answers. |
| 📊 **Interactive Visualizations** | The AI generates rich, interactive charts, graphs, and data cards on-the-fly to visualize information. |
| 🗺️ **Multi-Modal Analysis** | Upload an image of a map, and the AI will analyze the depicted regions to provide a comprehensive hydrogeological report. |
| 🎙️ **Voice-Enabled Co-Pilot Mode** | A hands-free mode that provides spoken responses and listens for follow-up questions to guide your analysis. |
| 🌐 **Multilingual Support** | Full support for English and several Indian regional languages, making the platform accessible to a wider audience. |
| 📄 **Export & Share Reports** | Easily download any AI-generated report or visualization as a **PDF or PNG**, or share it with colleagues. |

---

## 🚀 Local Setup

Follow these steps to get the Ground-Sense AI Assistant running on your local machine.

### 📋 Prerequisites

Make sure you have the following installed on your system:
- [ ] Git
- [ ] Node.js (v18 or higher)
- [ ] Go (Golang) (v1.21 or higher)
- [ ] Docker & Docker Compose

### 1. Clone the Repository
Open your terminal and run the following commands:
```bash
git clone https://github.com/hxrshxz/ground-sense-bot.git
cd ground-sense-bot
```

### 2. Set Up the Frontend (React)
The frontend requires a Google Gemini API key to power the AI features.

- **Navigate back to the root project directory:**
  ```bash
  cd ..
  ```
- **Create the frontend environment file:**
  ```bash
  cp .env.example .env
  ```
- **Add your Gemini API Key:** Open the newly created `.env` file and add your key. You can get one from **[Google AI Studio](https://makersuite.google.com/app/apikey)**.
  ```env
  VITE_GEMINI_API_KEY=YOUR_API_KEY_HERE
  ```
- **Install dependencies and run the app:**
  ```bash
  npm install
  npm run dev
  ```
  
### 3. Set Up the Backend (Go & PostgreSQL)
The backend is fully containerized with Docker, making setup incredibly simple.

- **Navigate to the backend directory:**
  ```bash
  cd backend
  ```
- **Create the environment file:** (No modifications are needed for local Docker setup)
  ```bash
  cp .env.example .env
  ```
- **Launch the services:**
  ```bash
  docker-compose up -d --build
  ```
> The backend server will now be running on `http://localhost:8080`.

### 4. Access the Application
Once both services are running, open your web browser and navigate to:

**[http://localhost:5173](http://localhost:5173)**

You should now be greeted with the INGRES AI Assistant interface, ready to answer your queries!
