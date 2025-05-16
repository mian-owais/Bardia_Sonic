import React from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {/* Hero Section with Gradient Background */}
      <div className="bg-gradient-primary py-5">
        <Container className="py-5">
          <Row className="align-items-center">
            <Col lg={6} className="text-white mb-5 mb-lg-0">
              <div className="mb-4">
                <Logo size="large" variant="light" />
              </div>
              <h1 className="display-4 fw-bold mb-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Experience Books With All Your Senses
              </h1>
              <p className="lead mb-4" style={{ fontSize: "1.2rem", opacity: 0.9 }}>
                Immerse yourself in literature with AI-powered background music and sound effects that 
                adapt to what you're reading in real-time.
              </p>
              <div className="d-flex gap-3 mt-5">
                {isAuthenticated ? (
                  <Button 
                    as={Link} 
                    to="/dashboard" 
                    variant="light" 
                    size="lg" 
                    className="rounded-pill px-4 fw-bold"
                  >
                    Go to Dashboard
                  </Button>
                ) : (
                  <>
                    <Button 
                      as={Link} 
                      to="/register" 
                      variant="light" 
                      size="lg" 
                      className="rounded-pill px-4 fw-bold"
                    >
                      Get Started
                    </Button>
                    <Button 
                      as={Link} 
                      to="/login" 
                      variant="outline-light" 
                      size="lg"
                      className="rounded-pill px-4 fw-bold"
                    >
                      Login
                    </Button>
                  </>
                )}
              </div>
            </Col>
            <Col lg={6} className="d-flex justify-content-center">
              <div className="position-relative">
                <div className="position-absolute" style={{ width: "100%", height: "100%", top: "-15px", left: "15px", background: "rgba(0,0,0,0.2)", borderRadius: "20px", zIndex: 0 }}></div>
                <img 
                  src="/images/hero-image.png" 
                  alt="Reading with sound" 
                  className="img-fluid rounded-4 shadow-lg"
                  style={{ maxWidth: "100%", height: "auto", position: "relative", zIndex: 1 }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.style.display = 'none';
                  }}
                />
              </div>
            </Col>
          </Row>
        </Container>
      </div>
      
      {/* Features Section */}
      <Container className="py-5">
        <Row className="text-center mb-5">
          <Col>
            <h2 className="mb-3 fw-bold">How It Works</h2>
            <p className="lead" style={{ maxWidth: "700px", margin: "0 auto" }}>
              Our innovative platform analyzes text in real-time to provide the perfect audio 
              accompaniment that matches the mood, setting, and action in your books.
            </p>
          </Col>
        </Row>
        
        <Row className="g-4 mb-5">
          <Col md={6} lg={3}>
            <Card className="h-100 border-0 shadow-sm fade-in">
              <div className="text-center p-3">
                <div className="p-3 mb-3 rounded-circle bg-light d-inline-block">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 3V21M17 12H7" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <Card.Title className="fw-bold" style={{ color: "var(--primary)" }}>Upload PDF</Card.Title>
                <Card.Text>
                  Upload your PDF documents to our secure platform
                </Card.Text>
              </div>
            </Card>
          </Col>
          
          <Col md={6} lg={3}>
            <Card className="h-100 border-0 shadow-sm fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="text-center p-3">
                <div className="p-3 mb-3 rounded-circle bg-light d-inline-block">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 12H4M20 12H22M12 2V4M12 20V22M6 6L4 4M18 18L20 20M6 18L4 20M18 6L20 4" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="4" stroke="var(--accent)" strokeWidth="2"/>
                  </svg>
                </div>
                <Card.Title className="fw-bold" style={{ color: "var(--accent)" }}>AI Analysis</Card.Title>
                <Card.Text>
                  Our AI analyzes the text to understand context and emotion
                </Card.Text>
              </div>
            </Card>
          </Col>
          
          <Col md={6} lg={3}>
            <Card className="h-100 border-0 shadow-sm fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="text-center p-3">
                <div className="p-3 mb-3 rounded-circle bg-light d-inline-block">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18V5L21 3V16" stroke="var(--secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="6" cy="18" r="3" stroke="var(--secondary)" strokeWidth="2" />
                    <circle cx="18" cy="16" r="3" stroke="var(--secondary)" strokeWidth="2" />
                  </svg>
                </div>
                <Card.Title className="fw-bold" style={{ color: "var(--secondary)" }}>Music Selection</Card.Title>
                <Card.Text>
                  Perfect background music is selected to match the theme
                </Card.Text>
              </div>
            </Card>
          </Col>
          
          <Col md={6} lg={3}>
            <Card className="h-100 border-0 shadow-sm fade-in" style={{ animationDelay: "0.3s" }}>
              <div className="text-center p-3">
                <div className="p-3 mb-3 rounded-circle bg-light d-inline-block">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" stroke="var(--info)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M20 4L8.12 4C7.5 4 6.88 4.17 6.34 4.46L3.66 6C3.38 6.17 3.12 6.42 2.92 6.71C2.01 8 2.01 9.83 2.92 11.13C3.12 11.42 3.38 11.67 3.66 11.83L6.34 13.37C6.88 13.66 7.5 13.83 8.12 13.83H20C21.1 13.83 22 12.93 22 11.83V6C22 4.9 21.1 4 20 4Z" stroke="var(--info)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 18L6 18M10 18L8 18" stroke="var(--info)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <Card.Title className="fw-bold" style={{ color: "var(--info)" }}>Immersive Reading</Card.Title>
                <Card.Text>
                  Enjoy synchronized sound effects that enhance key moments
                </Card.Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Reading Modes Section */}
        <Row className="mt-5 align-items-center">
          <Col lg={6} className="mb-4 mb-lg-0">
            <h2 className="fw-bold mb-4">Two Reading Modes</h2>
            <div className="d-flex mb-4 align-items-start">
              <div className="rounded-circle p-2 me-3 bg-gradient-primary">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h4 className="fw-bold" style={{ color: "var(--primary)" }}>Reading Mode</h4>
                <p className="text-muted">
                  Background music that perfectly complements the theme and mood of what you're reading
                </p>
              </div>
            </div>
            <div className="d-flex mb-4 align-items-start">
              <div className="rounded-circle p-2 me-3 bg-gradient-primary">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.5 9H15.51M8.5 9H8.51M12 13.5V13.51M7 3V5M17 3V5M6.2 21H17.8C18.9201 21 19.4802 21 19.908 20.782C20.2843 20.5903 20.5903 20.2843 20.782 19.908C21 19.4802 21 18.9201 21 17.8V8.2C21 7.07989 21 6.51984 20.782 6.09202C20.5903 5.71569 20.2843 5.40973 19.908 5.21799C19.4802 5 18.9201 5 17.8 5H6.2C5.0799 5 4.51984 5 4.09202 5.21799C3.71569 5.40973 3.40973 5.71569 3.21799 6.09202C3 6.51984 3 7.07989 3 8.2V17.8C3 18.9201 3 19.4802 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.51984 21 5.07989 21 6.2 21Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h4 className="fw-bold" style={{ color: "var(--primary)" }}>Listening Mode</h4>
                <p className="text-muted">
                  Full immersion with background music, synchronized sound effects, and text-to-speech functionality
                </p>
              </div>
            </div>
            <Button as={Link} to={isAuthenticated ? "/dashboard" : "/register"} variant="accent" className="rounded-pill px-4 mt-3">
              Try It Now
            </Button>
          </Col>
          <Col lg={6}>
            <Card className="border-0 shadow overflow-hidden">
              <div className="ratio ratio-16x9">
                <img 
                  src="/images/reading-modes.png" 
                  alt="PDF Reader Demo" 
                  className="card-img-top"
                  style={{ objectFit: "cover" }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = 'https://placehold.co/600x400/6366F1/FFFFFF?text=Reading+Experience';
                  }}
                />
              </div>
            </Card>
          </Col>
        </Row>
      </Container>
      
      {/* Call to Action Section */}
      <div className="bg-light py-5 mt-5">
        <Container className="py-4 text-center">
          <h2 className="fw-bold mb-4">Ready to Transform Your Reading Experience?</h2>
          <p className="lead mb-4" style={{ maxWidth: "700px", margin: "0 auto" }}>
            Join thousands of readers who have discovered a new way to enjoy books with our AI-powered audio enhancement.
          </p>
          <Button 
            as={Link} 
            to={isAuthenticated ? "/dashboard" : "/register"} 
            variant="primary" 
            size="lg" 
            className="rounded-pill px-5 py-3 mt-3 fw-bold"
          >
            {isAuthenticated ? "Go to Dashboard" : "Get Started for Free"}
          </Button>
        </Container>
      </div>
    </>
  );
};

export default HomePage; 