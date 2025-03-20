import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "-MnO",  // Replace with your actual Firebase API key
  authDomain: "namma-yatri.firebaseapp.com",
  projectId: "namma-yatri",
  storageBucket: "namma-yatri.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export default app; 