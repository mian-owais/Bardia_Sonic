import React from 'react';
import { Box, Button } from '@mui/material';

const Dashboard = () => {
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar or Links */}
      <Box sx={{ width: '20%', bgcolor: '#e0e0e0', p: 2 }}>
        <Button>Open PDF 1</Button>
        <Button>Open PDF 2</Button>
      </Box>

      {/* Placeholder for PDF Viewer */}
      <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5' }}>
        {/* Add your static or placeholder content here */}
      </Box>
    </Box>
  );
};

export default Dashboard;