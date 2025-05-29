<<<<<<< HEAD
# GitGraphium with AI Backend Integration

A 3D GitHub repository visualizer with AI-powered code exploration and chat capabilities.

## Features

- Interactive 3D visualization of GitHub repositories
- AI-powered code summaries using Gemini API
- Chat with your codebase to ask questions about code
- Semantic code search
- VR support for immersive code exploration

## Setup

### Prerequisites

- Node.js (v18 or higher)
- Python (v3.8 or higher)
- A GitHub account (for API access)
- A Gemini API key (for AI summaries)

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd models
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

4. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

5. Create a `.env` file with your API keys (if needed):
   ```
   GROQ_API_KEY=your_groq_api_key
   ```

6. Start the backend server:
   ```
   python chat.py
   ```

The backend server will run on http://localhost:8000 by default.

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create or update the `.env` file to point to your backend:
   ```
   VITE_API_URL=http://localhost:8000
   ```

4. Start the development server:
   ```
   npm run dev
   ```

The frontend will be available at http://localhost:5173 by default.

## Usage

1. Open your browser and navigate to http://localhost:5173
2. Enter a GitHub repository URL (e.g., https://github.com/username/repo)
3. Click "Visualize Repository"
4. Explore the repository structure in 3D
5. Click on files to see AI-generated summaries
6. Use the Chat tab to ask questions about the codebase

## API Keys

- **GitHub Token**: Required for private repositories or to avoid API rate limits
- **Gemini API Key**: Required for AI-powered code summaries

## VR Mode

To use VR mode:
1. Ensure you have a compatible VR headset
2. Connect your headset to your computer
3. Click the "Enter VR" button in the visualization

## Technologies Used

- Frontend: React, Three.js, TailwindCSS
- Backend: Python, FastAPI, LangChain
- AI: Groq, Google Gemini 
=======
# Dev.env-ResourceX

**Dev.env-ResourceX** is a modular, multi-language development environment and resource exchange manager. It provides a structured backend, frontend, and model management system, aiming to streamline development workflows for projects involving JavaScript, Python, and other technologies.

![Project Overview](upload-project-overview-image-here)

### 🧠 What is Dev.env-ResourceX?

Dev.env-ResourceX is not just a modular development environment—it's also a **Resource Exchange System**. This means you can:

* Seamlessly share, manage, and access development resources like scripts, models, assets, and configuration files.
* Use the platform to **upload, fetch, or update resources** from various development domains (e.g., web, ML, graphics).
* Enable **cross-functional collaboration** between frontend, backend, and data teams through a unified structure.

### 🔧 How to Use the Resource Exchange:

1. **Upload a Resource:** Navigate to the desired module (e.g., `backend/`, `models/`, etc.) and add the resource.
2. **Tag it:** Use metadata files to categorize and describe the resource.
3. **Sync:** Pull updated resources or push your own using provided CLI or API tools.
4. **Collaborate:** Team members can fetch the latest version of assets via the resource sync interface.

![Resource Exchange Flow](upload-resource-exchange-diagram-here)

<p align="center">
  <a href="https://www.youtube.com/watch?v=TOljqkl3aoM" target="_blank">
    <img src="https://www.youtube.com/watch?v=TOljqkl3aoM/0.jpg" alt="Watch the Demo Video" width="720">
  </a>
</p>

---

## 📚 Table of Contents

* [Features](#features)
* [Project Structure](#project-structure)
* [Installation](#installation)
* [Usage](#usage)
* [Requirements](#requirements)

---

## 🚀 Features

* **Modular Design**: Backend, frontend, and models are organized for scalability.
* **Multi-language Support**: JavaScript (Node.js) backend, Python models, and HTML/JS frontend.
* **Resource Management**: Easily manage development resources and dependencies.
* **Resource Exchange System**: Collaborative and scalable resource sharing.

---

## 📁 Project Structure

```
Dev.env-ResourceX/
├── backend/      # Backend code and services (Node.js)
├── blender/      # Blender-related scripts or integrations
├── frontend/     # Frontend code (JavaScript/HTML)
├── models/       # Data models or machine learning models
```

---

## ⚙️ Installation

### Clone the repository:

```bash
git clone https://github.com/priyadarshi7/Dev.env-ResourceX.git
cd Dev.env-ResourceX
```

### Backend Setup (Node.js):

Navigate to the `backend/` directory and install dependencies.

```bash
cd backend
npm install
```

### Frontend Setup:

Navigate to the `frontend/` directory and install dependencies.

```bash
cd ../frontend
npm install
```

### Blender Setup:

If using Blender scripts, ensure Blender is installed and properly configured.

---

## 🧩 Usage

### Backend:

Run the backend server from the `backend/` directory:

```bash
cd backend
npm run dev
```

### Frontend:

Serve or build the frontend from the `frontend/` directory:

```bash
cd frontend
npm run dev
```

### Models:

Use or train models as described in the `models/` directory's documentation.

> **Note:** Refer to individual folder README files (if available) for detailed instructions.

---

## 📦 Requirements

* Node.js & npm
* Python 3.8+ (for models)
* Blender (optional, for Blender scripts)
* Other dependencies as specified in `package.json` or `requirements.txt`
>>>>>>> 3a414509462d00d915f7bf789b227b9780b53972
