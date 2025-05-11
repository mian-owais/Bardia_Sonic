import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Box, Typography, Button } from '@mui/material';

// Set the worker source for pdfjs
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PDFViewer = () => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null); // State for the selected PDF
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  return (
    <Box sx={{ height: '100vh', p: 3, bgcolor: '#f5f5f5' }}>
      {pdfUrl ? (
        <Box>
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<Typography>Loading PDF...</Typography>}
            error={<Typography color="error">Failed to load PDF.</Typography>}
          >
            <Page pageNumber={pageNumber} />
          </Document>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button onClick={() => setPageNumber(p => Math.max(p - 1, 1))} disabled={pageNumber <= 1}>
              Previous
            </Button>
            <Typography sx={{ mx: 2 }}>
              Page {pageNumber} of {numPages}
            </Typography>
            <Button onClick={() => setPageNumber(p => Math.min(p + 1, numPages))} disabled={pageNumber >= numPages}>
              Next
            </Button>
          </Box>
        </Box>
      ) : (
        <Typography>Select a PDF to view</Typography>
      )}
    </Box>
  );
};

export default PDFViewer;


