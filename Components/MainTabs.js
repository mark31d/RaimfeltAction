import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen      from './HomeScreen';
import WorkoutsScreen  from './WorkoutsScreen';
import NutritionScreen from './NutritionScreen';
import WeightScreen    from './WeightScreen';
import StatsScreen     from './StatsScreen';

const Tab = createBottomTabNavigator();

const C = {
  card:      '#121A33',
  border:    '#1D2850',
  secondary: '#9AA6C3',
  accent:    '#6EA8FF',
};

const ICONS = {
  Home:      require('../assets/ic_home.png'),
  Workouts:  require('../assets/ic_workouts.png'),
  Nutrition: require('../assets/ic_nutrition.png'),
  Weight:    require('../assets/ic_weight.png'),
  Stats:     require('../assets/ic_stats.png'),
};

function TabIcon({ name, focused }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapFocused]}>
      <Image
        source={ICONS[name]}
        style={[styles.icon, { tintColor: focused ? C.accent : C.secondary }]}
        resizeMode="contain"
      />
    </View>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown:             false,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor:   C.accent,
        tabBarInactiveTintColor: C.secondary,
        tabBarStyle:             styles.tabBar,
        tabBarItemStyle:         styles.tabItem,
        tabBarLabelStyle:        styles.label,
      })}
    >
      <Tab.Screen name="Home"      component={HomeScreen} />
      <Tab.Screen name="Workouts"  component={WorkoutsScreen} />
      <Tab.Screen name="Nutrition" component={NutritionScreen} />
      <Tab.Screen name="Weight"    component={WeightScreen} />
      <Tab.Screen name="Stats"     component={StatsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position:        'absolute',
    bottom:          28,
    left:            20,
    right:           20,
    height:          82,
    backgroundColor: C.card,
    borderRadius:    41,
    borderTopWidth:  0,
    borderWidth:     1,
    borderColor:     C.border,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 8 },
    shadowOpacity:   0.4,
    shadowRadius:    20,
    elevation:       14,
    paddingBottom:   0,
    paddingTop:      0,
  },
  tabItem: {
    height:        82,
    paddingTop:    10,
    paddingBottom: 10,
  },
  iconWrap: {
    width:          40,
    height:         40,
    borderRadius:   20,
    alignItems:     'center',
    justifyContent: 'center',
  },
  iconWrapFocused: {
    backgroundColor: '#6EA8FF22',
  },
  icon:  { width: 22, height: 22 },
  label: { fontSize: 10, fontWeight: '600', marginTop: 8 },
});
