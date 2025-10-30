import mongoose from 'mongoose';

const parkingLotSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    location: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location',
        required: true
    },
    totalSpots: {
        type: Number,
        required: true,
        min: 1
    },
    availableSpots: {
        type: Number,
        required: true,
        min: 0
    },
    ratePerHour: {
        type: Number,
        required: true,
        min: 0
    },
    operatingHours: {
        open: {
            type: String,
            default: '00:00'
        },
        close: {
            type: String,
            default: '23:59'
        }
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'maintenance'],
        default: 'active'
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

parkingLotSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.model('ParkingLot', parkingLotSchema);