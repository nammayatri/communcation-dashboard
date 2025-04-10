"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuth = exports.AuthProvider = void 0;
const react_1 = __importStar(require("react"));
const axios_1 = __importDefault(require("axios"));
const cityUtils_1 = require("../utils/cityUtils");
// Create a custom axios instance with interceptors for CORS
const apiClient = axios_1.default.create({
    baseURL: '/api', // This will be proxied to http://localhost:3001/api
    timeout: 15000,
    withCredentials: false, // Don't send cookies by default, which can cause CORS issues
});
// Debug the proxy setup
console.log('API client configured with baseURL:', apiClient.defaults.baseURL);
// Add request interceptor to include the auth token in every request
apiClient.interceptors.request.use(config => {
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
}, error => {
    console.error('Request error:', error);
    return Promise.reject(error);
});
// Add response interceptor for error handling
apiClient.interceptors.response.use(response => {
    return response;
}, error => {
    console.error('Response error:', error);
    // Handle 401 Unauthorized errors - just logout
    if (error.response && error.response.status === 401) {
        console.error('Unauthorized (401) detected. User will be logged out.');
        // Dispatch an event to trigger logout
        window.dispatchEvent(new CustomEvent('auth:invalid-token'));
    }
    return Promise.reject(error);
});
const AuthContext = (0, react_1.createContext)(undefined);
const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = (0, react_1.useState)(false);
    const [token, setToken] = (0, react_1.useState)(localStorage.getItem('token'));
    const [user, setUser] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [selectedMerchant, setSelectedMerchant] = (0, react_1.useState)(null);
    const [selectedCity, setSelectedCity] = (0, react_1.useState)(null);
    const [notification, setNotification] = (0, react_1.useState)(null);
    // Helper function to show notifications
    const showNotification = (message, type = 'info') => {
        setNotification({ message, type });
    };
    // Clear notification
    const clearNotification = () => {
        setNotification(null);
    };
    // Helper function to update the auth token
    const updateToken = (newToken) => {
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
    (0, react_1.useEffect)(() => {
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
    const fetchUserProfile = async (authToken) => {
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
        }
        catch (error) {
            console.error('Error fetching user profile:', error);
            return false;
        }
    };
    // Effect to fetch profile on mount if token exists
    (0, react_1.useEffect)(() => {
        console.log('Auth context mounted, checking token...');
        const savedToken = localStorage.getItem('token');
        if (savedToken) {
            console.log('Found saved token, setting auth state...');
            setToken(savedToken);
            setIsAuthenticated(true);
            fetchUserProfile(savedToken);
        }
        else {
            console.log('No saved token found');
        }
    }, []);
    (0, react_1.useEffect)(() => {
        if (user && user.availableMerchants.length > 0 && !selectedMerchant) {
            setSelectedMerchant(user.availableMerchants[0]);
        }
    }, [user, selectedMerchant]);
    (0, react_1.useEffect)(() => {
        if (user && selectedMerchant) {
            const merchantCities = user.availableCitiesForMerchant.find(city => city.merchantShortId === selectedMerchant);
            if (merchantCities && merchantCities.operatingCity.length > 0 && !selectedCity) {
                setSelectedCity(merchantCities.operatingCity[0]);
            }
        }
    }, [user, selectedMerchant, selectedCity]);
    const login = async (email, password) => {
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
            }
            else {
                setError('Invalid response from server: Missing authentication token');
                showNotification('Login failed: Missing authentication token', 'error');
                return false;
            }
        }
        catch (err) {
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
            }
            else {
                setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
                showNotification(err.response?.data?.message || 'Login failed', 'error');
            }
            return false;
        }
        finally {
            setLoading(false);
        }
    };
    const switchMerchantAndCity = async (merchantId, city) => {
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
            const cityName = (0, cityUtils_1.getCityNameFromCode)(cityCode);
            showNotification(`Switched to ${merchantId} - ${cityName}`, 'success');
            return true;
        }
        catch (err) {
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
            }
            else {
                showNotification(err.response?.data?.message || 'Failed to switch merchant/city', 'error');
            }
            return false;
        }
        finally {
            setLoading(false);
        }
    };
    return (<AuthContext.Provider value={{
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
    </AuthContext.Provider>);
};
exports.AuthProvider = AuthProvider;
const useAuth = () => {
    const context = (0, react_1.useContext)(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
exports.useAuth = useAuth;
