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
  CircularProgress,
  Button,
  Alert
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';

interface AlertMessage {
  messageId: string;
  title: string;
  type: string;
}

interface AlertListResponse {
  messages: AlertMessage[];
  totalCount: number;
}

const AlertCentreList: React.FC = () => {
  console.log('AlertCentreList component mounted');
  
  const [messages, setMessages] = useState<AlertMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const { token, selectedMerchant, selectedCity } = useAuth();
  const navigate = useNavigate();

  const fetchMessages = async () => {
    setLoading(true);
    setError(null);

    // Check if we have the required data
    if (!selectedMerchant || !selectedCity) {
      setError('Please select a merchant and city first');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching messages with params:', { rowsPerPage, page, token: !!token, selectedMerchant, selectedCity });
      const response = await fetch(
        `/api/bpp/driver-offer/${selectedMerchant}/${selectedCity}/message/list?limit=${rowsPerPage}&offset=${page * rowsPerPage}`,
        {
          headers: {
            'Accept': 'application/json;charset=utf-8',
            'token': token || ''
          }
        }
      );

      console.log('Response status:', response.status);
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }

      const data: AlertListResponse = await response.json();
      console.log('Fetched data:', data);
      setMessages(data.messages);
      setTotalCount(data.totalCount);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [page, rowsPerPage, token, selectedMerchant, selectedCity]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = (messageId: string) => {
    console.log('Navigating to message details:', messageId);
    navigate(`/message/${messageId}`, {
      state: {
        token,
        selectedMerchant,
        selectedCity
      }
    });
  };

  if (!selectedMerchant || !selectedCity) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Please select a merchant and city from the top menu to view messages.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Message List
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/alert-centre/create')}
          sx={{
            bgcolor: '#0288d1', // Material-UI's blue[700]
            '&:hover': {
              bgcolor: '#01579b', // Material-UI's blue[900]
            },
            borderRadius: '4px',
            textTransform: 'none',
            px: 3
          }}
        >
          Create Message
        </Button>
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: 1 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Message Id</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Message Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : messages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No messages found
                  </TableCell>
                </TableRow>
              ) : (
                messages.map((message) => (
                  <TableRow 
                    key={message.messageId} 
                    hover 
                    sx={{ 
                      '&:hover': {
                        bgcolor: '#f5f5f5',
                      }
                    }}
                  >
                    <TableCell sx={{ fontFamily: 'monospace' }}>{message.messageId}</TableCell>
                    <TableCell>{message.title}</TableCell>
                    <TableCell>{message.type}</TableCell>
                    <TableCell align="center">
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => handleViewDetails(message.messageId)}
                        sx={{
                          minWidth: '120px',
                          bgcolor: '#0288d1',
                          '&:hover': {
                            bgcolor: '#01579b',
                          }
                        }}
                      >
                        See Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalCount}
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
    </Box>
  );
};

export default AlertCentreList; 