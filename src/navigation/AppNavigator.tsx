import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme } from 'react-native';
import { Calendar, Clock, Users, LayoutDashboard, History } from 'lucide-react-native';
import { setNavigationRef } from '../../utils/navigationService';

// Import screens
import SplashScreen from '../screens/splash';
import LoginScreen from '../screens/login';
import SignupScreen from '../screens/signup';
import ForgotPasswordScreen from '../screens/forgot-password';
import PasswordResetOTPScreen from '../screens/password-reset-otp';
import NewPasswordScreen from '../screens/new-password';
import DashboardScreen from '../screens/DashboardScreen';
import HomeScreen from '../screens/HomeScreen';
import PatientsScreen from '../screens/patients';
import UpcomingScreen from '../screens/upcoming';
import PastScreen from '../screens/past';
import PatientSessionsScreen from '../screens/patient-sessions';
import ProfileScreen from '../screens/profile';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import EventDetailScreen from '../screens/EventDetailScreen';

// Import components
import CustomHeader from '../../components/CustomHeader';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator for main app screens
function TabNavigator() {
  const colorScheme = useColorScheme();
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        header: ({ route, options }) => {
          // Get the title from the route options, with better fallback logic
          let title = options.headerTitle?.toString() || options.title;
          
          // If we still don't have a title, use a default based on the route
          if (!title) {
            switch (route.name) {
              case 'Dashboard':
                title = 'Dashboard';
                break;
              case 'Today':
                title = "Today's Sessions";
                break;
              case 'Upcoming':
                title = 'Upcoming Sessions';
                break;
              case 'Past':
                title = 'Past Sessions';
                break;
              case 'Patients':
                title = 'Patient Management';
                break;
              default:
                title = 'Dashboard';
            }
          }
          
          return <CustomHeader title={title} showBellIcon={true} />;
        },
        tabBarActiveTintColor: colorScheme === 'dark' ? '#4F8EF7' : '#00143f',
        tabBarInactiveTintColor: colorScheme === 'dark' ? '#8E8E93' : '#8E8E93',
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
        },
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          headerTitle: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tab.Screen 
        name="Today" 
        component={HomeScreen}
        options={{
          title: "Today's Sessions",
          headerTitle: "Today's Sessions",
          tabBarLabel: 'Today',
          tabBarIcon: ({ color, size }) => <Clock size={size} color={color} />,
        }}
      />
      <Tab.Screen 
        name="Upcoming" 
        component={UpcomingScreen}
        options={{
          title: 'Upcoming Sessions',
          headerTitle: 'Upcoming Sessions',
          tabBarLabel: 'Upcoming',
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
        }}
      />
      <Tab.Screen 
        name="Past" 
        component={PastScreen}
        options={{
          title: 'Past Sessions',
          headerTitle: 'Past Sessions',
          tabBarLabel: 'Past',
          tabBarIcon: ({ color, size }) => <History size={size} color={color} />,
        }}
      />
      <Tab.Screen 
        name="Patients" 
        component={PatientsScreen}
        options={{
          title: 'Patient Management',
          headerTitle: 'Patient Management',
          tabBarLabel: 'Patients',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// Main App Navigator
const AppNavigator = forwardRef((props, ref) => {
  const navigationRef = useRef(null);

  useImperativeHandle(ref, () => ({
    navigate: (screen: string, params?: any) => {
      if (navigationRef.current) {
        (navigationRef.current as any).navigate(screen, params);
      }
    }
  }));

  // Set the navigation ref for global navigation
  const onNavigationReady = () => {
    if (navigationRef.current) {
      setNavigationRef(navigationRef.current);
    }
  };

  return (
    <NavigationContainer ref={navigationRef} onReady={onNavigationReady}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="PasswordResetOTP" component={PasswordResetOTPScreen} />
        <Stack.Screen name="NewPassword" component={NewPasswordScreen} />
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen 
          name="PatientSessions" 
          component={PatientSessionsScreen}
          options={{
            headerShown: true,
            header: ({ route }) => {
              const params = route.params as { patientName?: string } || {};
              const title = params.patientName ? `${params.patientName}'s Sessions` : 'Patient Sessions';
              return <CustomHeader title={title} showBackButton={true} />;
            },
          }}
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{
            headerShown: true,
            header: () => <CustomHeader title="Profile" showBackButton={true} hideProfileDropdown={true} />,
          }}
        />
        <Stack.Screen 
          name="Analytics" 
          component={AnalyticsScreen}
          options={{
            headerShown: true,
            header: () => <CustomHeader title="Analytics" showBackButton={true} hideProfileDropdown={true} />,
          }}
        />
        <Stack.Screen 
          name="Notifications" 
          component={NotificationsScreen}
          options={{
            headerShown: true,
            header: () => <CustomHeader title="Events & Notifications" showBackButton={true} hideProfileDropdown={true} />,
          }}
        />
        <Stack.Screen 
          name="EventDetail" 
          component={EventDetailScreen}
          options={{
            headerShown: false, // Custom header in component
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
});

AppNavigator.displayName = 'AppNavigator';

export default AppNavigator;
