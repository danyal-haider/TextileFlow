import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import axios from 'axios';
import ScreenWrapper from '../components/ScreenWrapper';
import { AuthContext } from '../context/AuthContext';
import { BASE_URL } from '../config';

const MyOrdersScreen = ({ navigation }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { userToken, userInfo } = useContext(AuthContext);

    const fetchOrders = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/orders`, {
                headers: { Authorization: `Bearer ${userToken}` },
            });

            // Filter orders where the manufacturer is the current user
            // Note: manufacturer field in Order is an ObjectId string or object
            // userInfo._id or userInfo.id? Need to be sure. AuthContext usually sets userInfo from backend response.
            // Backend User model uses _id.

            const myAssignedOrders = response.data.filter(order => {
                const manufacturerId = typeof order.manufacturer === 'object' ? order.manufacturer?._id : order.manufacturer;
                const userId = userInfo?._id || userInfo?.id;
                return manufacturerId && manufacturerId.toString() === userId?.toString();
            });

            setOrders(myAssignedOrders);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (userInfo) {
            fetchOrders();
        }
    }, [userInfo]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.orderTitle}>{item.title}</Text>
                <Text style={styles.statusBadge}>{item.status.toUpperCase()}</Text>
            </View>
            <Text style={styles.description}>{item.description}</Text>
            <View style={styles.row}>
                <Text style={styles.label}>Quantity:</Text>
                <Text style={styles.value}>{item.quantity}</Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.label}>Deadline:</Text>
                <Text style={styles.value}>
                    {item.deadline ? new Date(item.deadline).toLocaleDateString('en-GB') : 'N/A'}
                </Text>
            </View>
            <TouchableOpacity
                style={styles.detailsButton}
                onPress={() => navigation.navigate('OrderDetails', { order: item })}
                activeOpacity={0.7}
            >
                <Text style={styles.detailsButtonText}>View Details</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <ScreenWrapper>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Won Orders</Text>
                    <View style={styles.headerRightSpacer} />
                </View>
                {loading ? (
                    <ActivityIndicator size="large" color="#4a90e2" />
                ) : (
                    <FlatList
                        data={orders}
                        keyExtractor={(item) => item._id}
                        renderItem={renderItem}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                        ListEmptyComponent={<Text style={styles.emptyText}>You haven't been assigned any orders yet.</Text>}
                    />
                )}
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    backButtonText: {
        fontSize: 32,
        color: '#333',
        fontWeight: 'bold',
        lineHeight: 32,
    },
    headerTitle: {
        flex: 1,
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    headerRightSpacer: {
        width: 44,
    },
    card: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        borderLeftWidth: 4,
        borderLeftColor: '#7ed321', // Green for won
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    orderTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
        color: '#333',
    },
    statusBadge: {
        color: '#7ed321',
        fontWeight: 'bold',
        fontSize: 12,
    },
    description: {
        color: '#666',
        marginBottom: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    label: {
        color: '#666',
    },
    value: {
        fontWeight: '600',
        color: '#333',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        color: '#999',
    },
    detailsButton: {
        backgroundColor: '#0F172A',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },
    detailsButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
});

export default MyOrdersScreen;
