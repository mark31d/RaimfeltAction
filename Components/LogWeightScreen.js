import React, { useState, useContext } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, Image, TextInput, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import ConfirmModal from './ConfirmModal';
import { AppContext, todayISO } from '../App';

const C = {
  bg: '#0B1021', card: '#121A33', border: '#1D2850',
  text: '#EAF0FF', secondary: '#9AA6C3',
  accent: '#6EA8FF', success: '#2FE38C',
};

export default function LogWeightScreen({ navigation }) {
  const { addWeight, appState } = useContext(AppContext);
  const { profile } = appState;
  const units = profile.units || 'kg';

  const [inputDate, setInputDate] = useState(todayISO());
  const [inputVal, setInputVal] = useState('');
  const [modal, setModal] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const inputDateObj = new Date(inputDate + 'T12:00:00');

  const handleDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event?.type === 'set' && date) setInputDate(date.toISOString().slice(0, 10));
    } else if (date) {
      setInputDate(date.toISOString().slice(0, 10));
    }
  };

  const handleSave = () => {
    const val = Number(inputVal);
    if (!val || val <= 0) {
      setModal({ title: 'Invalid Weight', message: 'Please enter a valid weight.', showCancel: false });
      return;
    }
    addWeight({ dateISO: inputDate, weight: val });
    navigation.goBack();
  };

  const canSave = inputVal.trim() && Number(inputVal) > 0;

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Image
              source={require('../assets/ic_back.png')}
              style={s.backIcon}
              tintColor={C.text}
              resizeMode="contain"
              onError={() => {}}
            />
          </TouchableOpacity>
          <Text style={s.title}>Log Weight</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[s.saveBtn, !canSave && { opacity: 0.4 }]}
            disabled={!canSave}
          >
            <Text style={s.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          {/* Date selection */}
          <Text style={s.sectionLabel}>Date</Text>
          <TouchableOpacity
            style={s.datePickerBtn}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Text style={s.datePickerText}>
              {inputDateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
            <Text style={s.datePickerHint}>Tap to change</Text>
          </TouchableOpacity>

          {showDatePicker && Platform.OS === 'android' && (
            <DateTimePicker
              value={inputDateObj}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={handleDateChange}
            />
          )}

          {showDatePicker && Platform.OS === 'ios' && (
            <Modal visible transparent animationType="slide">
              <TouchableOpacity
                style={s.pickerOverlay}
                activeOpacity={1}
                onPress={() => setShowDatePicker(false)}
              >
                <View style={s.pickerContent} onStartShouldSetResponder={() => true}>
                  <DateTimePicker
                    value={inputDateObj}
                    mode="date"
                    display="spinner"
                    themeVariant="dark"
                    maximumDate={new Date()}
                    onChange={handleDateChange}
                    style={s.pickerNative}
                  />
                  <TouchableOpacity style={s.pickerDone} onPress={() => setShowDatePicker(false)}>
                    <Text style={s.pickerDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Modal>
          )}

          {/* Weight input */}
          <Text style={s.sectionLabel}>Weight ({units})</Text>
          <TextInput
            style={s.input}
            value={inputVal}
            onChangeText={setInputVal}
            placeholder={`e.g. 75.5`}
            placeholderTextColor={C.secondary}
            keyboardType="decimal-pad"
            autoFocus
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {modal && (
        <ConfirmModal
          visible
          title={modal.title}
          message={modal.message}
          confirmLabel={modal.confirmLabel || 'OK'}
          showCancel={modal.showCancel !== false}
          onConfirm={() => setModal(null)}
          onCancel={() => setModal(null)}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 20, paddingBottom: 40 },

  header:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:  { padding: 8 },
  backIcon: { width: 22, height: 22, transform: [{ scaleX: -1 }] },
  title:    { color: C.text, fontSize: 18, fontWeight: '700' },
  saveBtn:  { paddingVertical: 8, paddingHorizontal: 16 },
  saveBtnText: { color: C.accent, fontSize: 16, fontWeight: '700' },

  sectionLabel:   { color: C.secondary, fontSize: 12, fontWeight: '600', marginBottom: 10, marginTop: 20 },
  datePickerBtn:  { backgroundColor: C.card, borderRadius: 13, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  datePickerText: { color: C.text, fontSize: 17, fontWeight: '600' },
  datePickerHint: { color: C.secondary, fontSize: 12, marginTop: 4 },
  pickerOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pickerContent:  { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, borderWidth: 1, borderColor: C.border },
  pickerNative:   { height: 220 },
  pickerDone:     { marginTop: 16, padding: 14, backgroundColor: C.accent, borderRadius: 12, alignItems: 'center' },
  pickerDoneText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  input: {
    backgroundColor: C.card, borderRadius: 13, padding: 14,
    color: C.text, fontSize: 17, borderWidth: 1, borderColor: C.border,
  },
});
