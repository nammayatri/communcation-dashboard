import { Box, Button, styled, IconButton, Drawer, useMediaQuery, AppBar, Toolbar, Typography, createTheme, ThemeProvider } from '@mui/material';
import OverlayCreator from './components/OverlayCreator';
import OverlayListView from './components/OverlayListView';
import BannerDashboard from './components/BannerDashboard';
import AlertCentre from './components/AlertCentre';
import AlertCentreList from './components/AlertCentreList';
import DataDownloader from './components/DataDownloader';
import { useState } from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MessageIcon from '@mui/icons-material/Message';
import WarningIcon from '@mui/icons-material/Warning';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import ImageIcon from '@mui/icons-material/Image';
import LoginPage from './components/LoginPage';
import ProfileMenu from './components/ProfileMenu';
import { AuthProvider } from './contexts/AuthContext';
import MessageList from './components/MessageList';
import MessageDetails from './components/MessageDetails';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ImageUploader } from './components/ImageUploader';
import ScheduledOverlays from './components/ScheduledOverlays';

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
  onClick?: () => void;
  startIcon?: React.ReactNode;
  children?: React.ReactNode;
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  
  console.log('Dashboard render:', { isMobile });
  
  const SIDEBAR_WIDTH = 260;

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
        onClick={() => navigate('/image-upload')}
        startIcon={<ImageIcon />}
        selected={location.pathname === '/image-upload'}
      >
        Get Image Link
      </TabButton>

      <TabButton
        onClick={() => navigate('/download')}
        startIcon={<DownloadIcon />}
        selected={location.pathname === '/download'}
      >
        Download Data
      </TabButton>

      <TabButton
        onClick={() => navigate('/overlay')}
        startIcon={<DashboardIcon />}
        selected={location.pathname === '/overlay'}
      >
        Overlay Dashboard
      </TabButton>
      
      <TabButton
        onClick={() => navigate('/overlay/scheduled')}
        startIcon={<DashboardIcon />}
        selected={location.pathname === '/overlay/scheduled'}
      >
        Scheduled Overlays
      </TabButton>

      <TabButton
        onClick={() => navigate('/banner')}
        startIcon={<MessageIcon />}
        selected={location.pathname === '/banner'}
      >
        Banner Dashboard
      </TabButton>

      <TabButton
        onClick={() => {
          console.log('Navigating to Alert Centre');
          navigate('/alert-centre');
        }}
        startIcon={<WarningIcon />}
        selected={location.pathname.startsWith('/alert-centre') || location.pathname.startsWith('/message/')}
      >
        Alert Centre
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
              Dashboard
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
            zIndex: 1100,
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
        <Outlet />
      </Box>
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Dashboard />}>
              <Route index element={<Navigate to="/alert-centre" replace />} />
              <Route path="alert-centre" element={<AlertCentreList />} />
              <Route path="alert-centre/create" element={<AlertCentre />} />
              <Route path="message/:messageId" element={<MessageDetails />} />
              <Route path="messages" element={<MessageList />} />
              <Route path="overlay" element={<OverlayListView />} />
              <Route path="overlay/create" element={<OverlayCreator />} />
              <Route path="overlay/scheduled" element={<ScheduledOverlays />} />
              <Route path="banner" element={<BannerDashboard />} />
              <Route path="download" element={<DataDownloader />} />
              <Route path="image-upload" element={<ImageUploader />} />
              <Route path="*" element={<Navigate to="/overlay" replace />} />
            </Route>
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App; 