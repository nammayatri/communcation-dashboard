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
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const material_1 = require("@mui/material");
const icons_material_1 = require("@mui/icons-material");
const AuthContext_1 = require("../contexts/AuthContext");
const react_router_dom_1 = require("react-router-dom");
const LoginPage = () => {
    const [email, setEmail] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    const [showPassword, setShowPassword] = (0, react_1.useState)(false);
    const { login, loading, error } = (0, AuthContext_1.useAuth)();
    const navigate = (0, react_router_dom_1.useNavigate)();
    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await login(email, password);
        if (success) {
            console.log('Login successful, navigating to dashboard...');
            navigate('/alert-centre');
        }
    };
    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };
    return (<material_1.Box sx={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#f5f5f5',
        }}>
      <material_1.Container maxWidth="sm">
        <material_1.Paper elevation={3} sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
        }}>
          <material_1.Typography variant="h4" component="h1" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold', mb: 4 }}>
            Dashboard Login
          </material_1.Typography>
          <material_1.Typography variant="h6" component="h2" gutterBottom sx={{ color: 'primary.secondary', fontWeight: 'bold', mb: 4 }}>
            Please use your OPs dashboard account to login.
          </material_1.Typography>

          {error && (<material_1.Alert severity="error" sx={{ width: '100%', mb: 3 }}>
              {error}
            </material_1.Alert>)}

          <material_1.Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <material_1.TextField margin="normal" required fullWidth id="email" label="Email Address" name="email" autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 3 }}/>
            <material_1.TextField margin="normal" required fullWidth name="password" label="Password" type={showPassword ? 'text' : 'password'} id="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} InputProps={{
            endAdornment: (<material_1.InputAdornment position="end">
                    <material_1.IconButton aria-label="toggle password visibility" onClick={toggleShowPassword} edge="end">
                      {showPassword ? <icons_material_1.VisibilityOff /> : <icons_material_1.Visibility />}
                    </material_1.IconButton>
                  </material_1.InputAdornment>),
        }} sx={{ mb: 4 }}/>
            <material_1.Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{
            mt: 2,
            mb: 3,
            py: 1.5,
            position: 'relative',
            fontSize: '1rem',
        }}>
              {loading ? (<material_1.CircularProgress size={24} sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                marginTop: '-12px',
                marginLeft: '-12px',
            }}/>) : ('Sign In')}
            </material_1.Button>
          </material_1.Box>
        </material_1.Paper>
      </material_1.Container>
    </material_1.Box>);
};
exports.default = LoginPage;
