import React, { useEffect, useState, useRef, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Modal, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import io from 'socket.io-client';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import ScreenWrapper from '../components/ScreenWrapper';
import { AuthContext } from '../context/AuthContext';
import { colors, spacing, typography, shadows } from '../theme';
import { BASE_URL, resolveImageUri } from '../config';

const ChatScreen = ({ route, navigation }) => {
    const { order } = route.params;
    const { userToken, userInfo } = useContext(AuthContext);
    const [messages, setMessages] = useState([]);
    const insets = useSafeAreaInsets();
    const [inputText, setInputText] = useState('');
    const [uploading, setUploading] = useState(false);
    const [connecting, setConnecting] = useState(true);
    const [chatOrder, setChatOrder] = useState(order);
    const [activeMediaUrl, setActiveMediaUrl] = useState(null);

    const otherUser = userInfo?.role === 'manufacturer' ? chatOrder?.user : chatOrder?.manufacturer;

    const socketRef = useRef(null);
    const flatListRef = useRef(null);

    // Socket Host URL (remove /api from BASE_URL)
    const socketHost = BASE_URL.replace('/api', '');

    // Fetch Chat History
    const fetchHistory = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/chat/${order._id}`, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            setMessages(response.data);
            setConnecting(false);
        } catch (error) {
            console.error('Chat history fetch error:', error);
            Alert.alert('Error', 'Failed to load chat history.');
            setConnecting(false);
        }
    };

    const fetchOrderDetails = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/orders/${order._id}`, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            setChatOrder(response.data);
        } catch (error) {
            console.log('Error fetching order details in chat:', error);
        }
    };

    useEffect(() => {
        fetchHistory();
        fetchOrderDetails();

        // Initialize Socket.io Connection
        socketRef.current = io(socketHost, {
            transports: ['websocket']
        });

        // Join room
        socketRef.current.emit('join_room', { orderId: order._id });

        // Listen for new messages
        socketRef.current.on('receive_message', (newMsg) => {
            setMessages(prev => [...prev, newMsg]);
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    // Scroll to bottom helper
    const scrollToBottom = () => {
        if (flatListRef.current && messages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: true });
        }
    };

    const handleSend = () => {
        if (!inputText.trim()) return;

        if (socketRef.current) {
            socketRef.current.emit('send_message', {
                orderId: order._id,
                senderId: userInfo?._id || userInfo?.id,
                text: inputText.trim(),
                attachment: null
            });
            setInputText('');
        }
    };

    // Attachment uploading handler
    const uploadAttachment = async (fileUri, fileName, fileType) => {
        setUploading(true);
        const formData = new FormData();
        
        formData.append('file', {
            uri: Platform.OS === 'android' ? fileUri : fileUri.replace('file://', ''),
            name: fileName || `upload-${Date.now()}`,
            type: fileType || 'application/octet-stream'
        });

        try {
            const response = await axios.post(`${BASE_URL}/chat/upload`, formData, {
                headers: {
                    Authorization: `Bearer ${userToken}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Emit message containing the uploaded static attachment URL
            if (socketRef.current) {
                socketRef.current.emit('send_message', {
                    orderId: order._id,
                    senderId: userInfo?._id || userInfo?.id,
                    text: '',
                    attachment: response.data
                });
            }
        } catch (error) {
            console.error('Attachment upload error:', error);
            Alert.alert('Error', 'Failed to upload attachment.');
        } finally {
            setUploading(false);
        }
    };

    // Pick image from gallery
    const handlePickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert('Permission Denied', 'Permission to access camera roll is required!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.8
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            const type = asset.mimeType || 'image/jpeg';
            const name = asset.fileName || `image-${Date.now()}.jpg`;
            await uploadAttachment(asset.uri, name, type);
        }
    };

    // Pick doc/PDF
    const handlePickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                copyToCacheDirectory: true
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                await uploadAttachment(asset.uri, asset.name, asset.mimeType);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const renderMessageItem = ({ item }) => {
        const userId = userInfo?._id || userInfo?.id;
        const isOwn = item.sender?._id === userId || item.sender === userId;

        return (
            <View style={[styles.messageRow, isOwn ? styles.messageRowOwn : styles.messageRowOther]}>
                <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
                    
                    {/* Render Text */}
                    {item.text ? <Text style={[styles.messageText, isOwn ? styles.textOwn : styles.textOther]}>{item.text}</Text> : null}

                    {/* Render Attachment */}
                    {item.attachment && item.attachment.url ? (
                        item.attachment.mimeType.startsWith('image/') ? (
                            <TouchableOpacity activeOpacity={0.9} onPress={() => setActiveMediaUrl(item.attachment.url)}>
                                <Image
                                    source={{ uri: resolveImageUri(item.attachment.url) }}
                                    style={styles.attachmentImage}
                                    resizeMode="cover"
                                />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity activeOpacity={0.8} onPress={() => Linking.openURL(item.attachment.url)}>
                                <View style={styles.documentContainer}>
                                    <Text style={[styles.documentIcon, isOwn ? styles.textOwn : styles.textOther]}>📄</Text>
                                    <View style={styles.documentInfo}>
                                        <Text style={[styles.documentName, isOwn ? styles.textOwn : styles.textOther]} numberOfLines={1}>
                                            {item.attachment.name}
                                        </Text>
                                        <Text style={[styles.documentMeta, isOwn ? styles.textOwn : styles.textOther]}>
                                            Document file • Tap to open
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )
                    ) : null}

                    <Text style={[styles.timestamp, isOwn ? styles.timestampOwn : styles.timestampOther]}>
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    if (connecting) {
        return (
            <ScreenWrapper>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Connecting to chat...</Text>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <KeyboardAvoidingView
                style={styles.keyboardContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 60}
            >
                <View style={styles.header}>
                    {otherUser ? (
                        <TouchableOpacity 
                            style={styles.otherUserContainer}
                            onPress={() => navigation.navigate('OtherUserProfile', { user: otherUser })}
                            activeOpacity={0.8}
                        >
                            <Image 
                                source={{ uri: resolveImageUri(otherUser.profilePic) || 'https://ui-avatars.com/api/?name=' + (otherUser.name || 'User') + '&background=0F172A&color=fff' }} 
                                style={styles.headerAvatar}
                            />
                            <View style={styles.headerTitleContainer}>
                                <Text style={styles.headerTitle} numberOfLines={1}>{otherUser.name || 'Loading...'}</Text>
                                <Text style={styles.headerSubtitle}>
                                    {otherUser.companyName ? `${otherUser.companyName} • View Profile` : 'Tap to view profile'}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerTitle} numberOfLines={1}>{chatOrder?.title || order.title}</Text>
                            <Text style={styles.headerSubtitle}>Order Chat Thread</Text>
                        </View>
                    )}
                </View>

                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item._id}
                    renderItem={renderMessageItem}
                    contentContainerStyle={styles.messagesList}
                    onContentSizeChange={scrollToBottom}
                    onLayout={scrollToBottom}
                />

                {uploading && (
                    <View style={styles.uploadingBar}>
                        <ActivityIndicator size="small" color={colors.secondary} style={{ marginRight: 8 }} />
                        <Text style={styles.uploadingText}>Uploading attachment...</Text>
                    </View>
                )}

                {/* Input Row */}
                <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 14 : 10) }]}>
                    <TouchableOpacity style={styles.attachBtn} onPress={handlePickImage}>
                        <Text style={styles.attachIcon}>📸</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.attachBtn} onPress={handlePickDocument}>
                        <Text style={styles.attachIcon}>📎</Text>
                    </TouchableOpacity>

                    <TextInput
                        style={styles.input}
                        placeholder="Type your message..."
                        placeholderTextColor={colors.textLight}
                        value={inputText}
                        onChangeText={setInputText}
                        onSubmitEditing={handleSend}
                    />

                    <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                        <Text style={styles.sendIcon}>➔</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

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
                            source={{ uri: resolveImageUri(activeMediaUrl) }} 
                            style={styles.modalFullImage} 
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    keyboardContainer: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: spacing.s,
        color: colors.textLight,
        ...typography.body,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.s,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.surface,
    },
    otherUserContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerAvatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        marginRight: spacing.s,
        borderWidth: 1,
        borderColor: colors.border,
    },
    backButton: {
        marginRight: spacing.s,
        padding: spacing.xs,
    },
    backText: {
        fontSize: 22,
        color: colors.text,
        fontWeight: 'bold',
    },
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        ...typography.subheader,
        color: colors.text,
    },
    headerSubtitle: {
        fontSize: 12,
        color: colors.textLight,
    },
    messagesList: {
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.m,
    },
    messageRow: {
        marginBottom: spacing.m,
        maxWidth: '80%',
    },
    messageRowOwn: {
        alignSelf: 'flex-end',
        alignItems: 'flex-end',
    },
    messageRowOther: {
        alignSelf: 'flex-start',
        alignItems: 'flex-start',
    },
    senderText: {
        fontSize: 11,
        color: colors.textLight,
        fontWeight: 'bold',
        marginBottom: 2,
        marginLeft: 4,
    },
    bubble: {
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        ...shadows.small,
    },
    bubbleOwn: {
        backgroundColor: colors.primary,
        borderBottomRightRadius: 4,
    },
    bubbleOther: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    textOwn: {
        color: '#fff',
    },
    textOther: {
        color: colors.text,
    },
    attachmentImage: {
        width: 220,
        height: 150,
        borderRadius: 12,
        marginTop: 4,
    },
    documentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 10,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginTop: 4,
        width: 200,
    },
    documentIcon: {
        fontSize: 24,
        marginRight: 8,
    },
    documentInfo: {
        flex: 1,
    },
    documentName: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    documentMeta: {
        fontSize: 10,
        opacity: 0.7,
    },
    timestamp: {
        fontSize: 9,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    timestampOwn: {
        color: 'rgba(255,255,255,0.7)',
    },
    timestampOther: {
        color: colors.textLight,
    },
    uploadingBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
        paddingVertical: spacing.s,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    uploadingText: {
        fontSize: 13,
        color: colors.textLight,
        fontWeight: '500',
    },
    inputArea: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.s,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.surface,
    },
    attachBtn: {
        padding: spacing.s,
    },
    attachIcon: {
        fontSize: 20,
    },
    input: {
        flex: 1,
        height: 40,
        backgroundColor: colors.background,
        borderRadius: 20,
        paddingHorizontal: spacing.m,
        fontSize: 15,
        color: colors.text,
        marginHorizontal: spacing.s,
    },
    sendBtn: {
        backgroundColor: colors.primary,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 4,
    },
    sendIcon: {
        color: '#fff',
        fontSize: 16,
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

export default ChatScreen;
