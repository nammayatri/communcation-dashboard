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
const Delete_1 = __importDefault(require("@mui/icons-material/Delete"));
const papaparse_1 = __importDefault(require("papaparse"));
const messageService_1 = require("../services/messageService");
// Initial message state
const initialMessageState = {
    _type: 'Read',
    title: '',
    description: '',
    shortDescription: '',
    translations: [],
    mediaFiles: [],
};
const MessageCreator = () => {
    const [message, setMessage] = (0, react_1.useState)(initialMessageState);
    const [csvFile, setCsvFile] = (0, react_1.useState)(null);
    const [messageType, setMessageType] = (0, react_1.useState)('Read');
    const [actionLabel, setActionLabel] = (0, react_1.useState)('');
    const [images, setImages] = (0, react_1.useState)([]);
    const [previewImages, setPreviewImages] = (0, react_1.useState)([]);
    const [csvData, setCsvData] = (0, react_1.useState)([]);
    const [showCSVPreview, setShowCSVPreview] = (0, react_1.useState)(false);
    const [isProcessing, setIsProcessing] = (0, react_1.useState)(false);
    const [isUploading, setIsUploading] = (0, react_1.useState)(false);
    const [progress, setProgress] = (0, react_1.useState)({
        total: 0,
        processed: 0,
        success: 0,
        failed: 0,
        percentage: 0,
    });
    const [failedRecipients, setFailedRecipients] = (0, react_1.useState)([]);
    const [showFailedRecipients, setShowFailedRecipients] = (0, react_1.useState)(false);
    const [snackbar, setSnackbar] = (0, react_1.useState)({
        open: false,
        message: '',
        severity: 'success',
    });
    const handleMessageChange = (field) => (event) => {
        setMessage((prev) => ({
            ...prev,
            [field]: event.target.value,
        }));
    };
    const handleSwitchChange = (field) => (event) => {
        setMessage((prev) => ({
            ...prev,
            [field]: event.target.checked,
        }));
    };
    const handleMessageTypeChange = (event) => {
        const newType = event.target.value;
        setMessageType(newType);
        setMessage((prev) => ({
            ...prev,
            _type: newType,
        }));
    };
    const handleActionLabelChange = (event) => {
        const newLabel = event.target.value;
        setActionLabel(newLabel);
        if (messageType === 'Action') {
            setMessage((prev) => ({
                ...prev,
                actionLabel: newLabel,
            }));
        }
    };
    const handleCsvUpload = (event) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setCsvFile(file);
            papaparse_1.default.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    setCsvData(results.data);
                },
                error: (error) => {
                    setSnackbar({
                        open: true,
                        message: `CSV parsing error: ${error.message}`,
                        severity: 'error',
                    });
                }
            });
        }
    };
    const handleImageUpload = (event) => {
        if (event.target.files) {
            const newFiles = Array.from(event.target.files);
            // Generate preview URLs for the images
            const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
            setImages(prevImages => [...prevImages, ...newFiles]);
            setPreviewImages(prevPreviews => [...prevPreviews, ...newPreviewUrls]);
            // In a real implementation, we would upload the images to the server
            // For now, just create mock file objects
            const newMediaFiles = newFiles.map(file => ({
                id: Math.random().toString(36).substring(2, 11),
                name: file.name,
                size: file.size,
                url: URL.createObjectURL(file)
            }));
            setMessage(prev => ({
                ...prev,
                mediaFiles: [...prev.mediaFiles, ...newMediaFiles]
            }));
        }
    };
    const handleDeleteImage = (index) => {
        // Release the object URL to avoid memory leaks
        URL.revokeObjectURL(previewImages[index]);
        // Remove the image from state
        setPreviewImages(prev => prev.filter((_, i) => i !== index));
        setImages(prev => prev.filter((_, i) => i !== index));
        // Remove from message payload
        setMessage(prev => ({
            ...prev,
            mediaFiles: prev.mediaFiles.filter((_, i) => i !== index)
        }));
    };
    const validateInputs = () => {
        if (!csvFile) {
            setSnackbar({
                open: true,
                message: 'Please upload a CSV file with recipient information',
                severity: 'error',
            });
            return false;
        }
        const validation = (0, messageService_1.validateMessagePayload)(message);
        if (!validation.valid) {
            setSnackbar({
                open: true,
                message: `Validation errors: ${validation.errors.join(', ')}`,
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
        setProgress({
            total: csvData.length,
            processed: 0,
            success: 0,
            failed: 0,
            percentage: 0,
        });
        setSnackbar({
            open: true,
            message: 'Uploading images...',
            severity: 'info',
        });
        try {
            // Step 1: Upload images (in a real implementation)
            setIsUploading(true);
            let mediaFiles = [];
            if (images.length > 0) {
                mediaFiles = await (0, messageService_1.uploadImages)(images);
                // Update message with uploaded file IDs
                setMessage(prev => ({
                    ...prev,
                    mediaFiles
                }));
            }
            setIsUploading(false);
            setSnackbar({
                open: true,
                message: 'Processing messages...',
                severity: 'info',
            });
            // Step 2: Process CSV and send messages
            const result = await (0, messageService_1.processCSVAndSendMessages)(csvFile, message, (progressUpdate) => {
                setProgress({
                    ...progressUpdate,
                    percentage: Math.floor((progressUpdate.processed / progressUpdate.total) * 100)
                });
            });
            // Convert email field to recipient for compatibility
            const formattedFailedRecipients = result.failedRecipients.map(item => ({
                recipient: item.email,
                error: item.error
            }));
            setFailedRecipients(formattedFailedRecipients);
            const resultMessage = `Successfully sent ${result.success} messages. Failed: ${result.failed}`;
            setSnackbar({
                open: true,
                message: resultMessage,
                severity: result.failed > 0 ? 'error' : 'success',
            });
            if (result.failed > 0) {
                setShowFailedRecipients(true);
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
            setIsUploading(false);
        }
    };
    // Group errors by type for the failed recipients
    const groupedErrors = failedRecipients.reduce((acc, curr) => {
        if (!acc[curr.error]) {
            acc[curr.error] = [];
        }
        acc[curr.error].push(curr.recipient);
        return acc;
    }, {});
    return (<material_1.Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <material_1.Typography variant="h4" component="h1" gutterBottom>
        Message Creator
      </material_1.Typography>
      
      <material_1.Grid container spacing={3}>
        {/* Message Configuration */}
        <material_1.Grid item xs={12} md={6}>
          <material_1.Card>
            <material_1.CardContent>
              <material_1.Typography variant="h6" gutterBottom>
                Message Details
              </material_1.Typography>
              <material_1.Grid container spacing={2}>
                <material_1.Grid item xs={12}>
                  <material_1.FormControl fullWidth margin="normal">
                    <material_1.InputLabel id="message-type-label">Message Type</material_1.InputLabel>
                    <material_1.Select labelId="message-type-label" value={messageType} label="Message Type" onChange={handleMessageTypeChange}>
                      <material_1.MenuItem value="Read">Read</material_1.MenuItem>
                      <material_1.MenuItem value="Action">Action</material_1.MenuItem>
                    </material_1.Select>
                  </material_1.FormControl>
                </material_1.Grid>
                
                {messageType === 'Action' && (<material_1.Grid item xs={12}>
                    <material_1.TextField fullWidth label="Action Label" value={actionLabel} onChange={handleActionLabelChange} required margin="normal"/>
                  </material_1.Grid>)}
                
                <material_1.Grid item xs={12}>
                  <material_1.TextField fullWidth label="Title" value={message.title} onChange={handleMessageChange('title')} required margin="normal"/>
                </material_1.Grid>
                
                <material_1.Grid item xs={12}>
                  <material_1.TextField fullWidth label="Description" multiline rows={3} value={message.description} onChange={handleMessageChange('description')} required margin="normal"/>
                </material_1.Grid>
                
                <material_1.Grid item xs={12}>
                  <material_1.TextField fullWidth label="Push Notification description" value={message.shortDescription} onChange={handleMessageChange('shortDescription')} required margin="normal"/>
                </material_1.Grid>
                
                <material_1.Grid item xs={12}>
                  <material_1.TextField fullWidth label="Label (Optional)" value={message.label || ''} onChange={handleMessageChange('label')} margin="normal"/>
                </material_1.Grid>
                
                <material_1.Grid item xs={12}>
                  <material_1.FormControlLabel control={<material_1.Switch checked={!!message.alwaysTriggerOnOnboarding} onChange={handleSwitchChange('alwaysTriggerOnOnboarding')}/>} label="Always Trigger On Onboarding"/>
                </material_1.Grid>
              </material_1.Grid>
            </material_1.CardContent>
          </material_1.Card>
        </material_1.Grid>
        
        {/* Media Upload and Recipients */}
        <material_1.Grid item xs={12} md={6}>
          <material_1.Grid container spacing={3}>
            <material_1.Grid item xs={12}>
              <material_1.Card>
                <material_1.CardContent>
                  <material_1.Typography variant="h6" gutterBottom>
                    Media Attachments
                  </material_1.Typography>
                  <material_1.Box sx={{ mb: 2 }}>
                    <input accept="image/*" style={{ display: 'none' }} id="image-upload" type="file" multiple onChange={handleImageUpload}/>
                    <label htmlFor="image-upload">
                      <material_1.Button variant="outlined" component="span" startIcon={<CloudUpload_1.default />}>
                        Upload Images
                      </material_1.Button>
                    </label>
                  </material_1.Box>
                  
                  {previewImages.length > 0 && (<material_1.Grid container spacing={1} sx={{ mt: 2 }}>
                      {previewImages.map((preview, index) => (<material_1.Grid item xs={4} key={index}>
                          <material_1.Box sx={{
                    position: 'relative',
                    width: '100%',
                    paddingTop: '100%', // 1:1 Aspect Ratio
                    borderRadius: 1,
                    overflow: 'hidden',
                    border: '1px solid #eee',
                }}>
                            <material_1.Box component="img" src={preview} alt={`Uploaded ${index + 1}`} sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                }}/>
                            <material_1.IconButton size="small" sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    bgcolor: 'rgba(255, 255, 255, 0.7)',
                    '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                    },
                }} onClick={() => handleDeleteImage(index)}>
                              <Delete_1.default fontSize="small"/>
                            </material_1.IconButton>
                          </material_1.Box>
                          <material_1.Typography variant="caption" display="block" sx={{ mt: 0.5, textAlign: 'center' }}>
                            {images[index]?.name}
                          </material_1.Typography>
                        </material_1.Grid>))}
                    </material_1.Grid>)}
                </material_1.CardContent>
              </material_1.Card>
            </material_1.Grid>
            
            <material_1.Grid item xs={12}>
              <material_1.Card>
                <material_1.CardContent>
                  <material_1.Typography variant="h6" gutterBottom>
                    Recipients
                  </material_1.Typography>
                  <material_1.Box sx={{ mb: 2 }}>
                    <input accept=".csv" style={{ display: 'none' }} id="csv-upload" type="file" onChange={handleCsvUpload}/>
                    <label htmlFor="csv-upload">
                      <material_1.Button variant="outlined" component="span" startIcon={<CloudUpload_1.default />} sx={{ mr: 2 }}>
                        Upload Recipients CSV
                      </material_1.Button>
                    </label>
                    {csvFile && (<>
                        <material_1.Chip label={csvFile.name} onDelete={() => setCsvFile(null)} sx={{ mr: 1 }}/>
                        <material_1.Button size="small" onClick={() => setShowCSVPreview(true)} sx={{ mt: 1 }}>
                          Preview Data
                        </material_1.Button>
                      </>)}
                  </material_1.Box>
                  
                  {csvFile && (<material_1.Box sx={{ mt: 2 }}>
                      <material_1.Typography variant="body2" gutterBottom>
                        {csvData.length} recipients found in the CSV file.
                      </material_1.Typography>
                      <material_1.FormHelperText>
                        The CSV should contain email or user identifier columns.
                      </material_1.FormHelperText>
                    </material_1.Box>)}
                </material_1.CardContent>
              </material_1.Card>
            </material_1.Grid>
          </material_1.Grid>
        </material_1.Grid>
        
        {/* Processing Status */}
        {isProcessing && (<material_1.Grid item xs={12}>
            <material_1.Paper elevation={3} sx={{ p: 3, mt: 2, mb: 2, backgroundColor: 'rgba(245, 245, 245, 0.9)' }}>
              <material_1.Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                {isUploading ? 'Uploading Images' : 'Processing Messages'}
                <material_1.Chip label={`${progress.percentage}%`} color="primary" sx={{ ml: 2, fontWeight: 'bold' }} size="small"/>
              </material_1.Typography>
              
              <material_1.LinearProgress variant="determinate" value={progress.percentage} sx={{
                height: 10,
                borderRadius: 5,
                mb: 2,
                '& .MuiLinearProgress-bar': {
                    borderRadius: 5
                }
            }}/>
              
              <material_1.Box sx={{
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                mt: 1
            }}>
                <material_1.Box sx={{ textAlign: 'center' }}>
                  <material_1.Typography variant="body2" color="textSecondary" gutterBottom>
                    Total
                  </material_1.Typography>
                  <material_1.Chip label={progress.total} variant="outlined" sx={{ minWidth: '80px' }}/>
                </material_1.Box>
                
                <material_1.Box sx={{ textAlign: 'center' }}>
                  <material_1.Typography variant="body2" color="textSecondary" gutterBottom>
                    Success
                  </material_1.Typography>
                  <material_1.Chip label={progress.success} color="success" sx={{ minWidth: '80px' }}/>
                </material_1.Box>
                
                <material_1.Box sx={{ textAlign: 'center' }}>
                  <material_1.Typography variant="body2" color="textSecondary" gutterBottom>
                    Failed
                  </material_1.Typography>
                  <material_1.Chip label={progress.failed} color="error" sx={{ minWidth: '80px' }}/>
                </material_1.Box>
                
                <material_1.Box sx={{ textAlign: 'center' }}>
                  <material_1.Typography variant="body2" color="textSecondary" gutterBottom>
                    Processed
                  </material_1.Typography>
                  <material_1.Chip label={`${progress.processed}/${progress.total}`} color="primary" variant="outlined" sx={{ minWidth: '80px' }}/>
                </material_1.Box>
              </material_1.Box>
            </material_1.Paper>
          </material_1.Grid>)}
        
        {/* Submit Button */}
        <material_1.Grid item xs={12}>
          <material_1.Button variant="contained" color="primary" size="large" onClick={handleSubmit} disabled={isProcessing} sx={{ py: 1.5 }}>
            {isProcessing ? 'Sending Messages...' : 'Send Messages'}
          </material_1.Button>
        </material_1.Grid>
      </material_1.Grid>
      
      {/* CSV Preview Dialog */}
      <material_1.Dialog open={showCSVPreview} onClose={() => setShowCSVPreview(false)} maxWidth="md" fullWidth>
        <material_1.DialogTitle>CSV Data Preview</material_1.DialogTitle>
        <material_1.DialogContent dividers>
          {csvData.length > 0 && (<material_1.Box sx={{ overflow: 'auto', maxHeight: '400px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {Object.keys(csvData[0]).map((header, index) => (<th key={index} style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>
                        {header}
                      </th>))}
                  </tr>
                </thead>
                <tbody>
                  {csvData.slice(0, 10).map((row, rowIndex) => (<tr key={rowIndex}>
                      {Object.values(row).map((cell, cellIndex) => (<td key={cellIndex} style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                          {cell}
                        </td>))}
                    </tr>))}
                </tbody>
              </table>
              {csvData.length > 10 && (<material_1.Typography variant="body2" color="textSecondary" sx={{ mt: 2, textAlign: 'center' }}>
                  Showing first 10 of {csvData.length} records
                </material_1.Typography>)}
            </material_1.Box>)}
        </material_1.DialogContent>
        <material_1.DialogActions>
          <material_1.Button onClick={() => setShowCSVPreview(false)}>Close</material_1.Button>
        </material_1.DialogActions>
      </material_1.Dialog>
      
      {/* Failed Recipients Dialog */}
      <material_1.Dialog open={showFailedRecipients} onClose={() => setShowFailedRecipients(false)} maxWidth="md" fullWidth>
        <material_1.DialogTitle sx={{ bgcolor: '#f8f8f8', borderBottom: '1px solid #eee' }}>
          <material_1.Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
            Message Results Summary
            {progress.failed > 0 && (<material_1.Chip label={`${progress.failed} Failed`} color="error" size="small" sx={{ ml: 2 }}/>)}
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
              <material_1.Chip label={`Total: ${progress.total}`} variant="outlined" icon={<span style={{ marginLeft: '8px' }}>📊</span>}/>
              <material_1.Chip label={`Success: ${progress.success}`} color="success" variant="outlined" icon={<span style={{ marginLeft: '8px' }}>✅</span>}/>
              <material_1.Chip label={`Failed: ${progress.failed}`} color="error" variant="outlined" icon={<span style={{ marginLeft: '8px' }}>❌</span>}/>
              <material_1.Chip label={`Success Rate: ${Math.round((progress.success / progress.total) * 100)}%`} color={progress.success > progress.failed ? "success" : "error"} icon={<span style={{ marginLeft: '8px' }}>📈</span>}/>
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
              {Object.entries(groupedErrors).map(([error, recipients], index) => (<material_1.Paper key={index} elevation={2} sx={{ p: 2, mb: 3, borderLeft: '4px solid #f44336' }}>
                  <material_1.Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1
                }}>
                    <material_1.Typography variant="subtitle1" color="error" sx={{ fontWeight: 'medium' }}>
                      {error}
                    </material_1.Typography>
                    <material_1.Chip label={`${recipients.length} recipient${recipients.length > 1 ? 's' : ''}`} color="error" size="small" variant="outlined"/>
                  </material_1.Box>
                  <material_1.Box sx={{
                    maxHeight: '150px',
                    overflow: 'auto',
                    border: '1px solid #eee',
                    borderRadius: 1,
                    mt: 1
                }}>
                    <material_1.List dense disablePadding>
                      {recipients.map((recipient, recipientIndex) => (<material_1.ListItem key={recipientIndex} divider={recipientIndex < recipients.length - 1} sx={{
                        py: 0.5,
                        bgcolor: recipientIndex % 2 === 0 ? 'transparent' : '#f9f9f9'
                    }}>
                          <material_1.ListItemText primary={recipient} primaryTypographyProps={{
                        variant: 'body2'
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
                All messages sent successfully!
              </material_1.Typography>
              <material_1.Typography variant="body2" color="textSecondary">
                {progress.total} messages were processed without any errors.
              </material_1.Typography>
            </material_1.Box>)}
        </material_1.DialogContent>
        <material_1.DialogActions sx={{ borderTop: '1px solid #eee', p: 2 }}>
          <material_1.Button onClick={() => setShowFailedRecipients(false)} variant="contained">
            Close
          </material_1.Button>
        </material_1.DialogActions>
      </material_1.Dialog>
      
      {/* Snackbar for notifications */}
      <material_1.Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <material_1.Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </material_1.Alert>
      </material_1.Snackbar>
    </material_1.Box>);
};
exports.default = MessageCreator;
