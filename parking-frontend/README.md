# Parking App Frontend

React Native mobile app with Google Material Design for parking management system.

## Features

- **Login**: Username/password authentication with MFA support
- **Register**: User registration with role selection (customer/admin)
- **MFA Setup**: Two-factor authentication setup with QR code
- **MFA Verification**: Login verification using authenticator app

## Tech Stack

- React Native with Expo
- React Native Paper (Material Design)
- React Navigation
- Axios for API calls
- AsyncStorage for token management

## Installation

```bash
cd parking-frontend
npm install
npm start
```

## API Configuration

Update the API base URL in `src/services/api.js`:
```javascript
const API_BASE_URL = 'http://your-backend-url:3000/api';
```

## Screens

1. **LoginScreen**: Username/password login with MFA redirect
2. **RegisterScreen**: User registration form with role selection
3. **MFASetupScreen**: QR code display and verification setup
4. **MFAVerifyScreen**: 6-digit code verification for login

## Backend Integration

The app integrates with the following backend endpoints:
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/mfa/setup` - MFA setup
- `POST /auth/mfa/verify-setup` - MFA verification setup
- `POST /auth/mfa/verify` - MFA login verification