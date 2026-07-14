import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import axios from 'axios';
import ScreenWrapper from '../components/ScreenWrapper';
import Card from '../components/Card';
import CustomButton from '../components/CustomButton';
import { AuthContext } from '../context/AuthContext';
import { colors, spacing, typography, shadows } from '../theme';
import { BASE_URL } from '../config';

const DefectDetailsScreen = ({ route, navigation }) => {
    const { order } = route.params;
    const { userToken } = useContext(AuthContext);

    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchDefectReport = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/qc/${order._id}/latest`, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            setReport(response.data);
        } catch (error) {
            console.error('Error fetching defect report:', error);
            Alert.alert('Error', 'Failed to retrieve defect logs.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDefectReport();
    }, []);

    const handleRework = () => {
        // Direct flow to upload updated QC report upon rework completion
        navigation.navigate('UploadQc', { order });
    };

    if (loading) {
        return (
            <ScreenWrapper>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Retrieving defect details...</Text>
                </View>
            </ScreenWrapper>
        );
    }

    if (!report || report.approvalStatus !== 'Rejected') {
        return (
            <ScreenWrapper>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>🎉</Text>
                    <Text style={styles.emptyText}>No active defect reports found for this order.</Text>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.backBtnText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backText}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Rework & Defect Log</Text>
                    <View style={styles.headerRightSpacer} />
                </View>

                {/* Status Indicator Card */}
                <Card style={[styles.defectHeaderCard, { borderColor: colors.error }]}>
                    <Text style={styles.alertHeader}>⚠️ REWORK REQUIRED</Text>
                    <Text style={styles.orderTitle}>{order.title}</Text>
                    <Text style={styles.dateText}>Rejected on: {new Date(report.reviewedAt).toLocaleDateString()}</Text>
                </Card>

                {/* Exporter Defects specifications card */}
                <Card style={styles.defectCard}>
                    <Text style={styles.sectionTitle}>Reported Defects (Logged by Exporter)</Text>
                    <View style={styles.defectBox}>
                        <Text style={styles.defectDesc}>"{report.defectDescription}"</Text>
                    </View>

                    {report.reviewComments ? (
                        <View style={{ marginTop: spacing.m }}>
                            <Text style={styles.sectionTitle}>Exporter Review Comments</Text>
                            <Text style={styles.reviewCommentsText}>"{report.reviewComments}"</Text>
                        </View>
                    ) : null}
                </Card>

                {/* Original QC references submitted by manufacturer */}
                <Card style={styles.detailCard}>
                    <Text style={styles.sectionTitle}>Your Original QC Comments</Text>
                    <Text style={styles.notesText}>"{report.comments}"</Text>

                    {report.defectImages && report.defectImages.length > 0 && (
                        <View style={{ marginTop: spacing.m }}>
                            <Text style={[styles.sectionTitle, { color: colors.error }]}>Uploaded Defect Images</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesRow}>
                                {report.defectImages.map((url, i) => (
                                    <Image key={i} source={{ uri: url }} style={styles.image} />
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </Card>

                {/* Action button to proceed to rework upload */}
                <View style={styles.footer}>
                    <CustomButton
                        title="Upload Updated QC Report"
                        onPress={handleRework}
                        style={{ backgroundColor: colors.secondary }}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: spacing.s,
        color: colors.textLight,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.l,
    },
    emptyIcon: {
        fontSize: 54,
        marginBottom: spacing.s,
        opacity: 0.5,
    },
    emptyText: {
        ...typography.body,
        color: colors.textLight,
        textAlign: 'center',
    },
    backBtn: {
        marginTop: spacing.m,
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.s,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    backBtnText: {
        color: colors.text,
        fontWeight: '600',
    },
    defectHeaderCard: {
        padding: spacing.m,
        borderRadius: 14,
        ...shadows.small,
        backgroundColor: colors.surface,
        marginBottom: spacing.m,
        borderLeftWidth: 5,
    },
    alertHeader: {
        fontSize: 13,
        fontWeight: 'bold',
        color: colors.error,
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    orderTitle: {
        ...typography.subheader,
        color: colors.text,
    },
    dateText: {
        fontSize: 11,
        color: colors.textLight,
        marginTop: 2,
    },
    defectCard: {
        padding: spacing.m,
        borderRadius: 14,
        ...shadows.small,
        backgroundColor: colors.surface,
        marginBottom: spacing.m,
        borderWidth: 1,
        borderColor: colors.border,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: spacing.s,
    },
    defectBox: {
        backgroundColor: colors.error + '08',
        borderColor: colors.error + '25',
        borderWidth: 1,
        borderRadius: 12,
        padding: spacing.m,
    },
    defectDesc: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        lineHeight: 20,
    },
    reviewCommentsText: {
        fontSize: 13,
        color: colors.textLight,
        fontStyle: 'italic',
    },
    detailCard: {
        padding: spacing.m,
        borderRadius: 14,
        ...shadows.small,
        backgroundColor: colors.surface,
        marginBottom: spacing.m,
        borderWidth: 1,
        borderColor: colors.border,
    },
    notesText: {
        fontSize: 13,
        color: colors.textLight,
    },
    imagesRow: {
        flexDirection: 'row',
        marginTop: spacing.s,
    },
    image: {
        width: 140,
        height: 100,
        borderRadius: 10,
        marginRight: spacing.s,
    },
    footer: {
        marginTop: spacing.s,
    },
});

export default DefectDetailsScreen;
