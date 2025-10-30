import mongoose from 'mongoose';
const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    parkingLot: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ParkingLot',
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    },
    spotNumber: {
        type: String
    },
    totalAmount: {
        type: Number,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentId: {
        type: String
    },
    receiptUrl: {
        type: String
    },
    vehicleDetails: {
        type: {
            type: String,
            enum: ['car', 'bike', 'truck'],
            required: true
        },
        licensePlate: {
            type: String,
            required: true
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});
bookingSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    if (this.startTime >= this.endTime) {
        next(new Error('End time must be after start time'));
        return;
    }
    const now = new Date();
    if (this.startTime < now) {
        next(new Error('Cannot book in the past'));
        return;
    }
    next();
});
export default mongoose.model('Booking', bookingSchema);