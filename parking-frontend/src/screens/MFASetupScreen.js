import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Image } from 'react-native';
import { TextInput, Button, Card, Title, Text, Paragraph } from 'react-native-paper';
import { authAPI } from '../services/api';
export default function MFASetupScreen({ navigation }) {
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(true);
  useEffect(() => {
    setupMFA();
  }, []);
  const setupMFA = async () => {
    try {
      const response = await authAPI.mfaSetup();
      setQrCode(response.data.qrDataUrl);
      setSecret(response.data.base32);
    } catch (error) {
      Alert.alert('Error', 'Failed to setup MFA');
    } finally {
      setSetupLoading(false);
    }
  };
  const verifySetup = async () => {
    if (!verificationCode) {
      Alert.alert('Error', 'Please enter verification code');
      return;
    }
    setLoading(true);
    try {
      await authAPI.mfaVerifySetup(verificationCode);
      Alert.alert('Success', 'MFA enabled successfully', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };
  if (setupLoading) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Setting up MFA...</Title>
          </Card.Content>
        </Card>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Setup Two-Factor Authentication</Title>
          <Paragraph style={styles.instructions}>
            1. Install an authenticator app (Google Authenticator, Authy, etc.)
          </Paragraph>
          <Paragraph style={styles.instructions}>
            2. Scan the QR code below or enter the secret manually
          </Paragraph>
          <Paragraph style={styles.instructions}>
            3. Enter the 6-digit code from your authenticator app
          </Paragraph>
          {qrCode && (
            <View style={styles.qrContainer}>
              <Image source={{ uri: qrCode }} style={styles.qrCode} />
            </View>
          )}

          <TextInput
            label="Verification Code"
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="numeric"
            maxLength={6}
            mode="outlined"
            style={styles.input}
          />
          <Button
            mode="contained"
            onPress={verifySetup}
            loading={loading}
            style={styles.button}
          >
            Verify & Enable MFA
          </Button>
          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            style={styles.linkButton}
          >
            Skip for now
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 8,
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  qrCode: {
    width: 200,
    height: 200,
  },

  input: {
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