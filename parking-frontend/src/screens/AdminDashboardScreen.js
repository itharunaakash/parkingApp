import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, List, Chip, DataTable, FAB } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { adminAPI } from '../services/api';
export default function AdminDashboardScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({});
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadUserData();
    loadDashboardData();
  }, []);
  const loadUserData = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  };
  const loadDashboardData = async () => {
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getBookings({ limit: 5 })
      ]);
      setStats(statsRes.data);
      setRecentBookings(bookingsRes.data.bookings);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
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
      <ScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadDashboardData} />}
      >
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <Title>Admin Dashboard</Title>
            <Paragraph>Welcome, {user?.username}!</Paragraph>
          </Card.Content>
        </Card>
        {}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content>
              <Title style={styles.statNumber}>{stats.totalUsers || 0}</Title>
              <Paragraph>Total Users</Paragraph>
            </Card.Content>
          </Card>
          <Card style={styles.statCard}>
            <Card.Content>
              <Title style={styles.statNumber}>{stats.totalParkingLots || 0}</Title>
              <Paragraph>Parking Lots</Paragraph>
            </Card.Content>
          </Card>
        </View>
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content>
              <Title style={styles.statNumber}>{stats.totalBookings || 0}</Title>
              <Paragraph>Total Bookings</Paragraph>
            </Card.Content>
          </Card>
          <Card style={styles.statCard}>
            <Card.Content>
              <Title style={styles.statNumber}>₹{stats.totalRevenue || 0}</Title>
              <Paragraph>Total Revenue</Paragraph>
            </Card.Content>
          </Card>
        </View>
        {}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Location Management</Title>
            <List.Item
              title="View All Locations"
              description="Manage parking locations"
              left={(props) => <List.Icon {...props} icon="map-marker" />}
              onPress={() => navigation.navigate('AdminLocations', { action: 'list' })}
            />
            <List.Item
              title="Add New Location"
              description="Create a new parking location"
              left={(props) => <List.Icon {...props} icon="plus-circle" />}
              onPress={() => navigation.navigate('AdminLocations', { action: 'create' })}
            />
          </Card.Content>
        </Card>
        {}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Parking Lot Management</Title>
            <List.Item
              title="View All Parking Lots"
              description="Manage parking lots"
              left={(props) => <List.Icon {...props} icon="car" />}
              onPress={() => navigation.navigate('AdminParkingLots', { action: 'list' })}
            />
            <List.Item
              title="Add New Parking Lot"
              description="Create a new parking lot"
              left={(props) => <List.Icon {...props} icon="plus-circle" />}
              onPress={() => navigation.navigate('AdminParkingLots', { action: 'create' })}
            />
          </Card.Content>
        </Card>
        {}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Booking Management</Title>
            <List.Item
              title="All Bookings"
              description="View and manage all bookings"
              left={(props) => <List.Icon {...props} icon="calendar" />}
              onPress={() => navigation.navigate('AdminBookings')}
            />
            <List.Item
              title="Active Bookings"
              description={`${stats.activeBookings || 0} active bookings`}
              left={(props) => <List.Icon {...props} icon="clock" />}
              onPress={() => navigation.navigate('AdminBookings', { filter: 'confirmed' })}
            />
          </Card.Content>
        </Card>
        {}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Recent Bookings</Title>
            {recentBookings.length > 0 ? (
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>User</DataTable.Title>
                  <DataTable.Title>Lot</DataTable.Title>
                  <DataTable.Title>Status</DataTable.Title>
                </DataTable.Header>
                {recentBookings.map((booking) => (
                  <DataTable.Row key={booking._id}>
                    <DataTable.Cell>{booking.user?.username}</DataTable.Cell>
                    <DataTable.Cell>{booking.parkingLot?.name}</DataTable.Cell>
                    <DataTable.Cell>
                      <Chip 
                        mode="outlined" 
                        textStyle={{ color: getStatusColor(booking.status) }}
                      >
                        {booking.status}
                      </Chip>
                    </DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
            ) : (
              <Paragraph>No recent bookings</Paragraph>
            )}
          </Card.Content>
        </Card>
        <Button mode="text" onPress={handleLogout} style={styles.logoutButton}>
          Logout
        </Button>
      </ScrollView>
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AdminLocations', { action: 'create' })}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  welcomeCard: {
    margin: 16,
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 4,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
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
  logoutButton: {
    margin: 16,
  },
});