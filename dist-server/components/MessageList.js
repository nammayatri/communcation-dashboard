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
const react_1 = __importStar(require("react"));
const material_1 = require("@mui/material");
const AuthContext_1 = require("../contexts/AuthContext");
const Add_1 = __importDefault(require("@mui/icons-material/Add"));
const react_router_dom_1 = require("react-router-dom");
const Info_1 = __importDefault(require("@mui/icons-material/Info"));
const MessageList = () => {
    const [messages, setMessages] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const [page, setPage] = (0, react_1.useState)(0);
    const [rowsPerPage, setRowsPerPage] = (0, react_1.useState)(10);
    const [totalCount, setTotalCount] = (0, react_1.useState)(0);
    const { token, selectedMerchant, selectedCity } = (0, AuthContext_1.useAuth)();
    const navigate = (0, react_router_dom_1.useNavigate)();
    const fetchMessages = async () => {
        if (!token || !selectedMerchant || !selectedCity) {
            setError('Missing required authentication information');
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/bpp/driver-offer/${selectedMerchant}/${selectedCity}/message/list?limit=${rowsPerPage}&offset=${page * rowsPerPage}`, {
                headers: {
                    'Accept': 'application/json;charset=utf-8',
                    'token': token
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch messages');
            }
            const data = await response.json();
            console.log('Fetched messages:', data);
            setMessages(data.messages || []);
            setTotalCount(data.totalCount || 0);
        }
        catch (err) {
            console.error('Error fetching messages:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
            setMessages([]);
            setTotalCount(0);
        }
        finally {
            setLoading(false);
        }
    };
    (0, react_1.useEffect)(() => {
        fetchMessages();
    }, [page, rowsPerPage, token, selectedMerchant, selectedCity]);
    const handleChangePage = (_event, newPage) => {
        setPage(newPage);
    };
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };
    const handleViewDetails = (messageId) => {
        console.log('Navigating to message details:', messageId);
        navigate(`/message/${messageId}`);
    };
    if (error) {
        return (<material_1.Box p={3}>
        <material_1.Typography color="error">Error: {error}</material_1.Typography>
      </material_1.Box>);
    }
    return (<material_1.Box sx={{
            p: 3,
            minHeight: 'calc(100vh - 64px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto'
        }}>
      <material_1.Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <material_1.Typography variant="h5" component="h2">
          Message List
        </material_1.Typography>
        <material_1.Button variant="contained" color="primary" startIcon={<Add_1.default />} onClick={() => navigate('/alert-centre/create')}>
          Create Message
        </material_1.Button>
      </material_1.Box>

      <material_1.TableContainer component={material_1.Paper} sx={{
            mb: 3,
            '& .MuiTable-root': {
                minWidth: 650,
            }
        }}>
        <material_1.Table>
          <material_1.TableHead>
            <material_1.TableRow>
              <material_1.TableCell>Title</material_1.TableCell>
              <material_1.TableCell>Push Notification description</material_1.TableCell>
              <material_1.TableCell>Created At</material_1.TableCell>
              <material_1.TableCell align="center">Actions</material_1.TableCell>
            </material_1.TableRow>
          </material_1.TableHead>
          <material_1.TableBody>
            {loading ? (<material_1.TableRow>
                <material_1.TableCell colSpan={4} align="center">
                  <material_1.CircularProgress />
                </material_1.TableCell>
              </material_1.TableRow>) : messages.length === 0 ? (<material_1.TableRow>
                <material_1.TableCell colSpan={4} align="center">
                  No messages found
                </material_1.TableCell>
              </material_1.TableRow>) : (messages.map((message) => (<material_1.TableRow key={message.messageId}>
                  <material_1.TableCell>{message.title}</material_1.TableCell>
                  <material_1.TableCell>{message.shortDescription}</material_1.TableCell>
                  <material_1.TableCell>{new Date(message.createdAt).toLocaleString()}</material_1.TableCell>
                  <material_1.TableCell align="center">
                    <material_1.Button variant="contained" color="primary" onClick={() => handleViewDetails(message.messageId)} startIcon={<Info_1.default />} size="small">
                      See Details
                    </material_1.Button>
                  </material_1.TableCell>
                </material_1.TableRow>)))}
          </material_1.TableBody>
        </material_1.Table>
      </material_1.TableContainer>
      <material_1.TablePagination rowsPerPageOptions={[5, 10, 25]} component="div" count={totalCount} rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage} sx={{
            borderTop: '1px solid rgba(224, 224, 224, 1)',
            '& .MuiTablePagination-displayedRows': {
                minWidth: '120px',
                textAlign: 'left'
            }
        }}/>
    </material_1.Box>);
};
exports.default = MessageList;
