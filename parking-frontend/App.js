import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { Platform } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import MFASetupScreen from './src/screens/MFASetupScreen';
import MFAVerifyScreen from './src/screens/MFAVerifyScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import BookingScreen from './src/screens/BookingScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import AdminLocationsScreen from './src/screens/AdminLocationsScreen';
import AdminParkingLotsScreen from './src/screens/AdminParkingLotsScreen';
import AdminBookingsScreen from './src/screens/AdminBookingsScreen';
const Stack = createStackNavigator();
export default function App() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      document.body.style.overflow = 'auto';
      document.body.style.height = '100vh';
      document.documentElement.style.overflow = 'auto';
    }
  }, []);

  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Register' }} />
          <Stack.Screen name="MFASetup" component={MFASetupScreen} options={{ title: 'Setup MFA' }} />
          <Stack.Screen name="MFAVerify" component={MFAVerifyScreen} options={{ title: 'Verify MFA' }} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard', headerLeft: null }} />
          <Stack.Screen name="Booking" component={BookingScreen} options={{ title: 'Bookings' }} />
          <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Payments' }} />
          <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Admin Dashboard', headerLeft: null }} />
          <Stack.Screen name="AdminLocations" component={AdminLocationsScreen} options={{ title: 'Manage Locations' }} />
          <Stack.Screen name="AdminParkingLots" component={AdminParkingLotsScreen} options={{ title: 'Manage Parking Lots' }} />
          <Stack.Screen name="AdminBookings" component={AdminBookingsScreen} options={{ title: 'Manage Bookings' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}