import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Box,
  TablePagination,
  CircularProgress
} from '@mui/material';
import { Message, MessageListResponse } from '../types/message';
import { useAuth } from '../contexts/AuthContext';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import InfoIcon from '@mui/icons-material/Info';

const MessageList: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const { token, selectedMerchant, selectedCity } = useAuth();
  const navigate = useNavigate();

  const fetchMessages = async () => {
    if (!token || !selectedMerchant || !selectedCity) {
      setError('Missing required authentication information');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/bpp/driver-offer/${selectedMerchant}/${selectedCity}/message/list?limit=${rowsPerPage}&offset=${page * rowsPerPage}`,
        {
          headers: {
            'Accept': 'application/json;charset=utf-8',
            'token': token
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data: MessageListResponse = await response.json();
      console.log('Fetched messages:', data);
      setMessages(data.messages || []);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setMessages([]);
      setTotalCount(0);
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
    navigate(`/message/${messageId}`);
  };

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 3,
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'auto'
    }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Message List
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/alert-centre/create')}
        >
          Create Message
        </Button>
      </Box>

      <TableContainer 
        component={Paper} 
        sx={{ 
          mb: 3,
          '& .MuiTable-root': {
            minWidth: 650,
          }
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Push Notification description</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
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
                <TableRow key={message.messageId}>
                  <TableCell>{message.title}</TableCell>
                  <TableCell>{message.shortDescription}</TableCell>
                  <TableCell>{new Date(message.createdAt).toLocaleString()}</TableCell>
                  <TableCell align="center">
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleViewDetails(message.messageId)}
                      startIcon={<InfoIcon />}
                      size="small"
                    >
                      See Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
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
          '& .MuiTablePagination-displayedRows': {
            minWidth: '120px',
            textAlign: 'left'
          }
        }}
      />
    </Box>
  );
};

export default MessageList; 