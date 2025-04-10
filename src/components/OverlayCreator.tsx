import React, { useState, ChangeEvent } from 'react';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Switch,
    FormControlLabel,
    Grid,
    Typography,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    Chip,
    Paper,
    Tabs,
    Tab,
    LinearProgress,
} from '@mui/material';
import { OverlayConfig, OverlayAction } from '../types/overlay';
import OverlayPreview from './OverlayPreview';
import { processCSVAndSendNotifications } from '../services/overlayService';
import { parseServiceAccountFile, generateFCMTokenFromServiceAccount } from '../services/firebaseTokenService';
import { useAuth } from '../contexts/AuthContext';
import { scheduleOverlay } from '../services/schedulerService';

const initialOverlayConfig: OverlayConfig = {
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

const OverlayCreator: React.FC = () => {
    const [config, setConfig] = useState<OverlayConfig>(initialOverlayConfig);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [fcmToken, setFcmToken] = useState('');
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'info';
    }>({
        open: false,
        message: '',
        severity: 'success',
    });
    const [showFailedTokens, setShowFailedTokens] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [authMethod, setAuthMethod] = useState<'token' | 'serviceAccount'>('token');
    const [serviceAccountFile, setServiceAccountFile] = useState<File | null>(null);
    const [isGeneratingToken, setIsGeneratingToken] = useState(false);
    const { user } = useAuth();
    const [scheduledTime, setScheduledTime] = useState<string>('');
    const [isScheduled, setIsScheduled] = useState(false);
    const [progressDialogOpen, setProgressDialogOpen] = useState(false);
    const [currentProgress, setCurrentProgress] = useState<{
        total: number;
        processed: number;
        success: number;
        failed: number;
        percentage: number;
        failedTokens: { token: string; error: string }[];
    }>({
        total: 0,
        processed: 0,
        success: 0,
        failed: 0,
        percentage: 0,
        failedTokens: []
    });

    const handleConfigChange = (field: keyof OverlayConfig) => (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setConfig((prev) => ({
            ...prev,
            [field]: event.target.value,
        }));
    };

    const handleVisibilityChange = (field: keyof OverlayConfig) => (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        setConfig((prev) => ({
            ...prev,
            [field]: event.target.checked,
        }));
    };

    const handleActionChange = (event: any) => {
        setConfig((prev) => ({
            ...prev,
            actions: [event.target.value as OverlayAction],
        }));
    };

    const handleCsvUpload = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setCsvFile(event.target.files[0]);
        }
    };

    const handleServiceAccountUpload = (event: ChangeEvent<HTMLInputElement>) => {
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
            const serviceAccount = await parseServiceAccountFile(serviceAccountFile);
            const token = await generateFCMTokenFromServiceAccount(serviceAccount);
            
            setFcmToken(token);
            setSnackbar({
                open: true,
                message: 'FCM token generated successfully',
                severity: 'success',
            });
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: `Error: ${error.message}`,
                severity: 'error',
            });
        } finally {
            setIsGeneratingToken(false);
        }
    };

    const validateInputs = (): boolean => {
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

                await scheduleOverlay(
                    config,
                    csvFile!,
                    fcmToken,
                    scheduledTime
                );

                setSnackbar({
                    open: true,
                    message: 'Overlay scheduled successfully',
                    severity: 'success',
                });
            } else {
                const result = await processCSVAndSendNotifications(
                    csvFile!,
                    config,
                    fcmToken,
                    (progressUpdate) => {
                        setCurrentProgress(prev => ({
                            ...prev,
                            total: progressUpdate.total,
                            processed: progressUpdate.processed,
                            success: progressUpdate.success,
                            failed: progressUpdate.failed,
                            percentage: Math.floor((progressUpdate.processed / progressUpdate.total) * 100),
                            failedTokens: progressUpdate.failedTokens
                        }));
                    }
                );

                // Update the trigger with actual success/failed counts
                const updatedOverlays = overlays.map((overlay: OverlayConfig) => {
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
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: `Error: ${error.message}`,
                severity: 'error',
            });
        } finally {
            setIsProcessing(false);
            setProgressDialogOpen(false);
        }
    };

    // Group errors by type
    const groupedErrors = currentProgress.failedTokens.reduce((acc: Record<string, string[]>, curr) => {
        if (!acc[curr.error]) {
            acc[curr.error] = [];
        }
        acc[curr.error].push(curr.token);
        return acc;
    }, {});

    return (
        <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            p: '0 16px 16px 16px',
            height: '100vh',
            overflow: 'hidden',
            mb: 12
        }}>
            <Card sx={{ flex: 1, overflow: 'auto', height: '100%' }}>
                <CardContent>
                    <Typography variant="h5" gutterBottom>
                        Overlay Configuration
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Title"
                                value={config.title}
                                onChange={handleConfigChange('title')}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                multiline
                                rows={3}
                                value={config.description}
                                onChange={handleConfigChange('description')}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Image URL"
                                value={config.imageUrl}
                                onChange={handleConfigChange('imageUrl')}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="OK Button Text"
                                value={config.okButtonText}
                                onChange={handleConfigChange('okButtonText')}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Cancel Button Text"
                                value={config.cancelButtonText}
                                onChange={handleConfigChange('cancelButtonText')}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Action</InputLabel>
                                        <Select
                                            value={config.actions[0]}
                                            onChange={handleActionChange}
                                            label="Action"
                                        >
                                            <MenuItem value="OPEN_LINK">Open Link</MenuItem>
                                            <MenuItem value="OPEN_APP">Open App</MenuItem>
                                            <MenuItem value="SET_DRIVER_ONLINE">
                                                Set Driver Online
                                            </MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                {config.actions[0] === 'OPEN_LINK' && (
                                    <Grid item xs={6}>
                                        <TextField
                                            fullWidth
                                            label="Link URL"
                                            value={config.link}
                                            onChange={handleConfigChange('link')}
                                            required
                                        />
                                    </Grid>
                                )}
                            </Grid>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Visibility Controls
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={config.titleVisibility}
                                                onChange={handleVisibilityChange(
                                                    'titleVisibility'
                                                )}
                                            />
                                        }
                                        label="Show Title"
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={
                                                    config.descriptionVisibility
                                                }
                                                onChange={handleVisibilityChange(
                                                    'descriptionVisibility'
                                                )}
                                            />
                                        }
                                        label="Show Description"
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={config.buttonOkVisibility}
                                                onChange={handleVisibilityChange(
                                                    'buttonOkVisibility'
                                                )}
                                            />
                                        }
                                        label="Show OK Button"
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={
                                                    config.buttonCancelVisibility
                                                }
                                                onChange={handleVisibilityChange(
                                                    'buttonCancelVisibility'
                                                )}
                                            />
                                        }
                                        label="Show Cancel Button"
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={config.imageVisibility}
                                                onChange={handleVisibilityChange(
                                                    'imageVisibility'
                                                )}
                                            />
                                        }
                                        label="Show Image"
                                    />
                                </Grid>
                            </Grid>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Authentication
                            </Typography>
                            
                            <Tabs 
                                value={authMethod} 
                                onChange={(_, newValue) => setAuthMethod(newValue)}
                                sx={{ mb: 2 }}
                            >
                                <Tab value="token" label="FCM Token" />
                                <Tab value="serviceAccount" label="Service Account" />
                            </Tabs>
                            
                            {authMethod === 'token' ? (
                                <TextField
                                    fullWidth
                                    label="FCM OAuth Token"
                                    placeholder="Bearer ya29.a0AfB_..."
                                    helperText="Enter the complete OAuth 2.0 token including 'Bearer' prefix"
                                    value={fcmToken}
                                    onChange={(e) => setFcmToken(e.target.value)}
                                    required
                                />
                            ) : (
                                <Box>
                                    <input
                                        accept=".json"
                                        style={{ display: 'none' }}
                                        id="service-account-file"
                                        type="file"
                                        onChange={handleServiceAccountUpload}
                                    />
                                    <label htmlFor="service-account-file">
                                        <Button
                                            variant="outlined"
                                            component="span"
                                            sx={{ mr: 2 }}
                                        >
                                            Upload Service Account JSON
                                        </Button>
                                    </label>
                                    {serviceAccountFile && (
                                        <Typography
                                            component="span"
                                            variant="body2"
                                            color="textSecondary"
                                        >
                                            {serviceAccountFile.name}
                                        </Typography>
                                    )}
                                    
                                    <Box sx={{ mt: 2 }}>
                                        <Button
                                            variant="contained"
                                            onClick={handleGenerateFCMToken}
                                            disabled={!serviceAccountFile || isGeneratingToken}
                                            sx={{ mr: 2 }}
                                        >
                                            {isGeneratingToken ? 'Generating...' : 'Generate FCM Token'}
                                        </Button>
                                        
                                        {fcmToken && (
                                            <Chip 
                                                label="Token Generated" 
                                                color="success" 
                                                size="small"
                                            />
                                        )}
                                    </Box>
                                    
                                    {fcmToken && (
                                        <TextField
                                            fullWidth
                                            margin="normal"
                                            label="Generated FCM Token"
                                            value={fcmToken}
                                            InputProps={{ readOnly: true }}
                                            variant="outlined"
                                            size="small"
                                            sx={{ 
                                                mt: 1,
                                                '& .MuiInputBase-input': { 
                                                    fontFamily: 'monospace',
                                                    fontSize: '0.8rem' 
                                                }
                                            }}
                                        />
                                    )}
                                </Box>
                            )}
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
                <Card sx={{ overflow: 'auto' }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Device Tokens
                        </Typography>
                        <input
                            accept=".csv"
                            style={{ display: 'none' }}
                            id="csv-file"
                            type="file"
                            onChange={handleCsvUpload}
                        />
                        <label htmlFor="csv-file">
                            <Button
                                variant="contained"
                                component="span"
                                sx={{ mr: 2 }}
                            >
                                Upload CSV
                            </Button>
                        </label>
                        {csvFile && (
                            <Typography
                                component="span"
                                variant="body2"
                                color="textSecondary"
                            >
                                {csvFile.name}
                            </Typography>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Schedule Options
                        </Typography>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={isScheduled}
                                    onChange={(e) => setIsScheduled(e.target.checked)}
                                />
                            }
                            label="Schedule for later"
                        />
                        {isScheduled && (
                            <TextField
                                type="datetime-local"
                                label="Scheduled Time"
                                value={scheduledTime}
                                onChange={(e) => setScheduledTime(e.target.value)}
                                fullWidth
                                sx={{ mt: 2 }}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                        )}
                    </CardContent>
                </Card>

                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={isProcessing || (isScheduled && !scheduledTime)}
                    sx={{ width: '100%' }}
                >
                    {isProcessing ? 'Processing...' : isScheduled ? 'Schedule Overlay' : 'Send Overlay'}
                </Button>
                <Card sx={{ flex: 1, overflow: 'auto', height: '100%' }}>
                    <CardContent>
                        <Typography variant="h5" gutterBottom>
                            Preview
                        </Typography>
                        <OverlayPreview config={config} />
                    </CardContent>
                </Card>
            </Box>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
            <Dialog
                open={showFailedTokens}
                onClose={() => setShowFailedTokens(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle sx={{ bgcolor: '#f8f8f8', borderBottom: '1px solid #eee' }}>
                    <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
                        Notification Results Summary
                        {currentProgress.failed > 0 && (
                            <Chip 
                                label={`${currentProgress.failed} Failed`} 
                                color="error" 
                                size="small"
                                sx={{ ml: 2 }}
                            />
                        )}
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ pb: 1, pt: 3 }}>
                    <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 1 }}>
                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
                            Overall Statistics
                        </Typography>
                        <Box sx={{ 
                            display: 'flex', 
                            gap: 2, 
                            flexWrap: 'wrap', 
                            justifyContent: 'space-around' 
                        }}>
                            <Chip 
                                label={`Total: ${currentProgress.total}`} 
                                variant="outlined" 
                                icon={<span style={{ marginLeft: '8px' }}>📊</span>}
                            />
                            <Chip 
                                label={`Success: ${currentProgress.success}`} 
                                color="success" 
                                variant="outlined"
                                icon={<span style={{ marginLeft: '8px' }}>✅</span>}
                            />
                            <Chip 
                                label={`Failed: ${currentProgress.failed}`} 
                                color="error" 
                                variant="outlined"
                                icon={<span style={{ marginLeft: '8px' }}>❌</span>}
                            />
                            <Chip 
                                label={`Success Rate: ${Math.round((currentProgress.success / currentProgress.total) * 100)}%`} 
                                color={currentProgress.success > currentProgress.failed ? "success" : "error"}
                                icon={<span style={{ marginLeft: '8px' }}>📈</span>}
                            />
                        </Box>
                    </Box>
                    
                    {Object.keys(groupedErrors).length > 0 ? (
                        <>
                            <Typography variant="subtitle1" gutterBottom sx={{ 
                                fontWeight: 'medium',
                                mt: 2,
                                mb: 2
                            }}>
                                Errors by Type
                            </Typography>
                            {Object.entries(groupedErrors).map(([error, tokens], index) => (
                                <Paper key={index} elevation={2} sx={{ p: 2, mb: 3, borderLeft: '4px solid #f44336' }}>
                                    <Box sx={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        mb: 1
                                    }}>
                                        <Typography variant="subtitle1" color="error" sx={{ fontWeight: 'medium' }}>
                                            {error}
                                        </Typography>
                                        <Chip 
                                            label={`${tokens.length} device${tokens.length > 1 ? 's' : ''}`} 
                                            color="error" 
                                            size="small"
                                            variant="outlined"
                                        />
                                    </Box>
                                    <Box sx={{ 
                                        maxHeight: '150px', 
                                        overflow: 'auto',
                                        border: '1px solid #eee',
                                        borderRadius: 1,
                                        mt: 1
                                    }}>
                                        <List dense disablePadding>
                                            {tokens.map((token, tokenIndex) => (
                                                <ListItem 
                                                    key={tokenIndex} 
                                                    divider={tokenIndex < tokens.length - 1}
                                                    sx={{ 
                                                        py: 0.5,
                                                        bgcolor: tokenIndex % 2 === 0 ? 'transparent' : '#f9f9f9'
                                                    }}
                                                >
                                                    <ListItemText 
                                                        primary={token}
                                                        primaryTypographyProps={{
                                                            variant: 'body2',
                                                            sx: { fontFamily: 'monospace' }
                                                        }}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Box>
                                </Paper>
                            ))}
                        </>
                    ) : (
                        <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center', 
                            py: 4
                        }}>
                            <Typography variant="h6" color="success.main" gutterBottom>
                                All notifications sent successfully!
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                {currentProgress.total} notifications were processed without any errors.
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ borderTop: '1px solid #eee', p: 2 }}>
                    <Button 
                        onClick={() => setShowFailedTokens(false)}
                        variant="contained"
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={progressDialogOpen}
                onClose={() => {}}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Processing Overlay Notifications
                    <Typography variant="subtitle2" color="text.secondary">
                        {currentProgress.processed} of {currentProgress.total} processed
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">
                                Progress: {currentProgress.percentage}%
                            </Typography>
                            <Typography variant="body2">
                                Success: {currentProgress.success} | Failed: {currentProgress.failed}
                            </Typography>
                        </Box>
                        <LinearProgress 
                            variant="determinate" 
                            value={currentProgress.percentage}
                            sx={{ height: 10, borderRadius: 5 }}
                        />
                    </Box>

                    {currentProgress.failedTokens.length > 0 && (
                        <Box>
                            <Typography variant="subtitle1" gutterBottom>
                                Failed Notifications ({currentProgress.failedTokens.length})
                            </Typography>
                            <Paper sx={{ maxHeight: 300, overflow: 'auto' }}>
                                <List dense>
                                    {currentProgress.failedTokens.map((failed, index) => (
                                        <ListItem key={index} divider>
                                            <ListItemText
                                                primary={`Token: ${failed.token}`}
                                                secondary={`Error: ${failed.error}`}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Paper>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => setProgressDialogOpen(false)}
                        disabled={isProcessing}
                    >
                        {isProcessing ? 'Processing...' : 'Close'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default OverlayCreator;