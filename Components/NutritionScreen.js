import React, { useState, useContext } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, Image,
} from 'react-native';
import { AppContext, todayISO, addDaysToISO, formatDisplayDate } from '../App';
import ConfirmModal from './ConfirmModal';
import { Card, Btn, ProgressBar } from './HomeScreen';

const C = {
  bg: '#0B1021', card: '#121A33', border: '#1D2850',
  text: '#EAF0FF', secondary: '#9AA6C3',
  accent: '#6EA8FF', accent2: '#7C5CFF', success: '#2FE38C',
};

const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_LABELS = {
  breakfast: 'Breakfast',
  lunch:     'Lunch',
  dinner:    'Dinner',
  snack:     'Snack',
};

const MEAL_ICONS = {
  breakfast: require('../assets/ic_breakfast.png'),
  lunch:     require('../assets/ic_lunch.png'),
  dinner:    require('../assets/ic_dinner.png'),
  snack:     require('../assets/ic_snack.png'),
};

export default function NutritionScreen({ navigation }) {
  const { appState, deleteFood, copyYesterday, caloriesForDate, macrosForDate } = useContext(AppContext);
  const { foodLogs, profile } = appState;

  const [dateISO, setDateISO] = useState(todayISO());
  const [modal, setModal] = useState(null);

  const dayLogs  = foodLogs.filter(f => f.dateISO === dateISO);
  const consumed = caloriesForDate(dateISO);
  const goal     = profile.dailyCaloriesGoal || 2100;
  const macros   = macrosForDate(dateISO);

  const handleDelete = (id, name) => {
    setModal({
      title: 'Delete Entry',
      message: `Remove "${name}"?`,
      confirmLabel: 'Delete',
      confirmDanger: true,
      onConfirm: () => deleteFood(id),
    });
  };

  const handleCopyYesterday = () => {
    const yesterday = addDaysToISO(dateISO, -1);
    const hasYesterdayData = foodLogs.some(f => f.dateISO === yesterday);
    if (!hasYesterdayData) {
      setModal({
        title: 'Nothing to Copy',
        message: 'No food was logged yesterday.',
        showCancel: false,
        confirmLabel: 'OK',
      });
      return;
    }
    setModal({
      title: 'Copy Yesterday',
      message: 'Copy all meals from yesterday to today?',
      confirmLabel: 'Copy',
      onConfirm: () => copyYesterday(dateISO),
    });
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Date nav */}
        <View style={s.dateNav}>
          <TouchableOpacity onPress={() => setDateISO(d => addDaysToISO(d, -1))} style={s.arrow}>
            <Text style={s.arrowText}>‹</Text>
          </TouchableOpacity>
          <View style={s.dateMid}>
            <Image
              source={require('../assets/ic_calendar.png')}
              style={s.calIcon}
              tintColor={C.secondary}
              resizeMode="contain"
              onError={() => {}}
            />
            <Text style={s.dateText}>{formatDisplayDate(dateISO)}</Text>
          </View>
          <TouchableOpacity
            onPress={() => dateISO < todayISO() && setDateISO(d => addDaysToISO(d, 1))}
            style={[s.arrow, dateISO >= todayISO() && { opacity: 0.3 }]}
          >
            <Text style={s.arrowText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Day summary */}
        <Card style={{ marginBottom: 16 }}>
          <View style={s.row}>
            <Text style={s.cardTitle}>Daily Summary</Text>
            <Text style={s.calText}>{consumed} / {goal} kcal</Text>
          </View>
          <ProgressBar progress={consumed / goal} color={consumed > goal ? '#FF6B6B' : C.accent} />
          <View style={s.macroRow}>
            <MacroCol label="Protein" val={macros.protein} color={C.accent} />
            <MacroCol label="Carbs"   val={macros.carbs}   color={C.accent2} />
            <MacroCol label="Fat"     val={macros.fat}      color={C.success} />
            <MacroCol label="Left"    val={Math.max(0, goal - consumed)} color={C.secondary} unit="kcal" />
          </View>
        </Card>

        {/* Numeric data table */}
        <Card style={{ marginBottom: 16 }}>
          <Text style={s.tableTitle}>Macros & Calories</Text>
          <View style={s.table}>
            <View style={[s.tableRow, s.tableHeader]}>
              <Text style={s.tableHeaderText}>Nutrient</Text>
              <Text style={s.tableHeaderText}>Value</Text>
              <Text style={s.tableHeaderText}>%</Text>
            </View>
            <TableRow label="Calories" value={consumed} unit="kcal" total={goal} />
            <TableRow label="Protein"  value={Math.round(macros.protein)} unit="g"  total={150} />
            <TableRow label="Carbs"    value={Math.round(macros.carbs)}   unit="g"  total={250} />
            <TableRow label="Fat"      value={Math.round(macros.fat)}     unit="g"  total={70} last />
          </View>
        </Card>

        {/* Action buttons */}
        <View style={s.actionRow}>
          <Btn
            label="Copy Yesterday"
            variant="ghost"
            small
            style={{ flex: 1 }}
            onPress={handleCopyYesterday}
          />
        </View>

        {/* Meal sections */}
        {MEALS.map(meal => {
          const mealLogs = dayLogs.filter(f => f.meal === meal);
          const mealCals = mealLogs.reduce((s, f) => s + (Number(f.calories) || 0), 0);
          return (
            <View key={meal} style={s.mealSection}>
              <View style={s.mealHeader}>
                <View style={s.mealTitleRow}>
                  <Image
                    source={MEAL_ICONS[meal]}
                    style={s.mealIcon}
                    tintColor={C.accent}
                    resizeMode="contain"
                    onError={() => {}}
                  />
                  <Text style={s.mealTitle}>{MEAL_LABELS[meal]}</Text>
                </View>
                <View style={s.mealRight}>
                  {mealCals > 0 && <Text style={s.mealCals}>{mealCals} kcal</Text>}
                  <TouchableOpacity
                    onPress={() => navigation.navigate('AddFood', { dateISO, meal })}
                    style={s.addBtn}
                  >
                    <Image
                      source={require('../assets/ic_plus.png')}
                      style={s.plusIcon}
                      tintColor={C.accent}
                      resizeMode="contain"
                      onError={() => {}}
                    />
                    <Text style={s.addBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {mealLogs.length === 0 ? (
                <Text style={s.emptyMeal}>No items added</Text>
              ) : (
                mealLogs.map(item => (
                  <FoodItem
                    key={item.id}
                    item={item}
                    onEdit={() => navigation.navigate('AddFood', { dateISO, meal, editItem: item })}
                    onDelete={() => handleDelete(item.id, item.name)}
                  />
                ))
              )}
            </View>
          );
        })}

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

function FoodItem({ item, onEdit, onDelete }) {
  return (
    <View style={s.foodItem}>
      <View style={{ flex: 1 }}>
        <Text style={s.foodName}>{item.name}</Text>
        <Text style={s.foodSub}>
          {item.grams}g  ·  P:{Math.round(item.protein)}g  C:{Math.round(item.carbs)}g  F:{Math.round(item.fat)}g
        </Text>
      </View>
      <Text style={s.foodCal}>{item.calories} kcal</Text>
      <TouchableOpacity onPress={onEdit} style={s.iconBtn}>
        <Image
          source={require('../assets/ic_edit.png')}
          style={s.actionIcon}
          tintColor={C.secondary}
          resizeMode="contain"
          onError={() => {}}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} style={s.iconBtn}>
        <Image
          source={require('../assets/ic_trash.png')}
          style={s.actionIcon}
          tintColor="#FF6B6B"
          resizeMode="contain"
          onError={() => {}}
        />
      </TouchableOpacity>
    </View>
  );
}

function MacroCol({ label, val, color, unit = 'g' }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={[s.macroVal, { color }]}>{Math.round(val)}{unit}</Text>
      <Text style={s.macroLabel}>{label}</Text>
    </View>
  );
}

