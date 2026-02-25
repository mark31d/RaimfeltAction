import React from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';

const C = {
  overlay:   'rgba(0,0,0,0.8)',
  card:      '#0F1630',
  border:    '#1D2850',
  text:      '#EAF0FF',
  secondary: '#9AA6C3',
  accent:    '#6EA8FF',
  danger:    '#FF6B6B',
};

export default function ConfirmModal({
  visible = false,
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel  = 'Cancel',
  onConfirm,
  onCancel,
  confirmDanger = false,
  showCancel    = true,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={s.overlay}>
        <View style={s.card}>

          <Text style={s.title}>{title}</Text>

          {!!message && (
            <ScrollView
              style={s.msgScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 2 }}
            >
              <Text style={s.message}>{message}</Text>
            </ScrollView>
          )}

          <View style={[s.btnRow, !showCancel && s.btnCenter]}>
            {showCancel && (
              <TouchableOpacity style={s.cancelBtn} onPress={onCancel} activeOpacity={0.75}>
                <Text style={s.cancelText}>{cancelLabel}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[s.confirmBtn, confirmDanger && s.dangerBtn, !showCancel && s.fullBtn]}
              onPress={onConfirm}
              activeOpacity={0.75}
            >
              <Text style={s.confirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: C.overlay,
    justifyContent:  'center',
    alignItems:      'center',
    padding:         28,
  },
  card: {
    width:           '100%',
    backgroundColor: C.card,
    borderRadius:    22,
    padding:         24,
    borderWidth:     1,
    borderColor:     C.border,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 12 },
    shadowOpacity:   0.5,
    shadowRadius:    24,
    elevation:       20,
  },
  title: {
    color:        C.text,
    fontSize:     18,
    fontWeight:   '700',
    textAlign:    'center',
    marginBottom: 10,
  },
  msgScroll: { maxHeight: 220 },
  message: {
    color:      C.secondary,
    fontSize:   14,
    lineHeight: 22,
    textAlign:  'center',
  },
  btnRow: {
    flexDirection: 'row',
    gap:           10,
    marginTop:     22,
  },
  btnCenter: { justifyContent: 'center' },
  cancelBtn: {
    flex:            1,
    paddingVertical: 14,
    borderRadius:    14,
    borderWidth:     1,
    borderColor:     C.border,
    alignItems:      'center',
  },
  cancelText: { color: C.secondary, fontSize: 15, fontWeight: '600' },
  confirmBtn: {
    flex:            1,
    paddingVertical: 14,
    borderRadius:    14,
    backgroundColor: C.accent,
    alignItems:      'center',
  },
  fullBtn:    { flex: 0, paddingHorizontal: 40 },
  confirmText:{ color: '#fff', fontSize: 15, fontWeight: '700' },
  dangerBtn:  { backgroundColor: C.danger },
});
