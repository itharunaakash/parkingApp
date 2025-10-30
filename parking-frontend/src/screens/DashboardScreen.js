import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Platform } from 'react-native';
import { Card, Title, Paragraph, Button, FAB, List, Chip } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bookingAPI, paymentAPI, dashboardAPI } from '../services/api';
export default function DashboardScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadUserData();
    loadDashboardData();
  }, []);
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const refresh = navigation?.getState()?.routes?.find(
        route => route.name === 'Dashboard'
      )?.params?.refresh;
      if (refresh) {
        loadDashboardData();
      }
    });
    return unsubscribe;
  }, [navigation]);
  const loadUserData = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  };
  const loadDashboardData = async () => {
    try {
      const [bookingsRes, paymentsRes] = await Promise.all([
        bookingAPI.getMyBookings({ limit: 5 }),
        paymentAPI.getHistory()
      ]);
      setBookings(bookingsRes.data.bookings || []);
      setPayments(paymentsRes.data.payments || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    navigation.navigate('Login');
  };
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'cancelled': return '#F44336';
      default: return '#757575';
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.scrollContainer}>
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <Title>Customer Dashboard</Title>
            <Paragraph>Welcome, {user?.username}!</Paragraph>
          </Card.Content>
        </Card>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Parking Services</Title>
            <List.Item
              title="Find Parkings"
              description="Search available parking lots"
              left={(props) => <List.Icon {...props} icon="map-search" />}
              onPress={() => navigation.navigate('Booking', { action: 'search' })}
            />
            <List.Item
              title="Create Booking"
              description="Book a parking spot"
              left={(props) => <List.Icon {...props} icon="plus-circle" />}
              onPress={() => navigation.navigate('Booking', { action: 'create' })}
            />
            <List.Item
              title="Booking History"
              description="View all your bookings"
              left={(props) => <List.Icon {...props} icon="history" />}
              onPress={() => navigation.navigate('Booking', { action: 'history' })}
            />
            <List.Item
              title="Cancel Booking"
              description="Cancel existing bookings"
              left={(props) => <List.Icon {...props} icon="cancel" />}
              onPress={() => navigation.navigate('Booking', { action: 'cancel' })}
            />
            <List.Item
              title="Waiting List"
              description="View waiting list status"
              left={(props) => <List.Icon {...props} icon="clock-outline" />}
              onPress={() => navigation.navigate('Booking', { action: 'waiting' })}
            />
          </Card.Content>
        </Card>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Payment Services</Title>
            <List.Item
              title="Payment History"
              description="View all payment transactions"
              left={(props) => <List.Icon {...props} icon="credit-card" />}
              onPress={() => navigation.navigate('Payment', { action: 'history' })}
            />
          </Card.Content>
        </Card>
        <Button 
          mode="outlined" 
          icon="shield-check"
          onPress={() => navigation.navigate('MFASetup')}
          style={styles.mfaButton}
        >
          Setup Two-Factor Authentication
        </Button>
        <Button mode="text" onPress={handleLogout} style={styles.logoutButton}>
          Logout
        </Button>
      </View>
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('Booking', { action: 'search' })}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
    ...(Platform.OS === 'web' && { 
      height: '100vh', 
      overflowY: 'auto',
      paddingBottom: 80
    }),
  },
  welcomeCard: {
    margin: 16,
    marginBottom: 8,
  },
  card: {
    margin: 16,
    marginVertical: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  mfaButton: {
    margin: 16,
    marginBottom: 8,
  },
  logoutButton: {
    margin: 16,
    marginTop: 0,
  },
});