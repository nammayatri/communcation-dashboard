// @ts-check
// Development server to handle API requests and serve static files
// This file uses CommonJS format for Node.js compatibility
const express = require('express');
const cors = require('cors');
const { JWT } = require('google-auth-library');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();

// Enable CORS and JSON parsing
app.use(cors({
  origin: '*',  // Allow all origins for development
  methods: ['POST', 'OPTIONS', 'GET'],
  credentials: true
}));
app.use(express.json());

// Check if dist directory exists
const distPath = path.join(__dirname, 'dist');
console.log('Looking for dist directory at:', distPath);
if (fs.existsSync(distPath)) {
  console.log('Dist directory found! Contents:', fs.readdirSync(distPath));
} else {
  console.log('WARNING: Dist directory not found at:', distPath);
}

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle the FCM token generation endpoint
app.post('/api/generate-fcm-token', async (req, res) => {
  try {
    const { serviceAccount } = req.body;

    if (!serviceAccount || !serviceAccount.client_email || !serviceAccount.private_key) {
      return res.status(400).json({ 
        error: 'Invalid service account: Missing required fields (client_email or private_key)' 
      });
    }

    // Create JWT client using service account credentials
    const jwtClient = new JWT(
      serviceAccount.client_email,
      null,
      serviceAccount.private_key,
      ['https://www.googleapis.com/auth/firebase.messaging'],
      null
    );

    // Get access token
    const token = await jwtClient.authorize();
    
    // Return the token with Bearer prefix
    return res.status(200).json({ token: `Bearer ${token.access_token}` });
  } catch (error) {
    console.error('Error generating FCM token:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Add a simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API server is running!' });
});

// Debug endpoint to check server status
app.get('/api/debug', (req, res) => {
  const info = {
    currentDirectory: __dirname,
    distPath: path.join(__dirname, 'dist'),
    distExists: fs.existsSync(path.join(__dirname, 'dist')),
    environment: process.env.NODE_ENV || 'development'
  };
  
  if (info.distExists) {
    info.distContents = fs.readdirSync(path.join(__dirname, 'dist'));
  }
  
  res.json(info);
});

// For handling client-side routing (SPA)
app.get('*', (req, res) => {
  console.log('Handling request for:', req.path);
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send(`Index.html not found at ${indexPath}. Current directory: ${__dirname}`);
  }
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`UI accessible at: http://localhost:${PORT}`);
    console.log(`Test API endpoint: http://localhost:${PORT}/api/test`);
    console.log(`Debug endpoint: http://localhost:${PORT}/api/debug`);
    console.log(`FCM Token endpoint: http://localhost:${PORT}/api/generate-fcm-token`);
  });
}

// Export the Express app for Vercel
module.exports = app; 