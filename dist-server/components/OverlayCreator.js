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
const OverlayPreview_1 = __importDefault(require("./OverlayPreview"));
const overlayService_1 = require("../services/overlayService");
const firebaseTokenService_1 = require("../services/firebaseTokenService");
const AuthContext_1 = require("../contexts/AuthContext");
const schedulerService_1 = require("../services/schedulerService");
const initialOverlayConfig = {
    id: new Date().toISOString(),
    title: '',
    description: '',
    imageUrl: '',
    okButtonText: 'OK',
    cancelButtonText: 'Cancel',
    actions: ['OPEN_LINK'],
    link: '',
    method: 'POST',
    reqBody: {},
    titleVisibility: true,
    descriptionVisibility: true,
    buttonOkVisibility: true,
    buttonCancelVisibility: true,
    buttonLayoutVisibility: true,
    imageVisibility: true,
    triggers: [],
};
const STORAGE_KEY = 'overlay_configs';
const OverlayCreator = () => {
    const [config, setConfig] = (0, react_1.useState)(initialOverlayConfig);
    const [csvFile, setCsvFile] = (0, react_1.useState)(null);
    const [fcmToken, setFcmToken] = (0, react_1.useState)('');
    const [snackbar, setSnackbar] = (0, react_1.useState)({
        open: false,
        message: '',
        severity: 'success',
    });
    const [showFailedTokens, setShowFailedTokens] = (0, react_1.useState)(false);
    const [isProcessing, setIsProcessing] = (0, react_1.useState)(false);
    const [authMethod, setAuthMethod] = (0, react_1.useState)('token');
    const [serviceAccountFile, setServiceAccountFile] = (0, react_1.useState)(null);
    const [isGeneratingToken, setIsGeneratingToken] = (0, react_1.useState)(false);
    const { user } = (0, AuthContext_1.useAuth)();
    const [scheduledTime, setScheduledTime] = (0, react_1.useState)('');
    const [isScheduled, setIsScheduled] = (0, react_1.useState)(false);
    const [progressDialogOpen, setProgressDialogOpen] = (0, react_1.useState)(false);
    const [currentProgress, setCurrentProgress] = (0, react_1.useState)({
        total: 0,
        processed: 0,
        success: 0,
        failed: 0,
        percentage: 0,
        failedTokens: []
    });
    const handleConfigChange = (field) => (event) => {
        setConfig((prev) => ({
            ...prev,
            [field]: event.target.value,
        }));
    };
    const handleVisibilityChange = (field) => (event) => {
        setConfig((prev) => ({
            ...prev,
            [field]: event.target.checked,
        }));
    };
    const handleActionChange = (event) => {
        setConfig((prev) => ({
            ...prev,
            actions: [event.target.value],
        }));
    };
    const handleCsvUpload = (event) => {
        if (event.target.files && event.target.files[0]) {
            setCsvFile(event.target.files[0]);
        }
    };
    const handleServiceAccountUpload = (event) => {
        if (event.target.files && event.target.files[0]) {
            setServiceAccountFile(event.target.files[0]);
        }
    };
    const handleGenerateFCMToken = async () => {
        if (!serviceAccountFile) {
            setSnackbar({
                open: true,
                message: 'Please upload a service account JSON file',
                severity: 'error',
            });
            return;
        }
        setIsGeneratingToken(true);
        setSnackbar({
            open: true,
            message: 'Generating FCM token from service account...',
            severity: 'info',
        });
        try {
            const serviceAccount = await (0, firebaseTokenService_1.parseServiceAccountFile)(serviceAccountFile);
            const token = await (0, firebaseTokenService_1.generateFCMTokenFromServiceAccount)(serviceAccount);
            setFcmToken(token);
            setSnackbar({
                open: true,
                message: 'FCM token generated successfully',
                severity: 'success',
            });
        }
        catch (error) {
            setSnackbar({
                open: true,
                message: `Error: ${error.message}`,
                severity: 'error',
            });
        }
        finally {
            setIsGeneratingToken(false);
        }
    };
    const validateInputs = () => {
        if (!csvFile) {
            setSnackbar({
                open: true,
                message: 'Please upload a CSV file with driver tokens',
                severity: 'error',
            });
            return false;
        }
        if (!fcmToken) {
            setSnackbar({
                open: true,
                message: 'Please enter FCM authentication token or generate one from service account',
                severity: 'error',
            });
            return false;
        }
        if (!config.title || !config.description) {
            setSnackbar({
                open: true,
                message: 'Title and description are required',
                severity: 'error',
            });
            return false;
        }
        if (config.actions[0] === 'OPEN_LINK' && !config.link) {
            setSnackbar({
                open: true,
                message: 'Link URL is required for OPEN_LINK action',
                severity: 'error',
            });
            return false;
        }
        return true;
    };
    const handleSubmit = async () => {
        if (!validateInputs()) {
            return;
        }
        setIsProcessing(true);
        setProgressDialogOpen(true);
        setCurrentProgress({
            total: 0,
            processed: 0,
            success: 0,
            failed: 0,
            percentage: 0,
            failedTokens: []
        });
        try {
            // Save overlay config to local storage
            const storedOverlays = localStorage.getItem(STORAGE_KEY);
            const overlays = storedOverlays ? JSON.parse(storedOverlays) : [];
            // Add trigger information
            const overlayWithTrigger = {
                ...config,
                triggers: [
                    ...(config.triggers || []),
                    {
                        triggeredAt: new Date().toISOString(),
                        triggeredBy: user?.email || 'Unknown User',
                        successCount: 0,
                        failedCount: 0,
                        status: 'processing',
                        result: {
                            success: 0,
                            failed: 0,
                            failedTokens: [],
                            progress: {
                                currentBatch: 0,
                                totalBatches: 0,
                                processedLines: 0,
                                totalLines: 0
                            }
                        }
                    }
                ]
            };
            overlays.push(overlayWithTrigger);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(overlays));
            if (isScheduled) {
                if (!scheduledTime) {
                    throw new Error('Please select a scheduled time');
                }
                await (0, schedulerService_1.scheduleOverlay)(config, csvFile, fcmToken, scheduledTime);
                setSnackbar({
                    open: true,
                    message: 'Overlay scheduled successfully',
                    severity: 'success',
                });
            }
            else {
                const result = await (0, overlayService_1.processCSVAndSendNotifications)(csvFile, config, fcmToken, (progressUpdate) => {
                    setCurrentProgress(prev => ({
                        ...prev,
                        total: progressUpdate.total,
                        processed: progressUpdate.processed,
                        success: progressUpdate.success,
                        failed: progressUpdate.failed,
                        percentage: Math.floor((progressUpdate.processed / progressUpdate.total) * 100),
                        failedTokens: progressUpdate.failedTokens
                    }));
                });
                // Update the trigger with actual success/failed counts
                const updatedOverlays = overlays.map((overlay) => {
                    if (overlay.id === config.id) {
                        const latestTrigger = overlay.triggers[overlay.triggers.length - 1];
                        return {
                            ...overlay,
                            triggers: [
                                ...overlay.triggers.slice(0, -1),
                                {
                                    ...latestTrigger,
                                    status: 'completed',
                                    completedAt: new Date().toISOString(),
                                    successCount: result.success,
                                    failedCount: result.failed,
                                    result: {
                                        success: result.success,
                                        failed: result.failed,
                                        failedTokens: result.failedTokens || [],
                                        progress: {
                                            currentBatch: result.progress?.currentBatch || 0,
                                            totalBatches: result.progress?.totalBatches || 0,
                                            processedLines: result.progress?.processedLines || 0,
                                            totalLines: result.progress?.totalLines || 0
                                        }
                                    }
                                }
                            ]
                        };
                    }
                    return overlay;
                });
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOverlays));
                setSnackbar({
                    open: true,
                    message: `Successfully sent ${result.success} notifications. Failed: ${result.failed}`,
                    severity: result.failed > 0 ? 'error' : 'success',
                });
            }
        }
        catch (error) {
            setSnackbar({
                open: true,
                message: `Error: ${error.message}`,
                severity: 'error',
            });
        }
        finally {
            setIsProcessing(false);
            setProgressDialogOpen(false);
        }
    };
    // Group errors by type
    const groupedErrors = currentProgress.failedTokens.reduce((acc, curr) => {
        if (!acc[curr.error]) {
            acc[curr.error] = [];
        }
        acc[curr.error].push(curr.token);
        return acc;
    }, {});
    return (<material_1.Box sx={{
            display: 'flex',
            gap: 2,
            p: '0 16px 16px 16px',
            height: '100vh',
            overflow: 'hidden',
            mb: 12
        }}>
            <material_1.Card sx={{ flex: 1, overflow: 'auto', height: '100%' }}>
                <material_1.CardContent>
                    <material_1.Typography variant="h5" gutterBottom>
                        Overlay Configuration
                    </material_1.Typography>
                    <material_1.Grid container spacing={2}>
                        <material_1.Grid item xs={12}>
                            <material_1.TextField fullWidth label="Title" value={config.title} onChange={handleConfigChange('title')} required/>
                        </material_1.Grid>
                        <material_1.Grid item xs={12}>
                            <material_1.TextField fullWidth label="Description" multiline rows={3} value={config.description} onChange={handleConfigChange('description')} required/>
                        </material_1.Grid>
                        <material_1.Grid item xs={12}>
                            <material_1.TextField fullWidth label="Image URL" value={config.imageUrl} onChange={handleConfigChange('imageUrl')}/>
                        </material_1.Grid>
                        <material_1.Grid item xs={6}>
                            <material_1.TextField fullWidth label="OK Button Text" value={config.okButtonText} onChange={handleConfigChange('okButtonText')}/>
                        </material_1.Grid>
                        <material_1.Grid item xs={6}>
                            <material_1.TextField fullWidth label="Cancel Button Text" value={config.cancelButtonText} onChange={handleConfigChange('cancelButtonText')}/>
                        </material_1.Grid>
                        <material_1.Grid item xs={12}>
                            <material_1.Grid container spacing={2}>
                                <material_1.Grid item xs={6}>
                                    <material_1.FormControl fullWidth>
                                        <material_1.InputLabel>Action</material_1.InputLabel>
                                        <material_1.Select value={config.actions[0]} onChange={handleActionChange} label="Action">
                                            <material_1.MenuItem value="OPEN_LINK">Open Link</material_1.MenuItem>
                                            <material_1.MenuItem value="OPEN_APP">Open App</material_1.MenuItem>
                                            <material_1.MenuItem value="SET_DRIVER_ONLINE">
                                                Set Driver Online
                                            </material_1.MenuItem>
                                        </material_1.Select>
                                    </material_1.FormControl>
                                </material_1.Grid>
                                {config.actions[0] === 'OPEN_LINK' && (<material_1.Grid item xs={6}>
                                        <material_1.TextField fullWidth label="Link URL" value={config.link} onChange={handleConfigChange('link')} required/>
                                    </material_1.Grid>)}
                            </material_1.Grid>
                        </material_1.Grid>
                        <material_1.Grid item xs={12}>
                            <material_1.Typography variant="h6" gutterBottom>
                                Visibility Controls
                            </material_1.Typography>
                            <material_1.Grid container spacing={2}>
                                <material_1.Grid item xs={6}>
                                    <material_1.FormControlLabel control={<material_1.Switch checked={config.titleVisibility} onChange={handleVisibilityChange('titleVisibility')}/>} label="Show Title"/>
                                </material_1.Grid>
                                <material_1.Grid item xs={6}>
                                    <material_1.FormControlLabel control={<material_1.Switch checked={config.descriptionVisibility} onChange={handleVisibilityChange('descriptionVisibility')}/>} label="Show Description"/>
                                </material_1.Grid>
                                <material_1.Grid item xs={6}>
                                    <material_1.FormControlLabel control={<material_1.Switch checked={config.buttonOkVisibility} onChange={handleVisibilityChange('buttonOkVisibility')}/>} label="Show OK Button"/>
                                </material_1.Grid>
                                <material_1.Grid item xs={6}>
                                    <material_1.FormControlLabel control={<material_1.Switch checked={config.buttonCancelVisibility} onChange={handleVisibilityChange('buttonCancelVisibility')}/>} label="Show Cancel Button"/>
                                </material_1.Grid>
                                <material_1.Grid item xs={6}>
                                    <material_1.FormControlLabel control={<material_1.Switch checked={config.imageVisibility} onChange={handleVisibilityChange('imageVisibility')}/>} label="Show Image"/>
                                </material_1.Grid>
                            </material_1.Grid>
                        </material_1.Grid>
                        <material_1.Grid item xs={12}>
                            <material_1.Typography variant="h6" gutterBottom>
                                Authentication
                            </material_1.Typography>
                            
                            <material_1.Tabs value={authMethod} onChange={(_, newValue) => setAuthMethod(newValue)} sx={{ mb: 2 }}>
                                <material_1.Tab value="token" label="FCM Token"/>
                                <material_1.Tab value="serviceAccount" label="Service Account"/>
                            </material_1.Tabs>
                            
                            {authMethod === 'token' ? (<material_1.TextField fullWidth label="FCM OAuth Token" placeholder="Bearer ya29.a0AfB_..." helperText="Enter the complete OAuth 2.0 token including 'Bearer' prefix" value={fcmToken} onChange={(e) => setFcmToken(e.target.value)} required/>) : (<material_1.Box>
                                    <input accept=".json" style={{ display: 'none' }} id="service-account-file" type="file" onChange={handleServiceAccountUpload}/>
                                    <label htmlFor="service-account-file">
                                        <material_1.Button variant="outlined" component="span" sx={{ mr: 2 }}>
                                            Upload Service Account JSON
                                        </material_1.Button>
                                    </label>
                                    {serviceAccountFile && (<material_1.Typography component="span" variant="body2" color="textSecondary">
                                            {serviceAccountFile.name}
                                        </material_1.Typography>)}
                                    
                                    <material_1.Box sx={{ mt: 2 }}>
                                        <material_1.Button variant="contained" onClick={handleGenerateFCMToken} disabled={!serviceAccountFile || isGeneratingToken} sx={{ mr: 2 }}>
                                            {isGeneratingToken ? 'Generating...' : 'Generate FCM Token'}
                                        </material_1.Button>
                                        
                                        {fcmToken && (<material_1.Chip label="Token Generated" color="success" size="small"/>)}
                                    </material_1.Box>
                                    
                                    {fcmToken && (<material_1.TextField fullWidth margin="normal" label="Generated FCM Token" value={fcmToken} InputProps={{ readOnly: true }} variant="outlined" size="small" sx={{
                    mt: 1,
                    '& .MuiInputBase-input': {
                        fontFamily: 'monospace',
                        fontSize: '0.8rem'
                    }
                }}/>)}
                                </material_1.Box>)}
                        </material_1.Grid>
                    </material_1.Grid>
                </material_1.CardContent>
            </material_1.Card>
            <material_1.Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
                <material_1.Card sx={{ overflow: 'auto' }}>
                    <material_1.CardContent>
                        <material_1.Typography variant="h6" gutterBottom>
                            Device Tokens
                        </material_1.Typography>
                        <input accept=".csv" style={{ display: 'none' }} id="csv-file" type="file" onChange={handleCsvUpload}/>
                        <label htmlFor="csv-file">
                            <material_1.Button variant="contained" component="span" sx={{ mr: 2 }}>
                                Upload CSV
                            </material_1.Button>
                        </label>
                        {csvFile && (<material_1.Typography component="span" variant="body2" color="textSecondary">
                                {csvFile.name}
                            </material_1.Typography>)}
                    </material_1.CardContent>
                </material_1.Card>

                <material_1.Card>
                    <material_1.CardContent>
                        <material_1.Typography variant="h6" gutterBottom>
                            Schedule Options
                        </material_1.Typography>
                        <material_1.FormControlLabel control={<material_1.Switch checked={isScheduled} onChange={(e) => setIsScheduled(e.target.checked)}/>} label="Schedule for later"/>
                        {isScheduled && (<material_1.TextField type="datetime-local" label="Scheduled Time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} fullWidth sx={{ mt: 2 }} InputLabelProps={{
                shrink: true,
            }}/>)}
                    </material_1.CardContent>
                </material_1.Card>

                <material_1.Button variant="contained" color="primary" onClick={handleSubmit} disabled={isProcessing || (isScheduled && !scheduledTime)} sx={{ width: '100%' }}>
                    {isProcessing ? 'Processing...' : isScheduled ? 'Schedule Overlay' : 'Send Overlay'}
                </material_1.Button>
                <material_1.Card sx={{ flex: 1, overflow: 'auto', height: '100%' }}>
                    <material_1.CardContent>
                        <material_1.Typography variant="h5" gutterBottom>
                            Preview
                        </material_1.Typography>
                        <OverlayPreview_1.default config={config}/>
                    </material_1.CardContent>
                </material_1.Card>
            </material_1.Box>
            <material_1.Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <material_1.Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </material_1.Alert>
            </material_1.Snackbar>
            <material_1.Dialog open={showFailedTokens} onClose={() => setShowFailedTokens(false)} maxWidth="md" fullWidth>
                <material_1.DialogTitle sx={{ bgcolor: '#f8f8f8', borderBottom: '1px solid #eee' }}>
                    <material_1.Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
                        Notification Results Summary
                        {currentProgress.failed > 0 && (<material_1.Chip label={`${currentProgress.failed} Failed`} color="error" size="small" sx={{ ml: 2 }}/>)}
                    </material_1.Typography>
                </material_1.DialogTitle>
                <material_1.DialogContent sx={{ pb: 1, pt: 3 }}>
                    <material_1.Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 1 }}>
                        <material_1.Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
                            Overall Statistics
                        </material_1.Typography>
                        <material_1.Box sx={{
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
            justifyContent: 'space-around'
        }}>
                            <material_1.Chip label={`Total: ${currentProgress.total}`} variant="outlined" icon={<span style={{ marginLeft: '8px' }}>📊</span>}/>
                            <material_1.Chip label={`Success: ${currentProgress.success}`} color="success" variant="outlined" icon={<span style={{ marginLeft: '8px' }}>✅</span>}/>
                            <material_1.Chip label={`Failed: ${currentProgress.failed}`} color="error" variant="outlined" icon={<span style={{ marginLeft: '8px' }}>❌</span>}/>
                            <material_1.Chip label={`Success Rate: ${Math.round((currentProgress.success / currentProgress.total) * 100)}%`} color={currentProgress.success > currentProgress.failed ? "success" : "error"} icon={<span style={{ marginLeft: '8px' }}>📈</span>}/>
                        </material_1.Box>
                    </material_1.Box>
                    
                    {Object.keys(groupedErrors).length > 0 ? (<>
                            <material_1.Typography variant="subtitle1" gutterBottom sx={{
                fontWeight: 'medium',
                mt: 2,
                mb: 2
            }}>
                                Errors by Type
                            </material_1.Typography>
                            {Object.entries(groupedErrors).map(([error, tokens], index) => (<material_1.Paper key={index} elevation={2} sx={{ p: 2, mb: 3, borderLeft: '4px solid #f44336' }}>
                                    <material_1.Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1
                }}>
                                        <material_1.Typography variant="subtitle1" color="error" sx={{ fontWeight: 'medium' }}>
                                            {error}
                                        </material_1.Typography>
                                        <material_1.Chip label={`${tokens.length} device${tokens.length > 1 ? 's' : ''}`} color="error" size="small" variant="outlined"/>
                                    </material_1.Box>
                                    <material_1.Box sx={{
                    maxHeight: '150px',
                    overflow: 'auto',
                    border: '1px solid #eee',
                    borderRadius: 1,
                    mt: 1
                }}>
                                        <material_1.List dense disablePadding>
                                            {tokens.map((token, tokenIndex) => (<material_1.ListItem key={tokenIndex} divider={tokenIndex < tokens.length - 1} sx={{
                        py: 0.5,
                        bgcolor: tokenIndex % 2 === 0 ? 'transparent' : '#f9f9f9'
                    }}>
                                                    <material_1.ListItemText primary={token} primaryTypographyProps={{
                        variant: 'body2',
                        sx: { fontFamily: 'monospace' }
                    }}/>
                                                </material_1.ListItem>))}
                                        </material_1.List>
                                    </material_1.Box>
                                </material_1.Paper>))}
                        </>) : (<material_1.Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 4
            }}>
                            <material_1.Typography variant="h6" color="success.main" gutterBottom>
                                All notifications sent successfully!
                            </material_1.Typography>
                            <material_1.Typography variant="body2" color="textSecondary">
                                {currentProgress.total} notifications were processed without any errors.
                            </material_1.Typography>
                        </material_1.Box>)}
                </material_1.DialogContent>
                <material_1.DialogActions sx={{ borderTop: '1px solid #eee', p: 2 }}>
                    <material_1.Button onClick={() => setShowFailedTokens(false)} variant="contained">
                        Close
                    </material_1.Button>
                </material_1.DialogActions>
            </material_1.Dialog>

            <material_1.Dialog open={progressDialogOpen} onClose={() => { }} maxWidth="md" fullWidth>
                <material_1.DialogTitle>
                    Processing Overlay Notifications
                    <material_1.Typography variant="subtitle2" color="text.secondary">
                        {currentProgress.processed} of {currentProgress.total} processed
                    </material_1.Typography>
                </material_1.DialogTitle>
                <material_1.DialogContent>
                    <material_1.Box sx={{ mb: 3 }}>
                        <material_1.Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <material_1.Typography variant="body2">
                                Progress: {currentProgress.percentage}%
                            </material_1.Typography>
                            <material_1.Typography variant="body2">
                                Success: {currentProgress.success} | Failed: {currentProgress.failed}
                            </material_1.Typography>
                        </material_1.Box>
                        <material_1.LinearProgress variant="determinate" value={currentProgress.percentage} sx={{ height: 10, borderRadius: 5 }}/>
                    </material_1.Box>

                    {currentProgress.failedTokens.length > 0 && (<material_1.Box>
                            <material_1.Typography variant="subtitle1" gutterBottom>
                                Failed Notifications ({currentProgress.failedTokens.length})
                            </material_1.Typography>
                            <material_1.Paper sx={{ maxHeight: 300, overflow: 'auto' }}>
                                <material_1.List dense>
                                    {currentProgress.failedTokens.map((failed, index) => (<material_1.ListItem key={index} divider>
                                            <material_1.ListItemText primary={`Token: ${failed.token}`} secondary={`Error: ${failed.error}`}/>
                                        </material_1.ListItem>))}
                                </material_1.List>
                            </material_1.Paper>
                        </material_1.Box>)}
                </material_1.DialogContent>
                <material_1.DialogActions>
                    <material_1.Button onClick={() => setProgressDialogOpen(false)} disabled={isProcessing}>
                        {isProcessing ? 'Processing...' : 'Close'}
                    </material_1.Button>
                </material_1.DialogActions>
            </material_1.Dialog>
        </material_1.Box>);
};
exports.default = OverlayCreator;
