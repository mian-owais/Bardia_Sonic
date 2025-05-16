import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button, Badge, Dropdown } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';

const NavBar: React.FC = () => {
  const { currentUser, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState<boolean>(false);

  // Track scrolling to change navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Function to navigate programmatically instead of using as={Link}
  const navigateTo = (path: string) => {
    navigate(path);
  };

  return (
    <Navbar 
      expand="lg" 
      className={`navbar-custom ${scrolled ? 'shadow-sm' : ''}`}
      style={{
        transition: 'all 0.3s ease',
        background: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 1)',
        padding: '0.25rem 0.5rem',
        height: 'auto',
        minHeight: '40px',
        zIndex: 1030
      }}
      fixed="top"
    >
      <Container fluid className="px-2">
        <div className="navbar-content">
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
            <Logo size="small" animated={!scrolled} />
          </Navbar.Brand>
          
          <Navbar.Toggle aria-controls="responsive-navbar-nav" className="border-0 p-1" />
          
          <Navbar.Collapse id="responsive-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link 
                as={Link} 
                to="/" 
                className="mx-1 fw-medium"
                style={{ 
                  fontSize: '0.9rem', 
                  position: 'relative',
                  color: 'var(--dark)',
                  transition: 'all 0.2s ease',
                  padding: '0.25rem 0.5rem'
                }}
              >
                Home
              </Nav.Link>
              
              {isAuthenticated && (
                <>
                  <Nav.Link 
                    as={Link} 
                    to="/dashboard" 
                    className="mx-1 fw-medium"
                    style={{ 
                      fontSize: '0.9rem', 
                      position: 'relative',
                      color: 'var(--dark)',
                      transition: 'all 0.2s ease',
                      padding: '0.25rem 0.5rem'
                    }}
                  >
                    Dashboard
                  </Nav.Link>
                  {!currentUser?.isPremium && (
                    <Nav.Link 
                      as={Link} 
                      to="/payment" 
                      className="text-gradient mx-1 fw-medium"
                      style={{ 
                        fontSize: '0.9rem',
                        background: 'linear-gradient(90deg, #6366F1 0%, #EC4899 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        padding: '0.25rem 0.5rem'
                      }}
                    >
                      Upgrade
                    </Nav.Link>
                  )}
                </>
              )}
            </Nav>
            
            <Nav className="navbar-controls">
              {isAuthenticated ? (
                <Dropdown align="end">
                  <Dropdown.Toggle 
                    variant="light" 
                    id="dropdown-basic"
                    className="d-flex align-items-center border rounded-pill py-1 px-2 shadow-sm"
                    style={{ backgroundColor: 'white', fontSize: '0.9rem' }}
                  >
                    <div className="rounded-circle me-2 d-flex align-items-center justify-content-center"
                      style={{ 
                        width: '28px', 
                        height: '28px', 
                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    >
                      {currentUser?.name?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                    </div>
                    <span className="d-none d-md-inline">
                      {currentUser?.name || currentUser?.email?.split('@')[0]}
                    </span>
                    {currentUser?.isPremium && (
                      <Badge className="premium-badge ms-1 px-1" style={{ fontSize: '0.7rem' }}>Pro</Badge>
                    )}
                  </Dropdown.Toggle>

                  <Dropdown.Menu className="shadow-sm border-0">
                    <Dropdown.Item as={Link} to="/dashboard">My Dashboard</Dropdown.Item>
                    {!currentUser?.isPremium && (
                      <Dropdown.Item as={Link} to="/payment" className="text-primary">Upgrade to Premium</Dropdown.Item>
                    )}
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              ) : (
                <div className="d-flex">
                  <Button 
                    onClick={() => navigateTo('/login')}
                    variant="light" 
                    className="me-1 border rounded-pill px-3 py-1"
                    style={{ fontWeight: 500, fontSize: '0.9rem' }}
                  >
                    Login
                  </Button>
                  <Button 
                    onClick={() => navigateTo('/register')}
                    variant="primary"
                    className="rounded-pill px-3 py-1"
                    style={{ fontWeight: 500, fontSize: '0.9rem' }}
                  >
                    Register
                  </Button>
                </div>
              )}
            </Nav>
          </Navbar.Collapse>
        </div>
      </Container>
    </Navbar>
  );
};

export default NavBar; 