import React, { useState } from 'react';
import { Container, Form, Button, Card, Alert, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PaymentPage: React.FC = () => {
  const { currentUser, upgradeToPremium } = useAuth();
  const navigate = useNavigate();
  
  const [paymentMethod, setPaymentMethod] = useState<string>('credit');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardName, setCardName] = useState<string>('');
  const [expDate, setExpDate] = useState<string>('');
  const [cvv, setCvv] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null);
      setLoading(true);
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update user to premium
      upgradeToPremium();
      
      setSuccess(true);
      
      // Redirect to dashboard after a delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (err) {
      console.error('Payment error:', err);
      setError('Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (currentUser?.isPremium) {
    return (
      <Container className="py-5">
        <Card>
          <Card.Body className="text-center">
            <Card.Title>You're already a Premium member!</Card.Title>
            <Card.Text>Enjoy all premium features of Bardia Sonic PDF.</Card.Text>
            <Button variant="primary" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }
  
  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card>
            <Card.Header as="h4">Upgrade to Premium</Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && (
                <Alert variant="success">
                  Payment successful! You've been upgraded to Premium.
                </Alert>
              )}
              
              <div className="mb-4">
                <h5>Premium Features:</h5>
                <ul>
                  <li>Unlimited PDF uploads</li>
                  <li>Advanced AI-powered audio recommendations</li>
                  <li>Custom sound effects and music</li>
                  <li>High-quality text-to-speech</li>
                  <li>Priority processing</li>
                </ul>
                <div className="d-flex justify-content-center my-4">
                  <div className="bg-light p-3 rounded-3 border text-center">
                    <h3>$9.99/month</h3>
                    <p className="text-muted mb-0">Cancel anytime</p>
                  </div>
                </div>
              </div>
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Payment Method</Form.Label>
                  <div>
                    <Form.Check
                      inline
                      type="radio"
                      label="Credit Card"
                      name="paymentMethod"
                      id="credit"
                      value="credit"
                      checked={paymentMethod === 'credit'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <Form.Check
                      inline
                      type="radio"
                      label="PayPal"
                      name="paymentMethod"
                      id="paypal"
                      value="paypal"
                      checked={paymentMethod === 'paypal'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                  </div>
                </Form.Group>
                
                {paymentMethod === 'credit' ? (
                  <>
                    <Form.Group className="mb-3">
                      <Form.Label>Card Number</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        required
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Cardholder Name</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="John Doe"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        required
                      />
                    </Form.Group>
                    
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Expiration Date</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="MM/YY"
                            value={expDate}
                            onChange={(e) => setExpDate(e.target.value)}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>CVV</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="123"
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value)}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </>
                ) : (
                  <div className="text-center my-4">
                    <p>You will be redirected to PayPal to complete your payment.</p>
                  </div>
                )}
                
                <div className="d-grid gap-2">
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={loading || success}
                  >
                    {loading ? 'Processing...' : 'Pay & Upgrade Now'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PaymentPage; 