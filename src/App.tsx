import { CssBaseline, ThemeProvider, createTheme, Box, Button, styled, IconButton, Drawer, useMediaQuery, AppBar, Toolbar, Typography, Snackbar, Alert } from '@mui/material';
import OverlayCreator from './components/OverlayCreator';
import MessageCreator from './components/MessageCreator';
import { useState } from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MessageIcon from '@mui/icons-material/Message';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import LoginPage from './components/LoginPage';
import ProfileMenu from './components/ProfileMenu';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#E64A19',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontSize: '1rem',
          fontWeight: 500,
        },
      },
    },
  },
});

// Define props interface for the TabButton component
interface TabButtonProps {
  selected: boolean;
}

// Fixed styled component that doesn't require theme as a prop
const TabButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'selected'
})<TabButtonProps>(({ theme, selected }) => ({
  justifyContent: 'flex-start',
  padding: '12px 20px',
  borderRadius: '10px',
  marginBottom: '8px',
  backgroundColor: selected ? theme.palette.primary.main : 'transparent',
  color: selected ? 'white' : theme.palette.text.primary,
  '&:hover': {
    backgroundColor: selected ? theme.palette.primary.dark : '#f0f0f0',
  },
  transition: 'all 0.2s ease-in-out',
  boxShadow: selected ? '0 4px 10px rgba(230, 74, 25, 0.15)' : 'none',
  width: '100%',
}));

// Main dashboard component
const Dashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const SIDEBAR_WIDTH = 260;

  const handleTabChange = (tabIndex: number) => {
    setActiveTab(tabIndex);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Sidebar content rendered for both desktop and mobile
  const renderSidebar = () => (
    <Box sx={{ 
      p: 3, 
      height: '100%', 
      bgcolor: '#fcfcfc',
      width: isMobile ? 250 : '100%',
      borderRight: '1px solid #e0e0e0',
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 4 
      }}>
        <Box>
          <Box 
            component="div" 
            sx={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: theme.palette.primary.main,
              mb: 1
            }}
          >
            Dashboard
          </Box>
          <Box 
            component="div" 
            sx={{ 
              fontSize: '0.875rem', 
              color: 'text.secondary'
            }}
          >
            Communication Center
          </Box>
        </Box>
        {isMobile && (
          <IconButton onClick={toggleDrawer} edge="end" sx={{ ml: 1 }}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>
      
      <TabButton
        startIcon={<DashboardIcon />}
        onClick={() => handleTabChange(0)}
        selected={activeTab === 0}
      >
        Overlay Dashboard
      </TabButton>
      
      <TabButton
        startIcon={<MessageIcon />}
        onClick={() => handleTabChange(1)}
        selected={activeTab === 1}
      >
        Message Creator
      </TabButton>
    </Box>
  );

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh',
      width: '100vw',
      overflow: 'hidden'
    }}>
      {/* Mobile app bar */}
      {isMobile && (
        <AppBar position="fixed" color="default" elevation={1} sx={{ bgcolor: 'white', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={toggleDrawer}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: theme.palette.primary.main }}>
              {activeTab === 0 ? 'Overlay Dashboard' : 'Message Creator'}
            </Typography>
            <ProfileMenu />
          </Toolbar>
        </AppBar>
      )}
      
      {/* Fixed desktop sidebar */}
      {!isMobile && (
        <Box sx={{ 
          width: SIDEBAR_WIDTH, 
          flexShrink: 0,
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          bgcolor: '#fcfcfc',
          zIndex: 1,
          borderRight: '1px solid #e0e0e0',
        }}>
          {renderSidebar()}
        </Box>
      )}
      
      {/* Desktop header with profile */}
      {!isMobile && (
        <AppBar 
          position="fixed" 
          color="default" 
          elevation={0}
          sx={{ 
            bgcolor: 'white', 
            zIndex: 1,
            ml: `${SIDEBAR_WIDTH}px`,
            width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
            borderBottom: '1px solid #e0e0e0'
          }}
        >
          <Toolbar sx={{ justifyContent: 'flex-end' }}>
            <ProfileMenu />
          </Toolbar>
        </AppBar>
      )}
      
      {/* Mobile drawer */}
      {isMobile && (
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={toggleDrawer}
          sx={{
            '& .MuiDrawer-paper': {
              width: 250,
            },
          }}
        >
          {renderSidebar()}
        </Drawer>
      )}
      
      {/* Main content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1,
          p: 3,
          ml: isMobile ? 0 : `${SIDEBAR_WIDTH}px`,
          mt: isMobile ? '64px' : '64px',
          height: '100vh',
          overflow: 'auto',
          bgcolor: 'background.default',
        }}
      >
        <Box sx={{ display: activeTab === 0 ? 'block' : 'none' }}>
          <OverlayCreator />
        </Box>
        <Box sx={{ display: activeTab === 1 ? 'block' : 'none' }}>
          <MessageCreator />
        </Box>
      </Box>
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

// Component to conditionally render login or dashboard based on auth state
const AppContent = () => {
  const { token, notification, clearNotification } = useAuth();
  
  return (
    <>
      {token ? <Dashboard /> : <LoginPage />}
      
      {/* Notification Snackbar */}
      {notification && (
        <Snackbar
          open={!!notification}
          autoHideDuration={6000}
          onClose={clearNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={clearNotification} 
            severity={notification.type} 
            sx={{ width: '100%' }}
            variant="filled"
          >
            {notification.message}
          </Alert>
        </Snackbar>
      )}
    </>
  );
};

export default App; 