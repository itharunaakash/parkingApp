import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';

const router = express.Router();

router.get('/stats', verifyToken, async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments({ user: req.user._id });
    const activeBookings = await Booking.countDocuments({ 
      user: req.user._id, 
      status: { $in: ['confirmed', 'pending'] }
    });
    const completedBookings = await Booking.countDocuments({ 
      user: req.user._id, 
      status: 'completed' 
    });
    
    // Calculate total spent (simplified)
    const totalSpent = await Booking.aggregate([
      { $match: { user: req.user._id, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    res.json({
      totalBookings,
      activeBookings,
      completedBookings,
      totalSpent: totalSpent[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
  }
});

export default router;