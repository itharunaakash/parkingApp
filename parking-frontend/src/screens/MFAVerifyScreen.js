import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Card, Title, Paragraph } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';
export default function MFAVerifyScreen({ navigation }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit code');
      return;
    }
    setLoading(true);
    try {
      const tempToken = await AsyncStorage.getItem('tempToken');
      if (!tempToken) {
        Alert.alert('Error', 'Session expired. Please login again.');
        navigation.navigate('Login');
        return;
      }
      const response = await authAPI.mfaVerify(tempToken, code);
      await AsyncStorage.removeItem('tempToken');
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      if (response.data.user.role === 'admin') {
        navigation.navigate('AdminDashboard');
      } else {
        navigation.navigate('Dashboard');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Two-Factor Authentication</Title>
          <Paragraph style={styles.instructions}>
            Enter the 6-digit code from your authenticator app
          </Paragraph>
          <TextInput
            label="Verification Code"
            value={code}
            onChangeText={setCode}
            keyboardType="numeric"
            maxLength={6}
            mode="outlined"
            style={styles.input}
            autoFocus
          />
          <Button
            mode="contained"
            onPress={handleVerify}
            loading={loading}
            style={styles.button}
          >
            Verify
          </Button>
          <Button
            mode="text"
            onPress={() => navigation.navigate('Login')}
            style={styles.linkButton}
          >
            Back to Login
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  card: {
    padding: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
  },
  instructions: {
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
  },
  linkButton: {
    marginTop: 8,
  },
});