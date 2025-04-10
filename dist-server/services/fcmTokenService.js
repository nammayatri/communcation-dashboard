import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
const firebaseConfig = {
    projectId: "namma-yatri",
    apiKey: "-MnO", // Replace with your actual Firebase API key
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export const getAccessToken = async () => {
    try {
        // First, we need to get a custom token from your backend
        const response = await fetch('YOUR_BACKEND_ENDPOINT/generateCustomToken', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                serviceAccount: {
                    clientEmail: "firebase-adminsdk-w61zr@namma-yatri.iam.gserviceaccount.com",
                    projectId: "namma-yatri"
                }
            })
        });
        if (!response.ok) {
            throw new Error('Failed to get custom token');
        }
        const { customToken } = await response.json();
        // Sign in with the custom token
        const userCredential = await signInWithCustomToken(auth, customToken);
        // Get the ID token
        const idToken = await userCredential.user.getIdToken();
        return idToken;
    }
    catch (error) {
        console.error('Error getting access token:', error);
        throw error;
    }
};
