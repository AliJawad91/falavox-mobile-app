import React, { useEffect, useRef, useState } from 'react';
import { View, PermissionsAndroid, Platform, Alert, TouchableOpacity, Text, Modal, StyleSheet } from 'react-native';
import { createAgoraRtcEngine, IRtcEngine, RtcSurfaceView, ChannelProfileType, ClientRoleType, AudioScenarioType, AudioProfileType } from 'react-native-agora';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import io from 'socket.io-client';
import { ChannelTokenDataInterface, TranslationStartedPayload } from '../types';
import { APP_CONFIG, fetchWithTimeout, withBase } from '../config';
import { logger } from '../utils/logger';

type Props = NativeStackScreenProps<RootStackParamList, 'Call'>;

// All server URLs now come from APP_CONFIG
export default function CallScreen({ route, navigation }: Props) {
    const [remoteUsers, setRemoteUsers] = useState<number[]>([]);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
    const [isTranslationEnabled, setIsTranslationEnabled] = useState(false);
    const [translationSession, setTranslationSession] = useState<any>(null);
    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const [speakingLanguage, setSpeakingLanguage] = useState('en');
    const [listeningLanguage, setListeningLanguage] = useState('ur');
    const [originalSpeakerUid, setOriginalSpeakerUid] = useState<number | null>(null);
    const [activeTranslationUid, setActiveTranslationUid] = useState<number | null>(null);

    // Removed temp token
    const engineRef = useRef<IRtcEngine | null>(null);
    const { channel, channelTokenData, uid, expiresAt } = route.params;
    console.log(route.params,"route.params");
    
    const [tokenExpiry, setTokenExpiry] = useState<number | null>(expiresAt || null);
    const socket = useRef<any>(null);
    console.log(tokenExpiry, channel, "tokenExpiry, channel out useEffect");

    useEffect(() => {
        console.log(tokenExpiry, channel, "tokenExpiry, channel inside useEffect");
        
        if (!tokenExpiry) return;
        const msUntilRenew = tokenExpiry * 1000 - Date.now() - 30 * 1000; // renew 30s before expiry
        if (msUntilRenew <= 0) return;

        const id = setTimeout(async () => {
            try {
                const url = withBase(`${APP_CONFIG.TOKEN_ENDPOINT}?channel=${encodeURIComponent(channel)}`);
                const res = await fetchWithTimeout(url, { headers: { 'ngrok-skip-browser-warning': 'true' } });
                const j = (await res.json()) as { token?: string; expiresAt?: number; data?: { token: string; expiresAt?: number } };
                const token = j.token ?? j.data?.token;
                const newExpiry = j.expiresAt ?? j.data?.expiresAt;
                if (token) {
                    engineRef.current?.renewToken(token);
                    console.log("Agora token renewed");
                    
                    logger.info('Agora token renewed');
                }
                if (newExpiry) setTokenExpiry(newExpiry);
            } catch (err) {
                console.log("failed to refresh token");
                
                logger.warn('failed to refresh token', err);
            }
        }, msUntilRenew);
        return () => clearTimeout(id);
    }, [tokenExpiry, channel]);

    useEffect(() => {
        socket.current = io(APP_CONFIG.SERVER_HOST, { transports: ['websocket'] });

        const onConnect = () => {
            logger.info('Socket connected');
            socket.current.emit('join_channel', { channel: channel, uid: uid });
        };
        socket.current.on('connect', onConnect);

        const onTranslationStarted = async (payload: TranslationStartedPayload) => {
            const palabraTask = payload?.palabraTask?.data;
            if (!palabraTask) return;

            const remoteUid = palabraTask.remote_uid as number;
            const translatorUid = (palabraTask.translations?.[0]?.local_uid ?? palabraTask.local_uid) as number;
            logger.info('translation_started', { remoteUid, translatorUid });

            // Store session for later stop handling
            setTranslationSession(payload as any);
            setOriginalSpeakerUid(remoteUid);
            setActiveTranslationUid(translatorUid);
            await applyTranslationMuteLogic(engineRef.current, uid, remoteUid, translatorUid);
        };
        socket.current.on('translation_started', onTranslationStarted);

        const onTranslationStopped = async (payload?: any) => {
            logger.info('Translation stopped, restoring original');

            // Prefer payload-provided IDs if available
            const stoppedRemote = payload?.palabraTask?.data?.remote_uid ?? payload?.remote_uid ?? originalSpeakerUid;
            const stoppedTranslator = payload?.palabraTask?.data?.local_uid ?? payload?.translator_uid ?? activeTranslationUid;

            if (uid !== stoppedRemote) {
                if (stoppedRemote) await engineRef.current?.muteRemoteAudioStream(stoppedRemote, false);
            }
            if (stoppedTranslator) {
                await engineRef.current?.muteRemoteAudioStream(stoppedTranslator, true);
            }

            setIsTranslationEnabled(false);
            setTranslationSession(null);
            setActiveTranslationUid(null);
            setOriginalSpeakerUid(null);
        };
        socket.current.on('translation_stopped', onTranslationStopped);

        // Broadcast variant sent to other users in the channel by the backend
        const onTranslationSessionStopped = async (payload?: any) => {
            logger.info('Translation session stopped (broadcast), restoring original');

            const stoppedRemote = payload?.palabraTask?.data?.remote_uid ?? payload?.remote_uid ?? originalSpeakerUid;
            const stoppedTranslator = payload?.palabraTask?.data?.local_uid ?? payload?.translator_uid ?? activeTranslationUid;

            if (uid !== stoppedRemote) {
                if (stoppedRemote) await engineRef.current?.muteRemoteAudioStream(stoppedRemote, false);
            }
            if (stoppedTranslator) {
                await engineRef.current?.muteRemoteAudioStream(stoppedTranslator, true);
            }

            setIsTranslationEnabled(false);
            setTranslationSession(null);
            setActiveTranslationUid(null);
            setOriginalSpeakerUid(null);
        };
        socket.current.on('translation_session_stopped', onTranslationSessionStopped);

        return () => {
            socket.current?.off('connect', onConnect);
            socket.current?.off('translation_started', onTranslationStarted);
            socket.current?.off('translation_stopped', onTranslationStopped);
            socket.current?.off('translation_session_stopped', onTranslationSessionStopped);
            socket.current?.disconnect();
        };
    }, [channel, uid, originalSpeakerUid, activeTranslationUid]);

    useEffect(() => {
        const token = (channelTokenData as ChannelTokenDataInterface)?.token;
        if (!channel || !token) return;

        const start = async () => {
            try {
                await ensurePermissions();
                const engine = createAgoraRtcEngine();
                engineRef.current = engine;

                engine.initialize({
                    appId: APP_CONFIG.AGORA_APP_ID,
                });

                engine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
                engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);

                engine.registerEventHandler({
                    onUserJoined: async (_connection, remoteUid) => {
                        logger.info('Remote user joined', { remoteUid, activeTranslationUid, uid, originalSpeakerUid });
                        setRemoteUsers(prev => (prev.includes(remoteUid) ? prev : [...prev, remoteUid]));
                        if (originalSpeakerUid && activeTranslationUid) {
                            setTimeout(() => {
                                applyTranslationMuteLogic(engineRef.current, uid, originalSpeakerUid, activeTranslationUid);
                            }, 700);
                        } else {
                            logger.debug('IDs not ready yet, skipping mute logic');
                        }
                    },
                    onUserOffline: (_connection, uidGone) => {
                        logger.info('Remote user left', { uid: uidGone });
                        setRemoteUsers((prev) => prev.filter((id) => id !== uidGone));
                    },
                    onRemoteAudioStateChanged: (_connection, uidChanged, state, reason, elapsed) => {
                        logger.debug('Remote audio state', { uid: uidChanged, state, reason, elapsed });
                    },
                    onUserMuteAudio: (_connection, uidChanged, muted) => {
                        logger.debug('Remote mute', { uid: uidChanged, muted });
                    },
                    onJoinChannelSuccess: (_connection, myUid) => {
                        logger.info('Joined audio channel', { uid: myUid });
                    },
                });

                engine.enableAudio();
                engine.setAudioProfile(
                    AudioProfileType.AudioProfileDefault,
                    AudioScenarioType.AudioScenarioGameStreaming
                );

                engine.joinChannel(token, String(channel), Number(uid), {
                    clientRoleType: ClientRoleType.ClientRoleBroadcaster,
                });

                if (expiresAt) {
                    setTokenExpiry(expiresAt);
                }
            } catch (e: any) {
                Alert.alert('Agora error', e?.message ?? String(e));
            }
        };
        start();
        return () => {
            const engine = engineRef.current;
            if (engine) {
                engine.leaveChannel();
                engine.release();
                engineRef.current = null;
            }
        };
    }, [channel, channelTokenData, uid, expiresAt]);

    const toggleMute = () => {
        logger.debug('Toggle Mute');

        const engine = engineRef.current;
        if (engine) {
            engine.muteLocalAudioStream(!isMuted);
            setIsMuted(!isMuted);
        }
    };

    const toggleSpeaker = () => {
        const engine = engineRef.current;
        if (engine) {
            engine.setEnableSpeakerphone(!isSpeakerEnabled);
            setIsSpeakerEnabled(!isSpeakerEnabled);
        }
    };

    const toggleTranslation = () => {
        if (!isTranslationEnabled) {
            // Show language selection modal when enabling translation
            logger.debug('Enable translation pressed');

            setShowLanguageModal(true);
        } else {
            // Disable translation
            setIsTranslationEnabled(false);
            setTranslationSession(null);
            // Emit stop translation event to backend
            socket.current?.emit('stop_translation', {
                channel: channel,
                clientId: uid,
            });
        }
    }

    const handleLanguageSelection = () => {
        setShowLanguageModal(false);
        setIsTranslationEnabled(true);

        // Emit start translation with selected languages
        logger.debug('channelTokenData', channelTokenData);
        // channel,expiresAt, generatedAt, token, uid
        socket.current?.emit('start_translation', {
            channel: channel,
            sourceLanguage: speakingLanguage,
            targetLanguage: listeningLanguage,
            // channelTokenData: channelTokenData,
            channelTokenData: {
                token: channelTokenData?.token ?? '',
                uid: channelTokenData?.uid ?? uid,
                expiresAt: channelTokenData?.expiresAt ?? expiresAt ?? 0,
                generatedAt: channelTokenData?.generatedAt ?? Math.floor(Date.now() / 1000),
                channel: channelTokenData?.channel ?? channel,
            },
            clientId: uid,
        });
    }
    async function applyTranslationMuteLogic(
        engine: IRtcEngine | null,
        myUid: number,
        speakerUid: number,
        translatorUid: number
    ) {
        // applyTranslationMuteLogic(engineRef.current, uid, originalSpeakerUid, activeTranslationUid);

        logger.debug('applyTranslationMuteLogic', { myUid, speakerUid, translatorUid });
        if (!engine || !speakerUid || !translatorUid || !myUid) {
            logger.debug('IDs not ready yet, skipping mute logic');
            return;
        }

        logger.info('Applying translation logic', { myUid, speakerUid, translatorUid });

        // SPEAKER SIDE
        if (myUid === speakerUid) {
            console.log("🎙 Speaker detected — muting translator stream");
            await engine.muteRemoteAudioStream(translatorUid, true);
            await engine.muteLocalAudioStream(false);
        }
        // LISTENER SIDE
        else {
            console.log("🎧 Listener detected — muting speaker, enabling translator");
            await engine.muteRemoteAudioStream(speakerUid, true);
            await engine.muteRemoteAudioStream(translatorUid, false);
        }
    }

    const onLeave = () => {
        const engine = engineRef.current;
        if (engine) {
            engine.leaveChannel();
            engine.release();
            engineRef.current = null;
        }
        // Navigate back to JoinScreen
        // navigation.navigate('Join');
        navigation.goBack();
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' }}>

            {/* Audio Participants List */}
            <View style={{ alignItems: 'center', marginBottom: 50 }}>
                <Text style={{ color: 'white', fontSize: 24, marginBottom: 20 }}>
                    Audio Call
                </Text>

                <Text style={{ color: 'white', fontSize: 16, marginBottom: 10 }}>
                    Channel: {channel}
                </Text>

                {translationSession && (
                    <View style={{ marginTop: 10, alignItems: 'center' }}>
                        <Text style={{ color: '#90CAF9' }}>Translation Active</Text>
                        <Text style={{ color: '#BDBDBD', fontSize: 12 }}>Speaking: {speakingLanguage} → Hearing: {listeningLanguage}</Text>
                        <Text style={{ color: '#BDBDBD', fontSize: 12 }}>Task: {translationSession?.palabraTask?.data?.task_id ?? 'N/A'}</Text>
                        <Text style={{ color: '#BDBDBD', fontSize: 12 }}>Local UID: {translationSession?.palabraTask?.data?.local_uid ?? 'N/A'}</Text>
                        <Text style={{ color: '#BDBDBD', fontSize: 12 }}>Remote UID: {translationSession?.palabraTask?.data?.remote_uid ?? 'N/A'}</Text>
                    </View>
                )}

                {/* Local User */}
                <View style={{ alignItems: 'center', marginVertical: 10 }}>
                    <View style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        backgroundColor: isMuted ? '#ff4444' : '#4CAF50',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 5
                    }}>
                        <Text style={{ color: 'white', fontSize: 18 }}>Me</Text>
                    </View>
                    <Text style={{ color: 'white' }}>
                        {isMuted ? 'Muted' : 'Speaking'}
                    </Text>
                </View>

                {/* Remote Users */}
                {remoteUsers.map((uid) => (
                    <View key={uid} style={{ alignItems: 'center', marginVertical: 10 }}>
                        <View style={{
                            width: 60,
                            height: 60,
                            borderRadius: 30,
                            backgroundColor: '#2196F3',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <Text style={{ color: 'white', fontSize: 14 }}>{uid}</Text>
                        </View>
                        <Text style={{ color: 'white', marginTop: 5 }}>User {uid}</Text>
                    </View>
                ))}
            </View>

            {/* Audio Controls */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', padding: 20 }}>
                <TouchableOpacity
                    onPress={toggleMute}
                    style={{
                        padding: 15,
                        backgroundColor: isMuted ? '#ff4444' : '#4CAF50',
                        borderRadius: 30,
                        minWidth: 80,
                        alignItems: 'center'
                    }}
                >
                    <Text style={{ color: 'white' }}>
                        {isMuted ? '🎤 Off' : '🎤 On'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={toggleSpeaker}
                    style={{
                        padding: 15,
                        backgroundColor: isSpeakerEnabled ? '#FF9800' : '#666',
                        borderRadius: 30,
                        minWidth: 80,
                        alignItems: 'center'
                    }}
                >
                    <Text style={{ color: 'white' }}>
                        {isSpeakerEnabled ? '🔊 Speaker' : '📞 Ear'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={toggleTranslation}
                    style={{
                        padding: 15,
                        backgroundColor: isTranslationEnabled ? '#FF9800' : '#666',
                        borderRadius: 30,
                        minWidth: 80,
                        alignItems: 'center'
                    }}
                >
                    <Text style={{ color: 'white' }}>
                        {isTranslationEnabled ? 'Stop Translation' : 'Start Translation'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={onLeave}
                    style={{
                        padding: 15,
                        backgroundColor: 'red',
                        borderRadius: 30,
                        minWidth: 80,
                        alignItems: 'center'
                    }}
                >
                    <Text style={{ color: 'white' }}>📞 Leave</Text>
                </TouchableOpacity>
            </View>

            {/* Language Selection Modal */}
            <Modal
                visible={showLanguageModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowLanguageModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Languages</Text>

                        {/* Speaking Language Selection */}
                        <View style={styles.languageSection}>
                            <Text style={styles.languageLabel}>I will speak in:</Text>
                            <View style={styles.languageButtons}>
                                {[
                                    { code: 'en', name: 'English' },
                                    { code: 'es', name: 'Spanish' },
                                    { code: 'fr', name: 'French' },
                                    { code: 'ur', name: 'Urdu' },
                                    { code: 'ar', name: 'Arabic' },
                                    { code: 'hi', name: 'Hindi' }
                                ].map((lang) => (
                                    <TouchableOpacity
                                        key={lang.code}
                                        style={[
                                            styles.languageButton,
                                            speakingLanguage === lang.code && styles.selectedLanguageButton
                                        ]}
                                        onPress={() => setSpeakingLanguage(lang.code)}
                                    >
                                        <Text style={[
                                            styles.languageButtonText,
                                            speakingLanguage === lang.code && styles.selectedLanguageButtonText
                                        ]}>
                                            {lang.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Listening Language Selection */}
                        <View style={styles.languageSection}>
                            <Text style={styles.languageLabel}>I want to hear in:</Text>
                            <View style={styles.languageButtons}>
                                {[
                                    { code: 'en', name: 'English' },
                                    { code: 'es', name: 'Spanish' },
                                    { code: 'fr', name: 'French' },
                                    { code: 'ur', name: 'Urdu' },
                                    { code: 'ar', name: 'Arabic' },
                                    { code: 'hi', name: 'Hindi' }
                                ].map((lang) => (
                                    <TouchableOpacity
                                        key={lang.code}
                                        style={[
                                            styles.languageButton,
                                            listeningLanguage === lang.code && styles.selectedLanguageButton
                                        ]}
                                        onPress={() => setListeningLanguage(lang.code)}
                                    >
                                        <Text style={[
                                            styles.languageButtonText,
                                            listeningLanguage === lang.code && styles.selectedLanguageButtonText
                                        ]}>
                                            {lang.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowLanguageModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={handleLanguageSelection}
                            >
                                <Text style={styles.confirmButtonText}>Start Translation</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// ✅ AUDIO-ONLY PERMISSIONS
async function ensurePermissions() {
    if (Platform.OS === 'android') {
        const results = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, // Only audio permission needed
        ]);
        const granted = Object.values(results).every((r) => r === PermissionsAndroid.RESULTS.GRANTED);
        if (!granted) throw new Error('Microphone permission denied');
    }
    // iOS: Add NSMicrophoneUsageDescription to info.plist
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#2a2a2a',
        borderRadius: 20,
        padding: 24,
        width: '90%',
        maxHeight: '80%',
    },
    modalTitle: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 24,
    },
    languageSection: {
        marginBottom: 24,
    },
    languageLabel: {
        color: '#BDBDBD',
        fontSize: 16,
        marginBottom: 12,
        fontWeight: '500',
    },
    languageButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    languageButton: {
        backgroundColor: '#404040',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
    },
    selectedLanguageButton: {
        backgroundColor: '#4CAF50',
    },
    languageButtonText: {
        color: '#BDBDBD',
        fontSize: 14,
        fontWeight: '500',
    },
    selectedLanguageButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    cancelButton: {
        backgroundColor: '#666',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        flex: 0.45,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    confirmButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        flex: 0.45,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});