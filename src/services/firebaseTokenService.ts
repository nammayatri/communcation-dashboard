import axios from 'axios';

interface ServiceAccountKey {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

/**
 * Generate an OAuth2 access token from a service account JSON file
 * This token can be used for FCM API authorization
 */
export const generateFCMTokenFromServiceAccount = async (serviceAccountJson: ServiceAccountKey): Promise<string> => {
  try {
    // Ensure we have the required fields
    if (!serviceAccountJson.private_key || !serviceAccountJson.client_email) {
      throw new Error('Invalid service account JSON: Missing required fields (private_key or client_email)');
    }

    // Use relative URL which works in both development and production
    const apiUrl = '/api/generate-fcm-token';
    
    console.log('Sending request to generate FCM token:', apiUrl);
    
    const response = await axios.post(apiUrl, {
      serviceAccount: serviceAccountJson
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.data || !response.data.token) {
      console.error('Invalid API response:', response.data);
      throw new Error('Invalid response from token generation service');
    }

    console.log('Successfully generated FCM token');
    return response.data.token;
  } catch (error: any) {
    console.error('Error generating FCM token:', error);
    
    // Provide more detailed error information for debugging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      throw new Error(`Failed to generate FCM token: Server responded with status ${error.response.status} - ${error.response.data?.error || error.message}`);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server');
      throw new Error('Failed to generate FCM token: No response received from server. Please check your network connection.');
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error(`Failed to generate FCM token: ${error.message}`);
    }
  }
};

/**
 * Parse the service account JSON file uploaded by the user
 */
export const parseServiceAccountFile = async (file: File): Promise<ServiceAccountKey> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result !== 'string') {
          reject(new Error('Failed to read file as text'));
          return;
        }
        
        const serviceAccount = JSON.parse(result) as ServiceAccountKey;
        
        // Validate the service account JSON
        if (!serviceAccount.private_key || !serviceAccount.client_email || !serviceAccount.project_id) {
          reject(new Error('Invalid service account JSON: Missing required fields'));
          return;
        }
        
        resolve(serviceAccount);
      } catch (error) {
        reject(new Error('Invalid JSON format'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}; 