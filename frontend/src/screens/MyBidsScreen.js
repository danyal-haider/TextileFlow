import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import axios from 'axios';
import ScreenWrapper from '../components/ScreenWrapper';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme';
import { BASE_URL } from '../config';

const MyBidsScreen = ({ navigation }) => {
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { userToken } = useContext(AuthContext);

    const fetchBids = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/bids/my-bids`, {
                headers: { Authorization: `Bearer ${userToken}` },
            });
            setBids(response.data);
        } catch (error) {
            console.error('Error fetching bids:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchBids();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchBids();
    };

    const handleWithdraw = (bidId) => {
        Alert.alert(
            'Withdraw Bid',
            'Are you sure you want to withdraw this bid?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Withdraw',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await axios.put(`${BASE_URL}/bids/${bidId}/withdraw`, {}, {
                                headers: { Authorization: `Bearer ${userToken}` }
                            });
                            Alert.alert('Success', 'Bid withdrawn');
                            fetchBids();
                        } catch (error) {
                            Alert.alert('Error', error.response?.data?.message || 'Failed to withdraw bid');
                        }
                    }
                }
            ]
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => item.order && navigation.navigate('OrderDetails', { orderId: item.order._id || item.order })}
            style={styles.card}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.orderTitle}>{item.order?.title || 'Unknown Order'}</Text>
                <Text style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    {item.status.toUpperCase()}
                </Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.label}>Bid Amount:</Text>
                <Text style={styles.value}>PKR {item.price}</Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.label}>Price/Unit:</Text>
                <Text style={styles.value}>PKR {item.pricePerUnit || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.label}>Deadline:</Text>
                <Text style={styles.value}>{formatDate(item.deadline)}</Text>
            </View>
            {item.status === 'pending' && (
                <TouchableOpacity
                    style={styles.withdrawButton}
                    onPress={() => handleWithdraw(item._id)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.withdrawText}>Withdraw Bid</Text>
                </TouchableOpacity>
            )}
            <Text style={{ color: colors.primary, marginTop: 8, textAlign: 'right', fontSize: 11, fontWeight: 'bold' }}>
                Tap to view details &gt;
            </Text>
        </TouchableOpacity>
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return '#f5a623'; // Orange
            case 'accepted': return '#7ed321'; // Green
            case 'rejected': return '#d0021b'; // Red
            case 'withdrawn': return '#9b9b9b'; // Grey
            default: return '#4a90e2';
        }
    };

    return (
        <ScreenWrapper>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Bids</Text>
                    <View style={styles.headerRightSpacer} />
                </View>
                {loading ? (
                    <ActivityIndicator size="large" color="#4a90e2" />
                ) : (
                    <FlatList
                        data={bids}
                        keyExtractor={(item) => item._id}
                        renderItem={renderItem}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                        ListEmptyComponent={<Text style={styles.emptyText}>You haven't placed any bids yet.</Text>}
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
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    orderTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        overflow: 'hidden',
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    label: {
        color: '#666',
        width: 100, // Fixed width for alignment
    },
    value: {
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    withdrawButton: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#d0021b',
        borderRadius: 5,
        alignItems: 'center',
    },
    withdrawText: {
        color: '#d0021b',
        fontWeight: 'bold',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        color: '#999',
    },
});

export default MyBidsScreen;
