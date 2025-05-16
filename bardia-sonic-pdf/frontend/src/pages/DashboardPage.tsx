import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Spinner, Modal, Badge, InputGroup, ProgressBar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import pdfService, { PDF } from '../services/pdfService';

const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [pdfToDelete, setPdfToDelete] = useState<PDF | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Fetch PDFs on component mount
  useEffect(() => {
    fetchData();
  }, []);
  
  // Fetch PDF data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      try {
        // Fetch PDFs from API
        console.log("Attempting to fetch PDFs from API");
        const data = await pdfService.getAllPdfs();
        console.log("API Response:", data);
        setPdfs(data);
        setLoading(false);
        setError(null);
      } catch (error) {
        console.error("API Error:", error);
        setLoading(false);
        setError("Could not connect to PDF server. Please ensure the backend server is running.");
        setPdfs([]);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError('Failed to load content. Please try again later.');
      setLoading(false);
    }
  };
  
  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  // Filter PDFs based on search query
  const filteredPdfs = pdfs.filter(pdf => 
    searchQuery === '' || pdf.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploadFile(file);
      
      // Set default title from filename (without extension)
      if (!uploadTitle) {
        const fileName = file.name.split('.').slice(0, -1).join('.');
        setUploadTitle(fileName);
      }
    }
  };
  
  // Handle PDF upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadFile) {
      return;
    }
    
    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);
      
      try {
        console.log("Attempting to upload to API server");
        
        // Setup progress tracking
        const originalUpload = pdfService.uploadPdf;
        pdfService.uploadPdf = async (file, title) => {
          const xhr = new XMLHttpRequest();
          
          // Track upload progress
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded * 100) / event.total);
              setUploadProgress(progress);
            }
          });
          
          // Create form data
          const formData = new FormData();
          formData.append('file', file);
          formData.append('title', title || file.name);
          
          // Return a promise that resolves with the response
          return new Promise((resolve, reject) => {
            xhr.open('POST', '/api/pdf/upload');
            xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('authToken') || ''}`);
            
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve(JSON.parse(xhr.responseText));
              } else {
                reject(new Error(`HTTP Error: ${xhr.status}`));
              }
            };
            
            xhr.onerror = () => reject(new Error('Network Error'));
            xhr.ontimeout = () => reject(new Error('Request Timeout'));
            
            xhr.send(formData);
          });
        };
        
        // Perform the upload
        const result = await pdfService.uploadPdf(uploadFile, uploadTitle);
        
        // Restore original upload function
        pdfService.uploadPdf = originalUpload;
        
        console.log("API Upload Response:", result);
        
        // Reset form
        setUploadFile(null);
        setUploadTitle('');
        setShowUploadModal(false);
        
        // Show success message
        setError(null);
        alert("PDF uploaded successfully!");
        
        // Refresh PDFs list
        fetchData();
      } catch (error: any) {
        console.error("API Upload Error:", error);
        
        if (error.response) {
          if (error.response.status === 413) {
            setError('File is too large. Maximum file size is 10MB.');
          } else if (error.response.status === 415) {
            setError('Invalid file format. Only PDF files are accepted.');
          } else if (error.response.data && error.response.data.error) {
            setError(error.response.data.error);
          } else {
            setError('Server error: ' + error.response.status);
          }
        } else if (error.code === 'ECONNABORTED') {
          setError('Upload timeout. Please try with a smaller file or check your connection.');
        } else {
          setError('Failed to upload PDF. Make sure the backend server is running.');
        }
      }
    } catch (err) {
      console.error("General upload error:", err);
      setError('Failed to upload PDF. Please try again later.');
    } finally {
      setUploading(false);
    }
  };
  
  // Format file size for display
  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Handle deletion confirmation
  const confirmDelete = (pdf: PDF) => {
    setPdfToDelete(pdf);
    setShowDeleteModal(true);
  };
  
  // Handle PDF deletion
  const handleDelete = async () => {
    if (!pdfToDelete) return;
    
    try {
      await pdfService.deletePdf(pdfToDelete.id);
      setPdfs(pdfs.filter(pdf => pdf.id !== pdfToDelete.id));
      setShowDeleteModal(false);
      setPdfToDelete(null);
    } catch (err) {
      setError('Failed to delete PDF. Please try again later.');
    }
  };
  
  // Return components based on state
  if (loading && pdfs.length === 0) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
        <div className="text-center">
          <Spinner animation="border" role="status" className="mb-3" />
          <p>Loading your content...</p>
        </div>
      </Container>
    );
  }
  
  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My PDFs</h2>
        <div>
          {currentUser?.isPremium ? (
            <Badge bg="success" className="me-2 p-2">Premium Account</Badge>
          ) : (
            <Button 
              as={Link} 
              to="/payment" 
              variant="outline-success" 
              className="me-2"
            >
              Upgrade to Premium
            </Button>
          )}
          <Button variant="primary" onClick={() => setShowUploadModal(true)}>
            <i className="fas fa-upload me-1"></i> Upload PDF
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="alert alert-danger mb-4" role="alert">
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
        </div>
      )}
      
      {!currentUser?.isPremium && (
        <Card className="mb-4 bg-light">
          <Card.Body>
            <Row>
              <Col md={8}>
                <h4>Upgrade to Premium</h4>
                <p>Get unlimited PDF uploads, advanced AI-powered audio recommendations, and more.</p>
                <ul>
                  <li>Unlimited PDF uploads (Free users: 3 PDFs)</li>
                  <li>Advanced Google Gemini AI-powered audio recommendations</li>
                  <li>High-quality text-to-speech</li>
                  <li>Priority processing</li>
                </ul>
              </Col>
              <Col md={4} className="d-flex flex-column justify-content-center align-items-center">
                <h3 className="mb-3">$9.99/month</h3>
                <Button 
                  as={Link} 
                  to="/payment" 
                  variant="success" 
                  size="lg"
                >
                  Upgrade Now
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}
      
      {/* Search section */}
      <div className="mb-4">
        <Row>
          <Col md={12}>
            <InputGroup>
              <InputGroup.Text><i className="fas fa-search"></i></InputGroup.Text>
              <Form.Control
                placeholder="Search by title..."
                value={searchQuery}
                onChange={handleSearch}
              />
              {searchQuery && (
                <Button 
                  variant="outline-secondary" 
                  onClick={() => setSearchQuery('')}
                >
                  <i className="fas fa-times"></i>
                </Button>
              )}
            </InputGroup>
          </Col>
        </Row>
      </div>
      
      {/* Uploaded PDFs section */}
      {filteredPdfs.length > 0 ? (
          <Row xs={1} md={2} lg={3} className="g-4">
            {filteredPdfs.map((pdf) => (
              <Col key={pdf.id}>
                <Card className="h-100 pdf-card">
                  <Card.Body>
                    <div className="pdf-icon mb-3 d-flex justify-content-center">
                      <i className="fas fa-file-pdf fa-3x text-danger"></i>
                    </div>
                    <Card.Title>{pdf.title}</Card.Title>
                    <Card.Text>
                      <small className="text-muted">
                        <i className="fas fa-file me-1"></i> {pdf.num_pages} pages • {formatFileSize(pdf.file_size)}
                      </small>
                      <br />
                      <small className="text-muted">
                        <i className="fas fa-calendar me-1"></i> Uploaded: {formatDate(pdf.created_at)}
                      </small>
                    </Card.Text>
                  </Card.Body>
                  <Card.Footer>
                    <div className="d-flex justify-content-between">
                      <Button
                        as={Link}
                        to={`/reader/${pdf.id}`}
                        variant="primary"
                        size="sm"
                      >
                        <i className="fas fa-book-reader me-1"></i> Read
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => confirmDelete(pdf)}
                      >
                        <i className="fas fa-trash me-1"></i> Delete
                      </Button>
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
      ) : (
        <div className="text-center p-5 bg-light rounded">
          <i className="fas fa-file-pdf fa-3x mb-3 text-muted"></i>
          <h3>No PDFs found</h3>
          {searchQuery ? (
            <p>No results match your search query. Try different keywords or clear the search.</p>
          ) : (
            <p>Upload your first PDF to get started with Bardia Sonic PDF</p>
          )}
          <Button variant="primary" onClick={() => setShowUploadModal(true)}>
            <i className="fas fa-upload me-1"></i> Upload PDF
          </Button>
        </div>
      )}
      
      {/* Upload Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Upload PDF</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!currentUser?.isPremium && pdfs.length >= 3 ? (
            <div className="text-center p-3">
              <h5 className="mb-3">Upload Limit Reached</h5>
              <p>Free accounts are limited to 3 PDFs. Upgrade to Premium for unlimited uploads.</p>
              <Button 
                as={Link} 
                to="/payment" 
                variant="success"
                onClick={() => setShowUploadModal(false)}
              >
                Upgrade to Premium
              </Button>
            </div>
          ) : (
            <Form onSubmit={handleUpload}>
              {error && (
                <div className="alert alert-danger mb-3">
                  <i className="fas fa-exclamation-circle me-2"></i>
                  {error}
                </div>
              )}
              
              <Form.Group controlId="uploadTitle" className="mb-3">
                <Form.Label>Title</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter a title for the PDF (or leave blank to use filename)"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                />
              </Form.Group>
              
              <Form.Group controlId="uploadFile" className="mb-3">
                <Form.Label>PDF File</Form.Label>
                <Form.Control
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  required
                />
                <Form.Text className="text-muted">
                  Only PDF files are accepted. Maximum file size: 10MB.
                </Form.Text>
              </Form.Group>
              
              {uploading && (
                <div className="mb-3">
                  <Form.Label>Upload Progress: {uploadProgress}%</Form.Label>
                  <ProgressBar 
                    now={uploadProgress} 
                    label={`${uploadProgress}%`}
                    variant="primary"
                    animated={uploadProgress < 100}
                  />
                </div>
              )}
              
              <div className="d-flex justify-content-end">
                <Button
                  variant="secondary"
                  onClick={() => setShowUploadModal(false)}
                  className="me-2"
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={!uploadFile || uploading}
                >
                  {uploading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Uploading...
                    </>
                  ) : 'Upload'}
                </Button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete "{pdfToDelete?.title}"? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default DashboardPage; 