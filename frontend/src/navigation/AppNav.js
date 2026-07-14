import React, { useContext } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';

// Auth Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Exporter Screens
import ExporterDashboardScreen from '../screens/ExporterDashboardScreen';
import CreateOrderScreen from '../screens/CreateOrderScreen';
import ExporterProfileScreen from '../screens/ExporterProfileScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';
import BidDetailsScreen from '../screens/BidDetailsScreen';
import EditOrderScreen from '../screens/EditOrderScreen';

// Manufacturer Screens
import ManufacturerDashboardScreen from '../screens/ManufacturerDashboardScreen';
import AvailableOrdersScreen from '../screens/AvailableOrdersScreen';
import SubmitBidScreen from '../screens/SubmitBidScreen';
import MyBidsScreen from '../screens/MyBidsScreen';
import MyOrdersScreen from '../screens/MyOrdersScreen';
import ManufacturerProfileScreen from '../screens/ManufacturerProfileScreen';
import ManageMachinesScreen from '../screens/ManageMachinesScreen';
import AddEditMachineScreen from '../screens/AddEditMachineScreen';
import AllocateMachinesScreen from '../screens/AllocateMachinesScreen';
import ProductionTrackingScreen from '../screens/ProductionTrackingScreen';

// Admin Screen
import AdminDashboardScreen from '../screens/AdminDashboardScreen';

// Shared Dynamic Screens
import ChatScreen from '../screens/ChatScreen';
import NotificationScreen from '../screens/NotificationScreen';
import UploadQcReportScreen from '../screens/UploadQcReportScreen';
import QcReviewScreen from '../screens/QcReviewScreen';
import DefectDetailsScreen from '../screens/DefectDetailsScreen';
import OtherUserProfileScreen from '../screens/OtherUserProfileScreen';

const Stack = createNativeStackNavigator();

const AppNav = () => {
    const { isLoading, userToken, userInfo } = useContext(AuthContext);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size={'large'} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {userToken !== null ? (
                    // Authenticated Stacks
                    <>
                        {userInfo?.role === 'manufacturer' ? (
                            /* Manufacturer Flow */
                            <>
                                <Stack.Screen name="ManufacturerDashboard" component={ManufacturerDashboardScreen} />
                                <Stack.Screen name="AvailableOrders" component={AvailableOrdersScreen} />
                                <Stack.Screen name="SubmitBid" component={SubmitBidScreen} />
                                <Stack.Screen name="MyBids" component={MyBidsScreen} />
                                <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
                                <Stack.Screen name="ManufacturerProfile" component={ManufacturerProfileScreen} />
                                <Stack.Screen name="ManageMachines" component={ManageMachinesScreen} />
                                <Stack.Screen name="AddEditMachine" component={AddEditMachineScreen} />
                                <Stack.Screen name="AllocateMachines" component={AllocateMachinesScreen} />
                                <Stack.Screen name="ProductionTracking" component={ProductionTrackingScreen} />
                            </>
                        ) : userInfo?.role === 'admin' ? (
                            /* Admin Flow */
                            <>
                                <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
                            </>
                        ) : (
                            /* Exporter Flow (Default) */
                            <>
                                <Stack.Screen name="ExporterDashboard" component={ExporterDashboardScreen} />
                                <Stack.Screen name="CreateOrder" component={CreateOrderScreen} />
                                <Stack.Screen name="ExporterProfile" component={ExporterProfileScreen} />
                                <Stack.Screen name="BidDetails" component={BidDetailsScreen} />
                                <Stack.Screen name="EditOrder" component={EditOrderScreen} />
                                <Stack.Screen name="ProductionTracking" component={ProductionTrackingScreen} />
                            </>
                        )}

                        {/* Shared Screens for Authenticated Users */}
                        <Stack.Screen name="Chat" component={ChatScreen} />
                        <Stack.Screen name="Notifications" component={NotificationScreen} />
                        <Stack.Screen name="UploadQc" component={UploadQcReportScreen} />
                        <Stack.Screen name="QcReview" component={QcReviewScreen} />
                        <Stack.Screen name="DefectDetails" component={DefectDetailsScreen} />
                        <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
                        <Stack.Screen name="OtherUserProfile" component={OtherUserProfileScreen} />
                    </>
                ) : (
                    // Auth Stack
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNav;
