import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Image, TextInput, Modal, ActivityIndicator, Platform } from 'react-native';
import axios from 'axios';
import ScreenWrapper from '../components/ScreenWrapper';
import Card from '../components/Card';
import CustomButton from '../components/CustomButton';
import { AuthContext } from '../context/AuthContext';
import { colors, spacing, typography, shadows } from '../theme';
import { BASE_URL } from '../config';

const QcReviewScreen = ({ route, navigation }) => {
    const { order } = route.params;
    const { userToken } = useContext(AuthContext);
    const [activeMediaUrl, setActiveMediaUrl] = useState(null);

    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Modal state for rejection input
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [defectDesc, setDefectDesc] = useState('');
    const [rejectComments, setRejectComments] = useState('');

    const fetchQcReport = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/qc/${order._id}/latest`, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            setReport(response.data);
        } catch (error) {
            console.error('Error fetching QC report:', error);
            Alert.alert('Error', 'Failed to retrieve QC report.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQcReport();
    }, []);

    const handleApprove = async () => {
        Alert.alert(
            'Approve QC',
            'Are you sure you want to approve this QC Report? This will complete the order and release allocated machines.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    onPress: async () => {
                        setActionLoading(true);
                        try {
                            await axios.put(`${BASE_URL}/qc/${report._id}/review`, {
                                approvalStatus: 'Approved',
                                reviewComments: 'Approved by exporter.'
                            }, {
                                headers: { Authorization: `Bearer ${userToken}` }
                            });
                            Alert.alert('Success', 'QC Approved! Order completed successfully.', [
                                { text: 'OK', onPress: () => navigation.replace('ExporterDashboard') }
                            ]);
                        } catch (error) {
                            console.error(error);
                            Alert.alert('Error', 'Failed to approve QC report.');
                        } finally {
                            setActionLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleRejectSubmit = async () => {
        if (!defectDesc.trim()) {
            Alert.alert('Error', 'Please provide a description of the defect.');
            return;
        }

        setActionLoading(true);
        setRejectModalVisible(false);
        try {
            await axios.put(`${BASE_URL}/qc/${report._id}/review`, {
                approvalStatus: 'Rejected',
                reviewComments: rejectComments.trim(),
                defectDescription: defectDesc.trim()
            }, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            Alert.alert('QC Rejected', 'Defect report has been sent to the manufacturer.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to reject QC report.');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <ScreenWrapper>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Retrieving QC Report details...</Text>
                </View>
            </ScreenWrapper>
        );
    }

    if (!report) {
        return (
            <ScreenWrapper>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>🛡️</Text>
                    <Text style={styles.emptyText}>No Quality Control reports uploaded yet.</Text>
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
                    <Text style={styles.headerTitle}>QC Report Review</Text>
                    <View style={styles.headerRightSpacer} />
                </View>

                {/* Audit Header Info Card */}
                <Card style={styles.reportHeaderCard}>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusBadge, { backgroundColor: report.status === 'Passed' ? colors.success + '15' : colors.error + '15' }]}>
                            <Text style={[styles.statusText, { color: report.status === 'Passed' ? colors.success : colors.error }]}>
                                AUDIT: {report.status.toUpperCase()}
                            </Text>
                        </View>
                        <Text style={styles.dateText}>{new Date(report.createdAt).toLocaleDateString()}</Text>
                    </View>
                    <Text style={styles.orderTitle}>{order.title}</Text>
                    <Text style={styles.manufacturerName}>Prepared by: {report.manufacturer?.name || 'Assigned Manufacturer'}</Text>
                </Card>

                {/* Report Details Card */}
                <Card style={styles.detailCard}>
                    <Text style={styles.sectionTitle}>Inspector Summary Comments</Text>
                    <Text style={styles.commentsText}>"{report.comments}"</Text>

                    {report.inspectionNotes ? (
                        <View style={{ marginTop: spacing.s }}>
                            <Text style={styles.sectionTitle}>Inspection Specs Notes</Text>
                            <Text style={styles.notesText}>{report.inspectionNotes}</Text>
                        </View>
                    ) : null}
                </Card>

                {/* Images review */}
                {report.productImages && report.productImages.length > 0 && (
                    <Card style={styles.detailCard}>
                        <Text style={styles.sectionTitle}>Product Reference Images</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesRow}>
                            {report.productImages.map((url, i) => (
                                <TouchableOpacity key={i} activeOpacity={0.9} onPress={() => setActiveMediaUrl(url)}>
                                    <Image source={{ uri: url }} style={styles.image} />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </Card>
                )}

                {/* Defect Images review */}
                {report.defectImages && report.defectImages.length > 0 && (
                    <Card style={styles.detailCard}>
                        <Text style={[styles.sectionTitle, { color: colors.error }]}>Identified Defect Images</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesRow}>
                            {report.defectImages.map((url, i) => (
                                <TouchableOpacity key={i} activeOpacity={0.9} onPress={() => setActiveMediaUrl(url)}>
                                    <Image source={{ uri: url }} style={styles.image} />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </Card>
                )}

                {/* Previous Review History (if not pending) */}
                {report.approvalStatus !== 'Pending' && (
                    <Card style={[styles.detailCard, { borderColor: report.approvalStatus === 'Approved' ? colors.success : colors.error }]}>
                        <Text style={styles.sectionTitle}>Review Decision: {report.approvalStatus}</Text>
                        <Text style={styles.dateText}>Reviewed on: {new Date(report.reviewedAt).toLocaleDateString()}</Text>
                        
                        {report.approvalStatus === 'Rejected' && (
                            <View style={{ marginTop: spacing.s }}>
                                <Text style={styles.defectSubTitle}>Reported Defects:</Text>
                                <Text style={styles.defectDescText}>"{report.defectDescription}"</Text>
                            </View>
                        )}
                        {report.reviewComments ? (
                            <View style={{ marginTop: spacing.s }}>
                                <Text style={styles.defectSubTitle}>Review Comments:</Text>
                                <Text style={styles.notesText}>"{report.reviewComments}"</Text>
                            </View>
                        ) : null}
                    </Card>
                )}

                {/* Exporter Review Action Buttons */}
                {report.approvalStatus === 'Pending' && !actionLoading && (
                    <View style={styles.actionRow}>
                        <CustomButton
                            title="Approve QC"
                            onPress={handleApprove}
                            style={[styles.actionBtn, { backgroundColor: colors.success }]}
                        />
                        <CustomButton
                            title="Reject/Rework"
                            onPress={() => setRejectModalVisible(true)}
                            style={[styles.actionBtn, { backgroundColor: colors.error }]}
                        />
                    </View>
                )}

                {actionLoading && <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: spacing.m }} />}

                {/* Reject Input Dialog Modal */}
                <Modal visible={rejectModalVisible} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>File Defect Report</Text>
                            
                            <Text style={styles.modalLabel}>Description of Defects *</Text>
                            <TextInput
                                style={[styles.modalInput, styles.modalTextArea]}
                                placeholder="Describe stitching issues, missing logos, size variations, or defect specifics..."
                                placeholderTextColor={colors.textLight}
                                multiline
                                numberOfLines={3}
                                value={defectDesc}
                                onChangeText={setDefectDesc}
                            />

                            <Text style={styles.modalLabel}>Notes / Instructions (Optional)</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Instructions on rework requirements..."
                                placeholderTextColor={colors.textLight}
                                value={rejectComments}
                                onChangeText={setRejectComments}
                            />

                            <View style={styles.modalButtons}>
                                <TouchableOpacity style={[styles.modalBtn, styles.modalCancelBtn]} onPress={() => setRejectModalVisible(false)}>
                                    <Text style={styles.modalCancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.modalBtn, styles.modalSubmitBtn]} onPress={handleRejectSubmit}>
                                    <Text style={styles.modalSubmitText}>Submit Rejection</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Fullscreen Image Modal */}
                <Modal
                    visible={activeMediaUrl !== null}
                    transparent={true}
                    onRequestClose={() => setActiveMediaUrl(null)}
                    animationType="fade"
                >
                    <View style={styles.modalBackground}>
                        <TouchableOpacity 
                            style={styles.modalCloseButton} 
                            onPress={() => setActiveMediaUrl(null)}
                        >
                            <Text style={styles.modalCloseText}>✕ Close</Text>
                        </TouchableOpacity>
                        {activeMediaUrl && (
                            <Image 
                                source={{ uri: activeMediaUrl }} 
                                style={styles.modalFullImage} 
                                resizeMode="contain"
                            />
                        )}
                    </View>
                </Modal>
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
    reportHeaderCard: {
        padding: spacing.m,
        borderRadius: 14,
        ...shadows.small,
        backgroundColor: colors.surface,
        marginBottom: spacing.m,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.s,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    dateText: {
        fontSize: 11,
        color: colors.textLight,
    },
    orderTitle: {
        ...typography.subheader,
        color: colors.text,
    },
    manufacturerName: {
        fontSize: 13,
        color: colors.textLight,
        marginTop: 2,
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
    sectionTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: spacing.xs,
    },
    commentsText: {
        fontSize: 15,
        fontStyle: 'italic',
        color: colors.text,
        lineHeight: 20,
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
    defectSubTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.error,
        marginBottom: 2,
    },
    defectDescText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.s,
    },
    actionBtn: {
        width: '48%',
        height: 48,
        paddingVertical: 0,
        borderRadius: 12,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: spacing.m,
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: spacing.m,
        ...shadows.medium,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.error,
        marginBottom: spacing.m,
        textAlign: 'center',
    },
    modalLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        padding: spacing.s,
        marginBottom: spacing.m,
        color: colors.text,
        fontSize: 14,
    },
    modalTextArea: {
        height: 72,
        textAlignVertical: 'top',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalCancelBtn: {
        marginRight: spacing.s,
        backgroundColor: colors.background,
    },
    modalCancelText: {
        color: colors.textLight,
        fontWeight: '600',
    },
    modalSubmitBtn: {
        backgroundColor: colors.error,
    },
    modalSubmitText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCloseButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        right: 20,
        padding: 10,
        zIndex: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 8,
    },
    modalCloseText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    modalFullImage: {
        width: '95%',
        height: '80%',
    },
});

export default QcReviewScreen;
