import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, FlatList, Image, Modal, ScrollView,
} from 'react-native';

const C = {
  bg: '#0B1021', card: '#121A33', border: '#1D2850',
  text: '#EAF0FF', secondary: '#9AA6C3',
  accent: '#6EA8FF', success: '#2FE38C',
};

// ─── Exercise database (local constant) ──────────────────────────────────────
const EXERCISES = [
  { id: 'e01', name: 'Bench Press',         category: 'Chest',     muscles: 'Pectorals, Triceps, Deltoids',       howTo: 'Lie on a flat bench. Grip the bar slightly wider than shoulder-width. Lower the bar to your mid-chest and press back up explosively, keeping elbows at ~75°.' },
  { id: 'e02', name: 'Incline Bench Press', category: 'Chest',     muscles: 'Upper Pectorals, Triceps',           howTo: 'Set bench to 30–45°. Press the bar from upper chest upward. Focus on squeezing the upper chest at the top.' },
  { id: 'e03', name: 'Cable Fly',           category: 'Chest',     muscles: 'Pectorals',                         howTo: 'Set cables at shoulder height. Pull handles together in front of you in an arc, squeezing the chest.' },
  { id: 'e04', name: 'Dip',                 category: 'Chest',     muscles: 'Pectorals, Triceps',                howTo: 'Support yourself on parallel bars. Lower until elbows are at 90°, lean forward slightly for chest emphasis. Drive back up.' },
  { id: 'e05', name: 'Squat',               category: 'Legs',      muscles: 'Quadriceps, Glutes, Hamstrings',    howTo: 'Stand with feet shoulder-width apart, bar on upper back. Hinge hips back and down until thighs are parallel to floor. Drive through heels to stand.' },
  { id: 'e06', name: 'Romanian Deadlift',   category: 'Legs',      muscles: 'Hamstrings, Glutes',                howTo: 'Stand holding bar at hips. Hinge forward at hips, keeping back straight, lowering bar down shins. Drive hips forward to return.' },
  { id: 'e07', name: 'Leg Press',           category: 'Legs',      muscles: 'Quadriceps, Glutes',                howTo: 'Sit in machine. Place feet shoulder-width on platform. Lower until knees are at 90°, push through heels to extend.' },
  { id: 'e08', name: 'Lunge',               category: 'Legs',      muscles: 'Quadriceps, Glutes, Hamstrings',   howTo: 'Step forward, lower your back knee toward the floor. Push through the front heel to return. Alternate legs.' },
  { id: 'e09', name: 'Leg Curl',            category: 'Legs',      muscles: 'Hamstrings',                       howTo: 'Lie face down on machine. Curl the pad toward your glutes, pause, lower slowly.' },
  { id: 'e10', name: 'Deadlift',            category: 'Back',      muscles: 'Hamstrings, Glutes, Lower Back',   howTo: 'Stand with bar over mid-foot. Grip outside legs, hinge hips back, keep chest up. Drive hips forward to stand with bar close to body.' },
  { id: 'e11', name: 'Pull-Up',             category: 'Back',      muscles: 'Latissimus Dorsi, Biceps',         howTo: 'Hang from bar with overhand grip. Pull until chin clears the bar, squeezing lats. Lower slowly.' },
  { id: 'e12', name: 'Barbell Row',         category: 'Back',      muscles: 'Rhomboids, Lats, Biceps',          howTo: 'Hinge at hips ~45°. Pull bar to lower chest, driving elbows back. Squeeze shoulder blades. Lower under control.' },
  { id: 'e13', name: 'Lat Pulldown',        category: 'Back',      muscles: 'Latissimus Dorsi, Biceps',         howTo: 'Sit at cable machine. Pull bar to upper chest in an arc, pulling elbows down. Lean back slightly. Control the ascent.' },
  { id: 'e14', name: 'Shoulder Press',      category: 'Shoulders', muscles: 'Deltoids, Triceps',               howTo: 'Sit or stand. Press bar or dumbbells from shoulder height overhead until arms are fully extended. Lower slowly.' },
  { id: 'e15', name: 'Lateral Raise',       category: 'Shoulders', muscles: 'Lateral Deltoids',                howTo: 'Hold dumbbells at sides. Raise arms out to shoulder height with slightly bent elbows. Lower slowly.' },
  { id: 'e16', name: 'Face Pull',           category: 'Shoulders', muscles: 'Rear Deltoids, Rotator Cuff',     howTo: 'Set cable at face height. Pull rope to face with elbows high and wide, hands beside ears. Squeeze rear delts.' },
  { id: 'e17', name: 'Bicep Curl',          category: 'Arms',      muscles: 'Biceps Brachii',                  howTo: 'Stand with dumbbells. Keep elbows at sides. Curl weights to shoulder level, supinating wrist at top. Lower slowly.' },
  { id: 'e18', name: 'Tricep Pushdown',     category: 'Arms',      muscles: 'Triceps',                         howTo: 'Set cable at top. Keep elbows at sides. Push handle down until arms are fully extended. Control the return.' },
  { id: 'e19', name: 'Plank',               category: 'Core',      muscles: 'Abs, Obliques, Lower Back',       howTo: 'Support on forearms and toes. Keep body in a straight line from head to heels. Breathe normally and hold.' },
  { id: 'e20', name: 'Crunch',              category: 'Core',      muscles: 'Rectus Abdominis',                howTo: 'Lie on back, knees bent. Hands behind head or crossed on chest. Curl shoulders toward knees. Lower slowly.' },
  { id: 'e21', name: 'Burpee',              category: 'Cardio',    muscles: 'Full Body',                       howTo: 'Squat and place hands on floor. Jump feet back to plank. Do a push-up (optional). Jump feet forward. Explosively jump up with arms overhead.' },
  { id: 'e22', name: 'Box Jump',            category: 'Cardio',    muscles: 'Legs, Glutes',                    howTo: 'Stand before a sturdy box. Dip slightly and jump onto the box, landing softly with bent knees. Step back down.' },
  { id: 'e23', name: 'Mountain Climber',    category: 'Cardio',    muscles: 'Core, Legs, Shoulders',           howTo: 'Start in push-up position. Alternate driving knees to chest as fast as comfortable, keeping hips down.' },
  { id: 'e24', name: 'Jump Rope',           category: 'Cardio',    muscles: 'Calves, Shoulders, Cardio',       howTo: 'Hold rope handles at hip height. Jump just high enough for rope to pass under feet. Keep elbows close to body.' },
];

