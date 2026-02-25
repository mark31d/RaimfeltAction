import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Image, Modal,
} from 'react-native';
import ConfirmModal from './ConfirmModal';
import { useFocusEffect } from '@react-navigation/native';
import { AppContext, todayISO, totalWorkoutVolume } from '../App';

const C = {
  bg: '#0B1021', card: '#121A33', border: '#1D2850',
  text: '#EAF0FF', secondary: '#9AA6C3',
  accent: '#6EA8FF', accent2: '#7C5CFF', success: '#2FE38C',
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ─── Timer hook ───────────────────────────────────────────────────────────────
function useTimer(running) {
  const [seconds, setSeconds] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      clearInterval(ref.current);
    }
    return () => clearInterval(ref.current);
  }, [running]);

  const reset = () => setSeconds(0);

  const fmt = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sc = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sc).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(sc).padStart(2, '0')}`;
  };

  return { seconds, display: fmt(seconds), reset };
}

// ─── WorkoutSessionScreen ────────────────────────────────────────────────────
export default function WorkoutSessionScreen({ route, navigation }) {
  const { saveWorkoutSession, appState } = useContext(AppContext);
  const { planId } = route.params || {};

  const plan = planId
    ? appState.workoutPlans.find(p => p.id === planId)
    : null;

  const [started,   setStarted]   = useState(false);
  const [title,     setTitle]     = useState(plan?.name || 'Quick Workout');
  const [exercises, setExercises] = useState([]);
  const [notes,     setNotes]     = useState('');
  const [summaryVisible, setSummary] = useState(false);
  const [savedSession, setSavedSession] = useState(null);
  const [modal, setModal] = useState(null);

  const timer = useTimer(started);

  // ── Receive exercise from ExerciseLibrary ──────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      const addEx = route.params?.addExercise;
      if (addEx) {
        setExercises(prev => [
          ...prev,
          {
            id: uid(),
            name: addEx.name,
            sets: [{ id: uid(), reps: '', weight: '', done: false }],
            notes: '',
          },
        ]);
        navigation.setParams({ addExercise: null });
      }
    }, [route.params?.addExercise])
  );

  // ── Exercise / Set helpers ─────────────────────────────────────────────────
  const addSet = (exId) => {
    setExercises(prev => prev.map(ex =>
      ex.id === exId
        ? { ...ex, sets: [...ex.sets, { id: uid(), reps: '', weight: '', done: false }] }
        : ex
    ));
  };

  const removeSet = (exId, setId) => {
    setExercises(prev => prev.map(ex =>
      ex.id === exId
        ? { ...ex, sets: ex.sets.filter(s => s.id !== setId) }
        : ex
    ));
  };

  const updateSet = (exId, setId, field, value) => {
    setExercises(prev => prev.map(ex =>
      ex.id === exId
        ? { ...ex, sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s) }
        : ex
    ));
  };

  const toggleDone = (exId, setId) => {
    setExercises(prev => prev.map(ex =>
      ex.id === exId
        ? { ...ex, sets: ex.sets.map(s => s.id === setId ? { ...s, done: !s.done } : s) }
        : ex
    ));
  };

  const removeExercise = (exId) => {
    setExercises(prev => prev.filter(ex => ex.id !== exId));
  };

  const updateExNotes = (exId, text) => {
    setExercises(prev => prev.map(ex =>
      ex.id === exId ? { ...ex, notes: text } : ex
    ));
  };

  // ── Finish workout ─────────────────────────────────────────────────────────
  const handleFinish = () => {
    if (exercises.length === 0) {
      setModal({ title: 'No Exercises', message: 'Add at least one exercise before finishing.', showCancel: false });
      return;
    }
    setModal({
      title: 'Finish Workout',
      message: 'Complete this session?',
      confirmLabel: 'Finish',
      onConfirm: finishWorkout,
    });
  };

  const finishWorkout = () => {
    const session = {
      dateISO:     todayISO(),
      title,
      durationMin: Math.round(timer.seconds / 60),
      exercises,
      notes,
    };
    saveWorkoutSession(session);
    setSavedSession(session);
    setSummary(true);
  };

  const handleDiscard = () => {
    setModal({
      title: 'Discard Workout',
      message: 'Discard this session without saving?',
      confirmLabel: 'Discard',
      confirmDanger: true,
      onConfirm: () => navigation.goBack(),
    });
  };

  const volume = exercises.reduce((tot, ex) =>
    tot + ex.sets.reduce((s, set) =>
      s + (Number(set.reps) || 0) * (Number(set.weight) || 0), 0), 0);

  // ── Pre-start screen ───────────────────────────────────────────────────────
  if (!started) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.preHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Image
              source={require('../assets/ic_back.png')}
              style={s.backIcon}
              tintColor={C.text}
              resizeMode="contain"
              onError={() => {}}
            />
          </TouchableOpacity>
          <Text style={s.preTitle}>New Workout</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={s.preScroll}>
          <Text style={s.label}>Workout Name</Text>
          <TextInput
            style={s.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Push Day"
            placeholderTextColor={C.secondary}
          />

          {plan && (
            <View style={s.planInfo}>
              <Text style={s.planInfoTitle}>From plan: {plan.name}</Text>
              <Text style={s.planInfoSub}>Exercises will be added as you start</Text>
            </View>
          )}

          <TouchableOpacity style={s.startBtn} onPress={() => setStarted(true)}>
            <Text style={s.startBtnText}>▶  Start Session</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.libraryBtn}
            onPress={() => navigation.navigate('ExerciseLibrary', { fromWorkout: true })}
          >
            <Text style={s.libraryBtnText}>Browse Exercise Library</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Active workout ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      {/* Timer bar */}
      <View style={s.timerBar}>
        <View>
          <Text style={s.timerLabel}>Duration</Text>
          <Text style={s.timerDisplay}>{timer.display}</Text>
        </View>
        <Text style={s.sessionTitle}>{title}</Text>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={s.timerLabel}>Volume</Text>
          <Text style={s.timerDisplay}>{volume > 0 ? `${volume}kg` : '—'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {exercises.length === 0 && (
          <View style={s.emptyWrap}>
            <Text style={s.emptyText}>No exercises yet.</Text>
            <Text style={s.emptySub}>Tap "+ Add Exercise" to get started</Text>
          </View>
        )}

        {exercises.map((ex, exIdx) => (
          <View key={ex.id} style={s.exCard}>
            {/* Exercise header */}
            <View style={s.exHeader}>
              <Text style={s.exName}>{ex.name}</Text>
              <TouchableOpacity onPress={() => removeExercise(ex.id)} style={s.trashBtn}>
                <Image
                  source={require('../assets/ic_trash.png')}
                  style={s.trashIcon}
                  tintColor="#FF6B6B"
                  resizeMode="contain"
                  onError={() => {}}
                />
              </TouchableOpacity>
            </View>

            {/* Set header */}
            <View style={s.setHeader}>
              <Text style={[s.setCol, s.setColSet]}>Set</Text>
              <Text style={[s.setCol, s.setColReps]}>Reps</Text>
              <Text style={[s.setCol, s.setColWeight]}>Weight</Text>
              <Text style={[s.setCol, s.setColDone]}>Done</Text>
            </View>

            {/* Sets */}
            {ex.sets.map((set, setIdx) => (
              <View key={set.id} style={[s.setRow, set.done && s.setRowDone]}>
                <Text style={[s.setCol, s.setColSet, set.done && { color: C.success }]}>{setIdx + 1}</Text>
                <TextInput
                  style={[s.setInput, s.setColReps]}
                  value={set.reps}
                  onChangeText={v => updateSet(ex.id, set.id, 'reps', v)}
                  placeholder="—"
                  placeholderTextColor={C.secondary}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[s.setInput, s.setColWeight]}
                  value={set.weight}
                  onChangeText={v => updateSet(ex.id, set.id, 'weight', v)}
                  placeholder="—"
                  placeholderTextColor={C.secondary}
                  keyboardType="decimal-pad"
                />
                <TouchableOpacity
                  style={[s.doneBtn, set.done && s.doneBtnActive]}
                  onPress={() => toggleDone(ex.id, set.id)}
                >
                  <Text style={{ color: set.done ? '#fff' : C.secondary, fontSize: 14 }}>✓</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* Add set */}
            <TouchableOpacity style={s.addSetBtn} onPress={() => addSet(ex.id)}>
              <Text style={s.addSetText}>+ Add Set</Text>
            </TouchableOpacity>

            {/* Notes */}
            <TextInput
              style={s.notesInput}
              value={ex.notes}
              onChangeText={v => updateExNotes(ex.id, v)}
              placeholder="Notes (optional)..."
              placeholderTextColor={C.secondary}
              multiline
            />
          </View>
        ))}

        {/* Add exercise button */}
        <TouchableOpacity
          style={s.addExBtn}
          onPress={() => navigation.navigate('ExerciseLibrary', { fromWorkout: true })}
        >
          <Image
            source={require('../assets/ic_plus.png')}
            style={s.plusIcon}
            tintColor={C.accent}
            resizeMode="contain"
            onError={() => {}}
          />
          <Text style={s.addExText}>Add Exercise</Text>
        </TouchableOpacity>

        {/* Workout notes */}
        <View style={s.notesCard}>
          <Text style={s.notesLabel}>Session Notes</Text>
          <TextInput
            style={s.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="How did this session feel?"
            placeholderTextColor={C.secondary}
            multiline
          />
        </View>

        {/* Action buttons */}
        <View style={s.actionRow}>
          <TouchableOpacity style={s.discardBtn} onPress={handleDiscard}>
            <Text style={s.discardText}>Discard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.finishBtn} onPress={handleFinish}>
            <Text style={s.finishText}>Finish Workout</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Summary modal */}
      <Modal visible={summaryVisible} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.summaryModal}>
            <Image
              source={require('../assets/ic_workouts.png')}
              style={s.sumIcon}
              tintColor={C.success}
              resizeMode="contain"
              onError={() => {}}
            />
            <Text style={s.sumTitle}>Workout Complete!</Text>
            {savedSession && (
              <>
                <View style={s.sumRow}>
                  <SumStat label="Duration" value={`${savedSession.durationMin} min`} />
                  <SumStat label="Exercises" value={String(savedSession.exercises.length)} />
                  <SumStat label="Volume"
                    value={savedSession.exercises.reduce((tot, ex) =>
                      tot + ex.sets.reduce((s, set) =>
                        s + (Number(set.reps) || 0) * (Number(set.weight) || 0), 0), 0) + 'kg'
                    }
                  />
                </View>
                {savedSession.exercises.map(ex => (
                  <View key={ex.id} style={s.sumEx}>
                    <Text style={s.sumExName}>{ex.name}</Text>
                    <Text style={s.sumExSets}>
                      {ex.sets.filter(s => s.done).length}/{ex.sets.length} sets done
                    </Text>
                  </View>
                ))}
              </>
            )}
            <TouchableOpacity
              style={s.sumCloseBtn}
              onPress={() => {
                setSummary(false);
                navigation.goBack();
              }}
            >
              <Text style={s.sumCloseBtnText}>Back to App</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

function SumStat({ label, value }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ color: C.text, fontSize: 20, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: C.secondary, fontSize: 12, marginTop: 3 }}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16, paddingBottom: 40 },

  // Pre-start
  preHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, justifyContent: 'space-between' },
  backBtn:   { padding: 8 },
  backIcon:  { width: 22, height: 22, transform: [{ scaleX: -1 }] },
  preTitle:  { color: C.text, fontSize: 18, fontWeight: '700' },
  preScroll: { padding: 20, paddingBottom: 40 },
  label:     { color: C.secondary, fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8 },
  input: {
    backgroundColor: C.card, borderRadius: 14, padding: 15,
    color: C.text, fontSize: 17, borderWidth: 1, borderColor: C.border, marginBottom: 20,
  },
  planInfo: {
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.border, marginBottom: 20,
  },
  planInfoTitle: { color: C.text, fontSize: 15, fontWeight: '600' },
  planInfoSub:   { color: C.secondary, fontSize: 13, marginTop: 4 },
  startBtn:   { backgroundColor: C.accent2, borderRadius: 14, padding: 17, alignItems: 'center', marginBottom: 12 },
  startBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  libraryBtn: { padding: 14, alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: C.border },
  libraryBtnText: { color: C.accent, fontSize: 15, fontWeight: '600' },

  // Timer bar
  timerBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.card, padding: 16, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  timerLabel:   { color: C.secondary, fontSize: 11, textAlign: 'center' },
  timerDisplay: { color: C.accent, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  sessionTitle: { color: C.text, fontSize: 14, fontWeight: '600', flex: 1, textAlign: 'center', paddingHorizontal: 8 },

  // Exercise card
  exCard: {
    backgroundColor: C.card, borderRadius: 16, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: C.border,
  },
  exHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  exName:   { color: C.text, fontSize: 16, fontWeight: '700', flex: 1 },
  trashBtn: { padding: 6 },
  trashIcon:{ width: 18, height: 18 },

  // Set table
  setHeader:    { flexDirection: 'row', marginBottom: 6 },
  setRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  setRowDone:   { opacity: 0.6 },
  setCol:       { textAlign: 'center', color: C.secondary, fontSize: 12, fontWeight: '600' },
  setColSet:    { width: 32 },
  setColReps:   { flex: 1, marginHorizontal: 6 },
  setColWeight: { flex: 1, marginHorizontal: 6 },
  setColDone:   { width: 44, textAlign: 'center' },
  setInput: {
    backgroundColor: '#0B1021', borderRadius: 8, padding: 8,
    color: C.text, fontSize: 15, textAlign: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  doneBtn: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center',
  },
  doneBtnActive: { backgroundColor: C.success, borderColor: C.success },

  addSetBtn: { paddingVertical: 8, alignItems: 'center' },
  addSetText: { color: C.accent, fontSize: 14, fontWeight: '600' },

  notesCard:   { backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  notesLabel:  { color: C.secondary, fontSize: 12, fontWeight: '600', marginBottom: 8 },
  notesInput:  { color: C.secondary, fontSize: 13, marginTop: 6 },

  // Empty state
  emptyWrap: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { color: C.text, fontSize: 18, fontWeight: '600' },
  emptySub:  { color: C.secondary, fontSize: 14, marginTop: 8 },

  // Add exercise
  addExBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 16, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, borderStyle: 'dashed', marginBottom: 16,
  },
  plusIcon:  { width: 20, height: 20 },
  addExText: { color: C.accent, fontSize: 16, fontWeight: '600' },

  // Action row
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  discardBtn: {
    flex: 1, borderRadius: 13, padding: 15, alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  discardText: { color: C.secondary, fontSize: 15, fontWeight: '600' },
  finishBtn:   { flex: 2, backgroundColor: C.success, borderRadius: 13, padding: 15, alignItems: 'center' },
  finishText:  { color: '#0B1021', fontSize: 15, fontWeight: '800' },

  // Summary modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  summaryModal: {
    backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 28, borderWidth: 1, borderColor: C.border, maxHeight: '85%',
  },
  sumIcon:  { width: 56, height: 56, alignSelf: 'center', marginBottom: 12 },
  sumTitle: { color: C.text, fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 20 },
  sumRow:   { flexDirection: 'row', marginBottom: 20 },
  sumEx:    {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  sumExName: { color: C.text, fontSize: 14, fontWeight: '600' },
  sumExSets: { color: C.secondary, fontSize: 13 },
  sumCloseBtn: { marginTop: 20, backgroundColor: C.accent, borderRadius: 14, padding: 16, alignItems: 'center' },
  sumCloseBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
