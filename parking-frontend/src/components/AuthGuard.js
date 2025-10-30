import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
export default function AuthGuard({ children, navigation }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    checkAuth();
  }, []);
  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      if (token && userData) {
        const user = JSON.parse(userData);
        setIsAuthenticated(true);
        if (user.role === 'admin') {
          navigation.navigate('AdminDashboard');
        } else {
          navigation.navigate('Dashboard');
        }
      } else {
        navigation.navigate('Login');
      }
    } catch (error) {
      navigation.navigate('Login');
    } finally {
      setLoading(false);
    }
  };
  if (loading) return null;
  if (!isAuthenticated) return null;
  return children;
}