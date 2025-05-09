import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Stack, Button, IconButton, Tooltip, CircularProgress, LinearProgress, Alert } from '@mui/material';
import { Delete, PlayArrow, CloudUpload } from '@mui/icons-material';
import { motion } from 'framer-motion';
import PDFUpload from '../upload/PDFUpload';
import PDFAudioPlayer from '../player/PDFAudioPlayer';
import { uploadPDF, getPDFDocuments, deletePDFDocument, convertPDFToAudio, getPDFDocumentById } from '../../services/pdfService';
import PDFViewer from '../viewer/PDFViewer';

const MotionCard = motion(Card);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(undefined);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [convertingDocId, setConvertingDocId] = useState(null);
  const [convertProgress, setConvertProgress] = useState(0);
  const [convertError, setConvertError] = useState(null);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfToView, setPdfToView] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const docs = await getPDFDocuments();
      setDocuments(docs);
      console.log('Fetched documents:', docs); // Debug log
    } catch (error) {
      console.error('Error fetching documents:', error);
      setConvertError('Failed to load documents.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (file) => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(undefined);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const { documentId } = await uploadPDF(file);
      clearInterval(progressInterval);
      setUploadProgress(100);

      const fullDocument = await getPDFDocumentById(documentId);
      setDocuments([...documents, fullDocument]);

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload file. Please try again.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deletePDFDocument(id);
      setDocuments((docs) => docs.filter((doc) => doc._id !== id));
      if (selectedDocument?._id === id) {
        setSelectedDocument(null);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      setConvertError('Failed to delete document.');
    }
  };

  const handleConvert = async (id) => {
    try {
      setConvertingDocId(id);
      setConvertProgress(0);
      setConvertError(null);

      // Start progress animation
      const progressInterval = setInterval(() => {
        setConvertProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 1000);

      const response = await convertPDFToAudio(id);
      console.log('Conversion response:', response); // Debug log
      
      // Clear the progress interval and set to 100% when conversion is complete
      clearInterval(progressInterval);
      setConvertProgress(100);

      if (!response.success) {
        throw new Error(response.error || 'Conversion failed');
      }

      const updatedDoc = response.document;
      console.log('Updated document:', updatedDoc);

      // Defensive: check for audioUrl and url
      if (!updatedDoc.audioUrl && !(updatedDoc.audioChunks && updatedDoc.audioChunks[0]?.url)) {
        setConvertError('Conversion succeeded but no audio file was generated.');
        return;
      }
      if (!updatedDoc.url) {
        setConvertError('Conversion succeeded but PDF file URL is missing.');
        return;
      }

      // Update the document in the state
      setDocuments((docs) =>
        docs.map((doc) => (doc._id === id ? updatedDoc : doc))
      );
      if (selectedDocument?._id === id) {
        setSelectedDocument(updatedDoc);
      }

      // Keep the progress at 100% for a moment before resetting
      setTimeout(() => {
        setConvertingDocId(null);
        setConvertProgress(0);
      }, 2000);
    } catch (error) {
      console.error('Error converting document:', error);
      setConvertError('Failed to convert PDF to audio: ' + (error.message || error));
      setConvertingDocId(null);
      setConvertProgress(0);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (selectedDocument) {
    const audioUrl = selectedDocument.audioUrl 
      ? (selectedDocument.audioUrl.startsWith('http') 
          ? selectedDocument.audioUrl 
          : `${API_URL}${selectedDocument.audioUrl}`)
      : (selectedDocument.audioChunks && selectedDocument.audioChunks[0]?.url
          ? (selectedDocument.audioChunks[0].url.startsWith('http')
              ? selectedDocument.audioChunks[0].url
              : `${API_URL}${selectedDocument.audioChunks[0].url}`)
          : null);

    console.log('Selected document:', selectedDocument); // Debug log
    console.log('Constructed audioUrl:', audioUrl); // Debug log

    return (
      <PDFAudioPlayer 
        pdfUrl={selectedDocument.url} 
        audioUrl={audioUrl} 
      />
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={4}>
        <Typography variant="h4" component="h1">
          PDF to Audio Converter
        </Typography>

        {convertError && (
          <Alert severity="error">{convertError}</Alert>
        )}

        <PDFUpload
          onUpload={handleUpload}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          uploadError={uploadError}
        />

        <Grid container spacing={3}>
          {documents.map((document, idx) => {
            const key = document._id || `fallback-key-${idx}`;
            if (!document._id) {
              console.warn('Document missing _id:', document);
            }
            return (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <MotionCard
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -5 }}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Stack spacing={2}>
                      <Typography variant="h6" noWrap>
                        {document.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Uploaded: {
                          document.uploadDate && !isNaN(new Date(document.uploadDate))
                            ? new Date(document.uploadDate).toLocaleDateString()
                            : (document.createdAt && !isNaN(new Date(document.createdAt))
                                ? new Date(document.createdAt).toLocaleDateString()
                                : 'Unknown Date')
                        }
                      </Typography>
                      {convertingDocId === document._id && (
                        <Box sx={{ width: '100%' }}>
                          <LinearProgress variant="determinate" value={convertProgress} />
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Converting... {convertProgress}%
                          </Typography>
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View PDF">
                          <span>
                            <Button
                              variant="outlined"
                              onClick={() => { setPdfToView(document.url); setPdfViewerOpen(true); }}
                              disabled={!document.url}
                            >
                              View
                            </Button>
                          </span>
                        </Tooltip>
                        <Tooltip title="Play">
                          <span>
                            <Button
                              variant="contained"
                              startIcon={<PlayArrow />}
                              onClick={() => setSelectedDocument(document)}
                              disabled={!(document.audioUrl || (document.audioChunks && document.audioChunks[0]?.url)) || convertingDocId === document._id}
                            >
                              Play
                            </Button>
                          </span>
                        </Tooltip>
                        {!document.audioUrl && (
                          <Tooltip title="Convert">
                            <span>
                              <Button
                                variant="outlined"
                                startIcon={<CloudUpload />}
                                onClick={() => handleConvert(document._id)}
                                disabled={!!convertingDocId}
                              >
                                Convert
                              </Button>
                            </span>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete">
                          <span>
                            <IconButton
                              onClick={() => handleDelete(document._id)}
                              sx={{ ml: 'auto' }}
                              disabled={!!convertingDocId}
                            >
                              <Delete />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </Stack>
                  </CardContent>
                </MotionCard>
              </Grid>
            );
          })}
        </Grid>
      </Stack>
      {/* PDF Viewer Modal */}
      {pdfViewerOpen && pdfToView && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', bgcolor: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ width: '80vw', height: '90vh', bgcolor: 'white', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
            <Button onClick={() => setPdfViewerOpen(false)} sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>Close</Button>
            <PDFViewer pdfUrl={pdfToView} />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Dashboard;