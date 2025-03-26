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

const MessageList: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const { token } = useAuth();
  const navigate = useNavigate();

  const fetchMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/bpp/driver-offer/NAMMA_YATRI_PARTNER/message/list?limit=${rowsPerPage}&offset=${page * rowsPerPage}`,
        {
          headers: {
            'Accept': 'application/json;charset=utf-8',
            'token': token || ''
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data: MessageListResponse = await response.json();
      setMessages(data.messages);
      setTotalCount(data.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [page, rowsPerPage, token]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Message List
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/create-message')}
        >
          Create Message
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Message Id</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Message Type</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : messages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  No messages found
                </TableCell>
              </TableRow>
            ) : (
              messages.map((message) => (
                <TableRow key={message.messageId}>
                  <TableCell>{message.messageId}</TableCell>
                  <TableCell>{message.title}</TableCell>
                  <TableCell>{message.type}</TableCell>
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
        />
      </TableContainer>
    </Box>
  );
};

export default MessageList; 