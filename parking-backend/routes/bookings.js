import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import ParkingLot from '../models/ParkingLot.js';
import Location from '../models/Location.js';
import Booking from '../models/Booking.js';
import WaitingList from '../models/WaitingList.js';
import { body, validationResult } from 'express-validator';
import moment from 'moment';

const router = express.Router();

router.get('/search', verifyToken, async (req, res) => {
    try {
        const { location, startTime, endTime, vehicleType, timezone = 'UTC' } = req.query;
        if (!startTime || !endTime) {
            return res.status(400).json({ message: 'Start time and end time are required' });
        }
        
        const start = new Date(startTime);
        const end = new Date(endTime);
        
        let query = { status: 'active', availableSpots: { $gt: 0 } };
        if (location) {
            const locations = await Location.find({
                $or: [
                    { name: { $regex: location, $options: 'i' } },
                    { 'address.city': { $regex: location, $options: 'i' } }
                ]
            });
            query.location = { $in: locations.map(l => l._id) };
        }
        
        const parkingLots = await ParkingLot.find(query)
            .populate('location')
            .sort({ ratePerHour: 1 });
        
        const availableLots = [];
        for (const lot of parkingLots) {
            const conflictingBookings = await Booking.countDocuments({
                parkingLot: lot._id,
                status: { $in: ['confirmed', 'pending'] },
                $or: [
                    { startTime: { $lt: end }, endTime: { $gt: start } }
                ]
            });
            
            const actualAvailable = lot.totalSpots - conflictingBookings;
            if (actualAvailable > 0) {
                availableLots.push({
                    ...lot.toObject(),
                    actualAvailableSpots: actualAvailable,
                    estimatedCost: calculateCost(start, end, lot.ratePerHour)
                });
            }
        }
        
        res.json(availableLots);
    } catch (error) {
        res.status(500).json({ message: 'Error searching parking lots', error: error.message });
    }
});

router.post('/', [
    verifyToken,
    body('parkingLot').isMongoId(),
    body('startTime').isISO8601(),
    body('endTime').isISO8601(),
    body('vehicleDetails.type').isIn(['car', 'bike', 'truck']),
    body('vehicleDetails.licensePlate').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    try {
        const { parkingLot, startTime, endTime, vehicleDetails, timezone = 'UTC' } = req.body;
        
        const lot = await ParkingLot.findById(parkingLot);
        if (!lot || lot.status !== 'active') {
            return res.status(404).json({ message: 'Parking lot not available' });
        }
        
        const start = new Date(startTime);
        const end = new Date(endTime);
        
        const conflictingBookings = await Booking.countDocuments({
            parkingLot: lot._id,
            status: { $in: ['confirmed', 'pending'] },
            $or: [
                { startTime: { $lt: end }, endTime: { $gt: start } }
            ]
        });
        
        const actualAvailable = lot.totalSpots - conflictingBookings;
        if (actualAvailable <= 0) {
            return res.status(409).json({
                message: 'No spots available.',
            });
        }
        
        const totalAmount = calculateCost(start, end, lot.ratePerHour);
        const booking = new Booking({
            user: req.user._id,
            parkingLot: lot._id,
            startTime: start,
            endTime: end,
            vehicleDetails,
            totalAmount,
            spotNumber: `${lot.name}-${Date.now() % 1000}`
        });
        
        await booking.save();
        await booking.populate(['user', 'parkingLot']);
        
        lot.availableSpots = Math.max(0, lot.availableSpots - 1);
        await lot.save();
        
        res.status(201).json(booking);
    } catch (error) {
        res.status(500).json({ message: 'Error creating booking', error: error.message });
    }
});

router.get('/my-bookings', verifyToken, async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const query = { user: req.user._id };
        if (status) query.status = status;
        
        const bookings = await Booking.find(query)
            .populate('parkingLot')
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

router.post('/:id/cancel', verifyToken, async (req, res) => {
    try {
        console.log('Attempting to cancel booking:', req.params.id);
        console.log('Cancel request by user:', req.user?._id);
        const booking = await Booking.findOne({
            _id: req.params.id,
            user: req.user._id
        });
        
        if (!booking) {
            console.log('Booking not found or does not belong to user:', req.params.id);
            return res.status(404).json({ message: 'Booking not found' });
        }

        console.log('Found booking for cancellation:', { id: booking._id, status: booking.status, user: booking.user });
        
        if (booking.status === 'cancelled') {
            console.log('Booking already cancelled:', req.params.id);
            return res.status(400).json({ message: 'Booking already cancelled' });
        }
        
        booking.status = 'cancelled';
        await booking.save();
    console.log('Booking status updated to cancelled for:', booking._id);
        
        const lot = await ParkingLot.findById(booking.parkingLot);
        if (lot) {
            lot.availableSpots = Math.min(lot.totalSpots, lot.availableSpots + 1);
            await lot.save();
        }
        
        res.json({ message: 'Booking cancelled successfully', booking });
    } catch (error) {
        res.status(500).json({ message: 'Error cancelling booking', error: error.message });
    }
});

router.get('/waiting-list', verifyToken, async (req, res) => {
    try {
        const waitingList = [];
        res.json(waitingList);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching waiting list', error: error.message });
    }
});

function calculateCost(startTime, endTime, ratePerHour) {
    const hours = (endTime - startTime) / (1000 * 60 * 60); 
    return Math.ceil(hours) * ratePerHour;
}

export default router;