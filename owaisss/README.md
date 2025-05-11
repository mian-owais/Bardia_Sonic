# Text-to-Speech Platform

A modern web application that converts PDF documents to speech with advanced features like background sound effects and collaborative note-taking.

## Features

- **PDF to Speech Conversion**
  - Upload and process PDF documents
  - Convert text to speech using Gemini API
  - Add background sound effects based on content
  - Download audio files

- **Advanced Note-Taking System**
  - Rich text editing
  - Tag-based organization
  - Collaboration features
  - Version history
  - Color coding and pinning

- **Subscription Management**
  - Multiple subscription tiers
  - Secure payment processing
  - Usage analytics
  - Plan upgrades and cancellations

- **User Management**
  - Secure authentication
  - Profile management
  - Usage statistics
  - Document history

## Tech Stack

### Frontend
- React with TypeScript
- Material-UI for components
- Redux for state management
- Chart.js for analytics
- React Dropzone for file uploads

### Backend
- Node.js with Express
- MongoDB for database
- JWT for authentication
- Stripe for payments
- Google Gemini API for text processing

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Google Gemini API key
- Stripe account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/tts-platform.git
cd tts-platform
```

2. Install backend dependencies:
```bash
cd server
npm install
```

3. Install frontend dependencies:
```bash
cd ../client
npm install
```

4. Create environment files:
- Create `.env` in the server directory with:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tts-platform
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
FRONTEND_URL=http://localhost:3000
```

- Create `.env` in the client directory with:
```
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

5. Start the development servers:
- Backend:
```bash
cd server
npm run dev
```

- Frontend:
```bash
cd client
npm run dev
```

## Project Structure

```
tts-platform/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── App.tsx        # Main application component
│   └── package.json
├── server/                 # Backend Node.js application
│   ├── src/
│   │   ├── models/        # MongoDB models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Express middleware
│   │   └── server.js      # Main server file
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - User login
- GET /api/auth/profile - Get user profile
- PUT /api/auth/profile - Update profile
- PUT /api/auth/change-password - Change password

### Documents
- POST /api/documents/upload - Upload PDF
- POST /api/documents/process/:id - Process document
- GET /api/documents - Get user's documents
- GET /api/documents/:id - Get single document
- DELETE /api/documents/:id - Delete document

### Notes
- POST /api/notes - Create note
- GET /api/notes - Get user's notes
- GET /api/notes/:id - Get single note
- PUT /api/notes/:id - Update note
- DELETE /api/notes/:id - Delete note
- POST /api/notes/:id/collaborators - Add collaborator
- DELETE /api/notes/:id/collaborators/:userId - Remove collaborator
- GET /api/notes/:id/history - Get version history

### Subscription
- GET /api/subscription/plans - Get subscription plans
- POST /api/subscription/create-checkout-session - Create checkout session
- GET /api/subscription/status - Get subscription status
- POST /api/subscription/cancel - Cancel subscription

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Gemini API for text processing
- Stripe for payment processing
- Material-UI for UI components
- MongoDB for database 