import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { UserProfile } from '../types/user';
import { getCityNameFromCode } from '../utils/cityUtils';

// Create a custom axios instance with interceptors for CORS
const apiClient = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://communication-dashboard.vercel.app/api'
    : '/api',
  timeout: 15000,
  withCredentials: true,
});

// Debug the proxy setup
console.log('API client configured with baseURL:', apiClient.defaults.baseURL);

// Add request interceptor to include the auth token in every request
apiClient.interceptors.request.use(
  config => {
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.baseURL}${config.url}`);
    
    // Get the current token from localStorage (in case it was updated)
    const currentToken = localStorage.getItem('token');
    
    // Add token to headers if it exists and is not already set
    if (currentToken && config.headers && !config.headers['token']) {
      config.headers['token'] = currentToken;
      
      // Also add as Authorization header for APIs that expect that format
      if (!config.headers['Authorization']) {
        config.headers['Authorization'] = `Bearer ${currentToken}`;
      }
    }
    
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    console.error('Response error:', error);
    
    // Handle 401 Unauthorized errors - just logout
    if (error.response && error.response.status === 401) {
      console.error('Unauthorized (401) detected. User will be logged out.');
      // Dispatch an event to trigger logout
      window.dispatchEvent(new CustomEvent('auth:invalid-token'));
    }
    
    return Promise.reject(error);
  }
);

interface AuthContextProps {
  isAuthenticated: boolean;
  token: string | null;
  user: UserProfile | null;
  selectedMerchant: string | null;
  selectedCity: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  error: string | null;
  setSelectedMerchant: (merchant: string) => void;
  setSelectedCity: (city: string) => void;
  switchMerchantAndCity: (merchantId: string, city: string) => Promise<boolean>;
  notification: { message: string; type: 'success' | 'error' | 'info' | 'warning' } | null;
  clearNotification: () => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMerchant, setSelectedMerchant] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  // Helper function to show notifications
  const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setNotification({ message, type });
  };

  // Clear notification
  const clearNotification = () => {
    setNotification(null);
  };

  // Helper function to update the auth token
  const updateToken = (newToken: string) => {
    console.log('Updating auth token');
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsAuthenticated(false);
    setUser(null);
    setSelectedMerchant(null);
    setSelectedCity(null);
  };

  useEffect(() => {
    const handleInvalidToken = () => {
      console.log('Received invalid token notification');
      showNotification('Your session has expired. Please log in again.', 'error');
      logout();
    };
    
    window.addEventListener('auth:invalid-token', handleInvalidToken);
    
    return () => {
      window.removeEventListener('auth:invalid-token', handleInvalidToken);
    };
  }, [logout, showNotification]);

  const fetchUserProfile = async (authToken: string) => {
    console.log('Fetching user profile with token:', authToken ? 'present' : 'missing');
    try {
      const response = await apiClient.get('/bpp/user/profile', {
        headers: {
          'token': authToken,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Profile response:', response.data);
      
      if (response.data) {
        setUser(response.data);
        
        // Set initial merchant if not already set
        if (!selectedMerchant && response.data.availableMerchants.length > 0) {
          setSelectedMerchant(response.data.availableMerchants[0]);
        }
        
        // Set initial city if not already set
        if (!selectedCity && response.data.availableCitiesForMerchant.length > 0) {
          const firstMerchantCities = response.data.availableCitiesForMerchant[0];
          if (firstMerchantCities.operatingCity.length > 0) {
            setSelectedCity(firstMerchantCities.operatingCity[0]);
          }
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return false;
    }
  };

  // Effect to fetch profile on mount if token exists
  useEffect(() => {
    console.log('Auth context mounted, checking token...');
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      console.log('Found saved token, setting auth state...');
      setToken(savedToken);
      setIsAuthenticated(true);
      fetchUserProfile(savedToken);
    } else {
      console.log('No saved token found');
    }
  }, []);

  useEffect(() => {
    if (user && user.availableMerchants.length > 0 && !selectedMerchant) {
      setSelectedMerchant(user.availableMerchants[0]);
    }
  }, [user, selectedMerchant]);

  useEffect(() => {
    if (user && selectedMerchant) {
      const merchantCities = user.availableCitiesForMerchant.find(
        city => city.merchantShortId === selectedMerchant
      );
      
      if (merchantCities && merchantCities.operatingCity.length > 0 && !selectedCity) {
        setSelectedCity(merchantCities.operatingCity[0]);
      }
    }
  }, [user, selectedMerchant, selectedCity]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      // Use relative URL with the proxy
      const response = await apiClient.post('/bpp/user/login', {
        email,
        password
      });
      
      console.log('Login response:', response.data);
      
      const authToken = response.data.authToken;
      
      if (authToken) {
        updateToken(authToken);
        
        // Set initial merchant ID from response if available
        if (response.data.merchantId) {
          setSelectedMerchant(response.data.merchantId);
        }
        
        // Set initial city from response if available
        if (response.data.city) {
          setSelectedCity(response.data.city);
        }
        
        await fetchUserProfile(authToken);
        showNotification('Successfully logged in', 'success');
        return true;
      } else {
        setError('Invalid response from server: Missing authentication token');
        showNotification('Login failed: Missing authentication token', 'error');
        return false;
      }
    } catch (err: any) {
      // Check for 401 Unauthorized error - this indicates invalid credentials in login context
      if (err.response?.status === 401) {
        setError('Invalid email or password. Please try again.');
        showNotification('Invalid email or password', 'error');
        return false;
      }
      
      // Check if this is a CORS error
      if (err.message && (err.message.includes('Network Error') || err.message.includes('CORS'))) {
        setError('Network error: This may be a CORS issue. Please ensure the proxy server is running.');
        showNotification('Network error connecting to server', 'error');
        console.error('CORS issue detected in login:', err);
      } else {
        setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        showNotification(err.response?.data?.message || 'Login failed', 'error');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const switchMerchantAndCity = async (merchantId: string, city: string): Promise<boolean> => {
    if (!token) {
      console.error('No token available for switching merchant and city');
      showNotification('Authentication token missing. Please login again.', 'error');
      return false;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Get the city code (in case we receive the city name instead of code)
      const cityCode = city.startsWith('std:') ? city : city;
      
      console.log(`Switching to merchant: ${merchantId}, city: ${cityCode}`);
      
      // Use relative URL with the proxy
      const response = await apiClient.post('/bpp/user/switchMerchantAndCity', {
        merchantId,
        city: cityCode
      }, {
        headers: {
          'token': token,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Switch merchant response:', response.data);
      
      // Update token if it exists in the response
      if (response.data.authToken) {
        console.log('New token received from switchMerchantAndCity response');
        updateToken(response.data.authToken);
      }
      
      // Update local state
      setSelectedMerchant(merchantId);
      setSelectedCity(cityCode);
      
      // Show success notification
      const cityName = getCityNameFromCode(cityCode);
      showNotification(`Switched to ${merchantId} - ${cityName}`, 'success');
      
      return true;
    } catch (err: any) {
      console.error('Error switching merchant and city:', err);
      
      // Check for 401 Unauthorized error
      if (err.response?.status === 401) {
        showNotification('Your session has expired. Please log in again.', 'error');
        logout();
        return false;
      }
      
      // Check if this is a CORS error
      if (err.message && (err.message.includes('Network Error') || err.message.includes('CORS'))) {
        console.error('CORS issue detected in merchant switch:', err);
        showNotification('Network error while switching merchant/city', 'error');
      } else {
        showNotification(err.response?.data?.message || 'Failed to switch merchant/city', 'error');
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      token,
      user,
      selectedMerchant,
      selectedCity,
      login,
      logout,
      loading,
      error,
      setSelectedMerchant,
      setSelectedCity,
      switchMerchantAndCity,
      notification,
      clearNotification
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 