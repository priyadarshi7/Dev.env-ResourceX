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