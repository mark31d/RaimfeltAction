import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Image,
} from 'react-native';
import { AppContext } from '../App';
import ConfirmModal from './ConfirmModal';

const C = {
  bg: '#0B1021', card: '#121A33', border: '#1D2850',
  text: '#EAF0FF', secondary: '#9AA6C3',
  accent: '#6EA8FF', accent2: '#7C5CFF', success: '#2FE38C',
};

const DAY_NAMES  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TEMPLATES  = ['Rest', 'Full Body', 'Upper', 'Lower', 'Cardio', 'Custom'];
const TEMPLATE_COLORS = {
  Rest:       '#1D2850',
  'Full Body':'#6EA8FF',
  Upper:      '#7C5CFF',
  Lower:      '#2FE38C',
  Cardio:     '#FF9500',
  Custom:     '#9AA6C3',
};

// Sample exercises per template
const TEMPLATE_EXERCISES = {
  'Full Body': ['Squat', 'Bench Press', 'Barbell Row', 'Shoulder Press', 'Plank'],
  Upper:       ['Bench Press', 'Barbell Row', 'Shoulder Press', 'Bicep Curl', 'Tricep Pushdown'],
  Lower:       ['Squat', 'Romanian Deadlift', 'Leg Press', 'Lunge', 'Leg Curl'],
  Cardio:      ['Burpee', 'Box Jump', 'Mountain Climber', 'Jump Rope'],
  Rest:        [],
  Custom:      [],
};