function TableRow({ label, value, unit, total, last }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <View style={[s.tableRow, last && { borderBottomWidth: 0 }]}>
      <Text style={s.tableCellLabel}>{label}</Text>
      <Text style={s.tableCellValue}>{value} {unit}</Text>
      <Text style={s.tableCellPct}>{pct}%</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 20, paddingBottom: 110 },

  dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  arrow:   { padding: 12 },
  arrowText: { color: C.text, fontSize: 28, fontWeight: '300' },
  dateMid: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  calIcon: { width: 18, height: 18 },
  dateText:{ color: C.text, fontSize: 17, fontWeight: '600' },

  row:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle:{ color: C.text, fontSize: 16, fontWeight: '600' },
  calText:  { color: C.secondary, fontSize: 14 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 14 },
  macroVal: { fontSize: 16, fontWeight: '700' },
  macroLabel:{ color: C.secondary, fontSize: 11, marginTop: 2 },

  tableTitle:  { color: C.text, fontSize: 16, fontWeight: '600', marginBottom: 12 },
  table:       { borderWidth: 1, borderColor: C.border, borderRadius: 12, overflow: 'hidden' },
  tableRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  tableHeader: { backgroundColor: '#1D2850', borderBottomWidth: 0 },
  tableHeaderText: { flex: 1, color: C.secondary, fontSize: 12, fontWeight: '700' },
  tableCellLabel:  { flex: 1, color: C.secondary, fontSize: 14 },
  tableCellValue:  { flex: 1, color: C.text, fontSize: 14, fontWeight: '600' },
  tableCellPct:    { flex: 1, color: C.accent, fontSize: 13, fontWeight: '600' },

  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },

  mealSection: { marginBottom: 20 },
  mealTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mealIcon:     { width: 16, height: 16 },
  mealHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  mealTitle: { color: C.text, fontSize: 16, fontWeight: '600' },
  mealRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mealCals:  { color: C.secondary, fontSize: 13 },
  addBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  plusIcon:  { width: 16, height: 16 },
  addBtnText:{ color: C.accent, fontSize: 14, fontWeight: '600' },
  emptyMeal: { color: C.secondary, fontSize: 13, paddingVertical: 8, paddingLeft: 4 },

  foodItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.card, borderRadius: 12, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: C.border,
  },
  foodName: { color: C.text, fontSize: 14, fontWeight: '600' },
  foodSub:  { color: C.secondary, fontSize: 12, marginTop: 2 },
  foodCal:  { color: C.accent, fontSize: 14, fontWeight: '600', marginRight: 8 },
  iconBtn:  { padding: 6 },
  actionIcon:{ width: 18, height: 18 },
});
