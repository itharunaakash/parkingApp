import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Title, TextInput, Button, List, Chip, SegmentedButtons, Paragraph } from 'react-native-paper';
import { bookingAPI } from '../services/api';
export default function BookingScreen({ navigation, route }) {
  const [activeTab, setActiveTab] = useState(route.params?.action || 'search');
  const [licensePlate, setLicensePlate] = useState('');
  const [searchParams, setSearchParams] = useState({
    location: '',
    startDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endDate: new Date().toISOString().split('T')[0],
    endTime: '11:00',
    vehicleType: 'car'
  });
  const [availableLots, setAvailableLots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [waitingList, setWaitingList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cancellingBookings, setCancellingBookings] = useState({});
  useEffect(() => {
    if (activeTab === 'history' || activeTab === 'cancel') {
      loadBookings();
    } else if (activeTab === 'waiting') {
      loadWaitingList();
    }
  }, [activeTab]);
  useEffect(() => {
    const action = route.params?.action;
    if (action === 'history' || action === 'cancel') {
      loadBookings();
    } else if (action === 'waiting') {
      loadWaitingList();
    }
  }, []);
  const loadBookings = async () => {
    setLoading(true);
    try {
      console.log('Loading bookings...');
      const response = await bookingAPI.getMyBookings();
      console.log('Bookings loaded:', response.data.bookings);
      if (Array.isArray(response.data.bookings)) {
        setBookings(response.data.bookings);
      } else {
        console.error('Invalid bookings data:', response.data);
        setBookings([]);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      Alert.alert('Error', 'Failed to load bookings');
      setBookings([]); 
    } finally {
      setLoading(false);
    }
  };
  const searchParkingLots = async () => {
    setLoading(true);
    try {
      const startDateTime = new Date(`${searchParams.startDate}T${searchParams.startTime}:00`);
      const endDateTime = new Date(`${searchParams.endDate}T${searchParams.endTime}:00`);
      const response = await bookingAPI.search({
        location: searchParams.location || undefined,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        vehicleType: searchParams.vehicleType,
        timezone: 'UTC'
      });
      setAvailableLots(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to search parking lots');
    } finally {
      setLoading(false);
    }
  };
  const createBooking = async (lot) => {
    try {
      setLoading(true);
      console.log('Starting booking process...');
      if (!licensePlate.trim()) {
        Alert.alert('Error', 'Please enter vehicle license plate');
        setLoading(false);
        return;
      }
      console.log('Parsing dates:', {
        startDate: searchParams.startDate,
        startTime: searchParams.startTime,
        endDate: searchParams.endDate,
        endTime: searchParams.endTime
      });
      const startDateTime = new Date(`${searchParams.startDate}T${searchParams.startTime}:00`);
      const endDateTime = new Date(`${searchParams.endDate}T${searchParams.endTime}:00`);
      console.log('Parsed dates:', {
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString()
      });
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        Alert.alert('Error', 'Please enter valid dates and times');
        setLoading(false);
        return;
      }
      if (startDateTime >= endDateTime) {
        Alert.alert('Error', 'End time must be after start time');
        setLoading(false);
        return;
      }
      const now = new Date();
      console.log('Time comparison:', {
        now: now.toISOString(),
        startDateTime: startDateTime.toISOString()
      });
      if (startDateTime < now) {
        Alert.alert('Error', 'Start time cannot be in the past');
        setLoading(false);
        return;
      }
      const bookingData = {
        parkingLot: lot._id,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        vehicleDetails: {
          type: searchParams.vehicleType || 'car',
          licensePlate: licensePlate.trim().toUpperCase()
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone 
      };
      console.log('Creating booking with data:', JSON.stringify(bookingData, null, 2));
      const response = await bookingAPI.create(bookingData);
      console.log('Booking response:', response.data);
      if (!response || !response.data) {
        throw new Error('No response received from server');
      }
      if (response.data.waitingListId) {
        Alert.alert(
          'Added to Waiting List',
          'No spots available. You have been added to the waiting list.',
          [{ text: 'OK', onPress: () => {
            setActiveTab('waiting');
            loadWaitingList();
          }}]
        );
        return;
      }
      Alert.alert(
        'Success',
        'Booking created successfully',
        [
          {
            text: 'Pay Now',
            onPress: () => navigation.navigate('Payment', { booking: response.data })
          },
          {
            text: 'Later',
            onPress: () => {
              setActiveTab('history');
              loadBookings();
            }
          }
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Booking error:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      let errorMessage = 'Failed to create booking';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.map(e => e.msg).join(', ');
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };
  const loadWaitingList = async () => {
    setLoading(true);
    try {
      const response = await bookingAPI.getWaitingList();
      setWaitingList(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load waiting list');
    } finally {
      setLoading(false);
    }
  };
  const createBookingFromWaiting = async (waitingEntry) => {
    try {
      const bookingData = {
        parkingLot: waitingEntry.parkingLot._id,
        startTime: waitingEntry.desiredStartTime,
        endTime: waitingEntry.desiredEndTime,
        vehicleDetails: waitingEntry.vehicleDetails
      };
      const response = await bookingAPI.create(bookingData);
      Alert.alert('Success', 'Booking created from waiting list!', [
        { text: 'Pay Now', onPress: () => navigation.navigate('Payment', { booking: response.data }) },
        { text: 'Later', onPress: () => { setActiveTab('history'); loadBookings(); } }
      ]);
      loadWaitingList();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create booking');
    }
  };
  const cancelBooking = async (bookingId) => {
    if (!bookingId) {
      Alert.alert('Error', 'Invalid booking ID');
      return;
    }
    const bookingToCancel = bookings.find(b => b._id === bookingId);
    if (!bookingToCancel) {
      Alert.alert('Error', 'Booking not found');
      return;
    }
    console.log('Attempting to cancel booking:', bookingId);
    console.log('Booking status:', bookingToCancel.status);
    if (!['pending', 'confirmed'].includes(bookingToCancel.status)) {
      Alert.alert('Error', 'This booking cannot be cancelled');
      return;
    }
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No' },
        {
          text: 'Yes',
          onPress: async () => {
              try {
                setCancellingBookings(prev => ({ ...prev, [bookingId]: true }));
                console.log('Attempting to cancel booking:', bookingId);
                const response = await bookingAPI.cancel(bookingId);
                console.log('Cancel API response:', response?.data || response);
                // Reload bookings from server to ensure UI matches backend state
                await loadBookings();
                Alert.alert(
                  'Success',
                  'Booking cancelled successfully',
                  [{ text: 'OK' }]
                );
            } catch (error) {
              console.error('Cancel booking error:', error);
              console.error('Error response:', error.response?.data);
              let errorMessage = 'Failed to cancel booking';
              if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
              }
              Alert.alert('Error', errorMessage);
              loadBookings();
            } finally {
              setCancellingBookings(prev => ({ ...prev, [bookingId]: false }));
            }
          }
        }
      ],
      { cancelable: true }
    );
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
      <SegmentedButtons
        value={activeTab}
        onValueChange={setActiveTab}
        style={styles.tabs}
        buttons={[
          { value: 'search', label: 'Search' },
          { value: 'history', label: 'History' },
          { value: 'cancel', label: 'Cancel' },
          { value: 'waiting', label: 'Waiting List' }
        ]}
      />
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        {(activeTab === 'search' || activeTab === 'create') ? (
          <>
            <Card style={styles.card}>
              <Card.Content>
                <Title>{activeTab === 'create' ? 'Create Booking' : 'Search Parking'}</Title>
                <TextInput
                  label="Location"
                  value={searchParams.location}
                  onChangeText={(text) => setSearchParams(prev => ({ ...prev, location: text }))}
                  mode="outlined"
                  style={styles.input}
                />
                <TextInput
                  label="Start Date (YYYY-MM-DD)"
                  value={searchParams.startDate}
                  onChangeText={(text) => setSearchParams(prev => ({ ...prev, startDate: text }))}
                  mode="outlined"
                  style={styles.input}
                  placeholder="Example: 2025-10-27"
                  keyboardType="numbers-and-punctuation"
                />
                <TextInput
                  label="Start Time (24-hour HH:MM)"
                  value={searchParams.startTime}
                  onChangeText={(text) => setSearchParams(prev => ({ ...prev, startTime: text }))}
                  mode="outlined"
                  style={styles.input}
                  placeholder="Example: 09:00 or 14:30"
                  keyboardType="numbers-and-punctuation"
                />
                <TextInput
                  label="End Date (YYYY-MM-DD)"
                  value={searchParams.endDate}
                  onChangeText={(text) => setSearchParams(prev => ({ ...prev, endDate: text }))}
                  mode="outlined"
                  style={styles.input}
                  placeholder="Example: 2025-10-27"
                  keyboardType="numbers-and-punctuation"
                />
                <TextInput
                  label="End Time (24-hour HH:MM)"
                  value={searchParams.endTime}
                  onChangeText={(text) => setSearchParams(prev => ({ ...prev, endTime: text }))}
                  mode="outlined"
                  style={styles.input}
                  placeholder="Example: 11:00 or 16:30"
                  keyboardType="numbers-and-punctuation"
                />
                <SegmentedButtons
                  value={searchParams.vehicleType}
                  onValueChange={(value) => setSearchParams(prev => ({ ...prev, vehicleType: value }))}
                  buttons={[
                    { value: 'car', label: 'Car' },
                    { value: 'bike', label: 'Bike' },
                    { value: 'truck', label: 'Truck' }
                  ]}
                  style={styles.input}
                />
                {activeTab === 'create' && (
                  <TextInput
                    label="Vehicle License Plate *"
                    value={licensePlate}
                    onChangeText={setLicensePlate}
                    mode="outlined"
                    style={styles.input}
                    placeholder="ABC123"
                  />
                )}
                <Button
                  mode="contained"
                  onPress={searchParkingLots}
                  loading={loading}
                  style={styles.button}
                >
                  {activeTab === 'create' ? 'Find Available Spots' : 'Search'}
                </Button>
              </Card.Content>
            </Card>
            {loading ? (
              <Card style={styles.card}>
                <Card.Content>
                  <Paragraph>Searching parking lots...</Paragraph>
                </Card.Content>
              </Card>
            ) : availableLots.length === 0 && searchParams.location ? (
              <Card style={styles.card}>
                <Card.Content>
                  <Paragraph>No parking lots found for your search criteria.</Paragraph>
                </Card.Content>
              </Card>
            ) : availableLots.map((lot) => (
              <Card key={lot._id} style={styles.card}>
                <Card.Content>
                  <Title>{lot.name}</Title>
                  <List.Item
                    title={`₹${lot.ratePerHour}/hour`}
                    description={`${lot.availableSpots || lot.actualAvailableSpots || 0} spots available`}
                    right={() => (
                      activeTab === 'create' ? (
                        <Button 
                          mode="contained" 
                          onPress={() => {
                            console.log('Book button pressed for lot:', lot);
                            console.log('Current state:', {
                              licensePlate,
                              searchParams,
                              loading,
                              availableSpots: lot.availableSpots || lot.actualAvailableSpots || 0
                            });
                            if (!licensePlate.trim()) {
                              Alert.alert('Error', 'Please enter a vehicle license plate');
                              return;
                            }
                            createBooking(lot);
                          }}
                          loading={loading}
                          disabled={loading}
                          style={styles.bookButton}
                        >
                          {loading ? 'Booking...' : 'Book Now'}
                        </Button>
                      ) : (
                        <Button 
                          mode="outlined" 
                          disabled
                        >
                          View Only
                        </Button>
                      )
                    )}
                  />
                  {lot.location && (
                    <Paragraph style={styles.locationText}>
                      📍 {lot.location.name} - {lot.location.address?.city}
                    </Paragraph>
                  )}
                </Card.Content>
              </Card>
            ))}
          </>
        ) : activeTab === 'history' ? (
          <>
            {loading ? (
              <Card style={styles.card}>
                <Card.Content>
                  <Paragraph>Loading bookings...</Paragraph>
                </Card.Content>
              </Card>
            ) : bookings.length === 0 ? (
              <Card style={styles.card}>
                <Card.Content>
                  <Paragraph>No booking history found.</Paragraph>
                </Card.Content>
              </Card>
            ) : bookings.map((booking) => (
              <Card key={booking._id} style={styles.card}>
                <Card.Content>
                  <Title>{booking.parkingLot?.name}</Title>
                  <List.Item
                    title={`${new Date(booking.startTime).toLocaleString()}`}
                    description={`Spot: ${booking.spotNumber} | ₹${booking.totalAmount}`}
                    right={() => (
                      <View style={styles.bookingActions}>
                        <Chip style={{ backgroundColor: getStatusColor(booking.status) }}>
                          {booking.status}
                        </Chip>
                        {booking.paymentStatus === 'pending' && (
                          <Button
                            mode="contained"
                            onPress={() => navigation.navigate('Payment', { booking })}
                          >
                            Pay
                          </Button>
                        )}
                      </View>
                    )}
                  />
                </Card.Content>
              </Card>
            ))}
          </>
        ) : activeTab === 'cancel' ? (
          <>
            {loading ? (
              <Card style={styles.card}>
                <Card.Content>
                  <Paragraph>Loading bookings...</Paragraph>
                </Card.Content>
              </Card>
            ) : bookings.length === 0 ? (
              <Card style={styles.card}>
                <Card.Content>
                  <Paragraph>No bookings found.</Paragraph>
                </Card.Content>
              </Card>
            ) : bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length === 0 ? (
              <Card style={styles.card}>
                <Card.Content>
                  <Paragraph>No cancellable bookings available.</Paragraph>
                </Card.Content>
              </Card>
            ) : bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').map((booking) => (
              <Card key={booking._id} style={styles.card}>
                <Card.Content>
                  <Title>{booking.parkingLot?.name}</Title>
                  <List.Item
                    title={`${new Date(booking.startTime).toLocaleString()}`}
                    description={`Spot: ${booking.spotNumber} | ₹${booking.totalAmount}`}
                    right={() => (
                      <View style={styles.bookingActions}>
                        <Chip style={{ backgroundColor: getStatusColor(booking.status) }}>
                          {booking.status}
                        </Chip>
                        <Button
                          mode="contained"
                          onPress={() => cancelBooking(booking._id)}
                          style={[styles.cancelButton, { backgroundColor: '#FF5252' }]}
                          loading={cancellingBookings[booking._id]}
                          disabled={cancellingBookings[booking._id] || booking.status === 'cancelled'}
                          labelStyle={{ color: 'white' }}
                        >
                          {cancellingBookings[booking._id] ? 'Cancelling...' : 'Cancel Booking'}
                        </Button>
                      </View>
                    )}
                  />
                </Card.Content>
              </Card>
            ))}
          </>
        ) : activeTab === 'waiting' ? (
          <>
            {loading ? (
              <Card style={styles.card}>
                <Card.Content>
                  <Paragraph>Loading waiting list...</Paragraph>
                </Card.Content>
              </Card>
            ) : waitingList.length === 0 ? (
              <Card style={styles.card}>
                <Card.Content>
                  <Paragraph>No waiting list entries found.</Paragraph>
                </Card.Content>
              </Card>
            ) : waitingList.map((entry) => (
              <Card key={entry._id} style={styles.card}>
                <Card.Content>
                  <Title>{entry.parkingLot?.name}</Title>
                  <List.Item
                    title={`${new Date(entry.desiredStartTime).toLocaleString()}`}
                    description={`Vehicle: ${entry.vehicleDetails.type} - ${entry.vehicleDetails.licensePlate}`}
                    right={() => (
                      <View style={styles.waitingActions}>
                        <Chip style={{ backgroundColor: entry.status === 'notified' ? '#4CAF50' : '#FF9800' }}>
                          {entry.status}
                        </Chip>
                        {entry.status === 'notified' && (
                          <Button
                            mode="contained"
                            onPress={() => createBookingFromWaiting(entry)}
                            style={styles.bookNowButton}
                          >
                            Book Now
                          </Button>
                        )}
                      </View>
                    )}
                  />
                </Card.Content>
              </Card>
            ))}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabs: {
    margin: 16,
  },
  content: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  bookButton: {
    marginLeft: 8,
    minWidth: 120,
  },
  scrollContent: {
    paddingBottom: 100,
    minHeight: '100%',
  },
  card: {
    margin: 16,
    marginVertical: 8,
  },
  input: {
    marginBottom: 16,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeButton: {
    flex: 0.48,
  },
  button: {
    marginTop: 16,
  },
  bookingActions: {
    alignItems: 'flex-end',
  },
  cancelButton: {
    marginTop: 8,
  },
  waitingActions: {
    alignItems: 'flex-end',
  },
  bookNowButton: {
    marginTop: 8,
  },
  locationText: {
    marginTop: 8,
    color: '#666',
    fontSize: 12,
  },
});