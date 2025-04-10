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
// Styled components for better UI
const SelectWrapper = (0, material_1.styled)(material_1.Box)(({ theme }) => ({
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
const SelectIcon = (0, material_1.styled)(material_1.Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.palette.primary.main,
}));
const SelectText = (0, material_1.styled)(material_1.Box)(({}) => ({
    flex: 1,
}));
const ProfileMenu = () => {
    const { user, logout, selectedMerchant, selectedCity, setSelectedMerchant, setSelectedCity, switchMerchantAndCity, loading, } = (0, AuthContext_1.useAuth)();
    console.log('ProfileMenu render:', {
        hasProfile: !!user,
        profileData: user,
        selectedMerchant,
        selectedCity,
        loading
    });
    const [anchorEl, setAnchorEl] = (0, react_1.useState)(null);
    const [merchantMenuAnchorEl, setMerchantMenuAnchorEl] = (0, react_1.useState)(null);
    const [cityMenuAnchorEl, setCityMenuAnchorEl] = (0, react_1.useState)(null);
    const [localLoading, setLocalLoading] = (0, react_1.useState)(false);
    const open = Boolean(anchorEl);
    const merchantMenuOpen = Boolean(merchantMenuAnchorEl);
    const cityMenuOpen = Boolean(cityMenuAnchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };
    const handleMerchantMenuOpen = (event) => {
        setMerchantMenuAnchorEl(event.currentTarget);
    };
    const handleMerchantMenuClose = () => {
        setMerchantMenuAnchorEl(null);
    };
    const handleCityMenuOpen = (event) => {
        setCityMenuAnchorEl(event.currentTarget);
    };
    const handleCityMenuClose = () => {
        setCityMenuAnchorEl(null);
    };
    const handleMerchantSelect = async (merchantId) => {
        if (!user)
            return;
        setLocalLoading(true);
        // Find default city for this merchant
        const merchantCities = user.availableCitiesForMerchant.find((city) => city.merchantShortId === merchantId);
        // Select first city by default
        const cityToSelect = merchantCities && merchantCities.operatingCity.length > 0
            ? merchantCities.operatingCity[0]
            : '';
        // Call API to switch merchant and city
        const success = await switchMerchantAndCity(merchantId, cityToSelect);
        if (success) {
            setSelectedMerchant(merchantId);
            setSelectedCity(cityToSelect);
        }
        else {
            console.error(`Failed to switch to merchant ${merchantId}`);
        }
        setLocalLoading(false);
        handleMerchantMenuClose();
    };
    const handleCitySelect = async (cityCode) => {
        if (!selectedMerchant)
            return;
        setLocalLoading(true);
        // Call API to switch city
        const success = await switchMerchantAndCity(selectedMerchant, cityCode);
        if (success) {
            setSelectedCity(cityCode);
        }
        else {
            console.error(`Failed to switch to city ${cityCode}`);
        }
        setLocalLoading(false);
        handleCityMenuClose();
    };
    const getInitials = (firstName, lastName) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };
    // If no profile, show a login button or loading state
    if (!user) {
        return (<material_1.Box sx={{ display: 'flex', alignItems: 'center', gap: 2, height: '64px', padding: '0 16px' }}>
        <material_1.Button variant="contained" color="primary" onClick={() => {
                console.log('Logging out...');
                localStorage.removeItem('token');
                window.location.href = '/login';
            }} startIcon={<icons_material_1.Logout />}>
          Logout
        </material_1.Button>
      </material_1.Box>);
    }
    const userInitials = getInitials(user.firstName, user.lastName);
    // Find available cities for selected merchant
    const merchantCities = user.availableCitiesForMerchant.find((city) => city.merchantShortId === selectedMerchant);
    // Group cities by region for the dropdown
    const groupedCities = {};
    if (merchantCities) {
        // Initialize groups
        for (const group in cityUtils_1.cityGroups) {
            groupedCities[group] = [];
        }
        // Add cities to their groups
        merchantCities.operatingCity.forEach(cityCode => {
            let added = false;
            for (const [groupName, cityCodes] of Object.entries(cityUtils_1.cityGroups)) {
                if (cityCodes.includes(cityCode)) {
                    groupedCities[groupName].push({
                        code: cityCode,
                        name: (0, cityUtils_1.getCityNameFromCode)(cityCode)
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
                    name: (0, cityUtils_1.getCityNameFromCode)(cityCode)
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
    return (<react_1.default.Fragment>
      <material_1.Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            position: 'relative',
            height: '64px', // Match Toolbar height
            padding: '0 16px'
        }}>
        {/* Loading overlay */}
        {(loading || localLoading) && (<material_1.Box sx={{
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
            }}>
            <material_1.CircularProgress size={24}/>
          </material_1.Box>)}
        
        {/* Merchant selection */}
        <material_1.Tooltip title={`Current merchant: ${selectedMerchant || "Not selected"}`}>
          <SelectWrapper onClick={handleMerchantMenuOpen}>
            <SelectIcon>
              <icons_material_1.Business fontSize="small"/>
            </SelectIcon>
            <SelectText>
              <material_1.Typography variant="body2" sx={{ fontWeight: 500, minWidth: '120px' }}>
                {selectedMerchant || "Select Merchant"}
              </material_1.Typography>
            </SelectText>
          </SelectWrapper>
        </material_1.Tooltip>

        {/* City selection */}
        {selectedMerchant && merchantCities && (<material_1.Tooltip title={`Current city: ${selectedCity ? (0, cityUtils_1.getCityNameFromCode)(selectedCity) : "Not selected"} (${selectedCity || ""})`}>
            <SelectWrapper onClick={handleCityMenuOpen}>
              <SelectIcon>
                <icons_material_1.LocationCity fontSize="small"/>
              </SelectIcon>
              <SelectText>
                <material_1.Typography variant="body2" sx={{ fontWeight: 500, minWidth: '100px' }}>
                  {selectedCity ? (0, cityUtils_1.getCityNameFromCode)(selectedCity) : "Select City"}
                </material_1.Typography>
              </SelectText>
            </SelectWrapper>
          </material_1.Tooltip>)}

        {/* Profile badge */}
        <material_1.Tooltip title="Account settings">
          <material_1.IconButton onClick={handleClick} size="small" sx={{ ml: 2 }} aria-controls={open ? 'account-menu' : undefined} aria-haspopup="true" aria-expanded={open ? 'true' : undefined}>
            <material_1.Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <material_1.Avatar sx={{
            width: 40,
            height: 40,
            bgcolor: 'primary.main',
            color: 'white',
        }}>
                {userInitials}
              </material_1.Avatar>
              <material_1.Chip label={user.role.name.replace('_', ' ')} size="small" color="primary" sx={{
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
        }}/>
            </material_1.Box>
          </material_1.IconButton>
        </material_1.Tooltip>
      </material_1.Box>

      {/* Merchant Menu */}
      <material_1.Menu anchorEl={merchantMenuAnchorEl} open={merchantMenuOpen} onClose={handleMerchantMenuClose} PaperProps={{
            elevation: 3,
            sx: { minWidth: 200, maxHeight: 400 }
        }}>
        {user?.availableMerchants.map((merchant) => (<material_1.MenuItem key={merchant} selected={merchant === selectedMerchant} onClick={() => handleMerchantSelect(merchant)}>
            <material_1.ListItemIcon>
              <icons_material_1.Business fontSize="small"/>
            </material_1.ListItemIcon>
            {merchant}
          </material_1.MenuItem>))}
      </material_1.Menu>

      {/* City Menu */}
      <material_1.Menu anchorEl={cityMenuAnchorEl} open={cityMenuOpen} onClose={handleCityMenuClose} PaperProps={{
            elevation: 3,
            sx: { minWidth: 200, maxHeight: 400 }
        }}>
        {merchantCities && Object.entries(groupedCities).map(([group, cities]) => (<react_1.default.Fragment key={group}>
            <material_1.ListSubheader>{group}</material_1.ListSubheader>
            {cities.map(city => (<material_1.MenuItem key={city.code} selected={city.code === selectedCity} onClick={() => handleCitySelect(city.code)}>
                <material_1.ListItemIcon>
                  <icons_material_1.LocationCity fontSize="small"/>
                </material_1.ListItemIcon>
                {city.name}
                <material_1.Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  ({city.code})
                </material_1.Typography>
              </material_1.MenuItem>))}
          </react_1.default.Fragment>))}
      </material_1.Menu>

      {/* User Profile Menu */}
      <material_1.Menu anchorEl={anchorEl} id="account-menu" open={open} onClose={handleClose} onClick={handleClose} PaperProps={{
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
        }} transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
        <material_1.Box sx={{ p: 2, pb: 1 }}>
          <material_1.Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {user.firstName} {user.lastName}
          </material_1.Typography>
          <material_1.Typography variant="body2" color="text.secondary">
            {user.email}
          </material_1.Typography>
          <material_1.Typography variant="body2" color="text.secondary">
            {user.mobileCountryCode} {user.mobileNumber}
          </material_1.Typography>
        </material_1.Box>
        <material_1.Divider />
        <material_1.MenuItem>
          <material_1.ListItemIcon>
            <icons_material_1.Person fontSize="small"/>
          </material_1.ListItemIcon>
          My Profile
        </material_1.MenuItem>
        <material_1.MenuItem onClick={handleMerchantMenuOpen}>
          <material_1.ListItemIcon>
            <icons_material_1.Business fontSize="small"/>
          </material_1.ListItemIcon>
          {selectedMerchant || "Select Merchant"}
        </material_1.MenuItem>
        <material_1.MenuItem onClick={handleCityMenuOpen}>
          <material_1.ListItemIcon>
            <icons_material_1.LocationCity fontSize="small"/>
          </material_1.ListItemIcon>
          {selectedCity ? (0, cityUtils_1.getCityNameFromCode)(selectedCity) : "Select City"}
        </material_1.MenuItem>
        <material_1.MenuItem>
          <material_1.ListItemIcon>
            <icons_material_1.Settings fontSize="small"/>
          </material_1.ListItemIcon>
          Settings
        </material_1.MenuItem>
        <material_1.Divider />
        <material_1.MenuItem onClick={logout}>
          <material_1.ListItemIcon>
            <icons_material_1.Logout fontSize="small"/>
          </material_1.ListItemIcon>
          Logout
        </material_1.MenuItem>
      </material_1.Menu>
    </react_1.default.Fragment>);
};
exports.default = ProfileMenu;
