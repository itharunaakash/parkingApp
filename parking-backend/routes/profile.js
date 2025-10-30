import express from 'express';
import User from '../models/User.js';
import { verifyToken } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

router.get('/me', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password -mfaSecret');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

export default router;