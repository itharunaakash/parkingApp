import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { verifyToken, isAdmin, isCustomer } from '../middleware/auth.js';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

const router = express.Router();

router.post('/register', async (req, res) => {
    console.log("Incoming register data:", req.body);
    try {
        const { username, password, email, role } = req.body;
        if (!username || !password || !email) {
            console.error(" Missing fields:", { username, password, email });
            return res.status(400).json({ message: "All fields are required" });
        }
        const existingUser = await User.findOne({ 
            $or: [{ username }, { email }]
        });
        if (existingUser) {
            console.error(" User already exists:", existingUser);
            return res.status(400).json({ 
                message: 'User already exists with this username or email' 
            });
        }
        const user = new User({
            username,
            password,
            email,
            role: role || 'customer' 
        });
        await user.save();
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        console.log(" User registered successfully:", user.username);
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Registration error message:", error.message);
        console.error(" Full stack trace:", error);
        res.status(400).json({ 
            message: 'Error registering user', 
            error: error.message 
        });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        if (user.mfaEnabled && user.mfaSecret) {
            const tempToken = jwt.sign(
                { userId: user._id, mfa: true },
                process.env.JWT_SECRET,
                { expiresIn: '5m' }
            );
            return res.json({
                message: 'MFA required',
                mfaRequired: true,
                tempToken
            });
        }
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
});

router.post('/mfa/setup', verifyToken, async (req, res) => {
    try {
        const user = req.user;
        const secret = speakeasy.generateSecret({
            name: `ParkingApp (${user.email})`,
            length: 20
        });
        user.mfaSecret = secret.base32;
        await user.save();
        const otpauthUrl = secret.otpauth_url;
        const qrDataUrl = await qrcode.toDataURL(otpauthUrl);
        res.json({
            message: 'MFA secret generated',
            otpauthUrl,
            qrDataUrl,
            base32: secret.base32
        });
    } catch (error) {
        console.error("MFA setup error:", error);
        res.status(500).json({ message: 'Error generating MFA secret', error: error.message });
    }
});

router.post('/mfa/verify-setup', verifyToken, async (req, res) => {
    try {
        const user = req.user;
        const { token } = req.body; 
        if (!user.mfaSecret) {
            return res.status(400).json({ message: 'No MFA secret found for user. Start setup first.' });
        }
        const verified = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: 'base32',
            token,
            window: 1
        });
        if (!verified) {
            return res.status(400).json({ message: 'Invalid MFA code' });
        }
        user.mfaEnabled = true;
        await user.save();
        res.json({ message: 'MFA enabled successfully' });
    } catch (error) {
        console.error("MFA verify setup error:", error);
        res.status(500).json({ message: 'Error verifying MFA setup', error: error.message });
    }
});

router.post('/mfa/verify', async (req, res) => {
    try {
        const { tempToken, code } = req.body;
        if (!tempToken || !code) {
            return res.status(400).json({ message: 'tempToken and code are required' });
        }
        let payload;
        try {
            payload = jwt.verify(tempToken, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ message: 'Invalid or expired temp token' });
        }
        if (!payload || !payload.userId || !payload.mfa) {
            return res.status(401).json({ message: 'Invalid temp token' });
        }
        const user = await User.findById(payload.userId);
        if (!user || !user.mfaEnabled || !user.mfaSecret) {
            return res.status(400).json({ message: 'MFA not enabled for this user' });
        }
        const verified = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: 'base32',
            token: code,
            window: 1
        });
        if (!verified) {
            return res.status(401).json({ message: 'Invalid MFA code' });
        }
        const finalToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        res.json({
            message: 'MFA verification successful',
            token: finalToken,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("MFA verify error:", error);
        res.status(500).json({ message: 'Error verifying MFA', error: error.message });
    }
});

export default router;