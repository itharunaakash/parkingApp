import express from 'express';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import Location from '../models/Location.js';
import ParkingLot from '../models/ParkingLot.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

router.post('/locations', [
    verifyToken,
    isAdmin,
    body('name').notEmpty().trim(),
    body('address.city').notEmpty().trim(),
    body('coordinates.latitude').isFloat({ min: -90, max: 90 }),
    body('coordinates.longitude').isFloat({ min: -180, max: 180 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const location = new Location(req.body);
        await location.save();
        res.status(201).json(location);
    } catch (error) {
        res.status(500).json({ message: 'Error creating location', error: error.message });
    }
});

router.get('/locations', verifyToken, isAdmin, async (req, res) => {
    try {
        const locations = await Location.find().sort({ createdAt: -1 });
        res.json(locations);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching locations', error: error.message });
    }
});

router.put('/locations/:id', [
    verifyToken,
    isAdmin,
    body('name').optional().notEmpty().trim(),
    body('coordinates.latitude').optional().isFloat({ min: -90, max: 90 }),
    body('coordinates.longitude').optional().isFloat({ min: -180, max: 180 })
], async (req, res) => {
    try {
        const location = await Location.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }
        res.json(location);
    } catch (error) {
        res.status(500).json({ message: 'Error updating location', error: error.message });
    }
});

router.delete('/locations/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const parkingLots = await ParkingLot.countDocuments({ location: req.params.id });
        if (parkingLots > 0) {
            return res.status(400).json({ message: 'Cannot delete location with existing parking lots' });
        }
        const location = await Location.findByIdAndDelete(req.params.id);
        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }
        res.json({ message: 'Location deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting location', error: error.message });
    }
});

router.post('/parking-lots', [
    verifyToken,
    isAdmin,
    body('name').notEmpty().trim(),
    body('location').isMongoId(),
    body('totalSpots').isInt({ min: 1 }),
    body('ratePerHour').isFloat({ min: 0 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const parkingLot = new ParkingLot({
            ...req.body,
            availableSpots: req.body.totalSpots
        });
        await parkingLot.save();
        await parkingLot.populate('location');
        res.status(201).json(parkingLot);
    } catch (error) {
        res.status(500).json({ message: 'Error creating parking lot', error: error.message });
    }
});

router.get('/parking-lots', verifyToken, isAdmin, async (req, res) => {
    try {
        const parkingLots = await ParkingLot.find()
            .populate('location')
            .sort({ createdAt: -1 });
        res.json(parkingLots);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching parking lots', error: error.message });
    }
});

router.put('/parking-lots/:id', [
    verifyToken,
    isAdmin,
    body('totalSpots').optional().isInt({ min: 1 }),
    body('ratePerHour').optional().isFloat({ min: 0 }),
    body('status').optional().isIn(['active', 'maintenance', 'closed'])
], async (req, res) => {
    try {
        const parkingLot = await ParkingLot.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('location');
        if (!parkingLot) {
            return res.status(404).json({ message: 'Parking lot not found' });
        }
        res.json(parkingLot);
    } catch (error) {
        res.status(500).json({ message: 'Error updating parking lot', error: error.message });
    }
});

router.delete('/parking-lots/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const activeBookings = await Booking.countDocuments({ 
            parkingLot: req.params.id, 
            status: { $in: ['confirmed', 'pending'] }
        });
        if (activeBookings > 0) {
            return res.status(400).json({ message: 'Cannot delete parking lot with active bookings' });
        }
        const parkingLot = await ParkingLot.findByIdAndDelete(req.params.id);
        if (!parkingLot) {
            return res.status(404).json({ message: 'Parking lot not found' });
        }
        res.json({ message: 'Parking lot deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting parking lot', error: error.message });
    }
});

router.get('/dashboard', verifyToken, isAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'customer' });
        const totalParkingLots = await ParkingLot.countDocuments();
        const totalBookings = await Booking.countDocuments();
        const activeBookings = await Booking.countDocuments({ status: 'confirmed' });
        
        const revenueData = await Booking.aggregate([
            { $match: { paymentStatus: 'paid' } },
            { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
        ]);
        const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;
        
        res.json({
            totalUsers,
            totalParkingLots,
            totalBookings,
            activeBookings,
            totalRevenue
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
    }
});

router.put('/bookings/:id/status', [
    verifyToken,
    isAdmin,
    body('status').isIn(['pending', 'confirmed', 'cancelled', 'completed'])
], async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        
        if (booking.status === 'completed' && status === 'cancelled') {
            return res.status(400).json({ message: 'Cannot cancel a completed booking' });
        }
        
        if (status === 'cancelled' && booking.status !== 'cancelled') {
            const parkingLot = await ParkingLot.findById(booking.parkingLot);
            if (parkingLot) {
                parkingLot.availableSpots = Math.min(parkingLot.totalSpots, parkingLot.availableSpots + 1);
                await parkingLot.save();
            }
        }
        
        booking.status = status;
        await booking.save();
        
        res.json({ 
            success: true, 
            message: `Booking status updated to ${status}`,
            booking 
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error updating booking status', 
            error: error.message 
        });
    }
});

router.get('/bookings', verifyToken, isAdmin, async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const query = {};
        if (status) query.status = status;
        
        const bookings = await Booking.find(query)
            .populate('user', 'username email')
            .populate('parkingLot', 'name')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        
        const total = await Booking.countDocuments(query);
        
        res.json({
            bookings,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching bookings', error: error.message });
    }
});

export default router;