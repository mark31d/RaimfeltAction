import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Switch, Image,
} from 'react-native';
import { AppContext } from '../App';
import ConfirmModal from './ConfirmModal';
import { launchImageLibrary } from 'react-native-image-picker';

const C = {
  bg: '#0B1021', card: '#121A33', border: '#1D2850',
  text: '#EAF0FF', secondary: '#9AA6C3',
  accent: '#6EA8FF', accent2: '#7C5CFF', danger: '#FF6B6B',
};

const GOALS = [
  { id: 'lose',     label: 'Lose Weight' },
  { id: 'maintain', label: 'Stay Fit' },
  { id: 'gain',     label: 'Build Muscle' },
];
const UNITS = ['kg', 'lb'];

export default function SettingsScreen({ navigation }) {
  const { appState, setProfile, resetAll } = useContext(AppContext);
  const { profile } = appState;

  const [name,     setName]     = useState(profile.name || '');
  const [goal,     setGoal]     = useState(profile.goal || 'maintain');
  const [units,    setUnits]    = useState(profile.units || 'kg');
  const [calories, setCalories] = useState(String(profile.dailyCaloriesGoal || 2100));
  const [photo,    setPhoto]    = useState(profile.photo || null);
  const [saved,  setSaved]  = useState(false);
  const [modal,  setModal]  = useState(null);

  const handlePickPhoto = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8, selectionLimit: 1 }, (response) => {
      const uri = response.assets?.[0]?.uri;
      if (uri) {
        setPhoto(uri);
        setProfile({ photo: uri });
      }
    });
  };

  const handleSave = () => {
    setProfile({
      name: name.trim() || 'Athlete',
      goal,
      units,
      dailyCaloriesGoal: Number(calories) || 2100,
      photo,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setModal({
      title: 'Reset All Data',
      message: 'This will permanently delete all your workouts, food logs, and weight data. This cannot be undone.',
      confirmLabel: 'Reset Everything',
      confirmDanger: true,
      onConfirm: async () => {
        await resetAll();
        navigation.replace('Onboarding');
      },
    });
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
          <Image
            source={require('../assets/ic_back.png')}
            style={s.backIcon}
            tintColor={C.text}
            resizeMode="contain"
            onError={() => {}}
          />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Settings</Text>
      </View>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Profile section ── */}
        <Text style={s.sectionLabel}>PROFILE</Text>
        <View style={s.card}>

          {/* Avatar */}
          <View style={s.avatarWrap}>
            <TouchableOpacity style={s.avatar} onPress={handlePickPhoto} activeOpacity={0.8}>
              {photo ? (
                <Image source={{ uri: photo }} style={s.avatarImg} />
              ) : (
                <Text style={s.avatarInitial}>
                  {(name || 'A').charAt(0).toUpperCase()}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={s.cameraBadge} onPress={handlePickPhoto} activeOpacity={0.8}>
              <Image
                source={require('../assets/ic_edit.png')}
                style={s.cameraIcon}
                tintColor="#fff"
                resizeMode="contain"
                onError={() => {}}
              />
            </TouchableOpacity>
          </View>

          <Label>Your Name</Label>
          <TextInput
            style={s.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter name"
            placeholderTextColor={C.secondary}
          />

          <Label>Goal</Label>
          <View style={s.chips}>
            {GOALS.map(g => (
              <TouchableOpacity
                key={g.id}
                style={[s.chip, goal === g.id && s.chipActive]}
                onPress={() => setGoal(g.id)}
              >
                <Text style={[s.chipText, goal === g.id && { color: C.accent }]}>{g.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Label>Weight Units</Label>
          <View style={s.unitRow}>
            {UNITS.map(u => (
              <TouchableOpacity
                key={u}
                style={[s.unitBtn, units === u && s.unitBtnActive]}
                onPress={() => setUnits(u)}
              >
                <Text style={[s.unitText, units === u && { color: C.accent }]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Label>Daily Calories Goal</Label>
          <TextInput
            style={s.input}
            value={calories}
            onChangeText={setCalories}
            keyboardType="numeric"
            placeholder="2100"
            placeholderTextColor={C.secondary}
          />
        </View>

        <TouchableOpacity
          style={[s.saveBtn, saved && s.saveBtnDone]}
          onPress={handleSave}
          activeOpacity={0.75}
        >
          <Text style={s.saveBtnText}>{saved ? '✓ Saved!' : 'Save Profile'}</Text>
        </TouchableOpacity>

        {/* ── App info ── */}
        <Text style={s.sectionLabel}>APP INFO</Text>
        <View style={s.card}>
          <Row label="App"     value="Raynflet Active" />
          <Row label="Version" value="1.0.0" />
          <Row label="Storage" value="Local (on-device)" />
        </View>

        {/* ── Danger zone ── */}
        <Text style={[s.sectionLabel, { color: C.danger }]}>DANGER ZONE</Text>
        <View style={[s.card, { borderColor: '#3B1A1A' }]}>
          <Text style={s.dangerInfo}>
            Resetting clears ALL data — workouts, food logs, weight history, and profile. You'll be taken back to onboarding.
          </Text>
          <TouchableOpacity style={s.resetBtn} onPress={handleReset} activeOpacity={0.75}>
            <Text style={s.resetBtnText}>Reset All Data</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {modal && (
        <ConfirmModal
          visible
          title={modal.title}
          message={modal.message}
          confirmLabel={modal.confirmLabel}
          confirmDanger={modal.confirmDanger}
          showCancel={modal.showCancel !== false}
          onConfirm={() => { modal.onConfirm?.(); setModal(null); }}
          onCancel={() => setModal(null)}
        />
      )}
    </SafeAreaView>
  );
}

function Label({ children }) {
  return <Text style={s.label}>{children}</Text>;
}

function Row({ label, value }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.bg },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { flex: 1, color: C.text, fontSize: 18, fontWeight: '700', textAlign: 'center', marginLeft: -38 },
  backBtn:     { width: 38, height: 38, borderRadius: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  backIcon:    { width: 20, height: 20, transform: [{ scaleX: -1 }] },
  scroll:      { padding: 20, paddingBottom: 40 },
  sectionLabel:{ color: C.secondary, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10, marginTop: 8 },

  card: {
    backgroundColor: C.card, borderRadius: 18, padding: 18,
    marginBottom: 16, borderWidth: 1, borderColor: C.border,
  },

  avatarWrap:    { alignSelf: 'center', marginBottom: 20, marginTop: 4 },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#1D2850', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.accent, overflow: 'hidden',
  },
  avatarImg:     { width: 90, height: 90 },
  avatarInitial: { color: C.accent, fontSize: 36, fontWeight: '800' },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.card,
  },
  cameraIcon: { width: 13, height: 13 },

  label: { color: C.secondary, fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginTop: 16, marginBottom: 8 },

  input: {
    backgroundColor: '#0B1021', borderRadius: 12, padding: 14,
    color: C.text, fontSize: 16, borderWidth: 1, borderColor: C.border,
  },

  chips:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 20, borderWidth: 1, borderColor: C.border,
    backgroundColor: '#0B1021',
  },
  chipActive: { borderColor: C.accent },
  chipText:   { color: C.secondary, fontSize: 13, fontWeight: '500' },

  unitRow: { flexDirection: 'row', gap: 10 },
  unitBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1, borderColor: C.border, alignItems: 'center',
    backgroundColor: '#0B1021',
  },
  unitBtnActive: { borderColor: C.accent },
  unitText:      { color: C.secondary, fontSize: 15, fontWeight: '600' },

  saveBtn: {
    backgroundColor: C.accent, borderRadius: 14, padding: 16,
    alignItems: 'center', marginBottom: 24,
  },
  saveBtnDone: { backgroundColor: '#2FE38C' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  infoLabel: { color: C.secondary, fontSize: 14 },
  infoValue: { color: C.text, fontSize: 14, fontWeight: '500' },

  dangerInfo: { color: C.secondary, fontSize: 14, lineHeight: 20, marginBottom: 16 },
  resetBtn: {
    backgroundColor: '#3B1A1A', borderRadius: 12, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#6B2A2A',
  },
  resetBtnText: { color: C.danger, fontSize: 15, fontWeight: '700' },
});
