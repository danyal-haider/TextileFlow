import React, { useContext, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Alert, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import ScreenWrapper from '../components/ScreenWrapper';
import CustomButton from '../components/CustomButton';
import Card from '../components/Card';
import { AuthContext } from '../context/AuthContext';
import { colors, spacing, typography, shadows } from '../theme';
import { BASE_URL, resolveImageUri } from '../config';

const ManufacturerProfileScreen = ({ navigation }) => {
    const { userInfo, logout, userToken, updateProfile, changePassword, verifyPassword } = useContext(AuthContext);
    const [isEditing, setIsEditing] = useState(false);

    // Profile form states
    const [name, setName] = useState(userInfo?.name || '');
    const [email, setEmail] = useState(userInfo?.email || '');
    const [companyName, setCompanyName] = useState(userInfo?.companyName || '');
    const [profilePic, setProfilePic] = useState(userInfo?.profilePic || '');
    const [phone, setPhone] = useState(userInfo?.phone || '');
    const [country, setCountry] = useState(userInfo?.country || '');
    const [city, setCity] = useState(userInfo?.city || '');
    const [address, setAddress] = useState(userInfo?.address || '');
    const [about, setAbout] = useState(userInfo?.about || '');
    const [uploading, setUploading] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);

    // Password change states
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [currentPasswordVerified, setCurrentPasswordVerified] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [verifyingPwd, setVerifyingPwd] = useState(false);

    const [stats, setStats] = useState({
        totalBids: 0,
        pendingBids: 0,
        wonOrders: 0
    });

    useEffect(() => {
        if (userInfo) {
            setName(userInfo.name || '');
            setEmail(userInfo.email || '');
            setCompanyName(userInfo.companyName || '');
            setProfilePic(userInfo.profilePic || '');
            setPhone(userInfo.phone || '');
            setCountry(userInfo.country || '');
            setCity(userInfo.city || '');
            setAddress(userInfo.address || '');
            setAbout(userInfo.about || '');
        }
    }, [userInfo]);

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/bids/my-bids`, {
                headers: { Authorization: `Bearer ${userToken}` }
            });

            const myBids = response.data;
            const totalBids = myBids.length;
            const pendingBids = myBids.filter(b => b.status === 'pending').length;
            const wonOrders = myBids.filter(b => b.status === 'accepted').length;

            setStats({ totalBids, pendingBids, wonOrders });
        } catch (e) {
            console.log('Error fetching stats:', e);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchStats();
        }, [])
    );

    const handleAvatarPress = () => {
        Alert.alert(
            'Profile Picture',
            'Select an option:',
            [
                { text: 'Choose from Gallery', onPress: handlePickAvatar },
                ...(profilePic ? [{ text: 'Remove Photo', style: 'destructive', onPress: handleRemoveAvatar }] : []),
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };

    const handlePickAvatar = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert('Permission Denied', 'Permission to access photos is required!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.8
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            await uploadAvatar(asset.uri);
        }
    };

    const handleRemoveAvatar = async () => {
        setProfilePic('');
        await updateProfile(
            name || userInfo?.name,
            email || userInfo?.email,
            companyName || userInfo?.companyName,
            undefined,
            '',
            phone || userInfo?.phone,
            country || userInfo?.country,
            city || userInfo?.city,
            address || userInfo?.address,
            about || userInfo?.about
        );
    };

    const uploadAvatar = async (uri) => {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', {
            uri,
            name: `avatar-${userInfo?._id || Date.now()}.jpg`,
            type: 'image/jpeg'
        });

        try {
            const response = await axios.post(`${BASE_URL}/qc/upload-image`, formData, {
                headers: {
                    Authorization: `Bearer ${userToken}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            const uploadedUrl = response.data.url;
            setProfilePic(uploadedUrl);

            // Save immediately if not editing details
            if (!isEditing) {
                await updateProfile(
                    name || userInfo?.name,
                    email || userInfo?.email,
                    companyName || userInfo?.companyName,
                    undefined,
                    uploadedUrl,
                    phone || userInfo?.phone,
                    country || userInfo?.country,
                    city || userInfo?.city,
                    address || userInfo?.address,
                    about || userInfo?.about
                );
            }
        } catch (error) {
            console.error('Avatar upload error:', error);
            Alert.alert('Error', 'Failed to upload profile picture.');
        } finally {
            setUploading(false);
        }
    };

    const handleVerifyCurrentPassword = async () => {
        if (!currentPassword) {
            Alert.alert('Error', 'Please enter your current password.');
            return;
        }
        setVerifyingPwd(true);
        const success = await verifyPassword(currentPassword);
        setVerifyingPwd(false);
        if (success) {
            setCurrentPasswordVerified(true);
        }
    };

    const handleUpdatePassword = async () => {
        if (!newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please enter both password fields.');
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert('Error', 'New Password must be at least 6 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match.');
            return;
        }

        setVerifyingPwd(true);
        const success = await changePassword(currentPassword, newPassword);
        setVerifyingPwd(false);

        if (success) {
            // Password updated successfully! Reset states
            setCurrentPassword('');
            setCurrentPasswordVerified(false);
            setNewPassword('');
            setConfirmPassword('');
            setShowPasswordForm(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!name.trim() || !email.trim()) {
            Alert.alert('Error', 'Name and Email are required.');
            return;
        }

        // Save profile details
        setSavingProfile(true);
        const success = await updateProfile(
            name.trim(),
            email.trim(),
            companyName.trim(),
            undefined,
            profilePic,
            phone.trim(),
            country.trim(),
            city.trim(),
            address.trim(),
            about.trim()
        );
        setSavingProfile(false);

        if (success) {
            setIsEditing(false);
        }
    };

    const handleCancelEdit = () => {
        setName(userInfo?.name || '');
        setEmail(userInfo?.email || '');
        setCompanyName(userInfo?.companyName || '');
        setProfilePic(userInfo?.profilePic || '');
        setPhone(userInfo?.phone || '');
        setCountry(userInfo?.country || '');
        setCity(userInfo?.city || '');
        setAddress(userInfo?.address || '');
        setAbout(userInfo?.about || '');
        setShowPasswordForm(false);
        setCurrentPassword('');
        setCurrentPasswordVerified(false);
        setNewPassword('');
        setConfirmPassword('');
        setIsEditing(false);
    };

    const avatarUri = resolveImageUri(profilePic) || 'https://ui-avatars.com/api/?name=' + (name || 'Manufacturer') + '&background=0F172A&color=fff&size=150';

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>My Profile</Text>
                </View>

                {/* Profile Avatar Card */}
                <Card style={styles.profileCard}>
                    <TouchableOpacity style={styles.avatarContainer} onPress={handleAvatarPress} activeOpacity={0.9}>
                        <Image source={{ uri: avatarUri }} style={styles.avatar} />
                        {uploading && (
                            <View style={styles.avatarLoading}>
                                <ActivityIndicator size="small" color="#fff" />
                            </View>
                        )}
                        <View style={styles.avatarEditBadge}>
                            <Text style={styles.cameraIcon}>📷</Text>
                        </View>
                    </TouchableOpacity>

                    {!isEditing && (
                        <View style={styles.nameSection}>
                            <Text style={styles.name}>{userInfo?.name || 'Manufacturer Name'}</Text>
                            <View style={styles.roleBadge}>
                                <Text style={styles.roleBadgeText}>MANUFACTURER</Text>
                            </View>
                        </View>
                    )}
                </Card>

                {/* Details Section */}
                <Card style={styles.detailsCard}>
                    <Text style={styles.cardHeaderTitle}>{isEditing ? 'Edit Profile Details' : 'Account Details'}</Text>
                    <View style={styles.divider} />

                    {isEditing ? (
                        <View style={styles.editForm}>
                            <Text style={styles.inputLabel}>Full Name</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="Full Name"
                                placeholderTextColor={colors.textLight}
                            />

                            <Text style={styles.inputLabel}>Email Address</Text>
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Email"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholderTextColor={colors.textLight}
                            />

                            <Text style={styles.inputLabel}>Company Name</Text>
                            <TextInput
                                style={styles.input}
                                value={companyName}
                                onChangeText={setCompanyName}
                                placeholder="Company Name"
                                placeholderTextColor={colors.textLight}
                            />

                            <Text style={styles.inputLabel}>Phone Number</Text>
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="e.g. +92 300 1234567"
                                keyboardType="phone-pad"
                                placeholderTextColor={colors.textLight}
                            />

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>City</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={city}
                                        onChangeText={setCity}
                                        placeholder="City"
                                        placeholderTextColor={colors.textLight}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>Country</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={country}
                                        onChangeText={setCountry}
                                        placeholder="Country"
                                        placeholderTextColor={colors.textLight}
                                    />
                                </View>
                            </View>

                            <Text style={styles.inputLabel}>Company Address</Text>
                            <TextInput
                                style={[styles.input, { height: 60 }]}
                                value={address}
                                onChangeText={setAddress}
                                placeholder="Factory / Office Address"
                                multiline
                                numberOfLines={2}
                                placeholderTextColor={colors.textLight}
                            />

                            <Text style={styles.inputLabel}>About Company</Text>
                            <TextInput
                                style={[styles.input, { height: 80 }]}
                                value={about}
                                onChangeText={setAbout}
                                placeholder="Brief overview of production capacities, machinery, specializations..."
                                multiline
                                numberOfLines={3}
                                placeholderTextColor={colors.textLight}
                            />

                            {/* Password section trigger button */}
                            {!showPasswordForm ? (
                                <TouchableOpacity 
                                    style={styles.passwordTriggerBtn} 
                                    onPress={() => setShowPasswordForm(true)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.passwordTriggerText}>🔒 Change Password</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={{ marginTop: spacing.s }}>
                                    <Text style={[styles.cardHeaderTitle, { marginBottom: spacing.xs }]}>🔒 Change Password</Text>
                                    <View style={styles.divider} />

                                    {!currentPasswordVerified ? (
                                        <>
                                            <Text style={styles.inputLabel}>Enter Current Password</Text>
                                            <TextInput
                                                style={styles.input}
                                                value={currentPassword}
                                                onChangeText={setCurrentPassword}
                                                secureTextEntry
                                                placeholder="Current Password"
                                                placeholderTextColor={colors.textLight}
                                            />
                                            <CustomButton
                                                title={verifyingPwd ? "Verifying..." : "Verify Current Password"}
                                                onPress={handleVerifyCurrentPassword}
                                                disabled={verifyingPwd}
                                                style={{ marginBottom: spacing.m }}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <Text style={styles.pwdSuccessLabel}>✓ Current Password Verified Successfully</Text>

                                            <Text style={styles.inputLabel}>New Password</Text>
                                            <TextInput
                                                style={styles.input}
                                                value={newPassword}
                                                onChangeText={setNewPassword}
                                                secureTextEntry
                                                placeholder="New Password (min 6 characters)"
                                                placeholderTextColor={colors.textLight}
                                            />

                                            <Text style={styles.inputLabel}>Confirm Password</Text>
                                            <TextInput
                                                style={styles.input}
                                                value={confirmPassword}
                                                onChangeText={setConfirmPassword}
                                                secureTextEntry
                                                placeholder="Confirm Password"
                                                placeholderTextColor={colors.textLight}
                                            />

                                            <CustomButton
                                                title={verifyingPwd ? "Updating..." : "Update Password"}
                                                onPress={handleUpdatePassword}
                                                disabled={verifyingPwd}
                                                style={{ marginBottom: spacing.m }}
                                            />
                                        </>
                                    )}
                                </View>
                            )}
                        </View>
                    ) : (
                        <View style={styles.infoList}>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoEmoji}>👤</Text>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Full Name</Text>
                                    <Text style={styles.infoValue}>{userInfo?.name || 'N/A'}</Text>
                                </View>
                            </View>
                            <View style={styles.infoDivider} />
                            <View style={styles.infoRow}>
                                <Text style={styles.infoEmoji}>✉️</Text>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Email Address</Text>
                                    <Text style={styles.infoValue}>{userInfo?.email || 'N/A'}</Text>
                                </View>
                            </View>
                            <View style={styles.infoDivider} />
                            <View style={styles.infoRow}>
                                <Text style={styles.infoEmoji}>🏢</Text>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Company Name</Text>
                                    <Text style={styles.infoValue}>{userInfo?.companyName || 'Not Provided'}</Text>
                                </View>
                            </View>
                            <View style={styles.infoDivider} />
                            <View style={styles.infoRow}>
                                <Text style={styles.infoEmoji}>📞</Text>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Phone Number</Text>
                                    <Text style={styles.infoValue}>{userInfo?.phone || 'Not Provided'}</Text>
                                </View>
                            </View>
                            <View style={styles.infoDivider} />
                            <View style={styles.infoRow}>
                                <Text style={styles.infoEmoji}>📍</Text>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Location (City, Country)</Text>
                                    <Text style={styles.infoValue}>
                                        {userInfo?.city && userInfo?.country
                                            ? `${userInfo.city}, ${userInfo.country}`
                                            : userInfo?.city || userInfo?.country || 'Not Provided'}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.infoDivider} />
                            <View style={styles.infoRow}>
                                <Text style={styles.infoEmoji}>🏠</Text>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Company Address</Text>
                                    <Text style={styles.infoValue}>{userInfo?.address || 'Not Provided'}</Text>
                                </View>
                            </View>
                            <View style={styles.infoDivider} />
                            <View style={styles.infoRow}>
                                <Text style={styles.infoEmoji}>ℹ️</Text>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>About Company</Text>
                                    <Text style={styles.infoValue}>{userInfo?.about || 'No details added yet.'}</Text>
                                </View>
                            </View>
                        </View>
                    )}
                </Card>

                {/* Profile Detail Save Actions */}
                {isEditing && (
                    <View style={[styles.actions, { marginBottom: spacing.m }]}>
                        <View style={styles.buttonRow}>
                            <CustomButton
                                title={savingProfile ? "Saving..." : "Save Profile"}
                                onPress={handleSaveProfile}
                                disabled={savingProfile || verifyingPwd || uploading}
                                style={styles.halfButton}
                            />
                            <CustomButton
                                title="Cancel"
                                onPress={handleCancelEdit}
                                type="outline"
                                style={styles.halfButton}
                            />
                        </View>
                    </View>
                )}

                {/* Statistics Card */}
                {!isEditing && (
                    <>
                        <Text style={styles.sectionHeader}>Activity Overview</Text>
                        <View style={styles.statsContainer}>
                            <Card style={[styles.statCard, { borderBottomColor: '#7C3AED', borderBottomWidth: 4 }]}>
                                <Text style={[styles.statValue, { color: '#7C3AED' }]}>{stats.totalBids}</Text>
                                <Text style={styles.statLabel}>Total Bids</Text>
                            </Card>
                            <Card style={[styles.statCard, { borderBottomColor: '#D97706', borderBottomWidth: 4 }]}>
                                <Text style={[styles.statValue, { color: '#D97706' }]}>{stats.pendingBids}</Text>
                                <Text style={styles.statLabel}>Pending</Text>
                            </Card>
                            <Card style={[styles.statCard, { borderBottomColor: '#059669', borderBottomWidth: 4 }]}>
                                <Text style={[styles.statValue, { color: '#059669' }]}>{stats.wonOrders}</Text>
                                <Text style={styles.statLabel}>Won Orders</Text>
                            </Card>
                        </View>
                    </>
                )}

                {/* Edit Profile Entry / Logout */}
                {!isEditing && (
                    <View style={styles.actions}>
                        <CustomButton
                            title="Edit Profile Details"
                            onPress={() => setIsEditing(true)}
                            style={styles.actionButton}
                        />
                        <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
                            <Text style={styles.logoutText}>Log Out</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: spacing.m,
        paddingBottom: 60,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.m,
    },
    title: {
        ...typography.header,
        fontSize: 24,
        color: colors.primary,
    },
    profileCard: {
        alignItems: 'center',
        paddingVertical: spacing.l,
        marginBottom: spacing.m,
        borderRadius: 16,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: spacing.s,
    },
    avatar: {
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 4,
        borderColor: colors.background,
    },
    avatarLoading: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 55,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarEditBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        backgroundColor: colors.primary,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
        ...shadows.small,
    },
    cameraIcon: {
        fontSize: 14,
    },
    nameSection: {
        alignItems: 'center',
        marginTop: spacing.xs,
    },
    name: {
        ...typography.subheader,
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
    },
    roleBadge: {
        backgroundColor: colors.primary + '15',
        paddingHorizontal: spacing.m,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 6,
    },
    roleBadgeText: {
        color: colors.primary,
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    detailsCard: {
        padding: spacing.m,
        marginBottom: spacing.m,
        borderRadius: 16,
    },
    cardHeaderTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.primary,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.s,
    },
    infoList: {
        width: '100%',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.s,
    },
    infoEmoji: {
        fontSize: 20,
        marginRight: spacing.m,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        ...typography.caption,
        color: colors.textLight,
        fontSize: 11,
        marginBottom: 2,
    },
    infoValue: {
        ...typography.body,
        fontWeight: '600',
        color: colors.text,
        fontSize: 14,
    },
    infoDivider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 4,
    },
    editForm: {
        width: '100%',
    },
    inputLabel: {
        ...typography.caption,
        color: colors.text,
        fontWeight: '600',
        marginBottom: 6,
        marginLeft: 4,
    },
    input: {
        backgroundColor: colors.background,
        borderRadius: 8,
        paddingHorizontal: spacing.m,
        paddingVertical: 10,
        marginBottom: spacing.m,
        borderWidth: 1,
        borderColor: colors.border,
        color: colors.text,
        fontSize: 15,
    },
    sectionHeader: {
        ...typography.subheader,
        color: colors.text,
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: spacing.s,
        marginLeft: spacing.xs,
        marginTop: spacing.s,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.l,
    },
    statCard: {
        width: '31%',
        alignItems: 'center',
        paddingVertical: spacing.m,
        borderRadius: 12,
        elevation: 3,
    },
    statValue: {
        ...typography.header,
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    statLabel: {
        ...typography.caption,
        fontSize: 11,
        color: colors.textLight,
        textAlign: 'center',
    },
    actions: {
        marginTop: spacing.s,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    halfButton: {
        flex: 1,
    },
    actionButton: {
        marginBottom: spacing.m,
        borderRadius: 10,
    },
    logoutButton: {
        borderColor: colors.error,
        borderWidth: 1,
        backgroundColor: colors.error + '05',
        paddingVertical: spacing.m,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.s,
    },
    logoutText: {
        color: colors.error,
        fontWeight: 'bold',
        fontSize: 16,
    },
    passwordTriggerBtn: {
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        backgroundColor: colors.background,
        marginBottom: spacing.m,
    },
    passwordTriggerText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
    },
    pwdSuccessLabel: {
        color: colors.success,
        fontSize: 13,
        fontWeight: 'bold',
        marginBottom: spacing.s,
        textAlign: 'center',
    }
});

export default ManufacturerProfileScreen;
