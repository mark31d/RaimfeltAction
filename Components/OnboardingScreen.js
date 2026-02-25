import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Dimensions, Image,
} from 'react-native';
import { AppContext } from '../App';

const { width } = Dimensions.get('window');

const C = {
  bg: '#0B1021', card: '#121A33', border: '#1D2850',
  text: '#EAF0FF', secondary: '#9AA6C3',
  accent: '#6EA8FF', accent2: '#7C5CFF',
};

const GOALS = [
  { id: 'lose',     label: 'Lose Weight',  img: require('../assets/ic_fire.png'),     desc: 'Caloric deficit, burn fat' },
  { id: 'maintain', label: 'Stay Fit',     img: require('../assets/ic_stats.png'),    desc: 'Maintain your current shape' },
  { id: 'gain',     label: 'Build Muscle', img: require('../assets/ic_workouts.png'), desc: 'Caloric surplus, gain mass' },
];

const UNITS = ['kg', 'lb'];

export default function OnboardingScreen({ navigation }) {
  const { setProfile } = useContext(AppContext);
  const [step,     setStep]     = useState(0);
  const [name,     setName]     = useState('');
  const [goal,     setGoal]     = useState('maintain');
  const [units,    setUnits]    = useState('kg');
  const [calories, setCalories] = useState('2100');

  const canNext = step === 0 ? name.trim().length > 0 : true;

  const handleAutoCalc = () => setCalories('2100');

  const handleFinish = () => {
    setProfile({
      name: name.trim() || 'Athlete',
      goal,
      units,
      dailyCaloriesGoal: Number(calories) || 2100,
    });
    navigation.replace('MainTabs');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Progress */}
        <View style={styles.dotsRow}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[styles.dot, i <= step && styles.dotActive, i === step && styles.dotCurrent]} />
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* ── Step 0: Name ── */}
          {step === 0 && (
            <View style={styles.stepWrap}>
              <Text style={styles.stepTitle}>What's your name?</Text>
              <Text style={styles.stepSub}>We'll personalize your experience</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor={C.secondary}
                value={name}
                onChangeText={setName}
                autoFocus
                returnKeyType="next"
                onSubmitEditing={() => name.trim() && setStep(1)}
              />
            </View>
          )}

          {/* ── Step 1: Goal ── */}
          {step === 1 && (
            <View style={styles.stepWrap}>
              <Text style={styles.stepTitle}>What's your goal?</Text>
              <Text style={styles.stepSub}>Pick what fits you best</Text>
              {GOALS.map(g => (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.goalCard, goal === g.id && styles.goalCardActive]}
                  onPress={() => setGoal(g.id)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={g.img}
                    style={styles.goalIcon}
                    tintColor={goal === g.id ? C.accent : C.secondary}
                    resizeMode="contain"
                    onError={() => {}}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.goalLabel}>{g.label}</Text>
                    <Text style={styles.goalDesc}>{g.desc}</Text>
                  </View>
                  <View style={[styles.radio, goal === g.id && styles.radioActive]}>
                    {goal === g.id && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              ))}

              {/* Units */}
              <Text style={[styles.stepSub, { marginTop: 24, marginBottom: 12 }]}>Preferred units</Text>
              <View style={styles.unitsRow}>
                {UNITS.map(u => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.unitBtn, units === u && styles.unitBtnActive]}
                    onPress={() => setUnits(u)}
                  >
                    <Text style={[styles.unitBtnText, units === u && { color: C.accent }]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ── Step 2: Calories ── */}
          {step === 2 && (
            <View style={styles.stepWrap}>
              <Text style={styles.stepTitle}>Daily calorie goal</Text>
              <Text style={styles.stepSub}>Set your daily target or auto-calculate</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 2100"
                placeholderTextColor={C.secondary}
                value={calories}
                onChangeText={setCalories}
                keyboardType="numeric"
                autoFocus
              />
              <TouchableOpacity style={styles.autoBtn} onPress={handleAutoCalc}>
                <Text style={styles.autoBtnText}>Auto-calculate  —  2100 kcal</Text>
              </TouchableOpacity>
              <View style={styles.hintCard}>
                <Text style={styles.hintText}>
                  {'Lose weight: ~1700–1900 kcal\nMaintain: ~2000–2200 kcal\nBuild muscle: ~2400–2800 kcal'}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Nav buttons */}
        <View style={styles.navRow}>
          {step > 0 ? (
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(s => s - 1)}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          {step < 2 ? (
            <TouchableOpacity
              style={[styles.nextBtn, !canNext && styles.nextBtnDisabled]}
              onPress={() => canNext && setStep(s => s + 1)}
              activeOpacity={canNext ? 0.7 : 1}
            >
              <Text style={styles.nextBtnText}>Next  →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
              <Text style={styles.nextBtnText}>Let's Go!</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', paddingTop: 24, gap: 8 },
  dot: {
    height: 6, width: 6, borderRadius: 3, backgroundColor: C.border,
    marginHorizontal: 3,
  },
  dotActive:  { backgroundColor: '#3B4E7A' },
  dotCurrent: { width: 24, backgroundColor: C.accent },
  content: { flexGrow: 1, padding: 28, paddingTop: 40 },
  stepWrap: { flex: 1 },
  stepTitle: { color: C.text, fontSize: 30, fontWeight: '700', marginBottom: 8, lineHeight: 38 },
  stepSub:   { color: C.secondary, fontSize: 15, lineHeight: 22, marginBottom: 28 },
  input: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 18,
    color: C.text,
    fontSize: 18,
    borderWidth: 1,
    borderColor: C.border,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  goalCardActive: { borderColor: C.accent },
  goalIcon:  { width: 28, height: 28, marginRight: 16 },
  goalLabel: { color: C.text, fontSize: 17, fontWeight: '600' },
  goalDesc:  { color: C.secondary, fontSize: 13, marginTop: 3 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: C.accent },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.accent },
  unitsRow: { flexDirection: 'row', gap: 12 },
  unitBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    alignItems: 'center',
  },
  unitBtnActive: { borderColor: C.accent },
  unitBtnText:   { color: C.secondary, fontSize: 16, fontWeight: '600' },
  autoBtn: {
    marginTop: 16, padding: 16, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, alignItems: 'center',
  },
  autoBtnText: { color: C.accent, fontSize: 15 },
  hintCard: {
    marginTop: 20, padding: 16, borderRadius: 14,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  hintText: { color: C.secondary, fontSize: 13, lineHeight: 22 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 24, gap: 12 },
  backBtn: { flex: 1, justifyContent: 'center' },
  backBtnText: { color: C.secondary, fontSize: 16 },
  nextBtn: {
    flex: 1, backgroundColor: C.accent,
    borderRadius: 14, padding: 16, alignItems: 'center',
  },
  nextBtnDisabled: { opacity: 0.4 },
  finishBtn: {
    flex: 1, backgroundColor: C.accent2,
    borderRadius: 14, padding: 16, alignItems: 'center',
  },
  nextBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
