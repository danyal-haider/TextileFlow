import React, { useContext, useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';

const HomeScreen = ({ navigation }) => {
    const { logout, userInfo, userToken } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    // Replace with your actual local IP address
    const BASE_URL = `${API_URL}/orders`;

    const fetchOrders = async () => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${userToken}`
                }
            };
            const response = await axios.get(BASE_URL, config);
            setOrders(response.data);
        } catch (e) {
            console.log(e);
        }
    };

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await fetchOrders();
        setRefreshing(false);
    }, []);

    useEffect(() => {
        fetchOrders();
    }, []);

    // Refresh orders when navigating back to screen
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchOrders();
        });
        return unsubscribe;
    }, [navigation]);

    const renderOrderItem = ({ item }) => (
        <View style={styles.card}>
            <Text style={styles.orderTitle}>{item.title}</Text>
            <Text>Qty: {item.quantity}</Text>
            <Text>Status: {item.status}</Text>
            <Text style={styles.desc}>{item.description}</Text>
            <Text style={styles.user}>Posted by: {item.user?.name}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.welcome}>Hi, {userInfo?.name}</Text>
                <Button title="Logout" onPress={logout} color="red" />
            </View>

            <View style={styles.actions}>
                {userInfo?.role === 'exporter' && (
                    <Button
                        title="Create New Order"
                        onPress={() => navigation.navigate('CreateOrder')}
                    />
                )}
            </View>

            <Text style={styles.sectionTitle}>Recent Orders</Text>

            <FlatList
                data={orders}
                renderItem={renderOrderItem}
                keyExtractor={item => item._id}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={<Text>No orders found.</Text>}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    welcome: {
        fontSize: 18,
        fontWeight: 'bold'
    },
    actions: {
        marginBottom: 20
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10
    },
    card: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        elevation: 2
    },
    orderTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5
    },
    desc: {
        color: 'gray',
        marginBottom: 5
    },
    user: {
        fontSize: 12,
        color: 'blue'
    }
});

export default HomeScreen;
