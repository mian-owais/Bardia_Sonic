# Bardia Sonic PDF Frontend

React-based frontend for the Bardia Sonic PDF application. This web app enables context-aware background music and sound effects for PDF reading.

## Features

- PDF reading with synchronized background music
- Contextually appropriate sound effects
- Text-to-speech functionality
- Two modes: Reading (music only) and Listening (music + effects + TTS)
- User authentication and management
- PDF upload and management

## Tech Stack

- React 18 with TypeScript
- Vite for fast development and building
- Tailwind CSS & Bootstrap for UI
- React Router for navigation
- Firebase Authentication
- PDF.js for PDF rendering
- Web Audio API for audio playback

## Getting Started

### Prerequisites

- Node.js v14+
- NPM or Yarn

### Installation

1. Install dependencies

```bash
npm install
# or
yarn
```

2. Create a `.env` file based on `.env.example` and fill in your Firebase configuration

3. Start the development server

```bash
npm run dev
# or
yarn dev
```

4. Build for production

```bash
npm run build
# or
yarn build
```

## Project Structure

```
src/
├── components/      # Reusable UI components
├── contexts/        # React context providers
├── pages/           # Page components
├── services/        # API and Firebase services
├── App.tsx          # Main App component
└── main.tsx         # Entry point
```

## Environment Variables

- `VITE_API_URL`: URL of the backend API
- `VITE_FIREBASE_*`: Firebase configuration variables 