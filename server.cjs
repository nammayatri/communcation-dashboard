// @ts-nocheck
// Development server to handle API requests and serve static files
// This file uses CommonJS format for Node.js compatibility
require('dotenv').config();
console.log('CLICKHOUSE_HOST:', process.env.CLICKHOUSE_HOST);

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { JWT } = require('google-auth-library');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@clickhouse/client');
// Import the Clickhouse service - using dynamic import for ES modules
let clickhouseService;
(async () => {
  try {
    clickhouseService = await import('./dist-server/services/clickhouseService.js');
    console.log('Clickhouse service imported successfully');
  } catch (error) {
    console.error('Error importing Clickhouse service:', error);
  }
})();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://communication-dashboard.vercel.app', 'https://dashboard.moving.tech']
    : 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'token']
}));
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

// Route all API requests to the proxy middleware, except for generate-fcm-token and download-data
app.all('/api/*', (req, res, next) => {
  if (req.path === '/api/generate-fcm-token' || req.path === '/api/download-data') {
    return next();
  }
  createProxyMiddleware(req, res);
});

// Handle the FCM token generation endpoint
app.post('/api/generate-fcm-token', async (req, res) => {
  try {
    const { serviceAccount } = req.body;

    // Enhanced validation
    if (!serviceAccount) {
      return res.status(400).json({ 
        error: 'Service account data is required' 
      });
    }

    if (!serviceAccount.client_email || typeof serviceAccount.client_email !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid service account: client_email is required and must be a string' 
      });
    }

    if (!serviceAccount.private_key || typeof serviceAccount.private_key !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid service account: private_key is required and must be a string' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(serviceAccount.client_email)) {
      return res.status(400).json({ 
        error: 'Invalid service account: client_email must be a valid email address' 
      });
    }

    // Validate private key format (should start with -----BEGIN PRIVATE KEY-----)
    if (!serviceAccount.private_key.includes('-----BEGIN PRIVATE KEY-----')) {
      return res.status(400).json({ 
        error: 'Invalid service account: private_key must be in the correct PEM format' 
      });
    }

    // Create JWT client using service account credentials
    const jwtClient = new JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: ['https://www.googleapis.com/auth/firebase.messaging']
    });

    // Get access token
    const token = await jwtClient.authorize();
    
    if (!token || !token.access_token) {
      throw new Error('Failed to obtain access token from Google');
    }
    
    // Return the token with Bearer prefix
    return res.status(200).json({ token: `Bearer ${token.access_token}` });
  } catch (error) {
    console.error('Error generating FCM token:', error);
    
    // Enhanced error response
    const errorMessage = error.message || 'Internal server error';
    const errorDetails = {
      message: errorMessage,
      type: error.name,
      code: error.code || 'UNKNOWN_ERROR'
    };
    
    return res.status(500).json({ 
      error: 'Failed to generate FCM token',
      details: errorDetails
    });
  }
});

// Add API routes before static file serving
app.get('/api/test', (req, res) => {
  res.json({ message: 'API server is running!' });
});

// Add data download endpoint
app.get('/api/download-data', async (req, res) => {
  try {
    const { city, variant } = req.query;
    
    if (!city) {
      return res.status(400).json({ error: 'City parameter is required' });
    }

    console.log('Received request for city:', city, 'variant:', variant);
    console.log('clickhouseService:', clickhouseService);
    console.log('downloadData function:', clickhouseService?.downloadData);

    if (!clickhouseService) {
      throw new Error('Clickhouse service not initialized');
    }

    if (!clickhouseService.downloadData) {
      throw new Error('downloadData function not found in clickhouseService');
    }

    // Execute query using the service's downloadData function
    console.log('Executing downloadData...');
    const result = await clickhouseService.downloadData(city, variant);
    console.log('Got result:', result?.substring(0, 100));

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${city}_${variant || 'ALL'}_${new Date().toISOString().slice(0, 10)}.csv"`);
    
    // Send the CSV data directly
    res.send(result);
  } catch (error) {
    console.error('Error downloading data:', error);
    res.status(500).json({ error: 'Failed to download data: ' + error.message });
  }
});

// Check if dist directory exists and serve static files
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  console.log('Dist directory found! Contents:', fs.readdirSync(distPath));
  // Serve static files from the dist directory
  app.use(express.static(distPath));
} else {
  console.log('WARNING: Dist directory not found at:', distPath);
}

// Default route
app.get('/', (req, res) => {
  res.redirect('/login');
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
  console.log(`Server is running on port ${PORT}`);
});

// Export the Express app for Vercel
module.exports = app; 