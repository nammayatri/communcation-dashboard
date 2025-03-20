import { useState } from 'react';
import { Container, CssBaseline, ThemeProvider, createTheme, Box } from '@mui/material';
import OverlayCreator from './components/OverlayCreator';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#E64A19',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        minHeight: '100vh',
        bgcolor: 'background.default',
        py: 4
      }}>
        <Container maxWidth="xl">
          <OverlayCreator />
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App; 