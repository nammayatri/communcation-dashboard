import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    LinearProgress,
    Grid,
    TextField,
    Snackbar,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Switch,
} from '@mui/material';
import { Delete as DeleteIcon, Info as InfoIcon, Stop as StopIcon, Edit as EditIcon } from '@mui/icons-material';
import { ScheduledOverlay, getScheduledOverlays, cancelScheduledOverlay, STORAGE_KEY } from '../services/schedulerService';

interface SnackbarState {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
}

const ScheduledOverlays: React.FC = () => {
    const [scheduledOverlays, setScheduledOverlays] = useState<ScheduledOverlay[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedOverlay, setSelectedOverlay] = useState<ScheduledOverlay | null>(null);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [terminateDialogOpen, setTerminateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [snackbar, setSnackbar] = useState<SnackbarState>({
        open: false,
        message: '',
        severity: 'success'
    });

    useEffect(() => {
        loadScheduledOverlays();
        // Refresh data every 5 seconds
        const interval = setInterval(loadScheduledOverlays, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadScheduledOverlays = () => {
        const overlays = getScheduledOverlays();
        // Sort by creation date (newest first)
        const sortedOverlays = overlays.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setScheduledOverlays(sortedOverlays);
    };

    const handleDeleteClick = (overlay: ScheduledOverlay) => {
        setSelectedOverlay(overlay);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (selectedOverlay) {
            cancelScheduledOverlay(selectedOverlay.id);
            loadScheduledOverlays();
            setDeleteDialogOpen(false);
            setSelectedOverlay(null);
        }
    };

    const handleViewDetails = (overlay: ScheduledOverlay) => {
        setSelectedOverlay(overlay);
        setDetailsDialogOpen(true);
    };

    const handleTerminateClick = (overlay: ScheduledOverlay) => {
        setSelectedOverlay(overlay);
        setTerminateDialogOpen(true);
    };

    const handleTerminateConfirm = () => {
        if (selectedOverlay) {
            // Update status to failed and mark as terminated
            const schedules = getScheduledOverlays();
            const updatedSchedules = schedules.map(s => 
                s.id === selectedOverlay.id 
                    ? { 
                        ...s, 
                        status: 'failed',
                        completedAt: new Date().toISOString(),
                        error: 'Terminated by user',
                        result: {
                            success: s.result?.success || 0,
                            failed: s.result?.failed || 0,
                            failedTokens: s.result?.failedTokens || [],
                            progress: s.result?.progress
                        }
                    } 
                    : s
            );
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSchedules));
            loadScheduledOverlays();
            setTerminateDialogOpen(false);
            setSelectedOverlay(null);
        }
    };

    const handleEditClick = (overlay: ScheduledOverlay) => {
        setSelectedOverlay(overlay);
        setEditDialogOpen(true);
    };

    const handleEditConfirm = (updatedOverlay: ScheduledOverlay) => {
        // Validate scheduled time is in the future
        const scheduledDate = new Date(updatedOverlay.scheduledTime);
        if (scheduledDate <= new Date()) {
            setSnackbar({
                open: true,
                message: 'Scheduled time must be in the future',
                severity: 'error'
            });
            return;
        }

        const schedules = getScheduledOverlays();
        const updatedSchedules = schedules.map(s => 
            s.id === updatedOverlay.id ? updatedOverlay : s
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSchedules));
        loadScheduledOverlays();
        setEditDialogOpen(false);
        setSelectedOverlay(null);
        setSnackbar({
            open: true,
            message: 'Scheduled overlay updated successfully',
            severity: 'success'
        });
    };

    const getStatusColor = (status: ScheduledOverlay['status']) => {
        switch (status) {
            case 'pending':
                return 'warning';
            case 'processing':
                return 'info';
            case 'completed':
                return 'success';
            case 'failed':
                return 'error';
            default:
                return 'default';
        }
    };

    const getProgressValue = (overlay: ScheduledOverlay) => {
        if (overlay.status === 'completed') return 100;
        if (overlay.status === 'failed') return 0;
        if (overlay.status === 'processing') return 50;
        return 0;
    };

    const getProgressColor = (status: ScheduledOverlay['status']) => {
        switch (status) {
            case 'pending':
                return 'warning';
            case 'processing':
                return 'primary';
            case 'completed':
                return 'success';
            case 'failed':
                return 'error';
            default:
                return 'primary';
        }
    };

    const checkImageSize = async (url: string): Promise<boolean> => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const sizeInKB = blob.size / 1024;
            return sizeInKB <= 50;
        } catch (error) {
            console.error('Error checking image size:', error);
            return true; // If we can't check the size, allow it
        }
    };

    const handleImageUrlChange = async (url: string) => {
        if (!url) {
            setSelectedOverlay(prev => prev ? {
                ...prev,
                overlayConfig: {
                    ...prev.overlayConfig,
                    imageUrl: url
                }
            } : null);
            return;
        }

        const isValidSize = await checkImageSize(url);
        if (!isValidSize) {
            setSnackbar({
                open: true,
                message: 'Image size too large (over 50KB), may cause issues in rendering',
                severity: 'warning'
            });
        }

        setSelectedOverlay(prev => prev ? {
            ...prev,
            overlayConfig: {
                ...prev.overlayConfig,
                imageUrl: url
            }
        } : null);
    };

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Scheduled Overlays
            </Typography>
            <Card>
                <CardContent>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ maxWidth: '200px' }}>Title</TableCell>
                                    <TableCell>Scheduled Time</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Progress</TableCell>
                                    <TableCell>Created At</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {scheduledOverlays.map((overlay) => (
                                    <TableRow key={overlay.id}>
                                        <TableCell sx={{ maxWidth: '200px' }}>
                                            <Typography noWrap title={overlay.overlayConfig.title}>
                                                {overlay.overlayConfig.title}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(overlay.scheduledTime).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={overlay.status}
                                                color={getStatusColor(overlay.status)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                                                <Box sx={{ width: '100%', mr: 1 }}>
                                                    <LinearProgress 
                                                        variant="determinate" 
                                                        value={getProgressValue(overlay)}
                                                        color={getProgressColor(overlay.status)}
                                                    />
                                                </Box>
                                                {overlay.result && (
                                                    <Typography variant="body2" color="text.secondary">
                                                        {`${overlay.result.success}/${overlay.result.success + overlay.result.failed}`}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(overlay.createdAt).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <IconButton
                                                color="primary"
                                                onClick={() => handleViewDetails(overlay)}
                                            >
                                                <InfoIcon />
                                            </IconButton>
                                            {overlay.status === 'pending' && (
                                                <>
                                                    <IconButton
                                                        color="primary"
                                                        onClick={() => handleEditClick(overlay)}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton
                                                        color="error"
                                                        onClick={() => handleDeleteClick(overlay)}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </>
                                            )}
                                            {overlay.status === 'processing' && (
                                                <IconButton
                                                    color="error"
                                                    onClick={() => handleTerminateClick(overlay)}
                                                >
                                                    <StopIcon />
                                                </IconButton>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Cancel Scheduled Overlay</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to cancel this scheduled overlay? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog 
                open={detailsDialogOpen} 
                onClose={() => setDetailsDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Overlay Details</DialogTitle>
                <DialogContent>
                    {selectedOverlay && (
                        <Box sx={{ mt: 2 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <Typography variant="h6" gutterBottom>Configuration</Typography>
                                    <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                                        <Grid container spacing={2}>
                                            <Grid item xs={6}>
                                                <Typography variant="subtitle2" color="textSecondary">Title</Typography>
                                                <Typography>{selectedOverlay.overlayConfig.title}</Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="subtitle2" color="textSecondary">Description</Typography>
                                                <Typography>{selectedOverlay.overlayConfig.description}</Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="subtitle2" color="textSecondary">Scheduled Time</Typography>
                                                <Typography>{new Date(selectedOverlay.scheduledTime).toLocaleString()}</Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="subtitle2" color="textSecondary">Created At</Typography>
                                                <Typography>{new Date(selectedOverlay.createdAt).toLocaleString()}</Typography>
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                </Grid>

                                <Grid item xs={12}>
                                    <Typography variant="h6" gutterBottom>Status</Typography>
                                    <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                                        <Grid container spacing={2}>
                                            <Grid item xs={6}>
                                                <Typography variant="subtitle2" color="textSecondary">Current Status</Typography>
                                                <Chip
                                                    label={selectedOverlay.status}
                                                    color={getStatusColor(selectedOverlay.status)}
                                                />
                                            </Grid>
                                            {selectedOverlay.completedAt && (
                                                <Grid item xs={6}>
                                                    <Typography variant="subtitle2" color="textSecondary">Completed At</Typography>
                                                    <Typography>{new Date(selectedOverlay.completedAt).toLocaleString()}</Typography>
                                                </Grid>
                                            )}
                                            {selectedOverlay.error && (
                                                <Grid item xs={12}>
                                                    <Typography variant="subtitle2" color="textSecondary">Error</Typography>
                                                    <Typography color="error">{selectedOverlay.error}</Typography>
                                                </Grid>
                                            )}
                                        </Grid>
                                    </Paper>
                                </Grid>

                                {selectedOverlay.result && (
                                    <Grid item xs={12}>
                                        <Typography variant="h6" gutterBottom>Results</Typography>
                                        <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                                            <Grid container spacing={2}>
                                                <Grid item xs={6}>
                                                    <Typography variant="subtitle2" color="textSecondary">Success Count</Typography>
                                                    <Chip 
                                                        label={selectedOverlay.result.success} 
                                                        color="success" 
                                                    />
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="subtitle2" color="textSecondary">Failed Count</Typography>
                                                    <Chip 
                                                        label={selectedOverlay.result.failed} 
                                                        color="error" 
                                                    />
                                                </Grid>
                                                {selectedOverlay.result.failedTokens && selectedOverlay.result.failedTokens.length > 0 && (
                                                    <Grid item xs={12}>
                                                        <Typography variant="subtitle2" color="textSecondary">Failed Tokens</Typography>
                                                        <Box sx={{ mt: 1 }}>
                                                            {selectedOverlay.result.failedTokens.map((token, index) => (
                                                                <Paper key={index} sx={{ p: 1, mb: 1 }}>
                                                                    <Typography variant="body2">Token: {token.token}</Typography>
                                                                    <Typography variant="body2" color="error">Error: {token.error}</Typography>
                                                                </Paper>
                                                            ))}
                                                        </Box>
                                                    </Grid>
                                                )}
                                            </Grid>
                                        </Paper>
                                    </Grid>
                                )}
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={terminateDialogOpen} onClose={() => setTerminateDialogOpen(false)}>
                <DialogTitle>Terminate Processing</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to terminate this overlay processing? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTerminateDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleTerminateConfirm} color="error" variant="contained">
                        Terminate
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog 
                open={editDialogOpen} 
                onClose={() => setEditDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Edit Scheduled Overlay</DialogTitle>
                <DialogContent>
                    {selectedOverlay && (
                        <Box sx={{ mt: 2 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Title"
                                        value={selectedOverlay.overlayConfig.title}
                                        fullWidth
                                        onChange={(e) => {
                                            setSelectedOverlay({
                                                ...selectedOverlay,
                                                overlayConfig: {
                                                    ...selectedOverlay.overlayConfig,
                                                    title: e.target.value
                                                }
                                            });
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Description"
                                        value={selectedOverlay.overlayConfig.description}
                                        fullWidth
                                        multiline
                                        rows={4}
                                        onChange={(e) => {
                                            setSelectedOverlay({
                                                ...selectedOverlay,
                                                overlayConfig: {
                                                    ...selectedOverlay.overlayConfig,
                                                    description: e.target.value
                                                }
                                            });
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Image URL"
                                        value={selectedOverlay.overlayConfig.imageUrl}
                                        fullWidth
                                        onChange={(e) => handleImageUrlChange(e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="OK Button Text"
                                        value={selectedOverlay.overlayConfig.okButtonText}
                                        fullWidth
                                        onChange={(e) => {
                                            setSelectedOverlay({
                                                ...selectedOverlay,
                                                overlayConfig: {
                                                    ...selectedOverlay.overlayConfig,
                                                    okButtonText: e.target.value
                                                }
                                            });
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Cancel Button Text"
                                        value={selectedOverlay.overlayConfig.cancelButtonText}
                                        fullWidth
                                        onChange={(e) => {
                                            setSelectedOverlay({
                                                ...selectedOverlay,
                                                overlayConfig: {
                                                    ...selectedOverlay.overlayConfig,
                                                    cancelButtonText: e.target.value
                                                }
                                            });
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControl fullWidth>
                                        <InputLabel>Action</InputLabel>
                                        <Select
                                            value={selectedOverlay.overlayConfig.actions[0]}
                                            onChange={(e) => {
                                                setSelectedOverlay({
                                                    ...selectedOverlay,
                                                    overlayConfig: {
                                                        ...selectedOverlay.overlayConfig,
                                                        actions: [e.target.value as 'OPEN_LINK' | 'OPEN_APP' | 'SET_DRIVER_ONLINE']
                                                    }
                                                });
                                            }}
                                            label="Action"
                                        >
                                            <MenuItem value="OPEN_LINK">Open Link</MenuItem>
                                            <MenuItem value="OPEN_APP">Open App</MenuItem>
                                            <MenuItem value="SET_DRIVER_ONLINE">Set Driver Online</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                {selectedOverlay.overlayConfig.actions[0] === 'OPEN_LINK' && (
                                    <Grid item xs={12}>
                                        <TextField
                                            label="Link URL"
                                            value={selectedOverlay.overlayConfig.link || ''}
                                            fullWidth
                                            onChange={(e) => {
                                                setSelectedOverlay({
                                                    ...selectedOverlay,
                                                    overlayConfig: {
                                                        ...selectedOverlay.overlayConfig,
                                                        link: e.target.value
                                                    }
                                                });
                                            }}
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
                                                        checked={selectedOverlay.overlayConfig.titleVisibility}
                                                        onChange={(e) => {
                                                            setSelectedOverlay({
                                                                ...selectedOverlay,
                                                                overlayConfig: {
                                                                    ...selectedOverlay.overlayConfig,
                                                                    titleVisibility: e.target.checked
                                                                }
                                                            });
                                                        }}
                                                    />
                                                }
                                                label="Show Title"
                                            />
                                        </Grid>
                                        <Grid item xs={6}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={selectedOverlay.overlayConfig.descriptionVisibility}
                                                        onChange={(e) => {
                                                            setSelectedOverlay({
                                                                ...selectedOverlay,
                                                                overlayConfig: {
                                                                    ...selectedOverlay.overlayConfig,
                                                                    descriptionVisibility: e.target.checked
                                                                }
                                                            });
                                                        }}
                                                    />
                                                }
                                                label="Show Description"
                                            />
                                        </Grid>
                                        <Grid item xs={6}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={selectedOverlay.overlayConfig.buttonOkVisibility}
                                                        onChange={(e) => {
                                                            setSelectedOverlay({
                                                                ...selectedOverlay,
                                                                overlayConfig: {
                                                                    ...selectedOverlay.overlayConfig,
                                                                    buttonOkVisibility: e.target.checked
                                                                }
                                                            });
                                                        }}
                                                    />
                                                }
                                                label="Show OK Button"
                                            />
                                        </Grid>
                                        <Grid item xs={6}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={selectedOverlay.overlayConfig.buttonCancelVisibility}
                                                        onChange={(e) => {
                                                            setSelectedOverlay({
                                                                ...selectedOverlay,
                                                                overlayConfig: {
                                                                    ...selectedOverlay.overlayConfig,
                                                                    buttonCancelVisibility: e.target.checked
                                                                }
                                                            });
                                                        }}
                                                    />
                                                }
                                                label="Show Cancel Button"
                                            />
                                        </Grid>
                                        <Grid item xs={6}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={selectedOverlay.overlayConfig.imageVisibility}
                                                        onChange={(e) => {
                                                            setSelectedOverlay({
                                                                ...selectedOverlay,
                                                                overlayConfig: {
                                                                    ...selectedOverlay.overlayConfig,
                                                                    imageVisibility: e.target.checked
                                                                }
                                                            });
                                                        }}
                                                    />
                                                }
                                                label="Show Image"
                                            />
                                        </Grid>
                                    </Grid>
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        type="datetime-local"
                                        label="Scheduled Time"
                                        value={selectedOverlay.scheduledTime}
                                        fullWidth
                                        onChange={(e) => {
                                            setSelectedOverlay({
                                                ...selectedOverlay,
                                                scheduledTime: e.target.value
                                            });
                                        }}
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                    <Button 
                        onClick={() => handleEditConfirm(selectedOverlay!)} 
                        variant="contained" 
                        color="primary"
                    >
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>

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
        </Box>
    );
};

export default ScheduledOverlays; 