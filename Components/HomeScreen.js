import React, { useContext } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, Image,
} from 'react-native';
import { AppContext, todayISO, formatDisplayDate } from '../App';

const C = {
  bg: '#0B1021', card: '#121A33', card2: '#0F1630',
  border: '#1D2850', text: '#EAF0FF', secondary: '#9AA6C3',
  accent: '#6EA8FF', accent2: '#7C5CFF', success: '#2FE38C',
};

// ─── Shared UI primitives (used across screens) ───────────────────────────────

export function Card({ children, style }) {
  return <View style={[cardStyle.card, style]}>{children}</View>;
}

export function Btn({ label, onPress, variant = 'primary', small, style }) {
  const backgrounds = { primary: C.accent, accent2: C.accent2, ghost: 'transparent', success: C.success };
  const bg = backgrounds[variant] ?? C.accent;
  const textColor = variant === 'ghost' ? C.accent : '#fff';
  const border = variant === 'ghost' ? { borderWidth: 1, borderColor: C.border } : {};
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[cardStyle.btn, { backgroundColor: bg }, small && cardStyle.btnSm, border, style]}
    >
      <Text style={[cardStyle.btnText, { color: textColor }, small && { fontSize: 14 }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function ProgressBar({ progress, color = C.accent }) {
  const pct = Math.min(Math.max(progress || 0, 0), 1);
  return (
    <View style={cardStyle.track}>
      <View style={[cardStyle.fill, { width: `${Math.round(pct * 100)}%`, backgroundColor: color }]} />
    </View>
  );
}

export function SectionTitle({ children }) {
  return <Text style={cardStyle.section}>{children}</Text>;
}

const cardStyle = StyleSheet.create({
  card: {
    backgroundColor: C.card, borderRadius: 18, padding: 18,
    marginBottom: 16, borderWidth: 1, borderColor: C.border,
  },
  btn: { borderRadius: 13, paddingVertical: 13, paddingHorizontal: 22, alignItems: 'center' },
  btnSm: { paddingVertical: 9, paddingHorizontal: 16 },
  btnText: { fontSize: 16, fontWeight: '700' },
  track: { height: 6, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' },
  fill:  { height: 6, borderRadius: 3 },
  section: { color: C.text, fontSize: 18, fontWeight: '700', marginBottom: 12, marginTop: 4 },
});

// ─── HomeScreen ───────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }) {
  const {
    appState, streaks,
    caloriesForDate, macrosForDate, weeklyWeightChange,
  } = useContext(AppContext);
  const { profile, weightLogs, workoutPlans } = appState;

  const today     = todayISO();
  const consumed  = caloriesForDate(today);
  const goal      = profile.dailyCaloriesGoal || 2100;
  const macros    = macrosForDate(today);
  const wChange   = weeklyWeightChange();
  const latestW   = weightLogs.length
    ? [...weightLogs].sort((a, b) => b.dateISO.localeCompare(a.dateISO))[0]
    : null;
  const nextPlan  = workoutPlans[0] ?? null;
  const overCalorie = consumed > goal;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>Hey, {profile.name || 'Athlete'}</Text>
            <Text style={s.date}>{formatDisplayDate(today)}</Text>
          </View>
          <View style={s.headerRight}>
            <Image
              source={require('../assets/logo_rainpulse.png')}
              style={s.logo}
              resizeMode="contain"
              onError={() => {}}
            />
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={s.settingsBtn}
              activeOpacity={0.7}
            >
              <Image
                source={require('../assets/ic_settings.png')}
                style={s.settingsIcon}
                tintColor={C.secondary}
                resizeMode="contain"
                onError={() => {}}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Streak badges */}
        <View style={s.streakRow}>
          <StreakBadge label="Food"    value={streaks.food} />
          <StreakBadge label="Weight"  value={streaks.weight} />
          <StreakBadge label="Workout" value={streaks.workout} />
        </View>

        {/* ── Calories card ── */}
        <Card>
          <View style={s.row}>
            <Text style={s.cardTitle}>Today's Calories</Text>
            <Text style={[s.calNum, overCalorie && { color: '#FF6B6B' }]}>
              {consumed} / {goal}
            </Text>
          </View>
          <ProgressBar progress={consumed / goal} color={overCalorie ? '#FF6B6B' : C.accent} />
          <View style={s.macroRow}>
            <Macro label="Protein" val={macros.protein} color={C.accent} />
            <Macro label="Carbs"   val={macros.carbs}   color={C.accent2} />
            <Macro label="Fat"     val={macros.fat}      color={C.success} />
          </View>
          <Btn
            label="+ Add Food"
            small
            style={{ marginTop: 12 }}
            onPress={() => navigation.navigate('AddFood', { dateISO: today, meal: 'lunch' })}
          />
        </Card>

        {/* ── Weight card ── */}
        <Card>
          <View style={s.row}>
            <Text style={s.cardTitle}>Weight</Text>
            {wChange !== null && (
              <Text style={[s.wChange, { color: wChange.startsWith('+') ? '#FF6B6B' : C.success }]}>
                {wChange} {profile.units || 'kg'}/wk
              </Text>
            )}
          </View>
          <Text style={s.bigNum}>
            {latestW ? `${latestW.weight} ${profile.units || 'kg'}` : '—'}
          </Text>
          <Btn
            label="+ Log Weight"
            variant="ghost"
            small
            style={{ marginTop: 10 }}
            onPress={() => navigation.navigate('Weight')}
          />
        </Card>

        {/* ── Next workout card ── */}
        <Card>
          <Text style={s.cardTitle}>Next Workout</Text>
          {nextPlan ? (
            <>
              <Text style={s.planName}>{nextPlan.name}</Text>
              <Btn
                label="▶  Start Workout"
                variant="accent2"
                small
                style={{ marginTop: 10 }}
                onPress={() => navigation.navigate('WorkoutSession', { planId: nextPlan.id })}
              />
            </>
          ) : (
            <>
              <Text style={s.noData}>No plan yet — create one to get started</Text>
              <Btn
                label="+ Create Plan"
                variant="ghost"
                small
                style={{ marginTop: 10 }}
                onPress={() => navigation.navigate('WorkoutPlan')}
              />
            </>
          )}
        </Card>

        {/* ── Quick actions ── */}
        <SectionTitle>Quick Actions</SectionTitle>
        <View style={s.grid}>
          <QuickAction
            icon={require('../assets/ic_nutrition.png')}
            label="Add Food"
            onPress={() => navigation.navigate('AddFood', { dateISO: today, meal: 'lunch' })}
          />
          <QuickAction
            icon={require('../assets/ic_workouts.png')}
            label="Start Workout"
            onPress={() => navigation.navigate('WorkoutSession')}
          />
          <QuickAction
            icon={require('../assets/ic_weight.png')}
            label="Log Weight"
            onPress={() => navigation.navigate('Weight')}
          />
          <QuickAction
            icon={require('../assets/ic_stats.png')}
            label="View Stats"
            onPress={() => navigation.navigate('Stats')}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function StreakBadge({ label, value }) {
  return (
    <View style={s.badge}>
      <Image
        source={require('../assets/ic_fire.png')}
        style={s.fireIcon}
        tintColor="#FF9500"
        resizeMode="contain"
        onError={() => {}}
      />
      <Text style={s.badgeVal}>{value}</Text>
      <Text style={s.badgeLabel}>{label}</Text>
    </View>
  );
}

function Macro({ label, val, color }) {
  return (
    <View style={s.macro}>
      <Text style={[s.macroVal, { color }]}>{Math.round(val)}g</Text>
      <Text style={s.macroLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={s.qaCard} onPress={onPress} activeOpacity={0.7}>
      <Image source={icon} style={s.qaIcon} tintColor={C.accent} resizeMode="contain" onError={() => {}} />
      <Text style={s.qaLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: C.bg },
  scroll:   { padding: 20, paddingBottom: 110 },
  header:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { color: C.text, fontSize: 22, fontWeight: '700' },
  date:     { color: C.secondary, fontSize: 13, marginTop: 3 },
  logo:        { width: 36, height: 36 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingsBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  settingsIcon: { width: 18, height: 18 },

  streakRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  badge: {
    flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: C.border,
  },
  fireIcon:   { width: 18, height: 18, marginBottom: 4 },
  badgeVal:   { color: C.text, fontSize: 20, fontWeight: '800' },
  badgeLabel: { color: C.secondary, fontSize: 10, marginTop: 2 },

  row:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle:{ color: C.text, fontSize: 16, fontWeight: '600' },
  calNum:   { color: C.secondary, fontSize: 14 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 14 },
  macro:    { alignItems: 'center' },
  macroVal: { fontSize: 18, fontWeight: '800' },
  macroLabel:{ color: C.secondary, fontSize: 12, marginTop: 2 },
  wChange:  { fontSize: 14, fontWeight: '600' },
  bigNum:   { color: C.text, fontSize: 34, fontWeight: '800', marginTop: 6 },
  planName: { color: C.secondary, fontSize: 15, marginTop: 6 },
  noData:   { color: C.secondary, fontSize: 14, marginTop: 6, lineHeight: 20 },

  grid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  qaCard:  {
    width: '47%', backgroundColor: C.card, borderRadius: 16, padding: 18,
    alignItems: 'center', borderWidth: 1, borderColor: C.border,
  },
  qaIcon:  { width: 30, height: 30, marginBottom: 10 },
  qaLabel: { color: C.text, fontSize: 14, fontWeight: '500', textAlign: 'center' },
});
