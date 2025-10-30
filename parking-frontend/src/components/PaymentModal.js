import React, { useState } from 'react';
import { paymentAPI, bookingAPI } from '../services/api';
import './PaymentModal.css';
const PaymentModal = ({ booking, onClose, onSuccess }) => {
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  console.log('PaymentModal booking:', booking);
  const handleDummyPayment = async () => {
    console.log('Starting dummy payment...');
    setProcessing(true);
    setTimeout(() => {
      const slotAvailable = Math.random() > 0.2;
      setPaymentSuccess(true);
      setTimeout(() => {
        if (slotAvailable) {
          console.log('Payment successful, booking confirmed');
          onSuccess('confirmed');
        } else {
          console.log('No slots available, adding to waiting list');
          onSuccess('waiting');
        }
        onClose();
      }, 1500);
      setProcessing(false);
    }, 2000);
  };
  if (paymentSuccess) {
    return (
      <div className="payment-modal">
        <div className="payment-content">
          <div className="success-animation">✅</div>
          <h2>Payment Successful!</h2>
          <p>Your parking slot has been booked successfully.</p>
          <p>Amount Paid: ₹{booking.totalAmount}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="payment-modal">
      <div className="payment-content">
        <div className="payment-header">
          <h2>Complete Payment</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="payment-details">
          <div className="detail-row">
            <span>Parking Lot:</span>
            <span>{booking.parkingLot?.name}</span>
          </div>
          <div className="detail-row">
            <span>Vehicle:</span>
            <span>{booking.vehicleNumber}</span>
          </div>
          <div className="detail-row">
            <span>Duration:</span>
            <span>{Math.ceil((new Date(booking.endTime) - new Date(booking.startTime)) / (1000 * 60 * 60))} hours</span>
          </div>
          <div className="detail-row total">
            <span>Total Amount:</span>
            <span>₹{booking.totalAmount}</span>
          </div>
        </div>
        <div className="payment-methods">
          <h3>Payment Method</h3>
          <div className="dummy-payment">
            <p>🧪 Test Mode - Dummy Payment</p>
            <button 
              className="pay-btn" 
              onClick={handleDummyPayment}
              disabled={processing}
            >
              {processing ? 'Processing...' : `Pay ₹${booking.totalAmount}`}
            </button>
            <button 
              className="test-btn" 
              onClick={handleDummyPayment}
              disabled={processing}
            >
              {processing ? 'Processing Payment...' : 'Test Payment (Dummy)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PaymentModal;