export default function WorkoutPlanScreen({ route, navigation }) {
  const { createPlan, appState } = useContext(AppContext);
  const editPlan = route.params?.editPlan || null;

  const [planName, setPlanName] = useState(editPlan?.name || '');
  const [modal, setModal] = useState(null);
  const [days, setDays] = useState(
    editPlan?.days ||
    DAY_NAMES.map((_, i) => ({ dayIndex: i, template: 'Rest' }))
  );

  const setDayTemplate = (dayIndex, template) => {
    setDays(prev => prev.map(d => d.dayIndex === dayIndex ? { ...d, template } : d));
  };

  const handleSave = () => {
    if (!planName.trim()) {
      setModal({ title: 'Name Required', message: 'Please enter a name for your workout plan.', showCancel: false });
      return;
    }
    createPlan({ name: planName.trim(), days });
    setModal({
      title: 'Plan Saved',
      message: `"${planName.trim()}" has been added to your plans!`,
      showCancel: false,
      confirmLabel: 'OK',
      onConfirm: () => navigation.goBack(),
    });
  };

  const workoutDays = days.filter(d => d.template !== 'Rest').length;

  return (
    <SafeAreaView style={s.safe}>
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
        <Text style={s.title}>Create Plan</Text>
        <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
          <Text style={s.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Plan name */}
        <Text style={s.label}>Plan Name</Text>
        <TextInput
          style={s.input}
          value={planName}
          onChangeText={setPlanName}
          placeholder="e.g. Push/Pull/Legs"
          placeholderTextColor={C.secondary}
          autoFocus
        />

        {/* Summary */}
        <View style={s.summaryRow}>
          <SummaryPill label="Training Days" value={String(workoutDays)} color={C.accent} />
          <SummaryPill label="Rest Days"     value={String(7 - workoutDays)} color={C.secondary} />
        </View>

        {/* Day assignment */}
        <Text style={s.sectionTitle}>Weekly Schedule</Text>
        <Text style={s.sectionSub}>Tap a day to change its workout type</Text>

        {days.map(day => (
          <View key={day.dayIndex} style={s.dayCard}>
            <Text style={s.dayName}>{DAY_NAMES[day.dayIndex]}</Text>
            <View style={s.tmplWrap}>
              {TEMPLATES.map(tmpl => (
                <TouchableOpacity
                  key={tmpl}
                  style={[
                    s.tmplChip,
                    day.template === tmpl && {
                      backgroundColor: TEMPLATE_COLORS[tmpl] + '30',
                      borderColor: TEMPLATE_COLORS[tmpl],
                    },
                  ]}
                  onPress={() => setDayTemplate(day.dayIndex, tmpl)}
                >
                  <Text style={[
                    s.tmplText,
                    day.template === tmpl && { color: TEMPLATE_COLORS[tmpl] },
                  ]}>
                    {tmpl}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Preview */}
        {days.some(d => d.template !== 'Rest') && (
          <>
            <Text style={[s.sectionTitle, { marginTop: 24 }]}>Exercise Preview</Text>
            {days
              .filter(d => d.template !== 'Rest')
              .map(day => {
                const exercises = TEMPLATE_EXERCISES[day.template] || [];
                return (
                  <View key={day.dayIndex} style={s.previewCard}>
                    <View style={s.previewHeader}>
                      <Text style={s.previewDay}>{DAY_NAMES[day.dayIndex]}</Text>
                      <View style={[s.tmplBadge, { backgroundColor: TEMPLATE_COLORS[day.template] + '30' }]}>
                        <Text style={[s.tmplBadgeText, { color: TEMPLATE_COLORS[day.template] }]}>
                          {day.template}
                        </Text>
                      </View>
                    </View>
                    {exercises.length > 0 ? (
                      exercises.map((ex, i) => (
                        <Text key={i} style={s.exItem}>• {ex}</Text>
                      ))
                    ) : (
                      <Text style={s.exItem}>Custom — add exercises when starting workout</Text>
                    )}
                  </View>
                );
              })
            }
          </>
        )}

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

function SummaryPill({ label, value, color }) {
  return (
    <View style={s.summaryPill}>
      <Text style={[s.pillVal, { color }]}>{value}</Text>
      <Text style={s.pillLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 20, paddingBottom: 40 },

  header:      { flexDirection: 'row', alignItems: 'center', padding: 16, justifyContent: 'space-between' },
  backBtn:     { padding: 8 },
  backIcon:    { width: 22, height: 22, transform: [{ scaleX: -1 }] },
  title:       { color: C.text, fontSize: 18, fontWeight: '700' },
  saveBtn:     { backgroundColor: C.accent, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 18 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  label:      { color: C.secondary, fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8 },
  input: {
    backgroundColor: C.card, borderRadius: 14, padding: 15,
    color: C.text, fontSize: 17, borderWidth: 1, borderColor: C.border, marginBottom: 16,
  },

  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  summaryPill:{
    flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: C.border,
  },
  pillVal:   { fontSize: 24, fontWeight: '800' },
  pillLabel: { color: C.secondary, fontSize: 12, marginTop: 4 },

  sectionTitle: { color: C.text, fontSize: 17, fontWeight: '700', marginBottom: 4 },
  sectionSub:   { color: C.secondary, fontSize: 13, marginBottom: 16 },

  dayCard: {
    backgroundColor: C.card, borderRadius: 14, padding: 12,
    marginBottom: 10, borderWidth: 1, borderColor: C.border,
  },
  dayName: { color: C.text, fontSize: 13, fontWeight: '700', marginBottom: 8, letterSpacing: 0.3 },
  tmplWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tmplChip: {
    width: '31%', paddingVertical: 8, borderRadius: 18,
    borderWidth: 1, borderColor: C.border, backgroundColor: '#0B1021',
    alignItems: 'center',
  },
  tmplText: { color: C.secondary, fontSize: 12, fontWeight: '500' },

  previewCard: {
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: C.border,
  },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  previewDay:    { color: C.text, fontSize: 15, fontWeight: '700', width: 32 },
  tmplBadge:     { borderRadius: 8, paddingVertical: 3, paddingHorizontal: 10 },
  tmplBadgeText: { fontSize: 12, fontWeight: '600' },
  exItem:        { color: C.secondary, fontSize: 13, lineHeight: 22, paddingLeft: 4 },
});
