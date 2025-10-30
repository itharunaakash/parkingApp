import React, { useState } from 'react';
import { Platform } from 'react-native';
import { Button, Modal, Portal, Card, Title } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
export default function SimpleDatePicker({ visible, onDismiss, date, onConfirm }) {
  const [selectedDate, setSelectedDate] = useState(date || new Date());
  const handleDateChange = (event, newDate) => {
    if (newDate) {
      setSelectedDate(newDate);
    }
  };
  const handleConfirm = () => {
    onConfirm({ date: selectedDate });
  };
  if (Platform.OS === 'web') {
    return (
      <Portal>
        <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ margin: 20 }}>
          <Card>
            <Card.Content>
              <Title>Select Date</Title>
              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                style={{ padding: 10, margin: 10, width: '100%' }}
              />
              <Button mode="contained" onPress={handleConfirm}>
                Confirm
              </Button>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    );
  }
  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss}>
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
        <Button mode="contained" onPress={handleConfirm}>
          Confirm
        </Button>
      </Modal>
    </Portal>
  );
}