const CATEGORIES = ['All', ...new Set(EXERCISES.map(e => e.category))];

// ─── ExerciseLibraryScreen ────────────────────────────────────────────────────
export default function ExerciseLibraryScreen({ route, navigation }) {
  const { fromWorkout } = route.params || {};

  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState(null); // for modal

  const filtered = EXERCISES.filter(e => {
    const matchCat = category === 'All' || e.category === category;
    const matchQ   = !search || e.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQ;
  });

  const handleSelect = (exercise) => {
    if (fromWorkout) {
      navigation.navigate('WorkoutSession', { addExercise: exercise });
    } else {
      setSelected(exercise);
    }
  };

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
        <Text style={s.title}>Exercise Library</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Image
          source={require('../assets/ic_search.png')}
          style={s.searchIcon}
          tintColor={C.secondary}
          resizeMode="contain"
          onError={() => {}}
        />
        <TextInput
          style={s.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor={C.secondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.catRow}
        style={s.catScroll}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[s.catChip, category === cat && s.catChipActive]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[s.catText, category === cat && { color: C.accent }]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        ListEmptyComponent={<Text style={s.empty}>No exercises found</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.exCard}
            onPress={() => handleSelect(item)}
            activeOpacity={0.7}
          >
            <View style={s.exLeft}>
              <Text style={s.exName}>{item.name}</Text>
              <Text style={s.exMuscles}>{item.muscles}</Text>
            </View>
            <View style={s.exRight}>
              <View style={s.catBadge}>
                <Text style={s.catBadgeText}>{item.category}</Text>
              </View>
              {fromWorkout ? (
                <Text style={s.addText}>+ Add</Text>
              ) : (
                <TouchableOpacity onPress={() => setSelected(item)} style={s.infoBtn}>
                  <Image source={require('../assets/inf.png')} style={s.infoIcon} resizeMode="contain" />
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        )}
      />

      {/* How-to modal */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>{selected?.name}</Text>
            <View style={s.modalBadge}>
              <Text style={s.modalBadgeText}>{selected?.category}  ·  {selected?.muscles}</Text>
            </View>
            <Text style={s.howToLabel}>How to perform:</Text>
            <Text style={s.howToText}>{selected?.howTo}</Text>
            <TouchableOpacity style={s.closeBtn} onPress={() => setSelected(null)}>
              <Text style={s.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: C.bg },

  header:   { flexDirection: 'row', alignItems: 'center', padding: 16, justifyContent: 'space-between' },
  backBtn:  { padding: 8 },
  backIcon: { width: 22, height: 22, transform: [{ scaleX: -1 }] },
  title:    { color: C.text, fontSize: 18, fontWeight: '700' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14,
  },
  searchIcon:  { width: 18, height: 18, marginRight: 10 },
  searchInput: { flex: 1, paddingVertical: 12, color: C.text, fontSize: 15 },

  catScroll:  { height: 52, flexShrink: 0 },
  catRow:     { paddingHorizontal: 16, alignItems: 'center', gap: 8 },
  catChip:    { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  catChipActive: { borderColor: C.accent },
  catText:    { color: C.secondary, fontSize: 13, fontWeight: '500', lineHeight: 18 },

  list:  { paddingHorizontal: 16, paddingBottom: 32 },
  empty: { color: C.secondary, fontSize: 14, padding: 20, textAlign: 'center' },

  exCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: C.border,
  },
  exLeft:    { flex: 1 },
  exName:    { color: C.text, fontSize: 15, fontWeight: '600' },
  exMuscles: { color: C.secondary, fontSize: 12, marginTop: 2 },
  exRight:   { alignItems: 'flex-end', gap: 6 },
  catBadge:  { backgroundColor: '#1D2850', borderRadius: 8, paddingVertical: 3, paddingHorizontal: 8 },
  catBadgeText:{ color: C.secondary, fontSize: 11 },
  addText:   { color: C.accent, fontSize: 14, fontWeight: '700' },
  infoBtn:   { padding: 4 },
  infoIcon:  { width: 20, height: 20, tintColor: '#fff' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 28, borderWidth: 1, borderColor: C.border,
  },
  modalTitle:    { color: C.text, fontSize: 22, fontWeight: '700', marginBottom: 12 },
  modalBadge:    { backgroundColor: '#1D2850', borderRadius: 10, padding: 10, marginBottom: 20 },
  modalBadgeText:{ color: C.secondary, fontSize: 13 },
  howToLabel:    { color: C.secondary, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  howToText:     { color: C.text, fontSize: 15, lineHeight: 24 },
  closeBtn:      { marginTop: 24, backgroundColor: C.accent, borderRadius: 14, padding: 15, alignItems: 'center' },
  closeBtnText:  { color: '#fff', fontSize: 16, fontWeight: '700' },
});
