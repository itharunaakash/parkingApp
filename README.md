# parkingApp

Smart Parking — fullstack demo project (backend + frontend).

This repository contains two folders:

- `parking-backend/` — Express/MongoDB backend API
- `parking-frontend/` — React Native / React Web frontend

## Quick start

Prerequisites:
- Node.js 16+ and npm
- MongoDB instance (local or Atlas)

### Backend

1. Install dependencies

```bash
cd parking-backend
npm install
```

2. Create a `.env` file in `parking-backend/` with at least the following:

```ini
MONGODB_URI=mongodb://localhost:27017/parkingdb
JWT_SECRET=your_jwt_secret
PORT=5001
# Optional for Razorpay integration
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=rzp_secret_xxx
```

3. Start backend (development)

```bash
npm run dev
```

The backend listens by default on `http://localhost:5001`.

### Frontend

1. Install dependencies

```bash
cd parking-frontend
npm install
```

2. Start the frontend (web)

```bash
npm start
```

The frontend expects the backend API at `http://localhost:5001/api` (see `parking-frontend/src/services/api.js`).

## Notes

- There are sample routes for payments (Razorpay), bookings, admin, and auth (including MFA). For production you should integrate real Razorpay orders and secure environment variables.
- Use the `Test Payment (Dummy)` button in the UI for quick testing without Razorpay.

## License

MIT
