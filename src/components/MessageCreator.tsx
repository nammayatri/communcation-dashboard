import React, { useState, ChangeEvent } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Switch,
  FormControlLabel,
  Chip,
  Paper,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
  FormHelperText,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import Papa from 'papaparse';
import { 
  MessageType, 
//   MessageTranslation, 
  MediaFile, 
//   MessageRequest, 
  MessageSendProgressUpdate,
//   MessageSendResult,
  MessagePayload
} from '../types/message';
import { processCSVAndSendMessages, uploadImages, validateMessagePayload } from '../services/messageService';

// Initial message state
const initialMessageState: MessagePayload = {
  _type: 'Read',
  title: '',
  description: '',
  shortDescription: '',
  translations: [],
  mediaFiles: [],
};

const MessageCreator: React.FC = () => {
  const [message, setMessage] = useState<MessagePayload>(initialMessageState);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [messageType, setMessageType] = useState<MessageType>('Read');
  const [actionLabel, setActionLabel] = useState<string>('');
  const [images, setImages] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<Array<Record<string, string>>>([]);
  const [showCSVPreview, setShowCSVPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<MessageSendProgressUpdate & { percentage: number }>({
    total: 0,
    processed: 0,
    success: 0,
    failed: 0,
    percentage: 0,
  });
  const [failedRecipients, setFailedRecipients] = useState<{ recipient: string; error: string }[]>([]);
  const [showFailedRecipients, setShowFailedRecipients] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleMessageChange = (field: keyof MessagePayload) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setMessage((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSwitchChange = (field: keyof MessagePayload) => (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setMessage((prev) => ({
      ...prev,
      [field]: event.target.checked,
    }));
  };

  const handleMessageTypeChange = (event: any) => {
    const newType = event.target.value as MessageType;
    setMessageType(newType);
    setMessage((prev) => ({
      ...prev,
      _type: newType,
    }));
  };

  const handleActionLabelChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newLabel = event.target.value;
    setActionLabel(newLabel);
    if (messageType === 'Action') {
      setMessage((prev) => ({
        ...prev,
        actionLabel: newLabel,
      }));
    }
  };

  const handleCsvUpload = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setCsvFile(file);
      
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setCsvData(results.data as Array<Record<string, string>>);
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

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
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

  const handleDeleteImage = (index: number) => {
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

  const validateInputs = (): boolean => {
    if (!csvFile) {
      setSnackbar({
        open: true,
        message: 'Please upload a CSV file with recipient information',
        severity: 'error',
      });
      return false;
    }

    const validation = validateMessagePayload(message);
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
      let mediaFiles: MediaFile[] = [];
      
      if (images.length > 0) {
        mediaFiles = await uploadImages(images);
        
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
      const result = await processCSVAndSendMessages(
        csvFile!,
        message,
        (progressUpdate) => {
          setProgress({
            ...progressUpdate,
            percentage: Math.floor((progressUpdate.processed / progressUpdate.total) * 100)
          });
        }
      );
      
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
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: `Error: ${error.message}`,
        severity: 'error',
      });
    } finally {
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
  }, {} as Record<string, string[]>);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Message Creator
      </Typography>
      
      <Grid container spacing={3}>
        {/* Message Configuration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Message Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="message-type-label">Message Type</InputLabel>
                    <Select
                      labelId="message-type-label"
                      value={messageType}
                      label="Message Type"
                      onChange={handleMessageTypeChange}
                    >
                      <MenuItem value="Read">Read</MenuItem>
                      <MenuItem value="Action">Action</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                {messageType === 'Action' && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Action Label"
                      value={actionLabel}
                      onChange={handleActionLabelChange}
                      required
                      margin="normal"
                    />
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Title"
                    value={message.title}
                    onChange={handleMessageChange('title')}
                    required
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={3}
                    value={message.description}
                    onChange={handleMessageChange('description')}
                    required
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Short Description"
                    value={message.shortDescription}
                    onChange={handleMessageChange('shortDescription')}
                    required
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Label (Optional)"
                    value={message.label || ''}
                    onChange={handleMessageChange('label')}
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!!message.alwaysTriggerOnOnboarding}
                        onChange={handleSwitchChange('alwaysTriggerOnOnboarding')}
                      />
                    }
                    label="Always Trigger On Onboarding"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Media Upload and Recipients */}
        <Grid item xs={12} md={6}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Media Attachments
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="image-upload"
                      type="file"
                      multiple
                      onChange={handleImageUpload}
                    />
                    <label htmlFor="image-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<CloudUploadIcon />}
                      >
                        Upload Images
                      </Button>
                    </label>
                  </Box>
                  
                  {previewImages.length > 0 && (
                    <Grid container spacing={1} sx={{ mt: 2 }}>
                      {previewImages.map((preview, index) => (
                        <Grid item xs={4} key={index}>
                          <Box
                            sx={{
                              position: 'relative',
                              width: '100%',
                              paddingTop: '100%', // 1:1 Aspect Ratio
                              borderRadius: 1,
                              overflow: 'hidden',
                              border: '1px solid #eee',
                            }}
                          >
                            <Box
                              component="img"
                              src={preview}
                              alt={`Uploaded ${index + 1}`}
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                            <IconButton
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                bgcolor: 'rgba(255, 255, 255, 0.7)',
                                '&:hover': {
                                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                                },
                              }}
                              onClick={() => handleDeleteImage(index)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          <Typography variant="caption" display="block" sx={{ mt: 0.5, textAlign: 'center' }}>
                            {images[index]?.name}
                          </Typography>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recipients
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <input
                      accept=".csv"
                      style={{ display: 'none' }}
                      id="csv-upload"
                      type="file"
                      onChange={handleCsvUpload}
                    />
                    <label htmlFor="csv-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<CloudUploadIcon />}
                        sx={{ mr: 2 }}
                      >
                        Upload Recipients CSV
                      </Button>
                    </label>
                    {csvFile && (
                      <>
                        <Chip
                          label={csvFile.name}
                          onDelete={() => setCsvFile(null)}
                          sx={{ mr: 1 }}
                        />
                        <Button 
                          size="small" 
                          onClick={() => setShowCSVPreview(true)}
                          sx={{ mt: 1 }}
                        >
                          Preview Data
                        </Button>
                      </>
                    )}
                  </Box>
                  
                  {csvFile && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        {csvData.length} recipients found in the CSV file.
                      </Typography>
                      <FormHelperText>
                        The CSV should contain email or user identifier columns.
                      </FormHelperText>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
        
        {/* Processing Status */}
        {isProcessing && (
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3, mt: 2, mb: 2, backgroundColor: 'rgba(245, 245, 245, 0.9)' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                {isUploading ? 'Uploading Images' : 'Processing Messages'}
                <Chip 
                  label={`${progress.percentage}%`} 
                  color="primary" 
                  sx={{ ml: 2, fontWeight: 'bold' }} 
                  size="small"
                />
              </Typography>
              
              <LinearProgress 
                variant="determinate" 
                value={progress.percentage} 
                sx={{ 
                  height: 10, 
                  borderRadius: 5,
                  mb: 2,
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 5
                  }
                }} 
              />
              
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-around', 
                alignItems: 'center',
                mt: 1
              }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Total
                  </Typography>
                  <Chip 
                    label={progress.total} 
                    variant="outlined" 
                    sx={{ minWidth: '80px' }}
                  />
                </Box>
                
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Success
                  </Typography>
                  <Chip 
                    label={progress.success} 
                    color="success" 
                    sx={{ minWidth: '80px' }}
                  />
                </Box>
                
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Failed
                  </Typography>
                  <Chip 
                    label={progress.failed} 
                    color="error"
                    sx={{ minWidth: '80px' }}
                  />
                </Box>
                
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Processed
                  </Typography>
                  <Chip 
                    label={`${progress.processed}/${progress.total}`}
                    color="primary"
                    variant="outlined"
                    sx={{ minWidth: '80px' }}
                  />
                </Box>
              </Box>
            </Paper>
          </Grid>
        )}
        
        {/* Submit Button */}
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleSubmit}
            disabled={isProcessing}
            sx={{ py: 1.5 }}
          >
            {isProcessing ? 'Sending Messages...' : 'Send Messages'}
          </Button>
        </Grid>
      </Grid>
      
      {/* CSV Preview Dialog */}
      <Dialog
        open={showCSVPreview}
        onClose={() => setShowCSVPreview(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>CSV Data Preview</DialogTitle>
        <DialogContent dividers>
          {csvData.length > 0 && (
            <Box sx={{ overflow: 'auto', maxHeight: '400px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {Object.keys(csvData[0]).map((header, index) => (
                      <th key={index} style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvData.slice(0, 10).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {Object.values(row).map((cell, cellIndex) => (
                        <td key={cellIndex} style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {csvData.length > 10 && (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 2, textAlign: 'center' }}>
                  Showing first 10 of {csvData.length} records
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCSVPreview(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Failed Recipients Dialog */}
      <Dialog
        open={showFailedRecipients}
        onClose={() => setShowFailedRecipients(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#f8f8f8', borderBottom: '1px solid #eee' }}>
          <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
            Message Results Summary
            {progress.failed > 0 && (
              <Chip 
                label={`${progress.failed} Failed`} 
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
                label={`Total: ${progress.total}`} 
                variant="outlined" 
                icon={<span style={{ marginLeft: '8px' }}>📊</span>}
              />
              <Chip 
                label={`Success: ${progress.success}`} 
                color="success" 
                variant="outlined"
                icon={<span style={{ marginLeft: '8px' }}>✅</span>}
              />
              <Chip 
                label={`Failed: ${progress.failed}`} 
                color="error" 
                variant="outlined"
                icon={<span style={{ marginLeft: '8px' }}>❌</span>}
              />
              <Chip 
                label={`Success Rate: ${Math.round((progress.success / progress.total) * 100)}%`} 
                color={progress.success > progress.failed ? "success" : "error"}
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
              {Object.entries(groupedErrors).map(([error, recipients], index) => (
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
                      label={`${recipients.length} recipient${recipients.length > 1 ? 's' : ''}`} 
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
                      {recipients.map((recipient, recipientIndex) => (
                        <ListItem 
                          key={recipientIndex} 
                          divider={recipientIndex < recipients.length - 1}
                          sx={{ 
                            py: 0.5,
                            bgcolor: recipientIndex % 2 === 0 ? 'transparent' : '#f9f9f9'
                          }}
                        >
                          <ListItemText 
                            primary={recipient}
                            primaryTypographyProps={{
                              variant: 'body2'
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
                All messages sent successfully!
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {progress.total} messages were processed without any errors.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #eee', p: 2 }}>
          <Button 
            onClick={() => setShowFailedRecipients(false)}
            variant="contained"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
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

export default MessageCreator; 