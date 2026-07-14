import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import ScreenWrapper from '../components/ScreenWrapper';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import Card from '../components/Card';
import { AuthContext } from '../context/AuthContext';
import { colors, spacing, typography, shadows } from '../theme';
import { BASE_URL } from '../config';

const UploadQcReportScreen = ({ route, navigation }) => {
    const { order } = route.params;
    const { userToken } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Form states
    const [comments, setComments] = useState('');
    const [productImages, setProductImages] = useState([]);

    // Pick image from gallery and upload
    const handlePickImage = async () => {
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
            await uploadMediaFile(asset.uri);
        }
    };

    // Upload to static uploads server
    const uploadMediaFile = async (uri) => {
        setUploadingImage(true);
        const formData = new FormData();
        formData.append('file', {
            uri,
            name: `qc-${Date.now()}.jpg`,
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
            setProductImages(prev => [...prev, uploadedUrl]);
        } catch (error) {
            console.error('QC Image upload error:', error);
            Alert.alert('Error', 'Failed to upload media.');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleRemoveImage = (url) => {
        setProductImages(prev => prev.filter(item => item !== url));
    };

    const handleSubmitReport = async () => {
        if (!comments.trim()) {
            Alert.alert('Error', 'Please provide an inspection summary');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                comments: comments.trim(),
                productImages
            };

            await axios.post(`${BASE_URL}/qc/${order._id}/upload`, payload, {
                headers: { Authorization: `Bearer ${userToken}` }
            });

            Alert.alert('Success', 'QC Report submitted for exporter review!', [
                { text: 'OK', onPress: () => navigation.replace('ManufacturerDashboard') }
            ]);
        } catch (error) {
            console.error('Submit QC error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to submit QC report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backText}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Upload QC Report</Text>
                    <View style={styles.headerRightSpacer} />
                </View>

                {/* Info Card */}
                <Card style={styles.orderCard}>
                    <Text style={styles.orderTitle}>{order.title}</Text>
                    <Text style={styles.orderDetail}>Quantity: {order.quantity} pcs</Text>
                </Card>

                {/* Form Fields */}
                <Card style={styles.formCard}>
                    <Text style={styles.sectionTitle}>Inspection Details *</Text>
                    <CustomInput
                        label="Inspection Summary"
                        placeholder="Detail the audit process, quality highlights, fabric/stitching outcome..."
                        multiline
                        numberOfLines={6}
                        value={comments}
                        onChangeText={setComments}
                    />
                </Card>

                {/* Images Upload Card */}
                <Card style={styles.formCard}>
                    <Text style={styles.sectionTitle}>Product Photos</Text>
                    <Text style={styles.helperText}>Add reference photos of finished products or packaging:</Text>
                    <TouchableOpacity style={styles.uploadTrigger} onPress={handlePickImage}>
                        <Text style={styles.uploadTriggerText}>+ Add Product Image</Text>
                    </TouchableOpacity>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailRow}>
                        {productImages.map((url, index) => (
                            <View key={index} style={styles.thumbnailWrapper}>
                                <Image source={{ uri: url }} style={styles.thumbnail} />
                                <TouchableOpacity style={styles.deleteBadge} onPress={() => handleRemoveImage(url)}>
                                    <Text style={styles.deleteBadgeText}>×</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>

                    {uploadingImage && (
                        <View style={styles.uploadingImageBar}>
                            <ActivityIndicator size="small" color={colors.secondary} style={{ marginRight: 8 }} />
                            <Text style={styles.uploadingImageText}>Uploading media attachment...</Text>
                        </View>
                    )}
                </Card>

                <View style={styles.footer}>
                    <CustomButton
                        title={loading ? 'Submitting Report...' : 'Submit QC Report'}
                        onPress={handleSubmitReport}
                        disabled={loading || uploadingImage}
                    />
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: spacing.m,
        paddingTop: spacing.m,
        paddingBottom: spacing.xl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.l,
        marginTop: spacing.s,
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    backText: {
        fontSize: 32,
        color: colors.text,
        fontWeight: 'bold',
        lineHeight: 32,
    },
    headerTitle: {
        flex: 1,
        ...typography.header,
        fontSize: 22,
        textAlign: 'center',
    },
    headerRightSpacer: {
        width: 44,
    },
    orderCard: {
        padding: spacing.m,
        marginBottom: spacing.m,
        backgroundColor: colors.surface,
        borderRadius: 14,
        ...shadows.small,
    },
    orderTitle: {
        ...typography.subheader,
        color: colors.text,
    },
    orderDetail: {
        fontSize: 13,
        color: colors.textLight,
        marginTop: 2,
    },
    formCard: {
        padding: spacing.m,
        marginBottom: spacing.m,
        backgroundColor: colors.surface,
        borderRadius: 16,
        ...shadows.small,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: spacing.s,
    },
    toggleRow: {
        flexDirection: 'row',
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 4,
        gap: 4,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    toggleText: {
        color: colors.textLight,
        fontWeight: 'bold',
        fontSize: 14,
    },
    toggleTextActive: {
        color: '#fff',
    },
    helperText: {
        fontSize: 12,
        color: colors.textLight,
        marginBottom: spacing.s,
    },
    uploadTrigger: {
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: 'dashed',
        borderRadius: 12,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
        marginBottom: spacing.s,
    },
    uploadTriggerText: {
        color: colors.primary,
        fontWeight: '600',
        fontSize: 13,
    },
    thumbnailRow: {
        flexDirection: 'row',
        marginTop: spacing.xs,
        marginBottom: spacing.xs,
    },
    thumbnailWrapper: {
        position: 'relative',
        marginRight: spacing.s,
    },
    thumbnail: {
        width: 72,
        height: 72,
        borderRadius: 8,
    },
    deleteBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: colors.error,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteBadgeText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        lineHeight: 18,
    },
    uploadingImageBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.s,
    },
    uploadingImageText: {
        fontSize: 12,
        color: colors.textLight,
    },
    footer: {
        marginTop: spacing.s,
    },
});

export default UploadQcReportScreen;
