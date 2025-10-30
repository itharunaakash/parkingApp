import mongoose from 'mongoose';
const paymentSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'Rupee'
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'wallet', 'bank_transfer', 'razorpay'], 
        required: true
    },
    stripePaymentId: {
        type: String
    },
    stripeRefundId: {
        type: String
    },
    receiptUrl: {
        type: String
    },
    refundAmount: {
        type: Number
    },
    refundReason: {
        type: String
    },
    metadata: {
        type: Map,
        of: String
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
paymentSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});
export default mongoose.model('Payment', paymentSchema);