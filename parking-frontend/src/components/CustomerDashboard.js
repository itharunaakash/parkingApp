import React, { useState, useEffect } from 'react';
import { bookingAPI } from '../services/api';
import PaymentModal from './PaymentModal';
import './CustomerDashboard.css';
const CustomerDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    loadBookings();
  }, []);
  const loadBookings = async () => {
    setLoading(true);
    try {
      const response = await bookingAPI.getMyBookings();
      const allBookings = response.data.bookings || [];
      const demoBookings = [
        {
          _id: 'demo1',
          parkingLot: { name: 'bus stand parking' },
          vehicleNumber: 'KA01AB1234',
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          totalAmount: 10,
          status: 'pending'
        }
      ];
      const combinedBookings = [...allBookings, ...demoBookings];
      setBookings(combinedBookings.filter(b => b.status !== 'pending'));
      setPendingBookings(combinedBookings.filter(b => b.status === 'pending'));
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
    setLoading(false);
  };
  const handlePayNow = (booking) => {
    setSelectedBooking(booking);
    setShowPaymentModal(true);
  };
  const handlePaymentSuccess = (status = 'confirmed') => {
    console.log('Payment success callback called with status:', status);
    if (status === 'waiting') {
      const waitingBooking = { ...selectedBooking, status: 'waiting' };
      setPendingBookings(prev => prev.filter(b => b._id !== selectedBooking._id));
      setBookings(prev => [...prev, waitingBooking]);
      alert('No slots available! Added to waiting list.');
    } else {
      const confirmedBooking = { ...selectedBooking, status: 'confirmed' };
      setPendingBookings(prev => prev.filter(b => b._id !== selectedBooking._id));
      setBookings(prev => [...prev, confirmedBooking]);
      alert('Payment successful! Booking confirmed.');
    }
    setShowPaymentModal(false);
    setSelectedBooking(null);
  };
  const handleCancelBooking = (bookingId) => {
    console.log('Cancel button clicked for booking:', bookingId);
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      alert('Booking cancelled successfully (Demo)');
      setPendingBookings(prev => prev.filter(b => b._id !== bookingId));
      setBookings(prev => [...prev, ...pendingBookings.filter(b => b._id === bookingId).map(b => ({...b, status: 'cancelled'}))]);
    }
  };
  if (loading) return <div className="loading">Loading...</div>;
  return (
    <div className="customer-dashboard">
      <div className="header">
        <h1>My Parking Dashboard</h1>
        <p>Manage your parking bookings</p>
      </div>
      {pendingBookings.length > 0 && (
        <div className="pending-payments">
          <h2>Pending Payments</h2>
          {pendingBookings.map(booking => (
            <div key={booking._id} className="pending-card">
              <div className="booking-info">
                <h3>{booking.parkingLot?.name}</h3>
                <p>Vehicle: {booking.vehicleNumber}</p>
                <p>Amount: ₹{booking.totalAmount}</p>
                <p>Start: {new Date(booking.startTime).toLocaleString()}</p>
              </div>
              <div className="booking-actions">
                <button 
                  className="pay-now-btn"
                  onClick={() => handlePayNow(booking)}
                >
                  Pay Now
                </button>
                <button 
                  className="cancel-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCancelBooking(booking._id);
                  }}
                >
                  Cancel Booking
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="booking-history">
        <h2>Booking History</h2>
        {bookings.length === 0 ? (
          <div className="no-bookings">
            <p>No bookings found</p>
          </div>
        ) : (
          <div className="bookings-grid">
            {bookings.map(booking => (
              <div key={booking._id} className="booking-card">
                <div className="booking-header">
                  <h3>{booking.parkingLot?.name}</h3>
                  <span className={`status ${booking.status}`}>{booking.status}</span>
                </div>
                <div className="booking-details">
                  <p><strong>Vehicle:</strong> {booking.vehicleNumber}</p>
                  <p><strong>Start:</strong> {new Date(booking.startTime).toLocaleString()}</p>
                  <p><strong>End:</strong> {new Date(booking.endTime).toLocaleString()}</p>
                  <p><strong>Amount:</strong> ₹{booking.totalAmount}</p>
                  {(booking.status === 'pending' || booking.status === 'confirmed') && (
                    <button 
                      className="cancel-btn"
                      onClick={() => handleCancelBooking(booking._id)}
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {showPaymentModal && selectedBooking && (
        <PaymentModal
          booking={selectedBooking}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedBooking(null);
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};
export default CustomerDashboard;