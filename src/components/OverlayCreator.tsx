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
} from '@mui/material';
import { OverlayConfig, OverlayAction } from '../types/overlay';
import OverlayPreview from './OverlayPreview';
import { processCSVAndSendNotifications } from '../services/overlayService';

const initialOverlayConfig: OverlayConfig = {
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
};

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
    const [failedTokens, setFailedTokens] = useState<{ token: string; error: string }[]>([]);
    const [showFailedTokens, setShowFailedTokens] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

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
                message: 'Please enter FCM authentication token',
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
        setSnackbar({
            open: true,
            message: 'Processing notifications...',
            severity: 'info',
        });

        try {
            const result = await processCSVAndSendNotifications(
                csvFile!,
                config,
                fcmToken
            );

            setFailedTokens(result.failedTokens);

            const message = `Successfully sent ${result.success} notifications. Failed: ${result.failed}`;
            setSnackbar({
                open: true,
                message,
                severity: result.failed > 0 ? 'error' : 'success',
            });

            if (result.failed > 0) {
                setShowFailedTokens(true);
            }
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: `Error: ${error.message}`,
                severity: 'error',
            });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Box sx={{ display: 'flex', gap: 2, p: 2 }}>
            <Card sx={{ flex: 1 }}>
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
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Link URL"
                                    value={config.link}
                                    onChange={handleConfigChange('link')}
                                    required
                                />
                            </Grid>
                        )}
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
                            <TextField
                                fullWidth
                                label="FCM OAuth Token"
                                placeholder="Bearer ya29.a0AfB_..."
                                helperText="Enter the complete OAuth 2.0 token including 'Bearer' prefix"
                                value={fcmToken}
                                onChange={(e) => setFcmToken(e.target.value)}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
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
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSubmit}
                                fullWidth
                                disabled={isProcessing}
                            >
                                {isProcessing ? 'Sending...' : 'Send Overlay'}
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
            <Card sx={{ flex: 1 }}>
                <CardContent>
                    <Typography variant="h5" gutterBottom>
                        Preview
                    </Typography>
                    <OverlayPreview config={config} />
                </CardContent>
            </Card>
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
                <DialogTitle>Failed Notifications</DialogTitle>
                <DialogContent>
                    <List>
                        {failedTokens.map((item, index) => (
                            <ListItem key={index}>
                                <ListItemText
                                    primary={`Token: ${item.token}`}
                                    secondary={`Error: ${item.error}`}
                                />
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowFailedTokens(false)}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default OverlayCreator; 