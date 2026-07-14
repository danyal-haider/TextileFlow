import React, { useContext, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, Image } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';
import { colors, spacing, typography, shadows } from '../theme';
import ScreenWrapper from '../components/ScreenWrapper';
import Card from '../components/Card';

const AdminDashboardScreen = ({ navigation }) => {
    const { userToken, logout, userInfo } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${API_URL}/users`, {
                headers: {
                    Authorization: `Bearer ${userToken}`,
                },
            });
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            Alert.alert('Error', 'Failed to fetch users');
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchUsers();
        setRefreshing(false);
    }, []);

    const handleDeleteUser = (id) => {
        Alert.alert(
            'Delete User',
            'Are you sure you want to delete this user?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await axios.delete(`${API_URL}/users/${id}`, {
                                headers: {
                                    Authorization: `Bearer ${userToken}`,
                                },
                            });
                            setUsers(users.filter((user) => user._id !== id));
                            Alert.alert('Success', 'User deleted successfully');
                        } catch (error) {
                            console.error('Error deleting user:', error);
                            Alert.alert('Error', 'Failed to delete user');
                        }
                    },
                },
            ]
        );
    };

    const renderUserItem = ({ item }) => (
        <Card style={styles.userCard}>
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
                <Text style={styles.userRole}>Role: {item.role}</Text>
                {item.companyName ? <Text style={styles.userCompany}>Company: {item.companyName}</Text> : null}
            </View>
            {item.role !== 'admin' && (
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteUser(item._id)}
                >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
            )}
        </Card>
    );

    return (
        <ScreenWrapper>
            <View style={styles.container}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Admin Dashboard</Text>
                        <Text style={styles.subtext}>Manage Users</Text>
                    </View>
                    <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={users}
                    renderItem={renderUserItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: spacing.m,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.l,
    },
    greeting: {
        ...typography.header,
        color: colors.primary,
    },
    subtext: {
        ...typography.caption,
    },
    logoutButton: {
        padding: spacing.s,
        backgroundColor: colors.error,
        borderRadius: 8,
    },
    logoutText: {
        color: 'white',
        fontWeight: 'bold',
    },
    listContent: {
        paddingBottom: spacing.l,
    },
    userCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.m,
        padding: spacing.m,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        ...typography.subheader,
        fontSize: 16,
    },
    userEmail: {
        ...typography.body,
        fontSize: 14,
        color: colors.textLight,
    },
    userRole: {
        ...typography.caption,
        marginTop: 4,
        fontWeight: 'bold',
        color: colors.secondary,
        textTransform: 'capitalize',
    },
    userCompany: {
        ...typography.caption,
        color: colors.textLight,
    },
    deleteButton: {
        backgroundColor: colors.error,
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.s,
        borderRadius: 8,
        marginLeft: spacing.s,
    },
    deleteButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
});

export default AdminDashboardScreen;
