import express from 'express';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import Booking from '../models/Booking.js';

const router = express.Router();

router.get('/revenue', verifyToken, isAdmin, async (req, res) => {
    try {
        const totalRevenue = await Booking.aggregate([
            { $match: { paymentStatus: 'paid' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        
        res.json({
            totalRevenue: totalRevenue[0]?.total || 0
        });
    } catch (error) {
        res.status(500).json({ message: 'Error generating revenue report', error: error.message });
    }
});

export default router;