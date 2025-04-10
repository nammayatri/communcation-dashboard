import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Grid,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import { OverlayConfig, OverlayTrigger } from '../types/overlay';
import OverlayPreview from './OverlayPreview';

const STORAGE_KEY = 'overlay_configs';

const OverlayListView: React.FC = () => {
  const [overlays, setOverlays] = useState<OverlayConfig[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedOverlay, setSelectedOverlay] = useState<OverlayConfig | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Load overlays from local storage
    const storedOverlays = localStorage.getItem(STORAGE_KEY);
    if (storedOverlays) {
      setOverlays(JSON.parse(storedOverlays));
    }
  }, []);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewPreview = (overlay: OverlayConfig) => {
    setSelectedOverlay(overlay);
    setPreviewDialogOpen(true);
  };

  const handleViewDetails = (overlay: OverlayConfig) => {
    setSelectedOverlay(overlay);
    setDetailsDialogOpen(true);
  };

  const getTotalSuccessCount = (overlay: OverlayConfig) => {
    return overlay.triggers?.reduce((sum, trigger) => sum + trigger.successCount, 0) || 0;
  };

  const getTotalFailedCount = (overlay: OverlayConfig) => {
    return overlay.triggers?.reduce((sum, trigger) => sum + trigger.failedCount, 0) || 0;
  };

  const getLatestTrigger = (overlay: OverlayConfig): OverlayTrigger | null => {
    return overlay.triggers?.length > 0 
      ? overlay.triggers.reduce((latest, current) => 
          new Date(current.triggeredAt) > new Date(latest.triggeredAt) ? current : latest
        )
      : null;
  };

  // Sort overlays by last triggered time (newest first)
  const sortedOverlays = [...overlays].sort((a, b) => {
    const aLatest = getLatestTrigger(a);
    const bLatest = getLatestTrigger(b);
    if (!aLatest && !bLatest) return 0;
    if (!aLatest) return 1;
    if (!bLatest) return -1;
    return new Date(bLatest.triggeredAt).getTime() - new Date(aLatest.triggeredAt).getTime();
  });

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Overlay List
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/overlay/create')}
          sx={{
            bgcolor: '#0288d1',
            '&:hover': {
              bgcolor: '#01579b',
            },
            borderRadius: '4px',
            textTransform: 'none',
            px: 3
          }}
        >
          Create Overlay
        </Button>
      </Box>

      {overlays.length === 0 ? (
        <Alert severity="info">
          No overlays found. Create a new overlay to get started.
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: 1 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Last Triggered</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Success/Failed</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedOverlays
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((overlay) => {
                  const latestTrigger = getLatestTrigger(overlay);
                  const totalSuccess = getTotalSuccessCount(overlay);
                  const totalFailed = getTotalFailedCount(overlay);
                  
                  return (
                    <TableRow 
                      key={overlay.id} 
                      hover 
                      sx={{ 
                        '&:hover': {
                          bgcolor: '#f5f5f5',
                        }
                      }}
                    >
                      <TableCell sx={{ maxWidth: '200px' }}>
                        <Typography noWrap title={overlay.title}>
                          {overlay.title}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: '300px' }}>
                        <Typography noWrap title={overlay.description}>
                          {overlay.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {latestTrigger ? new Date(latestTrigger.triggeredAt).toLocaleString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Chip 
                            label={`Success: ${totalSuccess}`} 
                            color="success" 
                            size="small"
                          />
                          <Chip 
                            label={`Failed: ${totalFailed}`} 
                            color="error" 
                            size="small"
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => handleViewPreview(overlay)}
                          sx={{
                            minWidth: '120px',
                            bgcolor: '#0288d1',
                            '&:hover': {
                              bgcolor: '#01579b',
                            },
                            mr: 1
                          }}
                        >
                          Preview
                        </Button>
                        <Button
                          variant="contained"
                          color="info"
                          size="small"
                          onClick={() => handleViewDetails(overlay)}
                          sx={{
                            minWidth: '120px',
                          }}
                        >
                          See Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={overlays.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              borderTop: '1px solid rgba(224, 224, 224, 1)',
            }}
          />
        </TableContainer>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Overlay Preview</DialogTitle>
        <DialogContent>
          {selectedOverlay && <OverlayPreview config={selectedOverlay} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Overlay Details</DialogTitle>
        <DialogContent>
          {selectedOverlay && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Configuration</Typography>
                  <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="textSecondary">Title</Typography>
                        <Typography>{selectedOverlay.title}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="textSecondary">Description</Typography>
                        <Typography>{selectedOverlay.description}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="textSecondary">Action</Typography>
                        <Typography>{selectedOverlay.actions[0]}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="textSecondary">Created At</Typography>
                        <Typography>{new Date(selectedOverlay.id).toLocaleString()}</Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Trigger History</Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Triggered At</TableCell>
                          <TableCell>Triggered By</TableCell>
                          <TableCell align="right">Success Count</TableCell>
                          <TableCell align="right">Failed Count</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOverlay.triggers?.map((trigger, index) => (
                          <TableRow key={index}>
                            <TableCell>{new Date(trigger.triggeredAt).toLocaleString()}</TableCell>
                            <TableCell>{trigger.triggeredBy}</TableCell>
                            <TableCell align="right">
                              <Chip 
                                label={trigger.successCount} 
                                color="success" 
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Chip 
                                label={trigger.failedCount} 
                                color="error" 
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OverlayListView; 