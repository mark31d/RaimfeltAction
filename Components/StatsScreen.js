import React, { useState, useContext } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, Image, Dimensions,
} from 'react-native';
import ConfirmModal from './ConfirmModal';
import Svg, { Rect, Line, Path, Circle, Text as SvgText, G } from 'react-native-svg';
import { AppContext, todayISO, addDaysToISO, caloriesForDate, macrosForDate } from '../App';

const { width: SW } = Dimensions.get('window');

const C = {
  bg: '#0B1021', card: '#121A33', border: '#1D2850',
  text: '#EAF0FF', secondary: '#9AA6C3',
  accent: '#6EA8FF', accent2: '#7C5CFF', success: '#2FE38C',
  warning: '#FF9500',
};

// ─── SVG arc helper ───────────────────────────────────────────────────────────
function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = angleDeg * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function describeArc(cx, cy, r, start, end) {
  const s = polarToCartesian(cx, cy, r, start);
  const e = polarToCartesian(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────
function BarChart({ data, chartW, chartH, color, goalValue }) {
  if (!data || data.length === 0) {
    return (
      <Svg width={chartW} height={chartH}>
        <SvgText x={chartW / 2} y={chartH / 2} textAnchor="middle" fill={C.secondary} fontSize="13">No data</SvgText>
      </Svg>
    );
  }
  const PAD    = { top: 28, bottom: 36, left: 8, right: 8 };
  const W      = Math.max(0, chartW - PAD.left - PAD.right);
  const H      = Math.max(0, chartH - PAD.top - PAD.bottom);
  const maxVal = Math.max(...data.map(d => d.value), goalValue || 0, 1);
  const gap    = Math.min(4, W / data.length / 4);
  const bw     = Math.max(4, (W - gap * (data.length - 1)) / data.length);
  const goalY  = goalValue ? PAD.top + H - (goalValue / maxVal) * H : null;

  return (
    <Svg width={chartW} height={chartH}>
      {data.map((d, i) => {
        const bh = Math.max(2, (d.value / maxVal) * H);
        const x  = PAD.left + i * (bw + gap);
        const y  = PAD.top + H - bh;
        const valY = y - 6;
        const showValAbove = goalY === null || valY > goalY + 10 || d.value / maxVal > 0.15;
        return (
          <G key={i}>
            <Rect x={x} y={y} width={bw} height={bh} rx={4} fill={color} opacity={0.85} />
            {d.label ? (
              <SvgText x={x + bw / 2} y={chartH - 10} textAnchor="middle" fill={C.secondary} fontSize={9}>
                {String(d.label).slice(0, 6)}
              </SvgText>
            ) : null}
            {d.value > 0 && showValAbove && (
              <SvgText x={x + bw / 2} y={valY} textAnchor="middle" fill={color} fontSize={8}>
                {d.value}
              </SvgText>
            )}
            {d.value > 0 && !showValAbove && (
              <SvgText x={x + bw / 2} y={y + bh / 2 + 3} textAnchor="middle" fill={color} fontSize={7}>
                {d.value}
              </SvgText>
            )}
          </G>
        );
      })}
      {goalY !== null && goalY >= PAD.top && goalY <= PAD.top + H && (
        <G>
          <Line
            x1={PAD.left} y1={goalY} x2={chartW - PAD.right} y2={goalY}
            stroke={C.warning} strokeWidth={1.5} strokeDasharray="4,3"
          />
          <SvgText x={chartW - PAD.right - 2} y={goalY - 5} textAnchor="end" fill={C.warning} fontSize={8}>
            goal
          </SvgText>
        </G>
      )}
    </Svg>
  );
}

// ─── Line Chart ───────────────────────────────────────────────────────────────
function LineChart({ data, chartW, chartH, color }) {
  if (!data || data.length < 2) {
    return (
      <Svg width={chartW} height={chartH}>
        <SvgText x={chartW / 2} y={chartH / 2} textAnchor="middle" fill={C.secondary} fontSize="13">
          Not enough data
        </SvgText>
      </Svg>
    );
  }
  const PAD    = { top: 24, bottom: 36, left: 12, right: 12 };
  const W      = Math.max(0, chartW - PAD.left - PAD.right);
  const H      = Math.max(0, chartH - PAD.top - PAD.bottom);
  const values = data.map(d => d.value);
  const minV   = Math.min(...values);
  const maxV   = Math.max(...values);
  const range  = maxV - minV || 1;

  const pts = data.map((d, i) => ({
    x: PAD.left + (i / Math.max(1, data.length - 1)) * W,
    y: PAD.top + H - ((d.value - minV) / range) * H,
  }));

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const fillD = `${pathD} L ${pts[pts.length - 1].x} ${PAD.top + H} L ${pts[0].x} ${PAD.top + H} Z`;

  const labelStep = data.length <= 7 ? 1 : Math.max(1, Math.floor(data.length / 6));

  return (
    <Svg width={chartW} height={chartH}>
      <Path d={fillD} fill={color} opacity={0.1} />
      <Path d={pathD} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <React.Fragment key={i}>
          <Circle cx={p.x} cy={p.y} r={3.5} fill={color} />
          {i % labelStep === 0 && (
            <SvgText x={p.x} y={chartH - 10} textAnchor="middle" fill={C.secondary} fontSize={9}>
              {String(data[i].label || '').slice(0, 8)}
            </SvgText>
          )}
        </React.Fragment>
      ))}
    </Svg>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────
function DonutChart({ segments, size = 140, thickness = 24 }) {
  const total = segments.reduce((s, g) => s + g.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const r  = (size - thickness) / 2;

  if (!total) {
    return (
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={r} fill="none" stroke={C.border} strokeWidth={thickness} />
        <SvgText x={cx} y={cy + 5} textAnchor="middle" fill={C.secondary} fontSize={12}>No data</SvgText>
      </Svg>
    );
  }

  let angle = -90;
  const GAP = 4;
  return (
    <Svg width={size} height={size}>
      {segments.map((seg, i) => {
        const sweep    = (seg.value / total) * 360 - GAP;
        const endAngle = angle + Math.max(sweep, 0.5);
        const d        = describeArc(cx, cy, r, angle, endAngle);
        angle          = angle + sweep + GAP;
        return <Path key={i} d={d} fill="none" stroke={seg.color} strokeWidth={thickness} strokeLinecap="round" />;
      })}
    </Svg>
  );
}

// ─── StatsScreen ─────────────────────────────────────────────────────────────
export default function StatsScreen() {
  const { appState, streaks } = useContext(AppContext);
  const { foodLogs, weightLogs, workouts, profile } = appState;

  const [period, setPeriod] = useState('Week');
  const [modal,  setModal]  = useState(null);

  const days      = period === 'Week' ? 7 : 30;
  const cutoffISO = addDaysToISO(todayISO(), -days + 1);
  const dayArray  = Array.from({ length: days }, (_, i) => addDaysToISO(cutoffISO, i));

  // Fallback sample data when empty (for display only)
  const SAMPLE_CAL = [1950, 2100, 1850, 2250, 2000, 2400, 1900, 2050, 2200, 1780, 2150, 1980, 2320, 1880, 2050, 1920, 2180, 2000, 2400, 1850, 2100, 1950, 2200, 1900, 2050, 1980, 2320, 1880, 2150, 2000];
  const SAMPLE_PROT = [120, 95, 110, 130, 100, 140, 115, 125, 105, 118, 132, 98, 108, 122, 95, 115, 128, 102, 135, 112, 120, 118, 125, 110, 130, 105, 140, 98, 115, 108];
  const SAMPLE_WEIGHT = [72.5, 72.3, 72.1, 71.9, 72.0, 71.8, 71.6, 71.5, 71.4, 71.3, 71.2, 71.4, 71.3, 71.2];
  const SAMPLE_WORKOUT = [1, 0, 2, 0, 1, 1, 0, 2, 0, 1, 1, 0, 2, 1, 0, 1, 0, 2, 0, 1, 1, 0, 2, 0, 1, 1, 0, 2, 1, 0];

  const hasCal = dayArray.some(d => caloriesForDate(foodLogs, d) > 0);
  const hasWeight = weightLogs.length >= 2;
  const hasWorkout = dayArray.some(d => workouts.filter(w => w.dateISO === d).length > 0);

  // Calories per day
  const calData = dayArray.map((d, i) => ({
    label: days <= 7 ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }) : (i % 5 === 0 ? d.slice(8) : ''),
    value: hasCal ? caloriesForDate(foodLogs, d) : SAMPLE_CAL[i % SAMPLE_CAL.length],
  }));

  // Protein per day
  const proteinData = dayArray.map((d, i) => ({
    label: days <= 7 ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }) : (i % 5 === 0 ? d.slice(8) : ''),
    value: hasCal ? Math.round(macrosForDate(foodLogs, d).protein) : SAMPLE_PROT[i % SAMPLE_PROT.length],
  }));

  // Weight trend
  const weightData = hasWeight
    ? dayArray
        .map(d => {
          const log = [...weightLogs]
            .filter(l => l.dateISO === d)
            .sort((a, b) => b.dateISO.localeCompare(a.dateISO))[0];
          return log ? { label: d.slice(5), value: Number(log.weight) } : null;
        })
        .filter(Boolean)
    : dayArray.map((d, i) => ({ label: d.slice(5), value: SAMPLE_WEIGHT[i % SAMPLE_WEIGHT.length] }));

  // Workouts per day
  const workoutData = dayArray.map((d, i) => ({
    label: new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
    value: hasWorkout ? workouts.filter(w => w.dateISO === d).length : SAMPLE_WORKOUT[i % SAMPLE_WORKOUT.length],
  }));

  // Period aggregates
  const periodFoodLogs = foodLogs.filter(f => f.dateISO >= cutoffISO);
  const periodWorkouts = workouts.filter(w => w.dateISO >= cutoffISO);
  const daysWithFood   = new Set(periodFoodLogs.map(f => f.dateISO)).size || 1;
  const avgCal   = Math.round(periodFoodLogs.reduce((s, f) => s + (f.calories || 0), 0) / daysWithFood);
  const avgProt  = Math.round(periodFoodLogs.reduce((s, f) => s + (f.protein  || 0), 0) / daysWithFood);
  const avgCarbs = Math.round(periodFoodLogs.reduce((s, f) => s + (f.carbs    || 0), 0) / daysWithFood);
  const avgFat   = Math.round(periodFoodLogs.reduce((s, f) => s + (f.fat      || 0), 0) / daysWithFood);

  // Macros donut (fallback when no data: 35% P, 40% C, 25% F)
  const useMacroFallback = avgProt === 0 && avgCarbs === 0 && avgFat === 0;
  const macroSegments = useMacroFallback
    ? [
        { label: 'Protein', value: 35, color: C.accent },
        { label: 'Carbs', value: 40, color: C.success },
        { label: 'Fat', value: 25, color: C.warning },
      ]
    : [
        { label: 'Protein', value: avgProt * 4, color: C.accent },
        { label: 'Carbs', value: avgCarbs * 4, color: C.success },
        { label: 'Fat', value: avgFat * 9, color: C.warning },
      ];
  const totalMacroCal = macroSegments.reduce((s, m) => s + m.value, 0) || 1;

  // Weight delta
  const firstW    = weightData[0]?.value;
  const lastW     = weightData[weightData.length - 1]?.value;
  const wDeltaNum = firstW && lastW ? Number((lastW - firstW).toFixed(1)) : null;
  const wDeltaStr = wDeltaNum !== null ? `${wDeltaNum > 0 ? '+' : ''}${wDeltaNum} ${profile.units || 'kg'}` : '—';

  // Top exercises
  const exCounts = {};
  periodWorkouts.forEach(w => {
    (w.exercises || []).forEach(ex => {
      if (ex.name) exCounts[ex.name] = (exCounts[ex.name] || 0) + 1;
    });
  });
  const topExercises = Object.entries(exCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const handleExport = () => {
    setModal({
      title: `${period} Summary`,
      message: [
        `Period: last ${days} days`,
        `Avg Calories: ${avgCal} kcal/day`,
        `Avg Protein: ${avgProt}g  Carbs: ${avgCarbs}g  Fat: ${avgFat}g`,
        `Workouts: ${periodWorkouts.length}`,
        `Weight change: ${wDeltaStr}`,
      ].join('\n'),
      showCancel: false,
      confirmLabel: 'OK',
    });
  };

  const chartW = SW - 48;
  const chartH = 160;
  const units  = profile.units || 'kg';

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Statistics</Text>
          <TouchableOpacity style={s.exportBtn} onPress={handleExport}>
            <Text style={s.exportText}>Export</Text>
          </TouchableOpacity>
        </View>

        {/* Period toggle */}
        <View style={s.toggle}>
          {['Week', 'Month'].map(p => (
            <TouchableOpacity
              key={p}
              style={[s.toggleBtn, period === p && s.toggleActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[s.toggleText, period === p && { color: C.accent }]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Streak cards ── */}
        <View style={s.streakRow}>
          <StreakCard icon={require('../assets/ic_workouts.png')}  label="Workout"   streak={streaks.workout} color={C.success} />
          <StreakCard icon={require('../assets/ic_nutrition.png')} label="Nutrition" streak={streaks.food}    color={C.accent}  />
          <StreakCard icon={require('../assets/ic_weight.png')}    label="Weight"    streak={streaks.weight}  color={C.accent2} />
        </View>

        {/* ── Calories chart ── */}
        <ChartCard title="Calories / Day" icon={require('../assets/ic_chart.png')} iconColor={C.accent}
          subtitle={`Goal: ${profile.dailyCaloriesGoal} kcal  ·  Avg: ${hasCal ? avgCal : 2050} kcal`}>
          <BarChart data={calData} chartW={chartW} chartH={chartH} color={C.accent} goalValue={profile.dailyCaloriesGoal} />
        </ChartCard>

        {/* ── Protein chart ── */}
        <ChartCard title="Protein / Day" icon={require('../assets/ic_nutrition.png')} iconColor={C.success}
          subtitle={`Avg: ${hasCal ? avgProt : 115}g per day`}>
          <BarChart data={proteinData} chartW={chartW} chartH={chartH} color={C.success} />
        </ChartCard>

        {/* ── Macros donut ── */}
        <ChartCard title="Avg Macros Breakdown" icon={require('../assets/ic_chart.png')} iconColor={C.warning}>
          <View style={s.donutWrap}>
            <DonutChart segments={macroSegments} size={140} thickness={24} />
            <View style={s.donutLegend}>
              {macroSegments.map(m => (
                <View key={m.label} style={s.legendRow}>
                  <View style={[s.legendDot, { backgroundColor: m.color }]} />
                  <Text style={s.legendLabel}>{m.label}</Text>
                  <Text style={[s.legendPct, { color: m.color }]}>
                    {Math.round((m.value / totalMacroCal) * 100)}%
                  </Text>
                </View>
              ))}
              <View style={s.legendMacroRow}>
                <Text style={s.legendMacroText}>
                  P {useMacroFallback ? 120 : avgProt}g · C {useMacroFallback ? 140 : avgCarbs}g · F {useMacroFallback ? 65 : avgFat}g
                </Text>
              </View>
            </View>
          </View>
        </ChartCard>

        {/* ── Weight trend ── */}
        <ChartCard title="Weight Trend" icon={require('../assets/ic_weight.png')} iconColor={C.accent2}
          subtitle={wDeltaNum !== null ? `Change: ${wDeltaStr}` : undefined}>
          <LineChart data={weightData} chartW={chartW} chartH={chartH} color={C.accent2} />
        </ChartCard>

        {/* ── Workout frequency ── */}
        <ChartCard title="Workouts / Day" icon={require('../assets/ic_workouts.png')} iconColor={C.success}
          subtitle={`Total: ${hasWorkout ? periodWorkouts.length : 8} sessions`}>
          <BarChart data={workoutData} chartW={chartW} chartH={chartH} color={C.success} />
        </ChartCard>

        {/* ── Summary table ── */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Image source={require('../assets/ic_chart.png')} style={s.cardIcon} tintColor={C.accent} resizeMode="contain" onError={() => {}} />
            <Text style={s.cardTitle}>Period Summary</Text>
          </View>
          <SummaryRow label="Avg Calories / day"       value={`${avgCal} kcal`} />
          <SummaryRow label="Daily Calorie Goal"        value={`${profile.dailyCaloriesGoal} kcal`} />
          <SummaryRow label="Avg Protein / day"         value={`${avgProt}g`} />
          <SummaryRow label="Avg Carbs / day"           value={`${avgCarbs}g`} />
          <SummaryRow label="Avg Fat / day"             value={`${avgFat}g`} />
          <SummaryRow label="Total Workouts"            value={String(periodWorkouts.length)} />
          <SummaryRow label={`Weight Change (${units})`} value={wDeltaStr} />
          <SummaryRow label="Food Log Days"             value={String(daysWithFood)} last />
        </View>

        {/* ── Top exercises ── */}
        {topExercises.length > 0 && (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Image source={require('../assets/ic_workouts.png')} style={s.cardIcon} tintColor={C.success} resizeMode="contain" onError={() => {}} />
              <Text style={s.cardTitle}>Top Exercises</Text>
            </View>
            {topExercises.map(([name, count], i) => (
              <View key={name} style={[s.exRow, i < topExercises.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border }]}>
                <View style={s.exRank}>
                  <Text style={s.exRankText}>{i + 1}</Text>
                </View>
                <Text style={s.exName}>{name}</Text>
                <Text style={s.exCount}>{count}×</Text>
              </View>
            ))}
          </View>
        )}

      </ScrollView>

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

// ─── Sub-components ───────────────────────────────────────────────────────────
function StreakCard({ icon, label, streak, color }) {
  return (
    <View style={[s.streakCard, { borderColor: streak > 0 ? color + '60' : C.border }]}>
      <Image source={icon} style={s.streakIcon} tintColor={streak > 0 ? color : C.secondary} resizeMode="contain" onError={() => {}} />
      <Text style={[s.streakNum, { color: streak > 0 ? color : C.secondary }]}>{streak}</Text>
      <Text style={s.streakLabel}>{label}</Text>
      <Text style={[s.streakSub, { color: streak > 0 ? color : C.secondary }]}>day streak</Text>
    </View>
  );
}

function ChartCard({ title, icon, iconColor, subtitle, children }) {
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Image source={icon} style={s.cardIcon} tintColor={iconColor} resizeMode="contain" onError={() => {}} />
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>{title}</Text>
          {subtitle && <Text style={s.cardSub}>{subtitle}</Text>}
        </View>
      </View>
      {children}
    </View>
  );
}

function SummaryRow({ label, value, last }) {
  return (
    <View style={[s.sumRow, !last && { borderBottomWidth: 1, borderBottomColor: C.border }]}>
      <Text style={s.sumLabel}>{label}</Text>
      <Text style={s.sumValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 20, paddingBottom: 110 },

  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title:      { color: C.text, fontSize: 28, fontWeight: '800' },
  exportBtn:  { borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingVertical: 7, paddingHorizontal: 14 },
  exportText: { color: C.accent, fontSize: 14, fontWeight: '600' },

  toggle:       { flexDirection: 'row', backgroundColor: C.card, borderRadius: 12, marginBottom: 16, padding: 4, borderWidth: 1, borderColor: C.border },
  toggleBtn:    { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
  toggleActive: { backgroundColor: '#1D2850' },
  toggleText:   { color: C.secondary, fontSize: 14, fontWeight: '600' },

  streakRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  streakCard: {
    flex: 1, backgroundColor: C.card, borderRadius: 16, padding: 12,
    alignItems: 'center', borderWidth: 1,
  },
  streakIcon:  { width: 20, height: 20, marginBottom: 6 },
  streakNum:   { fontSize: 26, fontWeight: '800' },
  streakLabel: { color: C.text, fontSize: 11, fontWeight: '600', marginTop: 2 },
  streakSub:   { fontSize: 10, marginTop: 1 },

  card: {
    backgroundColor: C.card, borderRadius: 18, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: C.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12 },
  cardIcon:   { width: 18, height: 18, marginTop: 2 },
  cardTitle:  { color: C.text, fontSize: 15, fontWeight: '600' },
  cardSub:    { color: C.secondary, fontSize: 11, marginTop: 2 },

  donutWrap:      { flexDirection: 'row', alignItems: 'center', gap: 16 },
  donutLegend:    { flex: 1 },
  legendRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  legendDot:      { width: 10, height: 10, borderRadius: 5 },
  legendLabel:    { flex: 1, color: C.secondary, fontSize: 13 },
  legendPct:      { fontSize: 14, fontWeight: '700' },
  legendMacroRow: { marginTop: 4 },
  legendMacroText:{ color: C.secondary, fontSize: 11 },

  sumRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  sumLabel: { color: C.secondary, fontSize: 14 },
  sumValue: { color: C.text, fontSize: 14, fontWeight: '600' },

  exRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  exRank:    { width: 24, height: 24, borderRadius: 12, backgroundColor: '#1D2850', alignItems: 'center', justifyContent: 'center' },
  exRankText:{ color: C.accent, fontSize: 11, fontWeight: '700' },
  exName:    { flex: 1, color: C.text, fontSize: 14 },
  exCount:   { color: C.success, fontSize: 14, fontWeight: '700' },
});
