"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const material_1 = require("@mui/material");
const OverlayCreator_1 = __importDefault(require("./components/OverlayCreator"));
const OverlayListView_1 = __importDefault(require("./components/OverlayListView"));
const BannerDashboard_1 = __importDefault(require("./components/BannerDashboard"));
const AlertCentre_1 = __importDefault(require("./components/AlertCentre"));
const AlertCentreList_1 = __importDefault(require("./components/AlertCentreList"));
const DataDownloader_1 = __importDefault(require("./components/DataDownloader"));
const react_1 = require("react");
const Dashboard_1 = __importDefault(require("@mui/icons-material/Dashboard"));
const Message_1 = __importDefault(require("@mui/icons-material/Message"));
const Warning_1 = __importDefault(require("@mui/icons-material/Warning"));
const Menu_1 = __importDefault(require("@mui/icons-material/Menu"));
const Close_1 = __importDefault(require("@mui/icons-material/Close"));
const Download_1 = __importDefault(require("@mui/icons-material/Download"));
const Image_1 = __importDefault(require("@mui/icons-material/Image"));
const LoginPage_1 = __importDefault(require("./components/LoginPage"));
const ProfileMenu_1 = __importDefault(require("./components/ProfileMenu"));
const AuthContext_1 = require("./contexts/AuthContext");
const MessageList_1 = __importDefault(require("./components/MessageList"));
const MessageDetails_1 = __importDefault(require("./components/MessageDetails"));
const react_router_dom_1 = require("react-router-dom");
const ImageUploader_1 = require("./components/ImageUploader");
const ScheduledOverlays_1 = __importDefault(require("./components/ScheduledOverlays"));
const theme = (0, material_1.createTheme)({
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
// Fixed styled component that doesn't require theme as a prop
const TabButton = (0, material_1.styled)(material_1.Button, {
    shouldForwardProp: (prop) => prop !== 'selected'
})(({ theme, selected }) => ({
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
    const [drawerOpen, setDrawerOpen] = (0, react_1.useState)(false);
    const isMobile = (0, material_1.useMediaQuery)(theme.breakpoints.down('md'));
    const location = (0, react_router_dom_1.useLocation)();
    const navigate = (0, react_router_dom_1.useNavigate)();
    console.log('Dashboard render:', { isMobile });
    const SIDEBAR_WIDTH = 260;
    const toggleDrawer = () => {
        setDrawerOpen(!drawerOpen);
    };
    // Sidebar content rendered for both desktop and mobile
    const renderSidebar = () => (<material_1.Box sx={{
            p: 3,
            height: '100%',
            bgcolor: '#fcfcfc',
            width: isMobile ? 250 : '100%',
            borderRight: '1px solid #e0e0e0',
        }}>
      <material_1.Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4
        }}>
        <material_1.Box>
          <material_1.Box component="div" sx={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: theme.palette.primary.main,
            mb: 1
        }}>
            Dashboard
          </material_1.Box>
          <material_1.Box component="div" sx={{
            fontSize: '0.875rem',
            color: 'text.secondary'
        }}>
            Communication Center
          </material_1.Box>
        </material_1.Box>
        {isMobile && (<material_1.IconButton onClick={toggleDrawer} edge="end" sx={{ ml: 1 }}>
            <Close_1.default />
          </material_1.IconButton>)}
      </material_1.Box>
      
      <TabButton onClick={() => navigate('/image-upload')} startIcon={<Image_1.default />} selected={location.pathname === '/image-upload'}>
        Get Image Link
      </TabButton>

      <TabButton onClick={() => navigate('/download')} startIcon={<Download_1.default />} selected={location.pathname === '/download'}>
        Download Data
      </TabButton>

      <TabButton onClick={() => navigate('/overlay')} startIcon={<Dashboard_1.default />} selected={location.pathname === '/overlay'}>
        Overlay Dashboard
      </TabButton>
      
      <TabButton onClick={() => navigate('/overlay/scheduled')} startIcon={<Dashboard_1.default />} selected={location.pathname === '/overlay/scheduled'}>
        Scheduled Overlays
      </TabButton>

      <TabButton onClick={() => navigate('/banner')} startIcon={<Message_1.default />} selected={location.pathname === '/banner'}>
        Banner Dashboard
      </TabButton>

      <TabButton onClick={() => {
            console.log('Navigating to Alert Centre');
            navigate('/alert-centre');
        }} startIcon={<Warning_1.default />} selected={location.pathname.startsWith('/alert-centre') || location.pathname.startsWith('/message/')}>
        Alert Centre
      </TabButton>
    </material_1.Box>);
    return (<material_1.Box sx={{
            display: 'flex',
            height: '100vh',
            width: '100vw',
            overflow: 'hidden'
        }}>
      {/* Mobile app bar */}
      {isMobile && (<material_1.AppBar position="fixed" color="default" elevation={1} sx={{ bgcolor: 'white', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <material_1.Toolbar>
            <material_1.IconButton edge="start" color="inherit" aria-label="menu" onClick={toggleDrawer} sx={{ mr: 2 }}>
              <Menu_1.default />
            </material_1.IconButton>
            <material_1.Typography variant="h6" component="div" sx={{ flexGrow: 1, color: theme.palette.primary.main }}>
              Dashboard
            </material_1.Typography>
            <ProfileMenu_1.default />
          </material_1.Toolbar>
        </material_1.AppBar>)}
      
      {/* Fixed desktop sidebar */}
      {!isMobile && (<material_1.Box sx={{
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
        </material_1.Box>)}
      
      {/* Desktop header with profile */}
      {!isMobile && (<material_1.AppBar position="fixed" color="default" elevation={0} sx={{
                bgcolor: 'white',
                zIndex: 1100,
                ml: `${SIDEBAR_WIDTH}px`,
                width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
                borderBottom: '1px solid #e0e0e0'
            }}>
          <material_1.Toolbar sx={{ justifyContent: 'flex-end' }}>
            <ProfileMenu_1.default />
          </material_1.Toolbar>
        </material_1.AppBar>)}
      
      {/* Mobile drawer */}
      {isMobile && (<material_1.Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer} sx={{
                '& .MuiDrawer-paper': {
                    width: 250,
                },
            }}>
          {renderSidebar()}
        </material_1.Drawer>)}
      
      {/* Main content */}
      <material_1.Box component="main" sx={{
            flexGrow: 1,
            p: 3,
            ml: isMobile ? 0 : `${SIDEBAR_WIDTH}px`,
            mt: isMobile ? '64px' : '64px',
            height: '100vh',
            overflow: 'auto',
            bgcolor: 'background.default',
        }}>
        <react_router_dom_1.Outlet />
      </material_1.Box>
    </material_1.Box>);
};
function App() {
    return (<material_1.ThemeProvider theme={theme}>
      <react_router_dom_1.BrowserRouter>
        <AuthContext_1.AuthProvider>
          <react_router_dom_1.Routes>
            <react_router_dom_1.Route path="/login" element={<LoginPage_1.default />}/>
            <react_router_dom_1.Route path="/" element={<Dashboard />}>
              <react_router_dom_1.Route index element={<react_router_dom_1.Navigate to="/alert-centre" replace/>}/>
              <react_router_dom_1.Route path="alert-centre" element={<AlertCentreList_1.default />}/>
              <react_router_dom_1.Route path="alert-centre/create" element={<AlertCentre_1.default />}/>
              <react_router_dom_1.Route path="message/:messageId" element={<MessageDetails_1.default />}/>
              <react_router_dom_1.Route path="messages" element={<MessageList_1.default />}/>
              <react_router_dom_1.Route path="overlay" element={<OverlayListView_1.default />}/>
              <react_router_dom_1.Route path="overlay/create" element={<OverlayCreator_1.default />}/>
              <react_router_dom_1.Route path="overlay/scheduled" element={<ScheduledOverlays_1.default />}/>
              <react_router_dom_1.Route path="banner" element={<BannerDashboard_1.default />}/>
              <react_router_dom_1.Route path="download" element={<DataDownloader_1.default />}/>
              <react_router_dom_1.Route path="image-upload" element={<ImageUploader_1.ImageUploader />}/>
              <react_router_dom_1.Route path="*" element={<react_router_dom_1.Navigate to="/overlay" replace/>}/>
            </react_router_dom_1.Route>
          </react_router_dom_1.Routes>
        </AuthContext_1.AuthProvider>
      </react_router_dom_1.BrowserRouter>
    </material_1.ThemeProvider>);
}
exports.default = App;
