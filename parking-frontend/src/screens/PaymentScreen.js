import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Card, Title, Button, List, Chip, Paragraph } from 'react-native-paper';
import RazorpayCheckout from 'react-native-razorpay';
import { paymentAPI } from '../services/api';
export default function PaymentScreen({ navigation, route }) {
  const [activeTab, setActiveTab] = useState(route.params?.action || (route.params?.booking ? 'pay' : 'history'));
  const [booking, setBooking] = useState(route.params?.booking);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (activeTab === 'history') loadPaymentHistory();
  }, [activeTab]);
  const loadPaymentHistory = async () => {
    setLoading(true);
    try {
      const response = await paymentAPI.getHistory();
      setPayments(response.data.payments || []);
    } catch (error) {
      console.error('Payment history error:', error);
      Alert.alert('Error', 'Failed to load payment history');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };
  const processPayment = async () => {
    if (!booking || !booking._id) {
      Alert.alert('Error', 'No booking found or invalid booking data');
      return;
    }
    
    try {
      setLoading(true);
      const orderRes = await paymentAPI.createOrder({ bookingId: booking._id });
      const order = orderRes.data;
      if (!order || !order.orderId) {
        Alert.alert('Error', 'Failed to create Razorpay order');
        setLoading(false);
        return;
      }

      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: 'Smart Parking',
        description: 'Parking Fee Payment',
        order_id: order.orderId,
        prefill: {
          name: 'User',
          email: 'user@example.com',
          contact: '9999999999',
        },
        theme: { color: '#3b82f6' },
      };

      if (Platform.OS === 'web') {
        // Web Razorpay
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        script.onload = () => {
          const rzp = new window.Razorpay({
            ...options,
            handler: async function (response) {
              await handlePaymentSuccess(response);
            },
          });
          rzp.open();
        };
      } else {
        // Mobile - Razorpay doesn't work reliably
        Alert.alert('Info', 'Razorpay is not available on mobile. Please use Test Payment (Dummy) button instead.');
      }
    } catch (error) {
      console.error('Payment process error:', error);
      Alert.alert('Error', error.description || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (response) => {
    try {
      const verifyRes = await paymentAPI.verifyPayment({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      });
      if (verifyRes.data.success) {
        Alert.alert('Success', 'Payment completed successfully', [
          { text: 'OK', onPress: () => navigation.navigate('Dashboard') },
        ]);
      } else {
        Alert.alert('Error', 'Payment verification failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Payment verification failed');
    }
  };
  const requestRefund = async (payment) => {
    Alert.alert(
      'Request Refund',
      'Are you sure you want to request a refund?',
      [
        { text: 'Cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await paymentAPI.refund(payment.booking._id, 'Customer requested');
              Alert.alert('Success', 'Refund requested successfully');
              loadPaymentHistory();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to process refund');
            }
          },
        },
      ]
    );
  };
  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'failed': return '#F44336';
      case 'refunded': return '#9C27B0';
      default: return '#757575';
    }
  };
  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {activeTab === 'pay' ? (
          <>
            {booking ? (
              <Card style={styles.card}>
                <Card.Content>
                  <Title>Payment Details</Title>
                  <List.Item
                    title={booking.parkingLot?.name || 'Parking Booking'}
                    description={`${new Date(booking.startTime).toLocaleString()}`}
                  />
                  <List.Item
                    title="Amount"
                    description={`₹${booking.totalAmount}`}
                    titleStyle={styles.amountTitle}
                  />
                  {}
                  <Button
                    mode="contained"
                    onPress={processPayment}
                    loading={loading}
                    disabled={!booking}
                    style={styles.button}
                  >
                    Pay ₹{booking?.totalAmount || 0}
                  </Button>
                  {}
                  <Button
                    mode="outlined"
                    onPress={async () => {
                      if (!booking || !booking._id) {
                        Alert.alert('Error', 'No booking found');
                        return;
                      }
                      try {
                        setLoading(true);
                        const response = await paymentAPI.testPayment(booking._id, booking.totalAmount);
                        if (response.data.success) {
                          Alert.alert(
                            'Payment Successful', 
                            'Your booking has been confirmed and the slot is reserved.',
                            [
                              { 
                                text: 'View Bookings', 
                                onPress: () => {
                                  navigation.navigate('Dashboard', { 
                                    refresh: true,
                                    initialTab: 'bookings'
                                  });
                                }
                              }
                            ]
                          );
                        }
                      } catch (error) {
                        console.error('Dummy payment error:', error);
                        let errorMessage = 'Failed to process payment. Please try again.';
                        if (error.response?.data?.message) {
                          errorMessage = error.response.data.message;
                        } else if (error.message?.includes('Network Error')) {
                          errorMessage = 'Cannot connect to server. Please check your internet connection and ensure the backend server is running.';
                        }
                        Alert.alert('Payment Failed', errorMessage);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    loading={loading}
                    disabled={!booking}
                    style={[styles.button, styles.testButton]}
                  >
                    Test Payment (Dummy)
                  </Button>
                </Card.Content>
              </Card>
            ) : (
              <Paragraph style={styles.noBookingText}>
                No pending payment. Select a booking from your booking history to make payment.
              </Paragraph>
            )}
          </>
        ) : (
          <>
            {payments.length === 0 ? (
              <Card style={styles.card}>
                <Card.Content>
                  <Paragraph>No payment history found.</Paragraph>
                </Card.Content>
              </Card>
            ) : (
              payments.map((payment) => (
                <Card key={payment._id} style={styles.card}>
                  <Card.Content>
                    <List.Item
                      title={`₹${payment.amount}`}
                      description={`${new Date(payment.createdAt).toLocaleDateString()} - ${payment.paymentMethod}`}
                      right={() => (
                        <View style={styles.paymentActions}>
                          <Chip style={{ backgroundColor: getPaymentStatusColor(payment.status) }}>
                            {payment.status}
                          </Chip>
                          {payment.status === 'completed' && (
                            <Button
                              mode="outlined"
                              onPress={() => requestRefund(payment)}
                              style={styles.refundButton}
                            >
                              Refund
                            </Button>
                          )}
                        </View>
                      )}
                    />
                    {payment.booking && (
                      <Paragraph style={styles.bookingInfo}>
                        Booking: {payment.booking.parkingLot?.name} - {payment.booking.spotNumber}
                      </Paragraph>
                    )}
                  </Card.Content>
                </Card>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', height: '100vh' },
  content: { flexGrow: 1, overflow: 'auto', maxHeight: '100%' },
  card: { margin: 16, marginVertical: 8 },
  button: { marginTop: 20 },
  testButton: { marginTop: 10, borderColor: '#666' },
  amountTitle: { fontSize: 18, fontWeight: 'bold' },
  paymentActions: { alignItems: 'flex-end' },
  refundButton: { marginTop: 8 },
  bookingInfo: { marginTop: 8, color: '#666' },
  noBookingText: { marginTop: 16, textAlign: 'center', color: '#666' },
});
