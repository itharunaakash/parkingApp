import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Title, Button, TextInput, List, IconButton, FAB, Dialog, Portal } from 'react-native-paper';
import { adminAPI } from '../services/api';
export default function AdminLocationsScreen({ navigation, route }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: { city: '', state: '', zipCode: '', country: '' },
    coordinates: { latitude: '', longitude: '' }
  });
  const { action } = route.params || {};
  useEffect(() => {
    loadLocations();
    if (action === 'create') {
      handleAddLocation();
    }
  }, [action]);
  const loadLocations = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getLocations();
      setLocations(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  };
  const handleAddLocation = () => {
    setEditingLocation(null);
    setFormData({
      name: '',
      address: { city: '', state: '', zipCode: '', country: '' },
      coordinates: { latitude: '', longitude: '' }
    });
    setDialogVisible(true);
  };
  const handleEditLocation = (location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      address: location.address,
      coordinates: location.coordinates
    });
    setDialogVisible(true);
  };
  const handleSaveLocation = async () => {
    try {
      setSaving(true);
      if (!formData.name || !formData.address.city) {
        Alert.alert('Error', 'Please fill in the location name and city');
        return;
      }
      const latitude = parseFloat(formData.coordinates.latitude);
      const longitude = parseFloat(formData.coordinates.longitude);
      if (isNaN(latitude) || latitude < -90 || latitude > 90) {
        Alert.alert('Error', 'Please enter a valid latitude (-90 to 90)');
        return;
      }
      if (isNaN(longitude) || longitude < -180 || longitude > 180) {
        Alert.alert('Error', 'Please enter a valid longitude (-180 to 180)');
        return;
      }
      const locationData = {
        name: formData.name.trim(),
        address: {
          city: formData.address.city.trim(),
          state: formData.address.state?.trim() || '',
          zipCode: formData.address.zipCode?.trim() || '',
          country: formData.address.country?.trim() || ''
        },
        coordinates: {
          latitude: latitude,
          longitude: longitude
        }
      };
      console.log('Saving location data:', locationData);
      if (editingLocation) {
        console.log('Updating location with ID:', editingLocation._id);
        await adminAPI.updateLocation(editingLocation._id, locationData);
      } else {
        console.log('Creating new location');
        await adminAPI.createLocation(locationData);
      }
      await loadLocations(); 
      setDialogVisible(false); 
      Alert.alert(
        'Success',
        editingLocation ? 'Location updated successfully' : 'Location created successfully'
      );
    } catch (error) {
      console.error('Error saving location:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to save location. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };
  const handleDeleteLocation = (location) => {
    Alert.alert(
      'Delete Location',
      `Are you sure you want to delete "${location.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminAPI.deleteLocation(location._id);
              Alert.alert('Success', 'Location deleted successfully');
              loadLocations();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete location');
            }
          }
        }
      ]
    );
  };
  return (
    <View style={styles.container}>
      <ScrollView>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Location Management</Title>
            {locations.map((location) => (
              <List.Item
                key={location._id}
                title={location.name}
                description={`${location.address.city}, ${location.address.state}`}
                left={(props) => <List.Icon {...props} icon="map-marker" />}
                right={() => (
                  <View style={styles.actionButtons}>
                    <IconButton
                      icon="pencil"
                      size={20}
                      onPress={() => handleEditLocation(location)}
                    />
                    <IconButton
                      icon="delete"
                      size={20}
                      onPress={() => handleDeleteLocation(location)}
                    />
                  </View>
                )}
              />
            ))}
          </Card.Content>
        </Card>
      </ScrollView>
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleAddLocation}
      />
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>{editingLocation ? 'Edit Location' : 'Add Location'}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Location Name *"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="City *"
              value={formData.address.city}
              onChangeText={(text) => setFormData({ 
                ...formData, 
                address: { ...formData.address, city: text }
              })}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="State"
              value={formData.address.state}
              onChangeText={(text) => setFormData({ 
                ...formData, 
                address: { ...formData.address, state: text }
              })}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Zip Code"
              value={formData.address.zipCode}
              onChangeText={(text) => setFormData({ 
                ...formData, 
                address: { ...formData.address, zipCode: text }
              })}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Country"
              value={formData.address.country}
              onChangeText={(text) => setFormData({ 
                ...formData, 
                address: { ...formData.address, country: text }
              })}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Latitude *"
              value={formData.coordinates.latitude.toString()}
              onChangeText={(text) => setFormData({ 
                ...formData, 
                coordinates: { ...formData.coordinates, latitude: text }
              })}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              label="Longitude *"
              value={formData.coordinates.longitude.toString()}
              onChangeText={(text) => setFormData({ 
                ...formData, 
                coordinates: { ...formData.coordinates, longitude: text }
              })}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => setDialogVisible(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button 
              onPress={handleSaveLocation}
              loading={saving}
              disabled={saving}
              mode="contained"
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  input: {
    marginBottom: 12,
  },
});