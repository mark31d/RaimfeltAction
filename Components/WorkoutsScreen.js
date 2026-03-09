import React, { useState, useContext } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, Image,
} from 'react-native';
import { AppContext, todayISO, totalWorkoutVolume } from '../App';
import ConfirmModal from './ConfirmModal';

const C = {
  bg: '#0B1021', card: '#121A33', border: '#1D2850',
  text: '#EAF0FF', secondary: '#9AA6C3',
  accent: '#6EA8FF', accent2: '#7C5CFF', success: '#2FE38C',
};

const SEGMENTS = ['Plans', 'Sessions', 'Library'];

export default function WorkoutsScreen({ navigation }) {
  const { appState, deletePlan, deleteWorkout } = useContext(AppContext);
  const { workoutPlans, workouts } = appState;
  const [activeTab, setActiveTab] = useState('Plans');
  const [modal, setModal] = useState(null);

  const sortedSessions = [...workouts].sort((a, b) => b.dateISO.localeCompare(a.dateISO));

  const handleDeletePlan = (id, name) => {
    setModal({
      title: 'Delete Plan',
      message: `Delete "${name}"?`,
      confirmLabel: 'Delete',
      confirmDanger: true,
      onConfirm: () => deletePlan(id),
    });
  };

  const handleDeleteSession = (id, title) => {
    setModal({
      title: 'Delete Session',
      message: `Delete "${title}"?`,
      confirmLabel: 'Delete',
      confirmDanger: true,
      onConfirm: () => deleteWorkout(id),
    });
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Workouts</Text>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => {
            if (activeTab === 'Plans') navigation.navigate('WorkoutPlan');
            else if (activeTab === 'Sessions') navigation.navigate('WorkoutSession');
            else navigation.navigate('ExerciseLibrary');
          }}
        >
          <Image
            source={require('../assets/ic_plus.png')}
            style={s.plusIcon}
            tintColor="#fff"
            resizeMode="contain"
            onError={() => {}}
          />
        </TouchableOpacity>
      </View>

      {/* Segment control */}
      <View style={s.segRow}>
        {SEGMENTS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[s.segBtn, activeTab === tab && s.segActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[s.segText, activeTab === tab && { color: C.accent }]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Plans tab ── */}
        {activeTab === 'Plans' && (
          <>
            {appState.workoutPlan.length === 0 ? (
              <EmptyState
                message="No workout plans yet"
                sub="Create a plan to schedule your weekly training"
                actionLabel="+ Create Plan"
                onAction={() => navigation.navigate('WorkoutPlan')}
              />
            ) : (
              workoutPlans.map(plan => (
                <View key={plan.id} style={s.card}>
                  <View style={s.cardRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.cardTitle}>{plan.name}</Text>
                      <Text style={s.cardSub}>
                        {(plan.days || []).filter(d => d.template !== 'Rest').length} training days / week
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={s.trashBtn}
                      onPress={() => handleDeletePlan(plan.id, plan.name)}
                    >
                      <Image
                        source={require('../assets/ic_trash.png')}
                        style={s.trashIcon}
                        tintColor="#FF6B6B"
                        resizeMode="contain"
                        onError={() => {}}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Day chips */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                    {(plan.days || []).map(d => (
                      <DayChip key={d.dayIndex} day={d} />
                    ))}
                  </ScrollView>

                  <TouchableOpacity
                    style={s.startBtn}
                    onPress={() => navigation.navigate('WorkoutSession', { planId: plan.id })}
                  >
                    <Text style={s.startBtnText}>▶  Start Workout</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
            <TouchableOpacity
              style={s.ghostBtn}
              onPress={() => navigation.navigate('WorkoutPlan')}
            >
              <Text style={s.ghostBtnText}>+ Create New Plan</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── Sessions tab ── */}
        {activeTab === 'Sessions' && (
          <>
            <TouchableOpacity
              style={[s.startBtn, { marginBottom: 16 }]}
              onPress={() => navigation.navigate('WorkoutSession')}
            >
              <Text style={s.startBtnText}>▶  Quick Workout</Text>
            </TouchableOpacity>

            {sortedSessions.length === 0 ? (
              <EmptyState
                message="No sessions yet"
                sub="Start a workout to see your history here"
                actionLabel="Start Workout"
                onAction={() => navigation.navigate('WorkoutSession')}
              />
            ) : (
              sortedSessions.map(session => {
                const vol = totalWorkoutVolume(session);
                return (
                  <View key={session.id} style={s.card}>
                    <View style={s.cardRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.cardTitle}>{session.title}</Text>
                        <Text style={s.cardSub}>{session.dateISO}</Text>
                      </View>
                      <TouchableOpacity
                        style={s.trashBtn}
                        onPress={() => handleDeleteSession(session.id, session.title)}
                      >
                        <Image
                          source={require('../assets/ic_trash.png')}
                          style={s.trashIcon}
                          tintColor="#FF6B6B"
                          resizeMode="contain"
                          onError={() => {}}
                        />
                      </TouchableOpacity>
                    </View>
                    <View style={s.statsRow}>
                      <SessionStat label="Duration"  value={`${session.durationMin || 0} min`} />
                      <SessionStat label="Exercises" value={String((session.exercises || []).length)} />
                      <SessionStat label="Volume"    value={vol > 0 ? `${vol}kg` : '—'} />
                    </View>
                    {(session.exercises || []).slice(0, 3).map(ex => (
                      <Text key={ex.id} style={s.exLine}>• {ex.name} — {ex.sets?.length || 0} sets</Text>
                    ))}
                    {(session.exercises || []).length > 3 && (
                      <Text style={s.moreText}>+{(session.exercises || []).length - 3} more</Text>
                    )}
                  </View>
                );
              })
            )}
          </>
        )}

        {/* ── Library tab ── */}
        {activeTab === 'Library' && (
          <>
            <Text style={s.libDesc}>
              Browse the full exercise library with instructions for each movement.
            </Text>
            <TouchableOpacity
              style={[s.startBtn, { marginBottom: 16 }]}
              onPress={() => navigation.navigate('ExerciseLibrary')}
            >
              <Text style={s.startBtnText}>Open Exercise Library →</Text>
            </TouchableOpacity>

            {/* Quick category overview */}
            {['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio'].map(cat => (
              <TouchableOpacity
                key={cat}
                style={s.catCard}
                onPress={() => navigation.navigate('ExerciseLibrary')}
              >
                <Text style={s.catName}>{cat}</Text>
                <Text style={s.catArrow}>›</Text>
              </TouchableOpacity>
            ))}
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

function DayChip({ day }) {
  const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  const isRest = day.template === 'Rest';
  return (
    <View style={[s.dayChip, isRest && s.dayChipRest]}>
      <Text style={[s.dayChipDay, isRest && { color: C.secondary }]}>{DAYS[day.dayIndex]}</Text>
      {!isRest && <Text style={s.dayChipTmpl}>{day.template.split(' ')[0]}</Text>}
    </View>
  );
}

function SessionStat({ label, value }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ color: C.text, fontSize: 16, fontWeight: '700' }}>{value}</Text>
      <Text style={{ color: C.secondary, fontSize: 11, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function EmptyState({ message, sub, actionLabel, onAction }) {
  return (
    <View style={s.emptyWrap}>
      <Text style={s.emptyTitle}>{message}</Text>
      <Text style={s.emptySub}>{sub}</Text>
      <TouchableOpacity style={s.emptyBtn} onPress={onAction}>
        <Text style={s.emptyBtnText}>{actionLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16, paddingBottom: 110 },

  header:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 },
  title:   { color: C.text, fontSize: 28, fontWeight: '800' },
  addBtn:  { backgroundColor: C.accent, borderRadius: 12, padding: 10 },
  plusIcon:{ width: 20, height: 20 },

  segRow:   { flexDirection: 'row', marginHorizontal: 16, marginBottom: 4, backgroundColor: C.card, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: C.border },
  segBtn:   { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 },
  segActive:{ backgroundColor: '#1D2850' },
  segText:  { color: C.secondary, fontSize: 14, fontWeight: '600' },

  card: {
    backgroundColor: C.card, borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: C.border,
  },
  cardRow:  { flexDirection: 'row', alignItems: 'flex-start' },
  cardTitle:{ color: C.text, fontSize: 16, fontWeight: '700' },
  cardSub:  { color: C.secondary, fontSize: 13, marginTop: 3 },
  trashBtn: { padding: 6 },
  trashIcon:{ width: 18, height: 18 },

  dayChip:     { alignItems: 'center', backgroundColor: '#1D2A5A', borderRadius: 10, padding: 8, marginRight: 6, minWidth: 44 },
  dayChipRest: { backgroundColor: '#1A1D2E' },
  dayChipDay:  { color: C.accent, fontSize: 12, fontWeight: '700' },
  dayChipTmpl: { color: C.secondary, fontSize: 10, marginTop: 2 },

  startBtn:     { backgroundColor: C.accent2, borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 12 },
  startBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  ghostBtn:     { borderRadius: 12, padding: 13, alignItems: 'center', borderWidth: 1, borderColor: C.border, marginTop: 4 },
  ghostBtnText: { color: C.accent, fontSize: 15, fontWeight: '600' },

  statsRow: { flexDirection: 'row', paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.border, marginTop: 10 },
  exLine:   { color: C.secondary, fontSize: 13, lineHeight: 22 },
  moreText: { color: C.secondary, fontSize: 12, marginTop: 4, fontStyle: 'italic' },

  libDesc: { color: C.secondary, fontSize: 14, lineHeight: 22, marginBottom: 16 },
  catCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.card, borderRadius: 14, padding: 16,
    marginBottom: 8, borderWidth: 1, borderColor: C.border,
  },
  catName:  { color: C.text, fontSize: 15, fontWeight: '600' },
  catArrow: { color: C.secondary, fontSize: 20 },

  emptyWrap: { paddingVertical: 40, alignItems: 'center' },
  emptyTitle:{ color: C.text, fontSize: 18, fontWeight: '600' },
  emptySub:  { color: C.secondary, fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  emptyBtn:  { marginTop: 16, backgroundColor: C.accent2, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
