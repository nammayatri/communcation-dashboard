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
const Send_1 = __importDefault(require("@mui/icons-material/Send"));
const CloudUpload_1 = __importDefault(require("@mui/icons-material/CloudUpload"));
const react_router_dom_1 = require("react-router-dom");
const AuthContext_1 = require("../contexts/AuthContext");
const MessageDetails = () => {
    const { messageId } = (0, react_router_dom_1.useParams)();
    const location = (0, react_router_dom_1.useLocation)();
    const { token: contextToken, selectedMerchant: contextMerchant, selectedCity: contextCity } = (0, AuthContext_1.useAuth)();
    const fileInputRef = (0, react_1.useRef)(null);
    // Use token from navigation state or fallback to context
    const token = location.state?.token || contextToken;
    const selectedMerchant = location.state?.selectedMerchant || contextMerchant;
    const selectedCity = location.state?.selectedCity || contextCity;
    const [messageInfo, setMessageInfo] = (0, react_1.useState)(null);
    const [deliveryInfo, setDeliveryInfo] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [selectedFile, setSelectedFile] = (0, react_1.useState)(null);
    const [isSending, setIsSending] = (0, react_1.useState)(false);
    const [showCSVPreview, setShowCSVPreview] = (0, react_1.useState)(false);
    const [csvPreviewData, setCsvPreviewData] = (0, react_1.useState)({
        headers: [],
        rows: []
    });
    const [snackbar, setSnackbar] = (0, react_1.useState)({
        open: false,
        message: '',
        severity: 'success',
    });
    (0, react_1.useEffect)(() => {
        console.log('MessageDetails mounted/updated with:', {
            messageId,
            token: token ? 'present' : 'missing',
            selectedMerchant: selectedMerchant ? 'present' : 'missing',
            selectedCity: selectedCity ? 'present' : 'missing'
        });
        if (!messageId || !token || !selectedMerchant) {
            console.error('Missing required data:', {
                messageId: !!messageId,
                token: !!token,
                selectedMerchant: !!selectedMerchant
            });
            setSnackbar({
                open: true,
                message: 'Missing required information for fetching message details',
                severity: 'error'
            });
            setLoading(false);
            return;
        }
        fetchMessageDetails();
    }, [messageId, token, selectedMerchant]);
    const fetchMessageDetails = async () => {
        if (!token || !messageId || !selectedMerchant) {
            console.error('Cannot fetch message details - missing required data');
            return;
        }
        setLoading(true);
        try {
            console.log('Fetching message info for:', { messageId, selectedMerchant });
            // Fetch message info
            const infoResponse = await fetch(`/api/bpp/driver-offer/${selectedMerchant}/${selectedCity}/message/${messageId}/info`, {
                headers: {
                    'Accept': 'application/json;charset=utf-8',
                    'token': token
                }
            });
            console.log('Message info response status:', infoResponse.status);
            if (!infoResponse.ok) {
                const errorText = await infoResponse.text();
                throw new Error(`Failed to fetch message info: ${infoResponse.status} - ${errorText}`);
            }
            const messageInfoData = await infoResponse.json();
            console.log('Message info data:', messageInfoData);
            if (!messageInfoData) {
                throw new Error('No message info data received');
            }
            setMessageInfo(messageInfoData);
            // Fetch delivery info
            console.log('Fetching delivery info');
            const deliveryResponse = await fetch(`/api/bpp/driver-offer/${selectedMerchant}/${selectedCity}/message/${messageId}/deliveryInfo`, {
                headers: {
                    'Accept': 'application/json;charset=utf-8',
                    'token': token
                }
            });
            console.log('Delivery info response status:', deliveryResponse.status);
            if (!deliveryResponse.ok) {
                const errorText = await deliveryResponse.text();
                throw new Error(`Failed to fetch delivery info: ${deliveryResponse.status} - ${errorText}`);
            }
            const deliveryInfoData = await deliveryResponse.json();
            console.log('Delivery info data:', deliveryInfoData);
            if (!deliveryInfoData) {
                throw new Error('No delivery info data received');
            }
            setDeliveryInfo(deliveryInfoData);
        }
        catch (error) {
            console.error('Error fetching message details:', error);
            setSnackbar({
                open: true,
                message: 'Failed to fetch message details: ' + (error instanceof Error ? error.message : 'Unknown error'),
                severity: 'error'
            });
            // Reset state on error
            setMessageInfo(null);
            setDeliveryInfo(null);
        }
        finally {
            setLoading(false);
        }
    };
    const handleFileSelect = (event) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setSelectedFile(file);
            // Read the CSV file
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result;
                const lines = text.split('\n').filter(line => line.trim());
                if (lines.length > 0) {
                    const headers = lines[0].split(',').map(h => h.trim());
                    const rows = lines.slice(1, 4).map(line => line.split(',').map(cell => cell.trim()));
                    setCsvPreviewData({
                        headers,
                        rows
                    });
                    setShowCSVPreview(true);
                }
            };
            reader.readAsText(file);
        }
    };
    const handleButtonClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Reset value to trigger onChange
            fileInputRef.current.click();
        }
    };
    const handleSendAgain = async () => {
        if (!selectedFile || !messageInfo) {
            setSnackbar({
                open: true,
                message: 'Please upload a CSV file first',
                severity: 'error'
            });
            return;
        }
        setIsSending(true);
        try {
            const formData = new FormData();
            formData.append('type', 'Include');
            formData.append('csvFile', selectedFile);
            formData.append('messageId', messageInfo.messageId);
            const response = await fetch(`https://dashboard.moving.tech/api/bpp/driver-offer/${selectedMerchant}/${selectedCity}/message/send`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;charset=utf-8',
                    'token': token || '',
                    'Referer': 'https://dashboard.moving.tech',
                    'sec-ch-ua': '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"macOS"',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
                },
                mode: 'cors',
                credentials: 'include',
                body: formData
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server responded with ${response.status}: ${errorText}`);
            }
            setSnackbar({
                open: true,
                message: 'Message sent successfully',
                severity: 'success'
            });
            setSelectedFile(null);
            await fetchMessageDetails(); // Refresh delivery info
        }
        catch (error) {
            console.error('Error sending message:', error);
            setSnackbar({
                open: true,
                message: 'Failed to send message: ' + (error instanceof Error ? error.message : 'Unknown error'),
                severity: 'error'
            });
        }
        finally {
            setIsSending(false);
        }
    };
    if (loading) {
        return (<material_1.Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 'calc(100vh - 64px)', // Account for the header height
                width: '100%',
                bgcolor: 'background.default'
            }}>
                <material_1.CircularProgress />
            </material_1.Box>);
    }
    if (!messageInfo || !deliveryInfo) {
        return (<material_1.Box sx={{
                p: 3,
                minHeight: 'calc(100vh - 64px)', // Account for the header height
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default'
            }}>
                <material_1.Typography variant="h6" color="error" gutterBottom>
                    Error Loading Message Details
                </material_1.Typography>
                <material_1.Button variant="contained" onClick={() => fetchMessageDetails()} sx={{ mt: 2 }}>
                    Retry Loading
                </material_1.Button>
                <material_1.Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    <material_1.Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
                        {snackbar.message}
                    </material_1.Alert>
                </material_1.Snackbar>
            </material_1.Box>);
    }
    return (<material_1.Box sx={{
            p: 3,
            minHeight: 'calc(100vh - 64px)', // Account for the header height
            bgcolor: 'background.default',
            overflow: 'auto'
        }}>
            {/* Delivery Info Section - Now at the top */}
            <material_1.Card sx={{ mb: 3 }}>
                <material_1.CardContent>
                    <material_1.Typography variant="h6" gutterBottom>Delivery Information</material_1.Typography>
                    {deliveryInfo && (<material_1.Grid container spacing={2}>
                            <material_1.Grid item xs={3}>
                                <material_1.Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
                                    <material_1.Typography variant="h6">{deliveryInfo.success || 0}</material_1.Typography>
                                    <material_1.Typography color="textSecondary">Success</material_1.Typography>
                                </material_1.Paper>
                            </material_1.Grid>
                            <material_1.Grid item xs={3}>
                                <material_1.Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
                                    <material_1.Typography variant="h6">{deliveryInfo.queued || 0}</material_1.Typography>
                                    <material_1.Typography color="textSecondary">Queued</material_1.Typography>
                                </material_1.Paper>
                            </material_1.Grid>
                            <material_1.Grid item xs={3}>
                                <material_1.Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light' }}>
                                    <material_1.Typography variant="h6">{deliveryInfo.seen || 0}</material_1.Typography>
                                    <material_1.Typography color="textSecondary">Seen</material_1.Typography>
                                </material_1.Paper>
                            </material_1.Grid>
                            <material_1.Grid item xs={3}>
                                <material_1.Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light' }}>
                                    <material_1.Typography variant="h6">{deliveryInfo.liked || 0}</material_1.Typography>
                                    <material_1.Typography color="textSecondary">Liked</material_1.Typography>
                                </material_1.Paper>
                            </material_1.Grid>
                        </material_1.Grid>)}
                </material_1.CardContent>
            </material_1.Card>

            {/* Send Again Section */}
            <material_1.Card sx={{ mb: 3 }}>
                <material_1.CardContent>
                    <material_1.Grid container spacing={2} alignItems="center">
                        <material_1.Grid item xs={8}>
                            <input ref={fileInputRef} accept=".csv" id="csv-file" type="file" style={{ display: "none" }} onChange={handleFileSelect}/>
                            <material_1.Button variant="contained" component="span" startIcon={selectedFile ? null : <CloudUpload_1.default />} color={selectedFile ? "success" : "primary"} onClick={handleButtonClick} fullWidth>
                                {selectedFile ? `Selected: ${selectedFile.name}` : "Upload CSV to Send Again"}
                            </material_1.Button>
                        </material_1.Grid>
                        <material_1.Grid item xs={4}>
                            <material_1.Button variant="contained" fullWidth disabled={!selectedFile || isSending} onClick={handleSendAgain} startIcon={isSending ? null : <Send_1.default />}>
                                {isSending ? 'Sending...' : 'Send Again'}
                            </material_1.Button>
                        </material_1.Grid>
                    </material_1.Grid>
                </material_1.CardContent>
            </material_1.Card>

            {/* Two-column layout for Message Info and Media Preview */}
            <material_1.Grid container spacing={3}>
                {/* Left column - Message Details */}
                <material_1.Grid item xs={12} md={6}>
                    <material_1.Card sx={{ height: '100%', overflow: 'auto' }}>
                        <material_1.CardContent>
                            <material_1.Typography variant="h6" gutterBottom>Message Information</material_1.Typography>
                            {messageInfo && (<material_1.Grid container spacing={2}>
                                    <material_1.Grid item xs={12}>
                                        <material_1.Typography variant="subtitle1" color="primary">Title</material_1.Typography>
                                        <material_1.Typography paragraph>{messageInfo.title || 'No title'}</material_1.Typography>
                                    </material_1.Grid>
                                    <material_1.Grid item xs={12}>
                                        <material_1.Typography variant="subtitle1" color="primary">Push Notification description</material_1.Typography>
                                        <material_1.Typography paragraph>{messageInfo.shortDescription || 'No Push Notification description'}</material_1.Typography>
                                    </material_1.Grid>
                                    <material_1.Grid item xs={12}>
                                        <material_1.Typography variant="subtitle1" color="primary">Description</material_1.Typography>
                                        <material_1.Typography paragraph>{messageInfo.description || 'No description'}</material_1.Typography>
                                    </material_1.Grid>
                                    {messageInfo.translations && messageInfo.translations.length > 0 && (<material_1.Grid item xs={12}>
                                            <material_1.Typography variant="subtitle1" color="primary" gutterBottom>Translations</material_1.Typography>
                                            {messageInfo.translations.map((translation, index) => (<material_1.Paper key={index} sx={{ p: 2, mb: 2 }}>
                                                    <material_1.Typography variant="subtitle2" color="primary">{translation.language || 'Unknown Language'}</material_1.Typography>
                                                    <material_1.Typography variant="body2" gutterBottom>Title: {translation.title || 'No title'}</material_1.Typography>
                                                    <material_1.Typography variant="body2" gutterBottom>Push Notification description: {translation.shortDescription || 'No Push Notification description'}</material_1.Typography>
                                                    <material_1.Typography variant="body2">Description: {translation.description || 'No description'}</material_1.Typography>
                                                </material_1.Paper>))}
                                        </material_1.Grid>)}
                                </material_1.Grid>)}
                        </material_1.CardContent>
                    </material_1.Card>
                </material_1.Grid>

                {/* Right column - Media Preview */}
                <material_1.Grid item xs={12} md={6}>
                    <material_1.Card sx={{ height: '100%', overflow: 'auto' }}>
                        <material_1.CardContent>
                            <material_1.Typography variant="h6" gutterBottom>Media Preview</material_1.Typography>
                            {messageInfo?.mediaFiles && messageInfo.mediaFiles.length > 0 ? (messageInfo.mediaFiles.map((media, index) => {
            if (media._type === 'VideoLink') {
                // Extract video ID from YouTube URL
                const videoId = media.link.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
                return (<material_1.Paper key={index} sx={{ p: 2, mb: 2 }}>
                                                <material_1.Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
                                                    <iframe style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%'
                    }} src={`https://www.youtube.com/embed/${videoId}`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen/>
                                                </material_1.Box>
                                            </material_1.Paper>);
            }
            else if (media._type === 'ImageLink') {
                return (<material_1.Paper key={index} sx={{ p: 2, mb: 2 }}>
                                                <img src={media.link} alt="Message media" style={{
                        width: '100%',
                        height: 'auto',
                        borderRadius: '4px',
                        maxHeight: '400px',
                        objectFit: 'contain'
                    }}/>
                                            </material_1.Paper>);
            }
            return null;
        })) : (<material_1.Typography color="textSecondary">No media content available</material_1.Typography>)}
                        </material_1.CardContent>
                    </material_1.Card>
                </material_1.Grid>
            </material_1.Grid>

            {/* Snackbar and Dialog remain unchanged */}
            <material_1.Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <material_1.Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
                    {snackbar.message}
                </material_1.Alert>
            </material_1.Snackbar>

            <material_1.Dialog open={showCSVPreview} onClose={() => setShowCSVPreview(false)} maxWidth="md" fullWidth>
                <material_1.DialogTitle>CSV Data Preview</material_1.DialogTitle>
                <material_1.DialogContent dividers>
                    <material_1.Box sx={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {csvPreviewData.headers.map((header, index) => (<th key={index} style={{
                padding: '8px',
                textAlign: 'left',
                borderBottom: '1px solid #ddd',
                backgroundColor: '#f5f5f5'
            }}>
                                            {header}
                                        </th>))}
                                </tr>
                            </thead>
                            <tbody>
                                {csvPreviewData.rows.map((row, rowIndex) => (<tr key={rowIndex}>
                                        {row.map((cell, cellIndex) => (<td key={cellIndex} style={{
                    padding: '8px',
                    borderBottom: '1px solid #ddd'
                }}>
                                                {cell}
                                            </td>))}
                                    </tr>))}
                            </tbody>
                        </table>
                        {csvPreviewData.rows.length === 3 && (<material_1.Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                                Showing first 3 rows of the CSV file
                            </material_1.Typography>)}
                    </material_1.Box>
                </material_1.DialogContent>
                <material_1.DialogActions>
                    <material_1.Button onClick={() => setShowCSVPreview(false)}>Close</material_1.Button>
                </material_1.DialogActions>
            </material_1.Dialog>
        </material_1.Box>);
};
exports.default = MessageDetails;
