// @ts-check
// Development server to handle API requests
// This file uses CommonJS format for Node.js compatibility
const express = require('express');
const cors = require('cors');
const { JWT } = require('google-auth-library');

// Create Express app
const app = express();

// Enable CORS and JSON parsing
app.use(cors({
  origin: '*',  // Allow all origins for development
  methods: ['POST', 'OPTIONS', 'GET'],
  credentials: true
}));
app.use(express.json());

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

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
    console.log(`Test endpoint: http://localhost:${PORT}/api/test`);
    console.log(`FCM Token endpoint: http://localhost:${PORT}/api/generate-fcm-token`);
  });
}

// Export the Express app for Vercel
module.exports = app; 