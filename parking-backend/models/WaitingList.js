import mongoose from 'mongoose';

const waitingListSchema = new mongoose.Schema({
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
    desiredStartTime: {
        type: Date,
        required: true
    },
    desiredEndTime: {
        type: Date,
        required: true
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
    status: {
        type: String,
        enum: ['waiting', 'notified', 'expired'],
        default: 'waiting'
    },
    notifiedAt: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('WaitingList', waitingListSchema);