// @ts-nocheck
// Development server to handle API requests and serve static files
// This file uses CommonJS format for Node.js compatibility
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { JWT } = require('google-auth-library');
const path = require('path');
const fs = require('fs');
// Import the Clickhouse service - using dynamic import for ES modules
let clickhouseService;
(async () => {
  try {
    clickhouseService = await import('./dist/services/clickhouseService.js');
    console.log('Clickhouse service imported successfully');
  } catch (error) {
    console.error('Error importing Clickhouse service:', error);
  }
})();

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

// Add data download endpoint
app.get('/api/download-data', async (req, res) => {
  try {
    const { city, variant } = req.query;
    
    if (!city) {
      return res.status(400).json({ error: 'City parameter is required' });
    }

    console.log('Received request for city:', city, 'variant:', variant);

    // Get the absolute paths
    const rootDir = process.cwd();
    const pythonScript = path.resolve(rootDir, 'scripts', 'Clickhouse_connect.py');
    const venvPython = path.resolve(rootDir, 'venv', 'bin', 'python3');

    // Generate timestamped filename
    const timestamp = new Date().toISOString()
      .replace(/[-:]/g, '')  // Remove dashes and colons
      .replace('T', '_')     // Replace T with underscore
      .slice(0, 15);         // Get YYYYMMDD_HHMMSS
    const outputFilename = `${city}_${variant || 'ALL'}_${timestamp}.csv`;
    const outputPath = path.resolve(rootDir, outputFilename);

    console.log('Working directory:', rootDir);
    console.log('Python script path:', pythonScript);
    console.log('Python interpreter path:', venvPython);
    console.log('Output file path:', outputPath);

    // Verify paths exist
    if (!fs.existsSync(pythonScript)) {
      console.error('Python script not found at:', pythonScript);
      return res.status(500).json({ error: 'Python script not found' });
    }

    if (!fs.existsSync(venvPython)) {
      console.error('Python interpreter not found at:', venvPython);
      return res.status(500).json({ error: 'Python interpreter not found' });
    }

    // Execute the Python script with the output filename
    const command = `${venvPython} "${pythonScript}" "${city}" "${variant || 'ALL'}" "${outputFilename}"`;
    console.log('Executing command:', command);

    const { exec } = require('child_process');
    await new Promise((resolve, reject) => {
      exec(command, {
        cwd: rootDir
      }, (error, stdout, stderr) => {
        if (error) {
          console.error('Error executing Python script:', error);
          console.error('stderr:', stderr);
          reject(error);
          return;
        }
        if (stderr) {
          console.warn('Python script warnings:', stderr);
        }
        console.log('Python script output:', stdout);
        resolve(null);
      });
    });

    // Check if output file exists
    console.log('Looking for output file at:', outputPath);

    if (!fs.existsSync(outputPath)) {
      console.error('Output file not found at:', outputPath);
      return res.status(500).json({ error: 'Output file was not generated' });
    }

    console.log('Output file found, sending response...');

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${outputFilename}`);
    
    // Stream the file to the response
    const fileStream = fs.createReadStream(outputPath);
    fileStream.pipe(res);

    // Clean up the file after streaming
    fileStream.on('end', () => {
      console.log('File streaming completed, cleaning up...');
      fs.unlinkSync(outputPath);
      console.log('Output file deleted');
    });

    fileStream.on('error', (err) => {
      console.error('Error streaming file:', err);
      res.status(500).json({ error: 'Error streaming file' });
    });
  } catch (error) {
    console.error('Error downloading data:', error);
    res.status(500).json({ error: 'Failed to download data' });
  }
});

// Helper function to convert data to CSV
function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => 
        JSON.stringify(row[header] ?? '')
      ).join(',')
    )
  ];
  
  return csvRows.join('\n');
}

// Default route
app.get('/', (req, res) => {
  res.redirect('/login');
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