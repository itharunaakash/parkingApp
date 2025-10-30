import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import Header from './Header';
import './AdminDashboard.css';
const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalBookings: 0, totalRevenue: 0, activeBookings: 0 });
  const [locations, setLocations] = useState([]);
  const [parkingLots, setParkingLots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);
  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, locationsRes, lotsRes, bookingsRes] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getLocations(),
        adminAPI.getParkingLots(),
        adminAPI.getBookings()
      ]);
      const bookingsData = bookingsRes.data.bookings || [];
      setStats({
        totalBookings: bookingsData.length,
        totalRevenue: bookingsData.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
        activeBookings: bookingsData.filter(b => b.status === 'active').length
      });
      setLocations(locationsRes.data);
      setParkingLots(lotsRes.data);
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };
  if (loading) return <div className="loading">Loading...</div>;
  return (
    <div className="admin-dashboard">
      <Header />
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome Admin!</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>{locations.length}</h3>
          <p>Total Locations</p>
        </div>
        <div className="stat-card">
          <h3>{parkingLots.length}</h3>
          <p>Parking Lots</p>
        </div>
        <div className="stat-card">
          <h3>{stats.totalBookings}</h3>
          <p>Total Bookings</p>
        </div>
        <div className="stat-card">
          <h3>₹{stats.totalRevenue}</h3>
          <p>Total Revenue</p>
        </div>
      </div>
      <div className="management-sections">
        <div className="section">
          <h3>Location Management</h3>
          <div className="section-item">
            <span>📍 View All Locations</span>
            <p>Manage parking locations</p>
          </div>
          <div className="section-item">
            <span>➕ Add New Location</span>
            <p>Create a new parking location</p>
          </div>
        </div>
        <div className="section">
          <h3>Parking Lot Management</h3>
          <div className="section-item">
            <span>🚗 View All Parking Lots</span>
            <p>Manage parking lots</p>
          </div>
          <div className="section-item">
            <span>➕ Add New Parking Lot</span>
            <p>Create a new parking lot</p>
          </div>
        </div>
        <div className="section">
          <h3>Booking Management</h3>
          <div className="section-item">
            <span>📋 All Bookings</span>
            <p>View and manage all bookings</p>
          </div>
          <div className="section-item">
            <span>🔴 Active Bookings</span>
            <p>{stats.activeBookings} active bookings</p>
          </div>
        </div>
      </div>
      <div className="recent-bookings">
        <h3>Recent Bookings</h3>
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Lot</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr><td colSpan="3">No recent bookings</td></tr>
            ) : (
              bookings.slice(0, 5).map(booking => (
                <tr key={booking._id}>
                  <td>{booking.user?.name || 'N/A'}</td>
                  <td>{booking.parkingLot?.name}</td>
                  <td>{booking.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default AdminDashboard;