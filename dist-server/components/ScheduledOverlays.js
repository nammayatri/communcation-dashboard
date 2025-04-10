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
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const material_1 = require("@mui/material");
const icons_material_1 = require("@mui/icons-material");
const schedulerService_1 = require("../services/schedulerService");
const ScheduledOverlays = () => {
    const [scheduledOverlays, setScheduledOverlays] = (0, react_1.useState)([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = (0, react_1.useState)(false);
    const [selectedOverlay, setSelectedOverlay] = (0, react_1.useState)(null);
    const [detailsDialogOpen, setDetailsDialogOpen] = (0, react_1.useState)(false);
    const [terminateDialogOpen, setTerminateDialogOpen] = (0, react_1.useState)(false);
    const [editDialogOpen, setEditDialogOpen] = (0, react_1.useState)(false);
    const [snackbar, setSnackbar] = (0, react_1.useState)({
        open: false,
        message: '',
        severity: 'success'
    });
    (0, react_1.useEffect)(() => {
        loadScheduledOverlays();
        // Refresh data every 5 seconds
        const interval = setInterval(loadScheduledOverlays, 5000);
        return () => clearInterval(interval);
    }, []);
    const loadScheduledOverlays = () => {
        const overlays = (0, schedulerService_1.getScheduledOverlays)();
        // Sort by creation date (newest first)
        const sortedOverlays = overlays.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setScheduledOverlays(sortedOverlays);
    };
    const handleDeleteClick = (overlay) => {
        setSelectedOverlay(overlay);
        setDeleteDialogOpen(true);
    };
    const handleDeleteConfirm = () => {
        if (selectedOverlay) {
            (0, schedulerService_1.cancelScheduledOverlay)(selectedOverlay.id);
            loadScheduledOverlays();
            setDeleteDialogOpen(false);
            setSelectedOverlay(null);
        }
    };
    const handleViewDetails = (overlay) => {
        setSelectedOverlay(overlay);
        setDetailsDialogOpen(true);
    };
    const handleTerminateClick = (overlay) => {
        setSelectedOverlay(overlay);
        setTerminateDialogOpen(true);
    };
    const handleTerminateConfirm = () => {
        if (selectedOverlay) {
            // Update status to failed and mark as terminated
            const schedules = (0, schedulerService_1.getScheduledOverlays)();
            const updatedSchedules = schedules.map(s => s.id === selectedOverlay.id
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
                : s);
            localStorage.setItem(schedulerService_1.STORAGE_KEY, JSON.stringify(updatedSchedules));
            loadScheduledOverlays();
            setTerminateDialogOpen(false);
            setSelectedOverlay(null);
        }
    };
    const handleEditClick = (overlay) => {
        setSelectedOverlay(overlay);
        setEditDialogOpen(true);
    };
    const handleEditConfirm = (updatedOverlay) => {
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
        const schedules = (0, schedulerService_1.getScheduledOverlays)();
        const updatedSchedules = schedules.map(s => s.id === updatedOverlay.id ? updatedOverlay : s);
        localStorage.setItem(schedulerService_1.STORAGE_KEY, JSON.stringify(updatedSchedules));
        loadScheduledOverlays();
        setEditDialogOpen(false);
        setSelectedOverlay(null);
        setSnackbar({
            open: true,
            message: 'Scheduled overlay updated successfully',
            severity: 'success'
        });
    };
    const getStatusColor = (status) => {
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
    const getProgressValue = (overlay) => {
        if (overlay.status === 'completed')
            return 100;
        if (overlay.status === 'failed')
            return 0;
        if (overlay.status === 'processing')
            return 50;
        return 0;
    };
    const getProgressColor = (status) => {
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
    const checkImageSize = async (url) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const sizeInKB = blob.size / 1024;
            return sizeInKB <= 50;
        }
        catch (error) {
            console.error('Error checking image size:', error);
            return true; // If we can't check the size, allow it
        }
    };
    const handleImageUrlChange = async (url) => {
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
    return (<material_1.Box>
            <material_1.Typography variant="h5" gutterBottom>
                Scheduled Overlays
            </material_1.Typography>
            <material_1.Card>
                <material_1.CardContent>
                    <material_1.TableContainer component={material_1.Paper}>
                        <material_1.Table>
                            <material_1.TableHead>
                                <material_1.TableRow>
                                    <material_1.TableCell sx={{ maxWidth: '200px' }}>Title</material_1.TableCell>
                                    <material_1.TableCell>Scheduled Time</material_1.TableCell>
                                    <material_1.TableCell>Status</material_1.TableCell>
                                    <material_1.TableCell>Progress</material_1.TableCell>
                                    <material_1.TableCell>Created At</material_1.TableCell>
                                    <material_1.TableCell>Actions</material_1.TableCell>
                                </material_1.TableRow>
                            </material_1.TableHead>
                            <material_1.TableBody>
                                {scheduledOverlays.map((overlay) => (<material_1.TableRow key={overlay.id}>
                                        <material_1.TableCell sx={{ maxWidth: '200px' }}>
                                            <material_1.Typography noWrap title={overlay.overlayConfig.title}>
                                                {overlay.overlayConfig.title}
                                            </material_1.Typography>
                                        </material_1.TableCell>
                                        <material_1.TableCell>
                                            {new Date(overlay.scheduledTime).toLocaleString()}
                                        </material_1.TableCell>
                                        <material_1.TableCell>
                                            <material_1.Chip label={overlay.status} color={getStatusColor(overlay.status)} size="small"/>
                                        </material_1.TableCell>
                                        <material_1.TableCell>
                                            <material_1.Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                                                <material_1.Box sx={{ width: '100%', mr: 1 }}>
                                                    <material_1.LinearProgress variant="determinate" value={getProgressValue(overlay)} color={getProgressColor(overlay.status)}/>
                                                </material_1.Box>
                                                {overlay.result && (<material_1.Typography variant="body2" color="text.secondary">
                                                        {`${overlay.result.success}/${overlay.result.success + overlay.result.failed}`}
                                                    </material_1.Typography>)}
                                            </material_1.Box>
                                        </material_1.TableCell>
                                        <material_1.TableCell>
                                            {new Date(overlay.createdAt).toLocaleString()}
                                        </material_1.TableCell>
                                        <material_1.TableCell>
                                            <material_1.IconButton color="primary" onClick={() => handleViewDetails(overlay)}>
                                                <icons_material_1.Info />
                                            </material_1.IconButton>
                                            {overlay.status === 'pending' && (<>
                                                    <material_1.IconButton color="primary" onClick={() => handleEditClick(overlay)}>
                                                        <icons_material_1.Edit />
                                                    </material_1.IconButton>
                                                    <material_1.IconButton color="error" onClick={() => handleDeleteClick(overlay)}>
                                                        <icons_material_1.Delete />
                                                    </material_1.IconButton>
                                                </>)}
                                            {overlay.status === 'processing' && (<material_1.IconButton color="error" onClick={() => handleTerminateClick(overlay)}>
                                                    <icons_material_1.Stop />
                                                </material_1.IconButton>)}
                                        </material_1.TableCell>
                                    </material_1.TableRow>))}
                            </material_1.TableBody>
                        </material_1.Table>
                    </material_1.TableContainer>
                </material_1.CardContent>
            </material_1.Card>

            <material_1.Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <material_1.DialogTitle>Cancel Scheduled Overlay</material_1.DialogTitle>
                <material_1.DialogContent>
                    <material_1.Typography>
                        Are you sure you want to cancel this scheduled overlay? This action cannot be undone.
                    </material_1.Typography>
                </material_1.DialogContent>
                <material_1.DialogActions>
                    <material_1.Button onClick={() => setDeleteDialogOpen(false)}>Cancel</material_1.Button>
                    <material_1.Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        Delete
                    </material_1.Button>
                </material_1.DialogActions>
            </material_1.Dialog>

            <material_1.Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="md" fullWidth>
                <material_1.DialogTitle>Overlay Details</material_1.DialogTitle>
                <material_1.DialogContent>
                    {selectedOverlay && (<material_1.Box sx={{ mt: 2 }}>
                            <material_1.Grid container spacing={3}>
                                <material_1.Grid item xs={12}>
                                    <material_1.Typography variant="h6" gutterBottom>Configuration</material_1.Typography>
                                    <material_1.Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                                        <material_1.Grid container spacing={2}>
                                            <material_1.Grid item xs={6}>
                                                <material_1.Typography variant="subtitle2" color="textSecondary">Title</material_1.Typography>
                                                <material_1.Typography>{selectedOverlay.overlayConfig.title}</material_1.Typography>
                                            </material_1.Grid>
                                            <material_1.Grid item xs={6}>
                                                <material_1.Typography variant="subtitle2" color="textSecondary">Description</material_1.Typography>
                                                <material_1.Typography>{selectedOverlay.overlayConfig.description}</material_1.Typography>
                                            </material_1.Grid>
                                            <material_1.Grid item xs={6}>
                                                <material_1.Typography variant="subtitle2" color="textSecondary">Scheduled Time</material_1.Typography>
                                                <material_1.Typography>{new Date(selectedOverlay.scheduledTime).toLocaleString()}</material_1.Typography>
                                            </material_1.Grid>
                                            <material_1.Grid item xs={6}>
                                                <material_1.Typography variant="subtitle2" color="textSecondary">Created At</material_1.Typography>
                                                <material_1.Typography>{new Date(selectedOverlay.createdAt).toLocaleString()}</material_1.Typography>
                                            </material_1.Grid>
                                        </material_1.Grid>
                                    </material_1.Paper>
                                </material_1.Grid>

                                <material_1.Grid item xs={12}>
                                    <material_1.Typography variant="h6" gutterBottom>Status</material_1.Typography>
                                    <material_1.Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                                        <material_1.Grid container spacing={2}>
                                            <material_1.Grid item xs={6}>
                                                <material_1.Typography variant="subtitle2" color="textSecondary">Current Status</material_1.Typography>
                                                <material_1.Chip label={selectedOverlay.status} color={getStatusColor(selectedOverlay.status)}/>
                                            </material_1.Grid>
                                            {selectedOverlay.completedAt && (<material_1.Grid item xs={6}>
                                                    <material_1.Typography variant="subtitle2" color="textSecondary">Completed At</material_1.Typography>
                                                    <material_1.Typography>{new Date(selectedOverlay.completedAt).toLocaleString()}</material_1.Typography>
                                                </material_1.Grid>)}
                                            {selectedOverlay.error && (<material_1.Grid item xs={12}>
                                                    <material_1.Typography variant="subtitle2" color="textSecondary">Error</material_1.Typography>
                                                    <material_1.Typography color="error">{selectedOverlay.error}</material_1.Typography>
                                                </material_1.Grid>)}
                                        </material_1.Grid>
                                    </material_1.Paper>
                                </material_1.Grid>

                                {selectedOverlay.result && (<material_1.Grid item xs={12}>
                                        <material_1.Typography variant="h6" gutterBottom>Results</material_1.Typography>
                                        <material_1.Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                                            <material_1.Grid container spacing={2}>
                                                <material_1.Grid item xs={6}>
                                                    <material_1.Typography variant="subtitle2" color="textSecondary">Success Count</material_1.Typography>
                                                    <material_1.Chip label={selectedOverlay.result.success} color="success"/>
                                                </material_1.Grid>
                                                <material_1.Grid item xs={6}>
                                                    <material_1.Typography variant="subtitle2" color="textSecondary">Failed Count</material_1.Typography>
                                                    <material_1.Chip label={selectedOverlay.result.failed} color="error"/>
                                                </material_1.Grid>
                                                {selectedOverlay.result.failedTokens && selectedOverlay.result.failedTokens.length > 0 && (<material_1.Grid item xs={12}>
                                                        <material_1.Typography variant="subtitle2" color="textSecondary">Failed Tokens</material_1.Typography>
                                                        <material_1.Box sx={{ mt: 1 }}>
                                                            {selectedOverlay.result.failedTokens.map((token, index) => (<material_1.Paper key={index} sx={{ p: 1, mb: 1 }}>
                                                                    <material_1.Typography variant="body2">Token: {token.token}</material_1.Typography>
                                                                    <material_1.Typography variant="body2" color="error">Error: {token.error}</material_1.Typography>
                                                                </material_1.Paper>))}
                                                        </material_1.Box>
                                                    </material_1.Grid>)}
                                            </material_1.Grid>
                                        </material_1.Paper>
                                    </material_1.Grid>)}
                            </material_1.Grid>
                        </material_1.Box>)}
                </material_1.DialogContent>
                <material_1.DialogActions>
                    <material_1.Button onClick={() => setDetailsDialogOpen(false)}>Close</material_1.Button>
                </material_1.DialogActions>
            </material_1.Dialog>

            <material_1.Dialog open={terminateDialogOpen} onClose={() => setTerminateDialogOpen(false)}>
                <material_1.DialogTitle>Terminate Processing</material_1.DialogTitle>
                <material_1.DialogContent>
                    <material_1.Typography>
                        Are you sure you want to terminate this overlay processing? This action cannot be undone.
                    </material_1.Typography>
                </material_1.DialogContent>
                <material_1.DialogActions>
                    <material_1.Button onClick={() => setTerminateDialogOpen(false)}>Cancel</material_1.Button>
                    <material_1.Button onClick={handleTerminateConfirm} color="error" variant="contained">
                        Terminate
                    </material_1.Button>
                </material_1.DialogActions>
            </material_1.Dialog>

            <material_1.Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
                <material_1.DialogTitle>Edit Scheduled Overlay</material_1.DialogTitle>
                <material_1.DialogContent>
                    {selectedOverlay && (<material_1.Box sx={{ mt: 2 }}>
                            <material_1.Grid container spacing={3}>
                                <material_1.Grid item xs={12}>
                                    <material_1.TextField label="Title" value={selectedOverlay.overlayConfig.title} fullWidth onChange={(e) => {
                setSelectedOverlay({
                    ...selectedOverlay,
                    overlayConfig: {
                        ...selectedOverlay.overlayConfig,
                        title: e.target.value
                    }
                });
            }}/>
                                </material_1.Grid>
                                <material_1.Grid item xs={12}>
                                    <material_1.TextField label="Description" value={selectedOverlay.overlayConfig.description} fullWidth multiline rows={4} onChange={(e) => {
                setSelectedOverlay({
                    ...selectedOverlay,
                    overlayConfig: {
                        ...selectedOverlay.overlayConfig,
                        description: e.target.value
                    }
                });
            }}/>
                                </material_1.Grid>
                                <material_1.Grid item xs={12}>
                                    <material_1.TextField label="Image URL" value={selectedOverlay.overlayConfig.imageUrl} fullWidth onChange={(e) => handleImageUrlChange(e.target.value)}/>
                                </material_1.Grid>
                                <material_1.Grid item xs={12} sm={6}>
                                    <material_1.TextField label="OK Button Text" value={selectedOverlay.overlayConfig.okButtonText} fullWidth onChange={(e) => {
                setSelectedOverlay({
                    ...selectedOverlay,
                    overlayConfig: {
                        ...selectedOverlay.overlayConfig,
                        okButtonText: e.target.value
                    }
                });
            }}/>
                                </material_1.Grid>
                                <material_1.Grid item xs={12} sm={6}>
                                    <material_1.TextField label="Cancel Button Text" value={selectedOverlay.overlayConfig.cancelButtonText} fullWidth onChange={(e) => {
                setSelectedOverlay({
                    ...selectedOverlay,
                    overlayConfig: {
                        ...selectedOverlay.overlayConfig,
                        cancelButtonText: e.target.value
                    }
                });
            }}/>
                                </material_1.Grid>
                                <material_1.Grid item xs={12}>
                                    <material_1.FormControl fullWidth>
                                        <material_1.InputLabel>Action</material_1.InputLabel>
                                        <material_1.Select value={selectedOverlay.overlayConfig.actions[0]} onChange={(e) => {
                setSelectedOverlay({
                    ...selectedOverlay,
                    overlayConfig: {
                        ...selectedOverlay.overlayConfig,
                        actions: [e.target.value]
                    }
                });
            }} label="Action">
                                            <material_1.MenuItem value="OPEN_LINK">Open Link</material_1.MenuItem>
                                            <material_1.MenuItem value="OPEN_APP">Open App</material_1.MenuItem>
                                            <material_1.MenuItem value="SET_DRIVER_ONLINE">Set Driver Online</material_1.MenuItem>
                                        </material_1.Select>
                                    </material_1.FormControl>
                                </material_1.Grid>
                                {selectedOverlay.overlayConfig.actions[0] === 'OPEN_LINK' && (<material_1.Grid item xs={12}>
                                        <material_1.TextField label="Link URL" value={selectedOverlay.overlayConfig.link || ''} fullWidth onChange={(e) => {
                    setSelectedOverlay({
                        ...selectedOverlay,
                        overlayConfig: {
                            ...selectedOverlay.overlayConfig,
                            link: e.target.value
                        }
                    });
                }}/>
                                    </material_1.Grid>)}
                                <material_1.Grid item xs={12}>
                                    <material_1.Typography variant="h6" gutterBottom>
                                        Visibility Controls
                                    </material_1.Typography>
                                    <material_1.Grid container spacing={2}>
                                        <material_1.Grid item xs={6}>
                                            <material_1.FormControlLabel control={<material_1.Switch checked={selectedOverlay.overlayConfig.titleVisibility} onChange={(e) => {
                    setSelectedOverlay({
                        ...selectedOverlay,
                        overlayConfig: {
                            ...selectedOverlay.overlayConfig,
                            titleVisibility: e.target.checked
                        }
                    });
                }}/>} label="Show Title"/>
                                        </material_1.Grid>
                                        <material_1.Grid item xs={6}>
                                            <material_1.FormControlLabel control={<material_1.Switch checked={selectedOverlay.overlayConfig.descriptionVisibility} onChange={(e) => {
                    setSelectedOverlay({
                        ...selectedOverlay,
                        overlayConfig: {
                            ...selectedOverlay.overlayConfig,
                            descriptionVisibility: e.target.checked
                        }
                    });
                }}/>} label="Show Description"/>
                                        </material_1.Grid>
                                        <material_1.Grid item xs={6}>
                                            <material_1.FormControlLabel control={<material_1.Switch checked={selectedOverlay.overlayConfig.buttonOkVisibility} onChange={(e) => {
                    setSelectedOverlay({
                        ...selectedOverlay,
                        overlayConfig: {
                            ...selectedOverlay.overlayConfig,
                            buttonOkVisibility: e.target.checked
                        }
                    });
                }}/>} label="Show OK Button"/>
                                        </material_1.Grid>
                                        <material_1.Grid item xs={6}>
                                            <material_1.FormControlLabel control={<material_1.Switch checked={selectedOverlay.overlayConfig.buttonCancelVisibility} onChange={(e) => {
                    setSelectedOverlay({
                        ...selectedOverlay,
                        overlayConfig: {
                            ...selectedOverlay.overlayConfig,
                            buttonCancelVisibility: e.target.checked
                        }
                    });
                }}/>} label="Show Cancel Button"/>
                                        </material_1.Grid>
                                        <material_1.Grid item xs={6}>
                                            <material_1.FormControlLabel control={<material_1.Switch checked={selectedOverlay.overlayConfig.imageVisibility} onChange={(e) => {
                    setSelectedOverlay({
                        ...selectedOverlay,
                        overlayConfig: {
                            ...selectedOverlay.overlayConfig,
                            imageVisibility: e.target.checked
                        }
                    });
                }}/>} label="Show Image"/>
                                        </material_1.Grid>
                                    </material_1.Grid>
                                </material_1.Grid>
                                <material_1.Grid item xs={12}>
                                    <material_1.TextField type="datetime-local" label="Scheduled Time" value={selectedOverlay.scheduledTime} fullWidth onChange={(e) => {
                setSelectedOverlay({
                    ...selectedOverlay,
                    scheduledTime: e.target.value
                });
            }} InputLabelProps={{
                shrink: true,
            }}/>
                                </material_1.Grid>
                            </material_1.Grid>
                        </material_1.Box>)}
                </material_1.DialogContent>
                <material_1.DialogActions>
                    <material_1.Button onClick={() => setEditDialogOpen(false)}>Cancel</material_1.Button>
                    <material_1.Button onClick={() => handleEditConfirm(selectedOverlay)} variant="contained" color="primary">
                        Save Changes
                    </material_1.Button>
                </material_1.DialogActions>
            </material_1.Dialog>

            <material_1.Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <material_1.Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </material_1.Alert>
            </material_1.Snackbar>
        </material_1.Box>);
};
exports.default = ScheduledOverlays;
