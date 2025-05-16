# Bardia Sonic PDF

A modern PDF reader with audio capabilities including text-to-speech and ambient sound effects.

## Features

- PDF reader with text extraction
- Text-to-speech functionality
- Background music and sound effects
- Dynamic audio recommendations based on content

## Prerequisites

- Node.js (v16+)
- Python (v3.7+)
- npm or yarn

## Setup Instructions

1. Clone the repository
   ```
   git clone https://github.com/yourusername/bardia-sonic-pdf.git
   cd bardia-sonic-pdf
   ```

2. Install dependencies
   ```
   npm install
   ```

   This will install both the frontend and backend dependencies.

## Development

To run the development servers for both frontend and backend:

```
npm run dev
```

### Frontend Only

```
npm run frontend:dev
```

### Backend Only

```
npm run backend:dev
```

## Troubleshooting

If you encounter any issues, try the following steps:

1. Make sure all dependencies are installed:
   ```
   npm run install
   ```

2. Check if the backend server is running:
   - The backend server should be running on http://localhost:5000
   - The frontend development server should be running on http://localhost:5173 or http://localhost:5174

3. If you see "Could not connect to PDF server" error:
   - Make sure the Flask server is running
   - Check if Flask and Flask-CORS are properly installed
   - Verify that port 5000 is available and not being used by another application

## License

MIT 