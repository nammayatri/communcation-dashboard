import React, { useState } from 'react';
import {
  Box,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip,
  Typography,
  // Select,
  // FormControl,
  // InputLabel,
  // SelectChangeEvent,
  // Badge,
  Chip,
  styled,
  ListSubheader,
  // Autocomplete,
  // TextField,
  CircularProgress,
} from '@mui/material';
import {
  Logout,
  Settings,
  Person,
  Business,
  LocationCity,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getCityNameFromCode, cityGroups } from '../utils/cityUtils';

// Styled components for better UI
const SelectWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  minWidth: 150,
  background: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(0.5, 1),
  border: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    borderColor: theme.palette.text.secondary,
  },
}));

const SelectIcon = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.primary.main,
}));

const SelectText = styled(Box)(({ }) => ({
  flex: 1,
}));

const ProfileMenu: React.FC = () => {
  const {
    profile,
    logout,
    selectedMerchant,
    selectedCity,
    setSelectedMerchant,
    setSelectedCity,
    switchMerchantAndCity,
    loading,
  } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [merchantMenuAnchorEl, setMerchantMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [cityMenuAnchorEl, setCityMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [localLoading, setLocalLoading] = useState<boolean>(false);
  
  const open = Boolean(anchorEl);
  const merchantMenuOpen = Boolean(merchantMenuAnchorEl);
  const cityMenuOpen = Boolean(cityMenuAnchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMerchantMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMerchantMenuAnchorEl(event.currentTarget);
  };

  const handleMerchantMenuClose = () => {
    setMerchantMenuAnchorEl(null);
  };

  const handleCityMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setCityMenuAnchorEl(event.currentTarget);
  };

  const handleCityMenuClose = () => {
    setCityMenuAnchorEl(null);
  };

  const handleMerchantSelect = async (merchantId: string) => {
    if (!profile) return;
    
    setLocalLoading(true);
    
    // Find default city for this merchant
    const merchantCities = profile.availableCitiesForMerchant.find(
      (city) => city.merchantShortId === merchantId
    );
    
    // Select first city by default
    const cityToSelect = merchantCities && merchantCities.operatingCity.length > 0 
      ? merchantCities.operatingCity[0] 
      : '';
    
    // Call API to switch merchant and city
    const success = await switchMerchantAndCity(merchantId, cityToSelect);
    
    if (success) {
      setSelectedMerchant(merchantId);
      setSelectedCity(cityToSelect);
    } else {
      console.error(`Failed to switch to merchant ${merchantId}`);
    }
    
    setLocalLoading(false);
    handleMerchantMenuClose();
  };

  const handleCitySelect = async (cityCode: string) => {
    if (!selectedMerchant) return;
    
    setLocalLoading(true);
    
    // Call API to switch city
    const success = await switchMerchantAndCity(selectedMerchant, cityCode);
    
    if (success) {
      setSelectedCity(cityCode);
    } else {
      console.error(`Failed to switch to city ${cityCode}`);
    }
    
    setLocalLoading(false);
    handleCityMenuClose();
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // If no profile, don't render
  if (!profile) return null;

  const userInitials = getInitials(profile.firstName, profile.lastName);

  // Find available cities for selected merchant
  const merchantCities = profile.availableCitiesForMerchant.find(
    (city) => city.merchantShortId === selectedMerchant
  );

  // Group cities by region for the dropdown
  const groupedCities: Record<string, { code: string; name: string }[]> = {};
  
  if (merchantCities) {
    // Initialize groups
    for (const group in cityGroups) {
      groupedCities[group] = [];
    }
    
    // Add cities to their groups
    merchantCities.operatingCity.forEach(cityCode => {
      let added = false;
      for (const [groupName, cityCodes] of Object.entries(cityGroups)) {
        if (cityCodes.includes(cityCode)) {
          groupedCities[groupName].push({
            code: cityCode,
            name: getCityNameFromCode(cityCode)
          });
          added = true;
          break;
        }
      }
      
      // If not found in any group, add to "Other"
      if (!added) {
        if (!groupedCities["Other"]) {
          groupedCities["Other"] = [];
        }
        groupedCities["Other"].push({
          code: cityCode,
          name: getCityNameFromCode(cityCode)
        });
      }
    });
    
    // Remove empty groups
    for (const group in groupedCities) {
      if (groupedCities[group].length === 0) {
        delete groupedCities[group];
      }
    }
  }

  return (
    <React.Fragment>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative' }}>
        {/* Loading overlay */}
        {(loading || localLoading) && (
          <Box 
            sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.7)',
              zIndex: 2,
              borderRadius: 1
            }}
          >
            <CircularProgress size={24} />
          </Box>
        )}
        
        {/* Merchant selection */}
        <Tooltip title={`Current merchant: ${selectedMerchant || "Not selected"}`}>
          <SelectWrapper onClick={handleMerchantMenuOpen}>
            <SelectIcon>
              <Business fontSize="small" />
            </SelectIcon>
            <SelectText>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {selectedMerchant || "Select Merchant"}
              </Typography>
            </SelectText>
          </SelectWrapper>
        </Tooltip>

        {/* City selection */}
        {selectedMerchant && merchantCities && (
          <Tooltip title={`Current city: ${selectedCity ? getCityNameFromCode(selectedCity) : "Not selected"} (${selectedCity || ""})`}>
            <SelectWrapper onClick={handleCityMenuOpen}>
              <SelectIcon>
                <LocationCity fontSize="small" />
              </SelectIcon>
              <SelectText>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {selectedCity ? getCityNameFromCode(selectedCity) : "Select City"}
                </Typography>
              </SelectText>
            </SelectWrapper>
          </Tooltip>
        )}

        {/* Profile badge */}
        <Tooltip title="Account settings">
          <IconButton
            onClick={handleClick}
            size="small"
            sx={{ ml: 2 }}
            aria-controls={open ? 'account-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
          >
            <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: 'primary.main',
                  color: 'white',
                }}
              >
                {userInitials}
              </Avatar>
              <Chip
                label={profile.role.name.replace('_', ' ')}
                size="small"
                color="primary"
                sx={{ 
                  height: 16,
                  fontSize: '0.6rem',
                  mt: 0.5,
                  maxWidth: 80,
                  '& .MuiChip-label': { 
                    px: 0.5,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }
                }}
              />
            </Box>
          </IconButton>
        </Tooltip>
      </Box>

      {/* Merchant Menu */}
      <Menu
        anchorEl={merchantMenuAnchorEl}
        open={merchantMenuOpen}
        onClose={handleMerchantMenuClose}
        PaperProps={{
          elevation: 3,
          sx: { minWidth: 200, maxHeight: 400 }
        }}
      >
        {profile.availableMerchants.map((merchant) => (
          <MenuItem 
            key={merchant} 
            selected={merchant === selectedMerchant}
            onClick={() => handleMerchantSelect(merchant)}
          >
            <ListItemIcon>
              <Business fontSize="small" />
            </ListItemIcon>
            {merchant}
          </MenuItem>
        ))}
      </Menu>

      {/* City Menu */}
      <Menu
        anchorEl={cityMenuAnchorEl}
        open={cityMenuOpen}
        onClose={handleCityMenuClose}
        PaperProps={{
          elevation: 3,
          sx: { minWidth: 200, maxHeight: 400 }
        }}
      >
        {merchantCities && Object.entries(groupedCities).map(([group, cities]) => (
          <React.Fragment key={group}>
            <ListSubheader>{group}</ListSubheader>
            {cities.map(city => (
              <MenuItem 
                key={city.code} 
                selected={city.code === selectedCity}
                onClick={() => handleCitySelect(city.code)}
              >
                <ListItemIcon>
                  <LocationCity fontSize="small" />
                </ListItemIcon>
                {city.name}
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  ({city.code})
                </Typography>
              </MenuItem>
            ))}
          </React.Fragment>
        ))}
      </Menu>

      {/* User Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
            mt: 1.5,
            minWidth: 250,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {profile.firstName} {profile.lastName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {profile.email}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {profile.mobileCountryCode} {profile.mobileNumber}
          </Typography>
        </Box>
        <Divider />
        <MenuItem>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          My Profile
        </MenuItem>
        <MenuItem onClick={handleMerchantMenuOpen}>
          <ListItemIcon>
            <Business fontSize="small" />
          </ListItemIcon>
          {selectedMerchant || "Select Merchant"}
        </MenuItem>
        <MenuItem onClick={handleCityMenuOpen}>
          <ListItemIcon>
            <LocationCity fontSize="small" />
          </ListItemIcon>
          {selectedCity ? getCityNameFromCode(selectedCity) : "Select City"}
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={logout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </React.Fragment>
  );
};

export default ProfileMenu; 