import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { TextInput, Button, Card, Title, SegmentedButtons } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';
export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    role: 'customer'
  });
  const [loading, setLoading] = useState(false);
  const handleRegister = async () => {
    const { username, password, email } = formData;
    if (!username || !password || !email) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const response = await authAPI.register(formData);
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      Alert.alert('Success', 'Registration successful! Would you like to set up two-factor authentication for enhanced security?', [
        { text: 'Skip', onPress: () => navigation.navigate('Login') },
        { text: 'Setup MFA', onPress: () => navigation.navigate('MFASetup') }
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Register</Title>
          <TextInput
            label="Username"
            value={formData.username}
            onChangeText={(value) => updateField('username', value)}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Email"
            value={formData.email}
            onChangeText={(value) => updateField('email', value)}
            keyboardType="email-address"
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Password"
            value={formData.password}
            onChangeText={(value) => updateField('password', value)}
            secureTextEntry
            mode="outlined"
            style={styles.input}
          />
          <SegmentedButtons
            value={formData.role}
            onValueChange={(value) => updateField('role', value)}
            buttons={[
              { value: 'customer', label: 'Customer' },
              { value: 'admin', label: 'Admin' }
            ]}
            style={styles.segmented}
          />
          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            style={styles.button}
          >
            Register
          </Button>
          <Button
            mode="text"
            onPress={() => navigation.navigate('Login')}
            style={styles.linkButton}
          >
            Already have an account? Login
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    padding: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  segmented: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
  },
  linkButton: {
    marginTop: 8,
  },
});