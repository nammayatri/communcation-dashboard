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
const react_router_dom_1 = require("react-router-dom");
const Add_1 = __importDefault(require("@mui/icons-material/Add"));
const OverlayPreview_1 = __importDefault(require("./OverlayPreview"));
const STORAGE_KEY = 'overlay_configs';
const OverlayListView = () => {
    const [overlays, setOverlays] = (0, react_1.useState)([]);
    const [page, setPage] = (0, react_1.useState)(0);
    const [rowsPerPage, setRowsPerPage] = (0, react_1.useState)(10);
    const [selectedOverlay, setSelectedOverlay] = (0, react_1.useState)(null);
    const [previewDialogOpen, setPreviewDialogOpen] = (0, react_1.useState)(false);
    const [detailsDialogOpen, setDetailsDialogOpen] = (0, react_1.useState)(false);
    const navigate = (0, react_router_dom_1.useNavigate)();
    (0, react_1.useEffect)(() => {
        // Load overlays from local storage
        const storedOverlays = localStorage.getItem(STORAGE_KEY);
        if (storedOverlays) {
            setOverlays(JSON.parse(storedOverlays));
        }
    }, []);
    const handleChangePage = (_event, newPage) => {
        setPage(newPage);
    };
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };
    const handleViewPreview = (overlay) => {
        setSelectedOverlay(overlay);
        setPreviewDialogOpen(true);
    };
    const handleViewDetails = (overlay) => {
        setSelectedOverlay(overlay);
        setDetailsDialogOpen(true);
    };
    const getTotalSuccessCount = (overlay) => {
        return overlay.triggers?.reduce((sum, trigger) => sum + trigger.successCount, 0) || 0;
    };
    const getTotalFailedCount = (overlay) => {
        return overlay.triggers?.reduce((sum, trigger) => sum + trigger.failedCount, 0) || 0;
    };
    const getLatestTrigger = (overlay) => {
        return overlay.triggers?.length > 0
            ? overlay.triggers.reduce((latest, current) => new Date(current.triggeredAt) > new Date(latest.triggeredAt) ? current : latest)
            : null;
    };
    // Sort overlays by last triggered time (newest first)
    const sortedOverlays = [...overlays].sort((a, b) => {
        const aLatest = getLatestTrigger(a);
        const bLatest = getLatestTrigger(b);
        if (!aLatest && !bLatest)
            return 0;
        if (!aLatest)
            return 1;
        if (!bLatest)
            return -1;
        return new Date(bLatest.triggeredAt).getTime() - new Date(aLatest.triggeredAt).getTime();
    });
    return (<material_1.Box sx={{ p: 3 }}>
      <material_1.Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <material_1.Typography variant="h5" component="h2">
          Overlay List
        </material_1.Typography>
        <material_1.Button variant="contained" color="primary" startIcon={<Add_1.default />} onClick={() => navigate('/overlay/create')} sx={{
            bgcolor: '#0288d1',
            '&:hover': {
                bgcolor: '#01579b',
            },
            borderRadius: '4px',
            textTransform: 'none',
            px: 3
        }}>
          Create Overlay
        </material_1.Button>
      </material_1.Box>

      {overlays.length === 0 ? (<material_1.Alert severity="info">
          No overlays found. Create a new overlay to get started.
        </material_1.Alert>) : (<material_1.TableContainer component={material_1.Paper} sx={{ boxShadow: 1 }}>
          <material_1.Table>
            <material_1.TableHead>
              <material_1.TableRow>
                <material_1.TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Title</material_1.TableCell>
                <material_1.TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Description</material_1.TableCell>
                <material_1.TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Last Triggered</material_1.TableCell>
                <material_1.TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Success/Failed</material_1.TableCell>
                <material_1.TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }} align="center">Actions</material_1.TableCell>
              </material_1.TableRow>
            </material_1.TableHead>
            <material_1.TableBody>
              {sortedOverlays
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((overlay) => {
                const latestTrigger = getLatestTrigger(overlay);
                const totalSuccess = getTotalSuccessCount(overlay);
                const totalFailed = getTotalFailedCount(overlay);
                return (<material_1.TableRow key={overlay.id} hover sx={{
                        '&:hover': {
                            bgcolor: '#f5f5f5',
                        }
                    }}>
                      <material_1.TableCell sx={{ maxWidth: '200px' }}>
                        <material_1.Typography noWrap title={overlay.title}>
                          {overlay.title}
                        </material_1.Typography>
                      </material_1.TableCell>
                      <material_1.TableCell sx={{ maxWidth: '300px' }}>
                        <material_1.Typography noWrap title={overlay.description}>
                          {overlay.description}
                        </material_1.Typography>
                      </material_1.TableCell>
                      <material_1.TableCell>
                        {latestTrigger ? new Date(latestTrigger.triggeredAt).toLocaleString() : 'Never'}
                      </material_1.TableCell>
                      <material_1.TableCell>
                        <material_1.Box sx={{ display: 'flex', gap: 1 }}>
                          <material_1.Chip label={`Success: ${totalSuccess}`} color="success" size="small"/>
                          <material_1.Chip label={`Failed: ${totalFailed}`} color="error" size="small"/>
                        </material_1.Box>
                      </material_1.TableCell>
                      <material_1.TableCell align="center">
                        <material_1.Button variant="contained" color="primary" size="small" onClick={() => handleViewPreview(overlay)} sx={{
                        minWidth: '120px',
                        bgcolor: '#0288d1',
                        '&:hover': {
                            bgcolor: '#01579b',
                        },
                        mr: 1
                    }}>
                          Preview
                        </material_1.Button>
                        <material_1.Button variant="contained" color="info" size="small" onClick={() => handleViewDetails(overlay)} sx={{
                        minWidth: '120px',
                    }}>
                          See Details
                        </material_1.Button>
                      </material_1.TableCell>
                    </material_1.TableRow>);
            })}
            </material_1.TableBody>
          </material_1.Table>
          <material_1.TablePagination rowsPerPageOptions={[5, 10, 25]} component="div" count={overlays.length} rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage} sx={{
                borderTop: '1px solid rgba(224, 224, 224, 1)',
            }}/>
        </material_1.TableContainer>)}

      {/* Preview Dialog */}
      <material_1.Dialog open={previewDialogOpen} onClose={() => setPreviewDialogOpen(false)} maxWidth="sm" fullWidth>
        <material_1.DialogTitle>Overlay Preview</material_1.DialogTitle>
        <material_1.DialogContent>
          {selectedOverlay && <OverlayPreview_1.default config={selectedOverlay}/>}
        </material_1.DialogContent>
        <material_1.DialogActions>
          <material_1.Button onClick={() => setPreviewDialogOpen(false)}>Close</material_1.Button>
        </material_1.DialogActions>
      </material_1.Dialog>

      {/* Details Dialog */}
      <material_1.Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="md" fullWidth>
        <material_1.DialogTitle>Overlay Details</material_1.DialogTitle>
        <material_1.DialogContent>
          {selectedOverlay && (<material_1.Box>
              <material_1.Grid container spacing={3}>
                <material_1.Grid item xs={12}>
                  <material_1.Typography variant="h6" gutterBottom>Configuration</material_1.Typography>
                  <material_1.Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                    <material_1.Grid container spacing={2}>
                      <material_1.Grid item xs={6}>
                        <material_1.Typography variant="subtitle2" color="textSecondary">Title</material_1.Typography>
                        <material_1.Typography>{selectedOverlay.title}</material_1.Typography>
                      </material_1.Grid>
                      <material_1.Grid item xs={6}>
                        <material_1.Typography variant="subtitle2" color="textSecondary">Description</material_1.Typography>
                        <material_1.Typography>{selectedOverlay.description}</material_1.Typography>
                      </material_1.Grid>
                      <material_1.Grid item xs={6}>
                        <material_1.Typography variant="subtitle2" color="textSecondary">Action</material_1.Typography>
                        <material_1.Typography>{selectedOverlay.actions[0]}</material_1.Typography>
                      </material_1.Grid>
                      <material_1.Grid item xs={6}>
                        <material_1.Typography variant="subtitle2" color="textSecondary">Created At</material_1.Typography>
                        <material_1.Typography>{new Date(selectedOverlay.id).toLocaleString()}</material_1.Typography>
                      </material_1.Grid>
                    </material_1.Grid>
                  </material_1.Paper>
                </material_1.Grid>

                <material_1.Grid item xs={12}>
                  <material_1.Typography variant="h6" gutterBottom>Trigger History</material_1.Typography>
                  <material_1.TableContainer component={material_1.Paper}>
                    <material_1.Table size="small">
                      <material_1.TableHead>
                        <material_1.TableRow>
                          <material_1.TableCell>Triggered At</material_1.TableCell>
                          <material_1.TableCell>Triggered By</material_1.TableCell>
                          <material_1.TableCell align="right">Success Count</material_1.TableCell>
                          <material_1.TableCell align="right">Failed Count</material_1.TableCell>
                        </material_1.TableRow>
                      </material_1.TableHead>
                      <material_1.TableBody>
                        {selectedOverlay.triggers?.map((trigger, index) => (<material_1.TableRow key={index}>
                            <material_1.TableCell>{new Date(trigger.triggeredAt).toLocaleString()}</material_1.TableCell>
                            <material_1.TableCell>{trigger.triggeredBy}</material_1.TableCell>
                            <material_1.TableCell align="right">
                              <material_1.Chip label={trigger.successCount} color="success" size="small"/>
                            </material_1.TableCell>
                            <material_1.TableCell align="right">
                              <material_1.Chip label={trigger.failedCount} color="error" size="small"/>
                            </material_1.TableCell>
                          </material_1.TableRow>))}
                      </material_1.TableBody>
                    </material_1.Table>
                  </material_1.TableContainer>
                </material_1.Grid>
              </material_1.Grid>
            </material_1.Box>)}
        </material_1.DialogContent>
        <material_1.DialogActions>
          <material_1.Button onClick={() => setDetailsDialogOpen(false)}>Close</material_1.Button>
        </material_1.DialogActions>
      </material_1.Dialog>
    </material_1.Box>);
};
exports.default = OverlayListView;
