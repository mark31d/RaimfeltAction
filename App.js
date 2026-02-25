import React, { useState, useEffect, useRef, createContext, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';

enableScreens();
import Loader from './Components/Loader';
import OnboardingScreen from './Components/OnboardingScreen';
import MainTabs from './Components/MainTabs';
import WorkoutSessionScreen from './Components/WorkoutSessionScreen';
import WorkoutPlanScreen from './Components/WorkoutPlanScreen';
import ExerciseLibraryScreen from './Components/ExerciseLibraryScreen';
import AddFoodScreen from './Components/AddFoodScreen';
import LogWeightScreen from './Components/LogWeightScreen';
import SettingsScreen from './Components/SettingsScreen';

export const AppContext = createContext(null);

// ─── Unique ID helper ────────────────────────────────────────────────────────
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ─── Date utilities ──────────────────────────────────────────────────────────
export const todayISO = () => new Date().toISOString().split('T')[0];

export const addDaysToISO = (dateISO, n) => {
  const d = new Date(dateISO + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};

export const formatDisplayDate = (dateISO) => {
  const t = todayISO();
  const y = addDaysToISO(t, -1);
  if (dateISO === t) return 'Today';
  if (dateISO === y) return 'Yesterday';
  const d = new Date(dateISO + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const shortDay = (dateISO) => {
  const d = new Date(dateISO + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
};

// ─── Calculations ────────────────────────────────────────────────────────────
export function caloriesForDate(foodLogs, dateISO) {
  return foodLogs
    .filter(f => f.dateISO === dateISO)
    .reduce((s, f) => s + (Number(f.calories) || 0), 0);
}

export function macrosForDate(foodLogs, dateISO) {
  const day = foodLogs.filter(f => f.dateISO === dateISO);
  return {
    protein: day.reduce((s, f) => s + (Number(f.protein) || 0), 0),
    carbs:   day.reduce((s, f) => s + (Number(f.carbs)   || 0), 0),
    fat:     day.reduce((s, f) => s + (Number(f.fat)     || 0), 0),
  };
}

export function totalWorkoutVolume(workout) {
  return (workout.exercises || []).reduce((tot, ex) =>
    tot + (ex.sets || []).reduce((s, set) =>
      s + (Number(set.reps) || 0) * (Number(set.weight) || 0), 0), 0);
}

export function weeklyWeightChange(weightLogs) {
  if (weightLogs.length < 2) return null;
  const sorted = [...weightLogs].sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  const latest = sorted[sorted.length - 1];
  const weekAgoISO = addDaysToISO(todayISO(), -7);
  const base = sorted.find(l => l.dateISO >= weekAgoISO) || sorted[0];
  if (base.dateISO === latest.dateISO) return null;
  const diff = Number(latest.weight) - Number(base.weight);
  return diff >= 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
}

function calcStreak(logs) {
  if (!logs.length) return 0;
  const dates = [...new Set(logs.map(l => l.dateISO))].sort((a, b) => b.localeCompare(a));
  let streak = 0;
  let cur = todayISO();
  for (const d of dates) {
    if (d === cur) { streak++; cur = addDaysToISO(cur, -1); }
    else if (d < cur) break;
  }
  return streak;
}

// ─── Storage ─────────────────────────────────────────────────────────────────
const STORAGE_KEY = '@rainpulse_v1';

const DEFAULT_STATE = {
  profile: { name: '', goal: 'maintain', units: 'kg', dailyCaloriesGoal: 2100 },
  weightLogs: [],
  foodLogs: [],
  workouts: [],
  workoutPlans: [],
};

// ─── Navigation ──────────────────────────────────────────────────────────────
const Stack = createNativeStackNavigator();

const NAV_THEME = {
  dark: true,
  colors: {
    primary: '#6EA8FF',
    background: '#0B1021',
    card: '#0B1021',
    text: '#EAF0FF',
    border: 'transparent',
    notification: '#6EA8FF',
  },
  // React Navigation v7 requires fonts
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium:  { fontFamily: 'System', fontWeight: '500' },
    bold:    { fontFamily: 'System', fontWeight: '600' },
    heavy:   { fontFamily: 'System', fontWeight: '700' },
  },
};

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [booting, setBooting] = useState(true);
  const [appState, setAppState] = useState(DEFAULT_STATE);
  const debRef = useRef(null);

  // Splash/boot timer
  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 3500);
    return () => clearTimeout(t);
  }, []);

  // Load persisted state
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => { if (raw) setAppState(JSON.parse(raw)); })
      .catch(() => {});
  }, []);

  // Debounced persist
  const persist = useCallback((s) => {
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() =>
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s)).catch(() => {}), 500);
  }, []);

  const updateState = useCallback((updater) => {
    setAppState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      persist(next);
      return next;
    });
  }, [persist]);

  // ── Profile ──────────────────────────────────────────────────────────────
  const setProfile = useCallback((p) =>
    updateState(prev => ({ ...prev, profile: { ...prev.profile, ...p } })), [updateState]);

  // ── Food ─────────────────────────────────────────────────────────────────
  const addFood = useCallback((item) =>
    updateState(prev => ({ ...prev, foodLogs: [...prev.foodLogs, { id: uid(), ...item }] })), [updateState]);

  const editFood = useCallback((id, updates) =>
    updateState(prev => ({
      ...prev,
      foodLogs: prev.foodLogs.map(f => f.id === id ? { ...f, ...updates } : f),
    })), [updateState]);

  const deleteFood = useCallback((id) =>
    updateState(prev => ({ ...prev, foodLogs: prev.foodLogs.filter(f => f.id !== id) })), [updateState]);

  const copyYesterday = useCallback((dateISO) =>
    updateState(prev => {
      const yesterday = addDaysToISO(dateISO, -1);
      const copies = prev.foodLogs
        .filter(f => f.dateISO === yesterday)
        .map(f => ({ ...f, id: uid(), dateISO }));
      return { ...prev, foodLogs: [...prev.foodLogs, ...copies] };
    }), [updateState]);

  // ── Weight ───────────────────────────────────────────────────────────────
  const addWeight = useCallback((log) =>
    updateState(prev => ({ ...prev, weightLogs: [...prev.weightLogs, { id: uid(), ...log }] })), [updateState]);

  const deleteWeight = useCallback((id) =>
    updateState(prev => ({ ...prev, weightLogs: prev.weightLogs.filter(w => w.id !== id) })), [updateState]);

  // ── Workout Plans ────────────────────────────────────────────────────────
  const createPlan = useCallback((plan) =>
    updateState(prev => ({ ...prev, workoutPlans: [...prev.workoutPlans, { id: uid(), ...plan }] })), [updateState]);

  const deletePlan = useCallback((id) =>
    updateState(prev => ({ ...prev, workoutPlans: prev.workoutPlans.filter(p => p.id !== id) })), [updateState]);

  // ── Workout Sessions ─────────────────────────────────────────────────────
  const saveWorkoutSession = useCallback((session) =>
    updateState(prev => ({ ...prev, workouts: [...prev.workouts, { id: uid(), ...session }] })), [updateState]);

  const deleteWorkout = useCallback((id) =>
    updateState(prev => ({ ...prev, workouts: prev.workouts.filter(w => w.id !== id) })), [updateState]);

  // ── Reset all ────────────────────────────────────────────────────────────
  const resetAll = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setAppState(DEFAULT_STATE);
  }, []);

  // ── Derived ──────────────────────────────────────────────────────────────
  const streaks = {
    food:    calcStreak(appState.foodLogs),
    weight:  calcStreak(appState.weightLogs),
    workout: calcStreak(appState.workouts),
  };

  const ctx = {
    appState,
    streaks,
    setProfile,
    addFood, editFood, deleteFood, copyYesterday,
    addWeight, deleteWeight,
    createPlan, deletePlan,
    saveWorkoutSession, deleteWorkout,
    resetAll,
    // Helpers
    caloriesForDate:   (d) => caloriesForDate(appState.foodLogs, d),
    macrosForDate:     (d) => macrosForDate(appState.foodLogs, d),
    remainingCalories: (d) => appState.profile.dailyCaloriesGoal - caloriesForDate(appState.foodLogs, d),
    weeklyWeightChange: ()  => weeklyWeightChange(appState.weightLogs),
  };

  if (booting) return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Loader spinnerDuration={2000} />
    </GestureHandlerRootView>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <AppContext.Provider value={ctx}>
      <NavigationContainer theme={NAV_THEME}>
        <Stack.Navigator
          initialRouteName="Onboarding"
          screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
        >
          <Stack.Screen name="Onboarding"       component={OnboardingScreen} />
          <Stack.Screen name="MainTabs"         component={MainTabs} />
          <Stack.Screen name="WorkoutSession"   component={WorkoutSessionScreen} />
          <Stack.Screen name="WorkoutPlan"      component={WorkoutPlanScreen} />
          <Stack.Screen name="ExerciseLibrary"  component={ExerciseLibraryScreen} />
          <Stack.Screen name="AddFood"          component={AddFoodScreen} />
          <Stack.Screen name="LogWeight"        component={LogWeightScreen} />
          <Stack.Screen name="Settings"         component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppContext.Provider>
    </GestureHandlerRootView>
  );
}
