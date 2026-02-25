import React, { useState, useContext } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, Image, Dimensions,
} from 'react-native';
import ConfirmModal from './ConfirmModal';
import Svg, { Line, Circle, Path, Text as SvgText } from 'react-native-svg';
import { AppContext, todayISO, addDaysToISO, weeklyWeightChange } from '../App';

const { width: SW } = Dimensions.get('window');
const C = {
  bg: '#0B1021', card: '#121A33', border: '#1D2850',
  text: '#EAF0FF', secondary: '#9AA6C3',
  accent: '#6EA8FF', success: '#2FE38C',
};

// ─── SVG Line Chart ───────────────────────────────────────────────────────────
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

  const PAD = { top: 20, bottom: 30, left: 10, right: 10 };
  const W = chartW - PAD.left - PAD.right;
  const H = chartH - PAD.top  - PAD.bottom;

  const values = data.map(d => d.value);
  const minV   = Math.min(...values);
  const maxV   = Math.max(...values);
  const range  = maxV - minV || 1;

  const pts = data.map((d, i) => ({
    x: PAD.left + (i / (data.length - 1)) * W,
    y: PAD.top  + H - ((d.value - minV) / range) * H,
  }));

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  // Gradient fill path
  const fillD = pathD + ` L ${pts[pts.length - 1].x.toFixed(1)} ${(PAD.top + H).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(PAD.top + H).toFixed(1)} Z`;

  return (
    <Svg width={chartW} height={chartH}>
      {/* Fill */}
      <Path d={fillD} fill={color} opacity={0.12} />
      {/* Line */}
      <Path d={pathD} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Points + labels */}
      {pts.map((p, i) => (
        <React.Fragment key={i}>
          <Circle cx={p.x} cy={p.y} r={4} fill={color} />
          {/* X labels every 2 items */}
          {(data.length <= 7 || i % Math.ceil(data.length / 7) === 0) && (
            <SvgText
              x={p.x}
              y={chartH - 6}
              textAnchor="middle"
              fill={C.secondary}
              fontSize={9}
            >
              {data[i].label}
            </SvgText>
          )}
        </React.Fragment>
      ))}
      {/* Min/Max labels on Y */}
      <SvgText x={PAD.left} y={PAD.top + H} fill={C.secondary} fontSize={9}>{minV.toFixed(1)}</SvgText>
      <SvgText x={PAD.left} y={PAD.top + 10} fill={C.secondary} fontSize={9}>{maxV.toFixed(1)}</SvgText>
    </Svg>
  );
}

// ─── WeightScreen ─────────────────────────────────────────────────────────────
export default function WeightScreen({ navigation }) {
  const { appState, deleteWeight } = useContext(AppContext);
  const { weightLogs, profile } = appState;

  const [period, setPeriod] = useState('7D');
  const [modal,  setModal]  = useState(null);
  const [logVisible] = useState(false); // legacy, log is now full-screen

  const handleLogPress = () => navigation?.navigate?.('LogWeight');

  const units = profile.units || 'kg';
  const wChange = weeklyWeightChange(weightLogs);

  // Filter logs by period
  const cutoff = addDaysToISO(todayISO(), period === '7D' ? -7 : -30);
  const filtered = [...weightLogs]
    .filter(l => l.dateISO >= cutoff)
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO));

  // Chart data
  const chartData = filtered.map(l => {
    const d = new Date(l.dateISO + 'T12:00:00');
    return {
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).replace(' ', '\n'),
      value: Number(l.weight),
    };
  });

  const allSorted = [...weightLogs].sort((a, b) => b.dateISO.localeCompare(a.dateISO));

  const handleDelete = (id, weight) => {
    setModal({
      title: 'Delete Entry',
      message: `Remove ${weight} ${units}?`,
      confirmLabel: 'Delete',
      confirmDanger: true,
      onConfirm: () => deleteWeight(id),
    });
  };

  const chartW = SW - 48;
  const chartH = 180;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Title + log btn */}
        <View style={s.header}>
          <Text style={s.title}>Weight</Text>
          <TouchableOpacity style={s.logBtn} onPress={handleLogPress}>
            <Image
              source={require('../assets/ic_plus.png')}
              style={s.plusIcon}
              tintColor="#fff"
              resizeMode="contain"
              onError={() => {}}
            />
            <Text style={s.logBtnText}>Log</Text>
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={s.statsRow}>
          <StatPill label="Latest" value={allSorted[0] ? `${allSorted[0].weight} ${units}` : '—'} />
          <StatPill label="7-Day Δ" value={wChange ? `${wChange} ${units}` : '—'} highlight={!!wChange} />
          <StatPill label="Entries" value={String(weightLogs.length)} />
        </View>

        {/* Period toggle */}
        <View style={s.toggle}>
          {['7D', '30D'].map(p => (
            <TouchableOpacity
              key={p}
              style={[s.toggleBtn, period === p && s.toggleActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[s.toggleText, period === p && { color: C.accent }]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart */}
        <View style={s.chartCard}>
          <Text style={s.chartTitle}>Weight Trend — {period}</Text>
          <LineChart data={chartData} chartW={chartW} chartH={chartH} color={C.accent} />
        </View>

        {/* Log list */}
        <Text style={s.sectionTitle}>History</Text>
        {allSorted.length === 0 ? (
          <Text style={s.empty}>No weight entries yet. Log your first weigh-in!</Text>
        ) : (
          allSorted.map(log => (
            <View key={log.id} style={s.logItem}>
              <View>
                <Text style={s.logWeight}>{log.weight} {units}</Text>
                <Text style={s.logDate}>{log.dateISO}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(log.id, log.weight)} style={s.trashBtn}>
                <Image
                  source={require('../assets/ic_trash.png')}
                  style={s.trashIcon}
                  tintColor="#FF6B6B"
                  resizeMode="contain"
                  onError={() => {}}
                />
              </TouchableOpacity>
            </View>
          ))
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

function StatPill({ label, value, highlight }) {
  return (
    <View style={s.statPill}>
      <Text style={[s.statVal, highlight && { color: C.accent }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 20, paddingBottom: 110 },

  header:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title:   { color: C.text, fontSize: 28, fontWeight: '800' },
  logBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.accent, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 14 },
  plusIcon:{ width: 16, height: 16 },
  logBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statPill: { flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  statVal:  { color: C.text, fontSize: 18, fontWeight: '700' },
  statLabel:{ color: C.secondary, fontSize: 11, marginTop: 3 },

  toggle:     { flexDirection: 'row', backgroundColor: C.card, borderRadius: 12, marginBottom: 16, padding: 4, borderWidth: 1, borderColor: C.border },
  toggleBtn:  { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  toggleActive:{ backgroundColor: '#1D2850' },
  toggleText: { color: C.secondary, fontSize: 14, fontWeight: '600' },

  chartCard:  { backgroundColor: C.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 20 },
  chartTitle: { color: C.text, fontSize: 14, fontWeight: '600', marginBottom: 12 },

  sectionTitle: { color: C.text, fontSize: 18, fontWeight: '700', marginBottom: 12 },
  empty:        { color: C.secondary, fontSize: 14, lineHeight: 22 },

  logItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: C.border,
  },
  logWeight: { color: C.text, fontSize: 18, fontWeight: '700' },
  logDate:   { color: C.secondary, fontSize: 12, marginTop: 2 },
  trashBtn:  { padding: 8 },
  trashIcon: { width: 18, height: 18 },
});
