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
const CloudUpload_1 = __importDefault(require("@mui/icons-material/CloudUpload"));
const Send_1 = __importDefault(require("@mui/icons-material/Send"));
const AuthContext_1 = require("../contexts/AuthContext");
const axios_1 = __importDefault(require("axios"));
const MessageSender = ({ messageId }) => {
    const { token } = (0, AuthContext_1.useAuth)();
    const fileInputRef = (0, react_1.useRef)(null);
    const [selectedFile, setSelectedFile] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [snackbar, setSnackbar] = (0, react_1.useState)({
        open: false,
        message: '',
        severity: 'success',
    });
    const handleFileSelect = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.type !== 'text/csv') {
                setSnackbar({
                    open: true,
                    message: 'Please upload a CSV file',
                    severity: 'error'
                });
                return;
            }
            setSelectedFile(file);
        }
    };
    const handleSendMessage = async () => {
        if (!token) {
            setSnackbar({
                open: true,
                message: 'Please login to send message',
                severity: 'error'
            });
            return;
        }
        if (!selectedFile) {
            setSnackbar({
                open: true,
                message: 'Please upload a CSV file first',
                severity: 'error'
            });
            return;
        }
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('type', 'Include');
            formData.append('csvFile', selectedFile);
            formData.append('messageId', messageId);
            await axios_1.default.post('/api/bpp/driver-offer/NAMMA_YATRI_PARTNER/message/send', formData, {
                headers: {
                    'Accept': 'application/json;charset=utf-8',
                    'token': token,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setSnackbar({
                open: true,
                message: 'Message sent successfully',
                severity: 'success'
            });
            // Reset file selection
            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
        catch (error) {
            setSnackbar({
                open: true,
                message: 'Failed to send message: ' + (error instanceof Error ? error.message : 'Unknown error'),
                severity: 'error'
            });
        }
        finally {
            setLoading(false);
        }
    };
    return (<material_1.Box sx={{ p: 3 }}>
            <material_1.Typography variant="h4" gutterBottom>
                Send Message
            </material_1.Typography>

            <material_1.Card>
                <material_1.CardContent>
                    <material_1.Typography variant="h6" gutterBottom>
                        Whom to Send
                    </material_1.Typography>

                    <material_1.Grid container spacing={3}>
                        <material_1.Grid item xs={12}>
                            <material_1.Box sx={{
            border: '2px dashed #ccc',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            bgcolor: '#fafafa',
            cursor: 'pointer',
            '&:hover': {
                bgcolor: '#f0f0f0'
            }
        }} onClick={() => fileInputRef.current?.click()}>
                                <input type="file" hidden ref={fileInputRef} accept=".csv" onChange={handleFileSelect}/>
                                <CloudUpload_1.default sx={{ fontSize: 48, color: 'primary.main', mb: 2 }}/>
                                <material_1.Typography variant="h6" gutterBottom>
                                    Upload CSV File
                                </material_1.Typography>
                                <material_1.Typography variant="body2" color="text.secondary">
                                    {selectedFile ? selectedFile.name : 'Click or drag and drop CSV file here'}
                                </material_1.Typography>
                            </material_1.Box>
                        </material_1.Grid>

                        <material_1.Grid item xs={12}>
                            <material_1.Button variant="contained" size="large" fullWidth startIcon={loading ? <material_1.CircularProgress size={20} color="inherit"/> : <Send_1.default />} onClick={handleSendMessage} disabled={!selectedFile || loading}>
                                {loading ? 'Sending...' : 'Send Message'}
                            </material_1.Button>
                        </material_1.Grid>
                    </material_1.Grid>
                </material_1.CardContent>
            </material_1.Card>

            <material_1.Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <material_1.Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
                    {snackbar.message}
                </material_1.Alert>
            </material_1.Snackbar>
        </material_1.Box>);
};
exports.default = MessageSender;
