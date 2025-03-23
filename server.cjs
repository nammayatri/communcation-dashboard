// @ts-nocheck
// Development server to handle API requests and serve static files
// This file uses CommonJS format for Node.js compatibility
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { JWT } = require('google-auth-library');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Check if dist directory exists
const distPath = path.join(__dirname, 'dist');
console.log('Looking for dist directory at:', distPath);
if (fs.existsSync(distPath)) {
  console.log('Dist directory found! Contents:', fs.readdirSync(distPath));
  // Serve static files from the dist directory
  app.use(express.static(distPath));
} else {
  console.log('WARNING: Dist directory not found at:', distPath);
}

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Base URL for the target API
const API_BASE_URL = 'https://dashboard.moving.tech';

// Proxy middleware function
const createProxyMiddleware = async (req, res) => {
  // The request path already includes /api, so we don't need to add it again
  const targetURL = `${API_BASE_URL}${req.url}`;
  
  console.log('Proxying request to:', targetURL);
  
  try {
    // Forward the original headers, method, and body
    const response = await axios({
      url: targetURL,
      method: req.method,
      data: req.body,
      headers: {
        ...req.headers,
        host: 'dashboard.moving.tech',
        // Remove the origin header to prevent CORS issues
        origin: undefined,
        // Remove connection headers that might cause problems
        connection: undefined,
        'access-control-request-method': undefined,
        'access-control-request-headers': undefined
      },
    });
    
    // Send the proxied response back to the client
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`Error proxying request to ${targetURL}:`, error.message);
    
    // Forward error response if available
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        error: 'An error occurred while proxying the request',
        message: error.message,
      });
    }
  }
};

// Route all API requests to the proxy middleware, except for generate-fcm-token
app.all('/api/*', (req, res, next) => {
  if (req.path === '/api/generate-fcm-token') {
    return next();
  }
  createProxyMiddleware(req, res);
});

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
      '',  // Using empty string instead of null
      serviceAccount.private_key,
      ['https://www.googleapis.com/auth/firebase.messaging'],
      undefined  // Using undefined instead of null
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

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'API proxy server is running' });
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
    environment: process.env.NODE_ENV || 'development',
    apiBaseUrl: API_BASE_URL
  };
   
  if (info.distExists) {
    info.distContents = fs.readdirSync(path.join(__dirname, 'dist'));
  }
   
  res.json(info);
});

// For handling client-side routing (SPA)
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  console.log('Handling client-side route:', req.path);
  
  // Send the index.html file for all non-API routes
  const path = require('path');
  const fs = require('fs');
  
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // During development, allow the Vite dev server to handle the request
    res.status(404).json({
      message: `Index file not found. In development, this route (${req.path}) should be handled by the Vite dev server.`
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});

// Export the Express app for Vercel
module.exports = app; 