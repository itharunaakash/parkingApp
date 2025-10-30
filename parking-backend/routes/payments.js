import dotenv from "dotenv";
dotenv.config();
import express from "express";
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { verifyToken } from "../middleware/auth.js";
import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";

const router = express.Router();

router.post("/test-payment", verifyToken, async (req, res) => {
  try {
    console.log("Test payment request:", req.body);
    console.log("User:", req.user._id);
    
    const { bookingId, amount } = req.body;
    
    if (!bookingId) {
      return res.status(400).json({ success: false, message: "Booking ID required" });
    }
    
    const booking = await Booking.findById(bookingId).populate('parkingLot');
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    
    console.log("Found booking:", booking._id);

    const payment = new Payment({
      booking: booking._id,
      user: req.user._id,
      amount: booking.totalAmount,
      status: 'completed',
      paymentMethod: 'razorpay'
    });
    await payment.save();
    
    // Update booking
    booking.status = "confirmed";
    booking.paymentStatus = "paid";
    await booking.save();
    
    console.log("Payment and booking updated successfully");
    
    res.json({
      success: true,
      message: "Test payment completed successfully",
      booking: {
        id: booking._id,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        amount: booking.totalAmount
      },
      payment: {
        id: payment._id,
        amount: payment.amount,
        status: payment.status
      }
    });
    
  } catch (error) {
    console.error("Test payment failed:", error);
    res.status(500).json({
      success: false,
      message: "Test payment failed",
      error: error.message,
    });
  }
});

// Create a (Razorpay) order
router.post('/create-order', verifyToken, async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ success: false, message: 'Booking ID required' });

    const booking = await Booking.findById(bookingId).populate('parkingLot');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const amountInPaise = Math.round((booking.totalAmount || 0) * 100);

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;


    if (keyId && keySecret) {
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const orderOptions = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_${booking._id}`,
        payment_capture: 1,
        notes: { bookingId: booking._id.toString() }
      };

      const order = await razorpay.orders.create(orderOptions);


      const payment = new Payment({
        booking: booking._id,
        user: req.user._id,
        amount: booking.totalAmount,
        status: 'pending',
        paymentMethod: 'razorpay',
        metadata: { razorpay_order_id: order.id }
      });
      await payment.save();

      return res.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: keyId
      });
    }

    
    const orderId = `order_${Date.now()}`;
    const payment = new Payment({
      booking: booking._id,
      user: req.user._id,
      amount: booking.totalAmount,
      status: 'pending',
      paymentMethod: 'razorpay',
      metadata: { razorpay_order_id: orderId }
    });
    await payment.save();

    res.json({
      success: true,
      orderId,
      amount: amountInPaise,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy'
    });
  } catch (error) {
    console.error('Create order failed:', error);
    res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
  }
});


router.post('/verify-payment', verifyToken, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment verification fields' });
    }

    const payment = await Payment.findOne({ 'metadata.razorpay_order_id': razorpay_order_id }).populate('booking');
    if (!payment) return res.status(404).json({ success: false, message: 'Payment/order not found' });


    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (secret) {
      const generatedSignature = crypto.createHmac('sha256', secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');
      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, message: 'Invalid signature' });
      }
    }


    payment.status = 'completed';
    if (!payment.metadata) payment.metadata = {};
    payment.metadata.razorpay_payment_id = razorpay_payment_id;
    await payment.save();

    // Update booking
    const booking = await Booking.findById(payment.booking._id);
    if (booking) {
      booking.status = 'confirmed';
      booking.paymentStatus = 'paid';
      await booking.save();
    }

    res.json({ success: true, message: 'Payment verified', paymentId: payment._id });
  } catch (error) {
    console.error('Payment verification failed:', error);
    res.status(500).json({ success: false, message: 'Payment verification failed', error: error.message });
  }
});


router.post('/refund', verifyToken, async (req, res) => {
  try {
    const { bookingId, reason } = req.body;
    if (!bookingId) return res.status(400).json({ success: false, message: 'Booking ID required' });


    const payment = await Payment.findOne({ booking: bookingId, status: 'completed' });
    if (!payment) return res.status(404).json({ success: false, message: 'Completed payment not found for booking' });

    payment.status = 'refunded';
    payment.refundAmount = payment.amount;
    payment.refundReason = reason || 'No reason provided';
    await payment.save();

    const booking = await Booking.findById(bookingId);
    if (booking) {
      booking.paymentStatus = 'refunded';
      await booking.save();
    }

    res.json({ success: true, message: 'Refund processed (mock)', paymentId: payment._id });
  } catch (error) {
    console.error('Refund failed:', error);
    res.status(500).json({ success: false, message: 'Refund failed', error: error.message });
  }
});

router.get("/history", verifyToken, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate({
        path: 'booking',
        populate: {
          path: 'parkingLot',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 });
    
    res.json({ success: true, payments });
  } catch (error) {
    console.error("Error loading payment history:", error);
    res.status(500).json({ message: "Failed to load payment history", error: error.message });
  }
});

export default router;