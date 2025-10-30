import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Title, Button, TextInput, List, IconButton, FAB, Dialog, Portal, Menu, Chip } from 'react-native-paper';
import { adminAPI } from '../services/api';
export default function AdminParkingLotsScreen({ navigation, route }) {
  const [parkingLots, setParkingLots] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [locationMenuVisible, setLocationMenuVisible] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [editingLot, setEditingLot] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    locationName: 'Select Location',
    totalSpots: '',
    ratePerHour: '',
    status: 'active'
  });
  const { action } = route.params || {};
  useEffect(() => {
    loadData();
    if (action === 'create') {
      handleAddParkingLot();
    }
  }, [action]);
  const loadData = async () => {
    setLoading(true);
    try {
      const [lotsRes, locationsRes] = await Promise.all([
        adminAPI.getParkingLots(),
        adminAPI.getLocations()
      ]);
      setParkingLots(lotsRes.data);
      setLocations(locationsRes.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  const handleAddParkingLot = () => {
    setEditingLot(null);
    setFormData({
      name: '',
      location: '',
      locationName: 'Select Location',
      totalSpots: '',
      ratePerHour: '',
      status: 'active'
    });
    setDialogVisible(true);
  };
  const handleEditParkingLot = (lot) => {
    setEditingLot(lot);
    setFormData({
      name: lot.name,
      location: lot.location?._id || '',
      locationName: lot.location?.name || 'Select Location',
      totalSpots: lot.totalSpots.toString(),
      ratePerHour: lot.ratePerHour.toString(),
      status: lot.status
    });
    setDialogVisible(true);
  };
  const handleSaveParkingLot = async () => {
    try {
      setSaving(true);
      if (!formData.name || !formData.location || !formData.totalSpots || !formData.ratePerHour) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }
      const totalSpots = parseInt(formData.totalSpots);
      const ratePerHour = parseFloat(formData.ratePerHour);
      if (isNaN(totalSpots) || totalSpots <= 0) {
        Alert.alert('Error', 'Please enter a valid number of spots');
        return;
      }
      if (isNaN(ratePerHour) || ratePerHour < 0) {
        Alert.alert('Error', 'Please enter a valid rate per hour');
        return;
      }
      const lotData = {
        name: formData.name.trim(),
        location: formData.location,
        totalSpots: totalSpots,
        ratePerHour: ratePerHour,
        status: formData.status
      };
      console.log('Saving parking lot data:', lotData);
      if (editingLot) {
        console.log('Updating parking lot with ID:', editingLot._id);
        await adminAPI.updateParkingLot(editingLot._id, lotData);
      } else {
        console.log('Creating new parking lot');
        await adminAPI.createParkingLot(lotData);
      }
      await loadData(); 
      setDialogVisible(false);
      Alert.alert(
        'Success',
        editingLot ? 'Parking lot updated successfully' : 'Parking lot created successfully'
      );
    } catch (error) {
      console.error('Error saving parking lot:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to save parking lot. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };
  const handleDeleteParkingLot = (lot) => {
    Alert.alert(
      'Delete Parking Lot',
      `Are you sure you want to delete "${lot.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminAPI.deleteParkingLot(lot._id);
              Alert.alert('Success', 'Parking lot deleted successfully');
              loadData();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete parking lot');
            }
          }
        }
      ]
    );
  };
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'maintenance': return '#FF9800';
      case 'closed': return '#F44336';
      default: return '#757575';
    }
  };
  return (
    <View style={styles.container}>
      <ScrollView>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Parking Lot Management</Title>
            {parkingLots.map((lot) => (
              <List.Item
                key={lot._id}
                title={lot.name}
                description={`${lot.location?.name || 'Unknown Location'} • ${lot.totalSpots} spots • ₹${lot.ratePerHour}/hr`}
                left={(props) => <List.Icon {...props} icon="car" />}
                right={() => (
                  <View style={styles.rightContent}>
                    <Chip 
                      mode="outlined" 
                      textStyle={{ color: getStatusColor(lot.status) }}
                      style={styles.statusChip}
                    >
                      {lot.status}
                    </Chip>
                    <View style={styles.actionButtons}>
                      <IconButton
                        icon="pencil"
                        size={20}
                        onPress={() => handleEditParkingLot(lot)}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => handleDeleteParkingLot(lot)}
                      />
                    </View>
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
        onPress={handleAddParkingLot}
      />
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>{editingLot ? 'Edit Parking Lot' : 'Add Parking Lot'}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Parking Lot Name *"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              mode="outlined"
              style={styles.input}
            />
            <Menu
              visible={locationMenuVisible}
              onDismiss={() => setLocationMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setLocationMenuVisible(true)}
                  style={styles.input}
                >
                  {formData.locationName}
                </Button>
              }
            >
              {locations.map((location) => (
                <Menu.Item
                  key={location._id}
                  onPress={() => {
                    setFormData({
                      ...formData,
                      location: location._id,
                      locationName: location.name
                    });
                    setLocationMenuVisible(false);
                  }}
                  title={location.name}
                />
              ))}
            </Menu>
            <TextInput
              label="Total Spots *"
              value={formData.totalSpots}
              onChangeText={(text) => setFormData({ ...formData, totalSpots: text })}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              label="Rate per Hour (₹) *"
              value={formData.ratePerHour}
              onChangeText={(text) => setFormData({ ...formData, ratePerHour: text })}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />
            <Menu
              visible={statusMenuVisible}
              onDismiss={() => setStatusMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setStatusMenuVisible(true)}
                  style={styles.input}
                >
                  Status: {formData.status}
                </Button>
              }
            >
              <Menu.Item
                onPress={() => {
                  setFormData({ ...formData, status: 'active' });
                  setStatusMenuVisible(false);
                }}
                title="Active"
              />
              <Menu.Item
                onPress={() => {
                  setFormData({ ...formData, status: 'maintenance' });
                  setStatusMenuVisible(false);
                }}
                title="Maintenance"
              />
              <Menu.Item
                onPress={() => {
                  setFormData({ ...formData, status: 'closed' });
                  setStatusMenuVisible(false);
                }}
                title="Closed"
              />
            </Menu>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => setDialogVisible(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button 
              onPress={handleSaveParkingLot}
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
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusChip: {
    marginRight: 8,
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