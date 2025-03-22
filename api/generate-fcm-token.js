// Serverless function for Vercel to generate FCM tokens from service account
const { JWT } = require('google-auth-library');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { serviceAccount } = req.body;

    // Validate the service account data
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
}; 