import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Title, Paragraph, List, Chip, Button, Menu, Searchbar, FAB } from 'react-native-paper';
import { adminAPI } from '../services/api';
export default function AdminBookingsScreen({ navigation, route }) {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { filter } = route.params || {};
  useEffect(() => {
    if (filter) {
      setStatusFilter(filter);
    }
    loadBookings();
  }, [filter, statusFilter, currentPage]);
  useEffect(() => {
    filterBookings();
  }, [bookings, searchQuery, statusFilter]);
  const loadBookings = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 20
      };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const response = await adminAPI.getBookings(params);
      setBookings(response.data.bookings);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };
  const filterBookings = () => {
    let filtered = bookings;
    if (searchQuery) {
      filtered = filtered.filter(booking =>
        booking.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.parkingLot?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredBookings(filtered);
  };
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'cancelled': return '#F44336';
      case 'completed': return '#2196F3';
      default: return '#757575';
    }
  };
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const formatCurrency = (amount) => {
    return `₹${amount?.toFixed(2) || '0.00'}`;
  };
  return (
    <View style={styles.container}>
      <Card style={styles.filterCard}>
        <Card.Content>
          <Searchbar
            placeholder="Search by user or parking lot..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />
          <Menu
            visible={statusMenuVisible}
            onDismiss={() => setStatusMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setStatusMenuVisible(true)}
                style={styles.filterButton}
              >
                Status: {statusFilter === 'all' ? 'All' : statusFilter}
              </Button>
            }
          >
            <Menu.Item
              onPress={() => {
                setStatusFilter('all');
                setStatusMenuVisible(false);
              }}
              title="All"
            />
            <Menu.Item
              onPress={() => {
                setStatusFilter('pending');
                setStatusMenuVisible(false);
              }}
              title="Pending"
            />
            <Menu.Item
              onPress={() => {
                setStatusFilter('confirmed');
                setStatusMenuVisible(false);
              }}
              title="Confirmed"
            />
            <Menu.Item
              onPress={() => {
                setStatusFilter('completed');
                setStatusMenuVisible(false);
              }}
              title="Completed"
            />
            <Menu.Item
              onPress={() => {
                setStatusFilter('cancelled');
                setStatusMenuVisible(false);
              }}
              title="Cancelled"
            />
          </Menu>
        </Card.Content>
      </Card>
      <ScrollView>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Bookings ({filteredBookings.length})</Title>
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => (
                <Card key={booking._id} style={styles.bookingCard}>
                  <Card.Content>
                    <View style={styles.bookingHeader}>
                      <Title style={styles.bookingTitle}>
                        {booking.parkingLot?.name || 'Unknown Lot'}
                      </Title>
                      <Chip 
                        mode="outlined" 
                        textStyle={{ color: getStatusColor(booking.status) }}
                      >
                        {booking.status}
                      </Chip>
                    </View>
                    <List.Item
                      title="User"
                      description={booking.user?.username || 'Unknown User'}
                      left={(props) => <List.Icon {...props} icon="account" />}
                    />
                    <List.Item
                      title="Start Time"
                      description={formatDate(booking.startTime)}
                      left={(props) => <List.Icon {...props} icon="clock-start" />}
                    />
                    <List.Item
                      title="End Time"
                      description={formatDate(booking.endTime)}
                      left={(props) => <List.Icon {...props} icon="clock-end" />}
                    />
                    <List.Item
                      title="Total Amount"
                      description={formatCurrency(booking.totalAmount)}
                      left={(props) => <List.Icon {...props} icon="currency-usd" />}
                    />
                    <List.Item
                      title="Payment Status"
                      description={booking.paymentStatus || 'pending'}
                      left={(props) => <List.Icon {...props} icon="credit-card" />}
                    />
                    <Paragraph style={styles.bookingId}>
                      Booking ID: {booking._id}
                    </Paragraph>
                    {}
                    <View style={styles.actionButtons}>
                      {booking.status !== 'cancelled' && (
                        <Button
                          mode="outlined"
                          color="#F44336"
                          onPress={() => {
                            Alert.alert(
                              'Cancel Booking',
                              'Are you sure you want to cancel this booking?',
                              [
                                { text: 'No', style: 'cancel' },
                                { 
                                  text: 'Yes', 
                                  style: 'destructive',
                                  onPress: async () => {
                                    try {
                                      await adminAPI.updateBookingStatus(booking._id, 'cancelled');
                                      Alert.alert('Success', 'Booking cancelled successfully');
                                      loadBookings(); 
                                    } catch (error) {
                                      Alert.alert(
                                        'Error',
                                        error.response?.data?.message || 'Failed to cancel booking'
                                      );
                                    }
                                  }
                                }
                              ]
                            );
                          }}
                        >
                          Cancel Booking
                        </Button>
                      )}
                    </View>
                  </Card.Content>
                </Card>
              ))
            ) : (
              <Paragraph>No bookings found</Paragraph>
            )}
          </Card.Content>
        </Card>
        {}
        {totalPages > 1 && (
          <Card style={styles.paginationCard}>
            <Card.Content>
              <View style={styles.paginationContainer}>
                <Button
                  mode="outlined"
                  disabled={currentPage === 1}
                  onPress={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <Paragraph style={styles.pageInfo}>
                  Page {currentPage} of {totalPages}
                </Paragraph>
                <Button
                  mode="outlined"
                  disabled={currentPage === totalPages}
                  onPress={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('Booking', { action: 'create' })}
        label="New Booking"
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 8,
  },
  filterCard: {
    margin: 16,
    marginBottom: 8,
  },
  searchbar: {
    marginBottom: 12,
  },
  filterButton: {
    alignSelf: 'flex-start',
  },
  card: {
    margin: 16,
    marginTop: 8,
  },
  bookingCard: {
    marginVertical: 8,
    backgroundColor: '#fafafa',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingTitle: {
    fontSize: 18,
    flex: 1,
  },
  bookingId: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  paginationCard: {
    margin: 16,
    marginTop: 8,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageInfo: {
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
});