import React, { useState, useContext, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import ConfirmModal from './ConfirmModal';
import { AppContext, todayISO } from '../App';

const C = {
  bg: '#0B1021', card: '#121A33', border: '#1D2850',
  text: '#EAF0FF', secondary: '#9AA6C3',
  accent: '#6EA8FF', success: '#2FE38C',
};

const GRAM_CHIPS = [50, 100, 150, 200, 300];
const MEALS      = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function AddFoodScreen({ route, navigation }) {
  const { addFood, editFood, appState } = useContext(AppContext);
  const { dateISO = todayISO(), meal: initMeal = 'lunch', editItem } = route.params || {};

  const isEdit = !!editItem;

  const [meal,     setMeal]     = useState(initMeal);
  const [name,     setName]     = useState(editItem?.name     || '');
  const [grams,    setGrams]    = useState(String(editItem?.grams    || ''));
  const [calories, setCalories] = useState(String(editItem?.calories || ''));
  const [protein,  setProtein]  = useState(String(editItem?.protein  || ''));
  const [carbs,    setCarbs]    = useState(String(editItem?.carbs    || ''));
  const [fat,      setFat]      = useState(String(editItem?.fat      || ''));

  // Recent foods (last 10 unique names)
  const recentFoods = [...new Map(
    [...appState.foodLogs]
      .sort((a, b) => b.dateISO.localeCompare(a.dateISO))
      .map(f => [f.name.toLowerCase(), f])
  ).values()].slice(0, 10);

  const fillFromRecent = (item) => {
    setName(item.name);
    setGrams(String(item.grams || ''));
    setCalories(String(item.calories || ''));
    setProtein(String(item.protein || ''));
    setCarbs(String(item.carbs || ''));
    setFat(String(item.fat || ''));
  };

  const handleGramChip = (g) => {
    setGrams(String(g));
    // Optionally scale macros if calories per gram known
  };

  const [modal, setModal] = useState(null);

  const canSave = name.trim() && calories;

  const handleSave = () => {
    if (!canSave) {
      setModal({ title: 'Required Fields', message: 'Please enter at least a name and calories.', showCancel: false });
      return;
    }
    const entry = {
      dateISO,
      meal,
      name: name.trim(),
      grams:    Number(grams)    || 0,
      calories: Number(calories) || 0,
      protein:  Number(protein)  || 0,
      carbs:    Number(carbs)    || 0,
      fat:      Number(fat)      || 0,
    };
    if (isEdit) {
      editFood(editItem.id, entry);
    } else {
      addFood(entry);
    }
    navigation.goBack();
  };

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
          <Text style={s.title}>{isEdit ? 'Edit Food' : 'Add Food'}</Text>
          <TouchableOpacity onPress={handleSave} style={[s.saveBtn, !canSave && { opacity: 0.4 }]}>
            <Text style={s.saveBtnText}>{isEdit ? 'Update' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* Meal selector */}
          <Text style={s.label}>Meal</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.mealScroll}>
            {MEALS.map(m => (
              <TouchableOpacity
                key={m}
                style={[s.mealChip, meal === m && s.mealChipActive]}
                onPress={() => setMeal(m)}
              >
                <Text style={[s.mealChipText, meal === m && { color: C.accent }]}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Food name */}
          <Text style={s.label}>Food Name *</Text>
          <TextInput
            style={s.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Chicken breast"
            placeholderTextColor={C.secondary}
            autoFocus={!isEdit}
          />

          {/* Grams */}
          <Text style={s.label}>Grams / Amount</Text>
          <TextInput
            style={s.input}
            value={grams}
            onChangeText={setGrams}
            placeholder="e.g. 150"
            placeholderTextColor={C.secondary}
            keyboardType="numeric"
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
            {GRAM_CHIPS.map(g => (
              <TouchableOpacity key={g} style={s.gramChip} onPress={() => handleGramChip(g)}>
                <Text style={s.gramChipText}>{g}g</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Calories */}
          <Text style={s.label}>Calories (kcal) *</Text>
          <TextInput
            style={s.input}
            value={calories}
            onChangeText={setCalories}
            placeholder="e.g. 250"
            placeholderTextColor={C.secondary}
            keyboardType="numeric"
          />

          {/* Macros row */}
          <View style={s.macroRow}>
            <View style={s.macroField}>
              <Text style={s.label}>Protein (g)</Text>
              <TextInput
                style={s.input}
                value={protein}
                onChangeText={setProtein}
                placeholder="0"
                placeholderTextColor={C.secondary}
                keyboardType="numeric"
              />
            </View>
            <View style={s.macroField}>
              <Text style={s.label}>Carbs (g)</Text>
              <TextInput
                style={s.input}
                value={carbs}
                onChangeText={setCarbs}
                placeholder="0"
                placeholderTextColor={C.secondary}
                keyboardType="numeric"
              />
            </View>
            <View style={s.macroField}>
              <Text style={s.label}>Fat (g)</Text>
              <TextInput
                style={s.input}
                value={fat}
                onChangeText={setFat}
                placeholder="0"
                placeholderTextColor={C.secondary}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Recent foods */}
          {!isEdit && recentFoods.length > 0 && (
            <>
              <Text style={[s.label, { marginTop: 24 }]}>Recent Foods</Text>
              {recentFoods.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={s.recentItem}
                  onPress={() => fillFromRecent(item)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={s.recentName}>{item.name}</Text>
                    <Text style={s.recentSub}>{item.grams}g · {item.calories} kcal</Text>
                  </View>
                  <Text style={s.recentPlus}>+</Text>
                </TouchableOpacity>
              ))}
            </>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      {modal && (
        <ConfirmModal
          visible
          title={modal.title}
          message={modal.message}
          confirmLabel={modal.confirmLabel}
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

  header: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, paddingBottom: 8, justifyContent: 'space-between',
  },
  backBtn:  { padding: 8 },
  backIcon: { width: 22, height: 22, transform: [{ scaleX: -1 }] },
  title:    { color: C.text, fontSize: 18, fontWeight: '700' },
  saveBtn:  { backgroundColor: C.accent, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16 },
  saveBtnText:{ color: '#fff', fontSize: 15, fontWeight: '700' },

  label: { color: C.secondary, fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: C.card, borderRadius: 13, padding: 14,
    color: C.text, fontSize: 16, borderWidth: 1, borderColor: C.border,
  },

  mealScroll: { marginBottom: 4 },
  mealChip: {
    paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.card, marginRight: 8,
  },
  mealChipActive: { borderColor: C.accent },
  mealChipText:   { color: C.secondary, fontSize: 14, fontWeight: '500' },

  chipScroll: { marginTop: 10, marginBottom: 4 },
  gramChip: {
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16,
    borderWidth: 1, borderColor: C.border, backgroundColor: '#1D2850', marginRight: 8,
  },
  gramChipText: { color: C.text, fontSize: 13 },

  macroRow:  { flexDirection: 'row', gap: 10, marginTop: 4 },
  macroField:{ flex: 1 },

  recentItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.card, borderRadius: 13, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: C.border,
  },
  recentName: { color: C.text, fontSize: 14, fontWeight: '600' },
  recentSub:  { color: C.secondary, fontSize: 12, marginTop: 2 },
  recentPlus: { color: C.accent, fontSize: 22, fontWeight: '300' },
});
