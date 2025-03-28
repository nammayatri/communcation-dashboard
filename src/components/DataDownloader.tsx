import React, { useState } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Grid,
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getCityNameFromCode } from '../utils/cityUtils';

interface CityOption {
  code: string;
  name: string;
}

const VARIANT_OPTIONS = [
  { value: 'ALL', label: 'All Variants' },
  { value: 'CAB', label: 'Cab' },
  { value: 'AUTO_RICKSHAW', label: 'Auto Rickshaw' },
];

const DataDownloader: React.FC = () => {
  const { profile } = useAuth();
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get available cities from user profile
  const availableCities: CityOption[] = profile?.availableCitiesForMerchant
    .flatMap(merchant => merchant.operatingCity)
    .map(cityCode => ({
      code: cityCode,
      name: getCityNameFromCode(cityCode),
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
      // TODO: Replace with actual API endpoint and query
      const response = await fetch(`/api/download-data?city=${selectedCity}&variant=${selectedVariant}`, {
        headers: {
          'token': localStorage.getItem('token') || '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download data');
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = `data_${selectedCity}_${selectedVariant.toLowerCase()}.csv`;
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      window.URL.revokeObjectURL(url);

      setSuccess('Data downloaded successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Download Data
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Select City</InputLabel>
            <Select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              label="Select City"
            >
              {availableCities.map((city) => (
                <MenuItem key={city.code} value={city.code}>
                  {city.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Select Variant</InputLabel>
            <Select
              value={selectedVariant}
              onChange={(e) => setSelectedVariant(e.target.value)}
              label="Select Variant"
            >
              {VARIANT_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleDownload}
            disabled={loading || !selectedCity}
            startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
            fullWidth
          >
            {loading ? 'Downloading...' : 'Download Data'}
          </Button>
        </Grid>

        {error && (
          <Grid item xs={12}>
            <Alert severity="error">{error}</Alert>
          </Grid>
        )}

        {success && (
          <Grid item xs={12}>
            <Alert severity="success">{success}</Alert>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default DataDownloader; 