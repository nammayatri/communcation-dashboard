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
const cityUtils_1 = require("../utils/cityUtils");
const VARIANT_OPTIONS = [
    { value: 'ALL', label: 'All Variants' },
    { value: 'CAB', label: 'Cab' },
    { value: 'AUTO_RICKSHAW', label: 'Auto Rickshaw' },
];
const DataDownloader = () => {
    const { user } = (0, AuthContext_1.useAuth)();
    const [selectedCity, setSelectedCity] = (0, react_1.useState)(null);
    const [selectedVariant, setSelectedVariant] = (0, react_1.useState)('ALL');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [success, setSuccess] = (0, react_1.useState)(null);
    const availableCities = user?.availableCitiesForMerchant
        .flatMap((merchant) => merchant.operatingCity)
        .map((cityCode) => ({
        code: cityCode,
        name: (0, cityUtils_1.getCityNameFromCode)(cityCode)
    })) || [];
    const handleDownload = async () => {
        if (!selectedCity) {
            setError('Please select a city');
            return;
        }
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const response = await fetch(`/api/download-data?city=${encodeURIComponent(selectedCity.name)}&variant=${selectedVariant}`, {
                headers: {
                    'token': localStorage.getItem('token') || '',
                },
            });
            if (!response.ok) {
                throw new Error('Failed to download data');
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `data_${selectedCity.name.replace(/\s+/g, '_')}_${selectedVariant.toLowerCase()}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            setSuccess('Data downloaded successfully');
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to download data');
        }
        finally {
            setLoading(false);
        }
    };
    return (<material_1.Paper sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
      <material_1.Typography variant="h5" gutterBottom>
        Download Data
      </material_1.Typography>

      <material_1.Grid container spacing={3}>
        <material_1.Grid item xs={12}>
          <material_1.FormControl fullWidth>
            <material_1.InputLabel>Select City</material_1.InputLabel>
            <material_1.Select value={selectedCity?.code || ''} onChange={(e) => {
            const selected = availableCities.find(city => city.code === e.target.value);
            setSelectedCity(selected || null);
        }} label="Select City">
              {availableCities.map((city) => (<material_1.MenuItem key={city.code} value={city.code}>
                  {city.name}
                </material_1.MenuItem>))}
            </material_1.Select>
          </material_1.FormControl>
        </material_1.Grid>

        <material_1.Grid item xs={12}>
          <material_1.FormControl fullWidth>
            <material_1.InputLabel>Select Variant</material_1.InputLabel>
            <material_1.Select value={selectedVariant} onChange={(e) => setSelectedVariant(e.target.value)} label="Select Variant">
              {VARIANT_OPTIONS.map((option) => (<material_1.MenuItem key={option.value} value={option.value}>
                  {option.label}
                </material_1.MenuItem>))}
            </material_1.Select>
          </material_1.FormControl>
        </material_1.Grid>

        <material_1.Grid item xs={12}>
          <material_1.Button variant="contained" color="primary" onClick={handleDownload} disabled={loading || !selectedCity} startIcon={loading ? <material_1.CircularProgress size={20}/> : <icons_material_1.Download />} fullWidth>
            {loading ? 'Downloading...' : 'Download Data'}
          </material_1.Button>
        </material_1.Grid>

        {error && (<material_1.Grid item xs={12}>
            <material_1.Alert severity="error">{error}</material_1.Alert>
          </material_1.Grid>)}

        {success && (<material_1.Grid item xs={12}>
            <material_1.Alert severity="success">{success}</material_1.Alert>
          </material_1.Grid>)}
      </material_1.Grid>
    </material_1.Paper>);
};
exports.default = DataDownloader;
