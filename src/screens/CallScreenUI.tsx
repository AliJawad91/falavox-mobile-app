import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Alert, PermissionsAndroid, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View, Modal } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, moderateVerticalScale } from "react-native-size-matters";
import { RootStackParamList } from "../../App";
import { bottomGradientColor, buttonBorderColor, icon, pressedIconButtonBackground, pressedPrimaryButtonBackground, primaryButtonBackground, secondaryText, text, topGradientColor } from "../utils/colors";
// @ts-ignore: Module declaration for SVGs is missing in the project types
import BackIcon from "../../assets/icons/ic_back_plain.svg";
// @ts-ignore: Module declaration for SVGs is missing in the project types
import MuteIcon from "../../assets/icons/ic_mic_off.svg";
// @ts-ignore: Module declaration for SVGs is missing in the project types
import MuteOnIcon from "../../assets/icons/ic_mic_none_24px.svg"
// @ts-ignore: Module declaration for SVGs is missing in the project types
import SpeakerIcon from "../../assets/icons/ic_speaker.svg";
// @ts-ignore: Module declaration for SVGs is missing in the project types
import SpeakerOffIcon from "../../assets/icons/speaker-off-3.svg"
// @ts-ignore: Module declaration for SVGs is missing in the project types
import PhoneIcon from "../../assets/icons/ic_phone.svg";
import { useEffect, useRef, useState } from "react";
import { APP_CONFIG, fetchWithTimeout, withBase } from "../config";
import createAgoraRtcEngine, { AudioProfileType, AudioScenarioType, ChannelProfileType, ClientRoleType, IRtcEngine } from "react-native-agora";
import { logger } from "../utils/logger";
import { io } from "socket.io-client";
import { ChannelTokenDataInterface, TranslationStartedPayloadAgain } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, 'CallUI'>;

function CallScreenUI({ route, navigation }: Props) {
    const { channel, calledUser, channelTokenData, uid, expiresAt } = route.params;
    const engineRef = useRef<IRtcEngine | null>(null);

    const [tokenExpiry, setTokenExpiry] = useState<number | null>(expiresAt || null);
    const [remoteUsers, setRemoteUsers] = useState<number[]>([]);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
    const [isTranslationEnabled, setIsTranslationEnabled] = useState(false);
    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const [speakingLanguage, setSpeakingLanguage] = useState('en');
    const [listeningLanguage, setListeningLanguage] = useState('ur');
    const [originalSpeakerUid, setOriginalSpeakerUid] = useState<number | null>(null);
    const [activeTranslationUid, setActiveTranslationUid] = useState<number | null>(null);
    const [callDuration, setCallDuration] = useState(0); // Duration in seconds
    const [isCallActive, setIsCallActive] = useState(false); // Track if call is active for timer
    const [isLeaving, setIsLeaving] = useState(false);
    const [joinStatusMessage, setJoinStatusMessage] = useState<string | null>(null);
    const [isJoinInProgress, setIsJoinInProgress] = useState(true);
    const joinCompletedAt = useRef<number | null>(null);
    const leaveChannelPromise = useRef<{ resolve?: () => void }>({});
    const callStartTime = useRef<number | null>(null);

    const handleBackPress = () => {
        navigation.goBack();
    };
    const socket = useRef<any>(null);
    // console.log(tokenExpiry, channel, "tokenExpiry, channel out useEffect");

    useEffect(() => {
        console.log(tokenExpiry, channel, "tokenExpiry, channel inside useEffect");

        if (!tokenExpiry) return;
        const msUntilRenew = tokenExpiry * 1000 - Date.now() - 30 * 1000; // renew 30s before expiry
        if (msUntilRenew <= 0) return;

        const id = setTimeout(async () => {
            try {
                const url = withBase(`${APP_CONFIG.TOKEN_ENDPOINT}?channel=${encodeURIComponent(channel)}?uid=${uid}`);
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

    // Call timer effect - runs continuously when call is active
    useEffect(() => {
        if (!isCallActive || !callStartTime.current) return;

        const interval = setInterval(() => {
            if (callStartTime.current) {
                const elapsed = Math.floor((Date.now() - callStartTime.current) / 1000);
                setCallDuration(elapsed);
            } else {
                setIsCallActive(false);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isCallActive]); // Depend on isCallActive state, not the ref

    useEffect(() => {
        socket.current = io(APP_CONFIG.SERVER_HOST, { transports: ['websocket'] });

        const onConnect = () => {
            logger.info('Socket connected');
            socket.current.emit('join_channel', { channel: channel, uid: uid });
        };
        socket.current.on('connect', onConnect);

        // const onTranslationStarted = async (payload: TranslationStartedPayload) => {
        const onTranslationStarted = async (payload: TranslationStartedPayloadAgain) => {
            const { success, taskId, translatorUid, sourceLanguage, targetLanguage, speakerUid, message } = payload;
            console.log(payload, "payloadd onTranslationStarted");

            if (!payload.success) return;

            // Store session for later stop handling
            setOriginalSpeakerUid(speakerUid);
            setActiveTranslationUid(translatorUid);
            applyTranslationMuteLogic(
                engineRef.current,
                uid,
                speakerUid,
                translatorUid,
                // isTranslationEnabled
            );

        };
        socket.current.on('translation_started', onTranslationStarted);

        const onTranslationStopped = async (payload?: any) => {
            logger.info('Translation stopped, restoring original');
            console.log(payload.clientId, "translation_stopped payload", uid, "uid", originalSpeakerUid, "originalSpeakerUid");
            // {
            //     "channel": "bashagain_muneeb",
            //     "clientId": 9,
            //     "status": "stopped",
            //     "timestamp": "2025-12-10T12:47:46.883Z"
            // }
            // Prefer payload-provided IDs if available
            // const stoppedRemote = Number(payload?.palabraTask?.data?.remote_uid ?? payload?.remote_uid ?? originalSpeakerUid);
            // const stoppedTranslator = Number(payload?.palabraTask?.data?.local_uid ?? payload?.translator_uid ?? activeTranslationUid);
            // console.log("onTranslationStopped uid", uid, typeof uid, "stoppedRemote", stoppedRemote, typeof stoppedRemote, "stoppedTranslator", stoppedTranslator, typeof stoppedTranslator, "originalSpeakerUid", originalSpeakerUid, typeof originalSpeakerUid);
            // console.log(calledUser.userName, calledUser.agoraId,"calleduser Info stoping");

            //onTranslationStopped uid 3 number stoppedRemote 3 number stoppedTranslator 31044 number originalSpeakerUid 3 string
            // Check if this event belongs to THIS user's translation session
            // if (stoppedRemote !== uid) {
            //     console.log("Ignoring stop from another user's session");
            //     return;
            // }

            // if (uid !== stoppedRemote) {
            // if (stoppedRemote) {
            engineRef.current?.muteRemoteAudioStream(calledUser.agoraId, false);

            // }
            // }
            // if (stoppedTranslator) {
            //     await engineRef.current?.muteRemoteAudioStream(stoppedTranslator, true);
            // }

            setIsTranslationEnabled(false);
            setActiveTranslationUid(null);
            setOriginalSpeakerUid(null);

            // applyListenerAudioLogic(
            //     engineRef.current!,
            //     stoppedRemote,
            //     false // translation OFF
            // );

        };
        socket.current.on('translation_stopped', onTranslationStopped);

        // Broadcast variant sent to other users in the channel by the backend
        // const onTranslationSessionStopped = async (payload?: any) => {
        //     logger.info('Translation session stopped (broadcast), restoring original');

        //     const stoppedRemote = Number(payload?.palabraTask?.data?.remote_uid ?? payload?.remote_uid ?? originalSpeakerUid);
        //     const stoppedTranslator = Number(payload?.palabraTask?.data?.local_uid ?? payload?.translator_uid ?? activeTranslationUid);

        //     if (uid !== stoppedRemote) {
        //         if (stoppedRemote) await engineRef.current?.muteRemoteAudioStream(stoppedRemote, false);
        //     }
        //     if (stoppedTranslator) {
        //         await engineRef.current?.muteRemoteAudioStream(stoppedTranslator, true);
        //     }

        //     setIsTranslationEnabled(false);
        //     setActiveTranslationUid(null);
        //     setOriginalSpeakerUid(null);



        // };
        // socket.current.on('translation_session_stopped', onTranslationSessionStopped);

        return () => {
            // Emit leave_channel before disconnecting for proper tracking
            // if (socket.current && channel && uid) {
            //     socket.current.emit('leave_channel', {
            //         channel: channel,
            //         uid: uid,
            //     });
            // }
            socket.current?.off('connect', onConnect);
            socket.current?.off('translation_started', onTranslationStarted);
            socket.current?.off('translation_stopped', onTranslationStopped);
            // socket.current?.off('translation_session_stopped', onTranslationSessionStopped);
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
                        callStartTime.current = Date.now();
                        joinCompletedAt.current = Date.now();
                        setIsJoinInProgress(false);
                        setIsCallActive(true); // Start the timer
                        setCallDuration(0); // Reset duration
                        setShowLanguageModal(true);
                        // Notify server that Agora channel is actually joined
                        // This ensures accurate timing - session starts only when channel is active
                        const emitAgoraJoined = () => {
                            if (socket.current && socket.current.connected) {
                                console.log('Emitting agora_channel_joined', { channel, uid });
                                socket.current.emit('agora_channel_joined', {
                                    channel: channel,
                                    uid: uid,
                                    timestamp: Date.now()
                                });
                                return true;
                            }
                            return false;
                        };

                        // Try to emit immediately
                        if (!emitAgoraJoined()) {
                            console.warn('Socket not connected yet, waiting for connection...', {
                                socketExists: !!socket.current,
                                socketConnected: socket.current?.connected,
                                channel,
                                uid
                            });

                            // Wait for socket to connect (with timeout)
                            let retryCount = 0;
                            const maxRetries = 10; // 5 seconds max wait
                            const retryInterval = setInterval(() => {
                                retryCount++;
                                if (emitAgoraJoined()) {
                                    clearInterval(retryInterval);
                                    console.log('Successfully emitted agora_channel_joined after retry', { retryCount });
                                } else if (retryCount >= maxRetries) {
                                    clearInterval(retryInterval);
                                    console.error('Failed to emit agora_channel_joined after retries', {
                                        retryCount,
                                        channel,
                                        uid
                                    });
                                    logger.error('Socket never connected - call tracking may be incomplete', {
                                        channel,
                                        uid
                                    });
                                }
                            }, 500); // Retry every 500ms
                        }
                    },
                    onLeaveChannel: (_connection, stats) => {
                        console.log("Left audio channel");
                        logger.info('Left audio channel', { stats });

                        callStartTime.current = null;
                        setIsCallActive(false); // Stop the timer
                        setCallDuration(0);
                        setIsLeaving(false);

                        // Notify server that Agora channel is actually left
                        // This ensures accurate timing - session ends when channel is actually left
                        if (socket.current) {
                            console.log("if (socket.current) onLeaveChannel", { channel: channel, uid: uid });

                            socket.current.emit('agora_channel_left', {
                                channel: channel,
                                uid: uid,
                                timestamp: Date.now(),
                            });
                        }
                        // Resolve the leave promise if it exists
                        if (leaveChannelPromise.current.resolve) {
                            leaveChannelPromise.current.resolve();
                        }
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
            // Reset call timer
            callStartTime.current = null;
            setIsCallActive(false); // Stop the timer
            setCallDuration(0);
        };
    }, [channel, channelTokenData, uid, expiresAt]);

    const toggleMute = () => {
        logger.debug('Toggle Mute');
        console.log("Toggle Mutee", isMuted);

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
        logger.debug('Translation toggle pressed', { isTranslationEnabled });

        if (!isTranslationEnabled) {
            // Show language selection modal when enabling translation
            setShowLanguageModal(true);
        } else {
            // Stop translation - send to backend and reset state
            logger.debug('Stopping translation');
            socket.current?.emit('stop_translation', {
                channel: channel,
                clientId: uid,
            });

            // Reset local state immediately for responsive UI
            setIsTranslationEnabled(false);
            // applyListenerAudioLogic(engineRef.current!, originalSpeakerUid!, false);

        }
    };


    const handleLanguageSelection = () => {
        setShowLanguageModal(false);
        setIsTranslationEnabled(true);

        socket.current?.emit('start_translation', {
            channel: channel,
            sourceLanguage: speakingLanguage,//'en', User B speaks English
            targetLanguage: listeningLanguage,//'ur', User A wants Urdu translation
            targetSpeakerUid: calledUser.agoraId,  // <-- CRITICAL: UID of User B (the speaker)
            client_Agora_Id: uid,      // User A's own UID (for tracking purposes)
            channelTokenData: {
                token: channelTokenData?.token ?? '',  // User A's token
                uid: channelTokenData?.uid ?? uid,     // User A's UID
                expiresAt: channelTokenData?.expiresAt ?? expiresAt ?? 0,
                generatedAt: channelTokenData?.generatedAt ?? Math.floor(Date.now() / 1000),
                channel: channelTokenData?.channel ?? channel,
            },
        });
    }

    async function applyTranslationMuteLogic(
        engine: IRtcEngine | null,
        myUid: number,
        speakerUid: number,
        translatorUid: number
    ) {
        if (!engine) return;

        logger.info('Applying translation logic', { myUid, speakerUid, translatorUid });
        speakerUid = Number(speakerUid);
        translatorUid = Number(translatorUid);

        if (myUid == speakerUid) {
            console.log("🎙 Speaker detected — mute translator feed, keep call audio");

            // Only mute the translator so the speaker still hears everyone else
            engine.muteRemoteAudioStream(translatorUid, true);

            // Ensure speaker hears normal call audio (e.g., listener replies)
            engine.adjustPlaybackSignalVolume(100);

            // Keep my mic ON
            engine.muteLocalAudioStream(false);

        } else {
            console.log("🎧 Listener detected — muting speaker, enabling translation");

            // Mute original speaker
            engine.muteRemoteAudioStream(speakerUid, true);

            // Make sure translator audio is audible for the listener
            engine.muteRemoteAudioStream(translatorUid, false);
            engine.adjustPlaybackSignalVolume(100);
        }
    }


    const formatCallTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const onLeave = async () => {
        console.log("onLeave pressed");

        if (isLeaving) return; // Prevent multiple calls
        if (joinCompletedAt.current && Date.now() - joinCompletedAt.current < 2000) {
            setJoinStatusMessage('Call joining is in progress…');
            setTimeout(() => setJoinStatusMessage(null), 1500);
            return;
        }
        logger.debug('Stopping translation');
        socket.current?.emit('stop_translation', {
            channel: channel,
            clientId: uid,
        });


        // Emit leave_channel for tracking
        socket.current?.emit('leave_channel', {
            channel: channel,
            uid: uid,
        });

        // Reset local state immediately for responsive UI
        setIsTranslationEnabled(false);
        callStartTime.current = null;
        setIsCallActive(false); // Stop the timer
        setCallDuration(0);
        const engine = engineRef.current;
        if (engine) {
            console.log('Calling engine.leaveChannel', { hasEngine: !!engineRef.current });
            setIsLeaving(true); // Set leaving state
            // Create a promise to wait for onLeaveChannel
            const waitForLeave = new Promise<void>((resolve) => {
                leaveChannelPromise.current.resolve = resolve;
            });
            // Set a timeout in case onLeaveChannel never fires
            const timeoutPromise = new Promise<void>((resolve) => {
                setTimeout(() => {
                    console.warn('onLeaveChannel timeout, proceeding anyway');
                    resolve();
                }, 3000); // 3 second timeout
            });

            try {
                engine.leaveChannel();

                // Wait for either onLeaveChannel or timeout
                await Promise.race([waitForLeave, timeoutPromise]);

                console.log('Agora channel left confirmed');

            } catch (error) {
                console.error('Error leaving channel:', error);
            } finally {
                // Cleanup
                engine.release();
                engineRef.current = null;
                leaveChannelPromise.current.resolve = undefined;

                // Navigate back
                navigation.goBack();
            }
        }
        else {
            navigation.goBack();
        }
    }
    return (
        <LinearGradient
            style={style.gradientContainerStyle}
            colors={[topGradientColor, bottomGradientColor]}>

            <SafeAreaView style={style.safeAreaStyle}>


                <View style={style.headerStyle}>

                    <Pressable
                        style={({ pressed }) => [
                            pressed ? style.pressedHeaderButtonStyle : style.headerButtonStyle,
                            { marginStart: moderateScale(10) }
                        ]}
                        onPress={handleBackPress}>

                        <BackIcon style={{ color: icon }}
                            width={moderateScale(15)} height={moderateVerticalScale(15)} />

                    </Pressable>

                </View>

                <View style={style.contentStyle}>

                    <View style={style.callInfoContainerStyle}>

                        <Text style={style.callTimeTextStyle}>{formatCallTime(callDuration)}</Text>
                        {joinStatusMessage && (
                            <Text style={{ color: 'white', marginTop: 8, fontSize: 12 }}>
                                {joinStatusMessage}
                            </Text>
                        )}
                        <Text style={style.callNameTextStyle}>{calledUser?.lastName} {calledUser?.firstName}</Text>

                        <Text style={style.callHashTagTextStyle}>@{calledUser?.userName}</Text>

                        <View style={style.callControlContainerStyle}>

                            <Pressable
                                style={({ pressed }) => [style.callControlButtonStyle, { backgroundColor: pressed ? pressedIconButtonBackground : 'transparent' }]}
                                onPress={toggleMute}>
                                {isMuted ?
                                    <MuteIcon
                                        style={{ color: icon }}
                                        width={moderateScale(25)}
                                        height={moderateVerticalScale(25)} />
                                    :
                                    <MuteOnIcon
                                        // style={{ color: icon }}
                                        // style={{ color: 'white' }}
                                        fill="white"
                                        width={moderateScale(25)}
                                        height={moderateVerticalScale(25)} />
                                }
                            </Pressable>

                            <Pressable
                                style={({ pressed }) => [style.callControlButtonStyle, { backgroundColor: pressed ? pressedIconButtonBackground : 'transparent' }]}
                                onPress={toggleSpeaker}>
                                {isSpeakerEnabled ?
                                    <SpeakerIcon
                                        style={{ color: icon }}
                                        width={moderateScale(25)}
                                        height={moderateVerticalScale(25)} />
                                    :
                                    <SpeakerOffIcon
                                        fill="white"
                                        width={moderateScale(25)}
                                        height={moderateVerticalScale(25)} />
                                }
                            </Pressable>

                        </View>
                        <View style={{ justifyContent: 'center', alignItems: 'center' }}>

                            {isTranslationEnabled && (
                                <View style={style.translationStatusIndicator}>
                                    <Text style={style.translationStatusText}>
                                        {speakingLanguage.toUpperCase()} → {listeningLanguage.toUpperCase()}
                                    </Text>
                                </View>
                            )}
                            <Pressable
                                style={({ pressed }) => [
                                    style.callTranslationButtonStyle,
                                    isTranslationEnabled && style.callTranslationButtonActiveStyle,
                                    pressed && {
                                        backgroundColor: isTranslationEnabled ? '#45A049' : '#f0f0f0',
                                        transform: [{ scale: 0.95 }],
                                    }
                                ]}
                                onPress={toggleTranslation}
                            >

                                <Text style={[
                                    style.callTranslationButtonTextStyle,
                                    isTranslationEnabled && style.callTranslationButtonTextActiveStyle
                                ]}>
                                    {isTranslationEnabled ? 'Stop Translation' : 'Start Translation'}
                                </Text>
                            </Pressable>
                        </View>


                        <Pressable
                            style={({ pressed }) => [style.callEndButtonStyle, { backgroundColor: pressed ? pressedPrimaryButtonBackground : primaryButtonBackground }]}
                            onPress={onLeave}>

                            <PhoneIcon
                                style={{ color: icon }}
                                width={moderateScale(30)}
                                height={moderateVerticalScale(30)} />

                        </Pressable>

                    </View>

                </View>
                {/* Language Selection Modal */}
                <Modal
                    visible={showLanguageModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowLanguageModal(false)}
                >
                    <View style={style.modalOverlay}>
                        <View style={style.modalContent}>
                            <Text style={style.modalTitle}>Select Languages</Text>

                            {/* Speaking Language Selection */}
                            <View style={style.languageSection}>
                                <Text style={style.languageLabel}>Speaker will speak in:</Text>
                                <View style={style.languageButtons}>
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
                                                style.languageButton,
                                                speakingLanguage === lang.code && style.selectedLanguageButton
                                            ]}
                                            onPress={() => setSpeakingLanguage(lang.code)}
                                        >
                                            <Text style={[
                                                style.languageButtonText,
                                                speakingLanguage === lang.code && style.selectedLanguageButtonText
                                            ]}>
                                                {lang.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Listening Language Selection */}
                            <View style={style.languageSection}>
                                <Text style={style.languageLabel}>I want to hear in:</Text>
                                <View style={style.languageButtons}>
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
                                                style.languageButton,
                                                listeningLanguage === lang.code && style.selectedLanguageButton
                                            ]}
                                            onPress={() => setListeningLanguage(lang.code)}
                                        >
                                            <Text style={[
                                                style.languageButtonText,
                                                listeningLanguage === lang.code && style.selectedLanguageButtonText
                                            ]}>
                                                {lang.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Action Buttons */}
                            <View style={style.modalActions}>
                                <TouchableOpacity
                                    style={style.cancelButton}
                                    onPress={() => setShowLanguageModal(false)}
                                >
                                    <Text style={style.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={style.confirmButton}
                                    onPress={handleLanguageSelection}
                                >
                                    <Text style={style.confirmButtonText}>Start Translation</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>

        </LinearGradient>
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

const style = StyleSheet.create({
    gradientContainerStyle: {
        flex: 1
    },
    safeAreaStyle: {
        flex: 1
    },
    containerStyle: {
        flex: 1
    },
    headerStyle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    headerButtonStyle: {
        paddingHorizontal: moderateScale(10),
        paddingVertical: moderateVerticalScale(10),
        borderRadius: moderateScale(30),
        aspectRatio: 1
    },
    pressedHeaderButtonStyle: {
        backgroundColor: pressedIconButtonBackground,
        paddingHorizontal: moderateScale(10),
        paddingVertical: moderateVerticalScale(10),
        borderRadius: moderateScale(30),
        aspectRatio: 1
    },
    contentStyle: {
        flex: 1,
        paddingVertical: moderateVerticalScale(20),
        justifyContent: 'center'
    },
    callInfoContainerStyle: {
        flex: 0.7,
        alignItems: 'center'
    },
    callTimeTextStyle: {
        fontFamily: Platform.select({ ios: 'Inter 18pt', android: 'Inter_Regular' }),
        fontWeight: Platform.select({ ios: '400' }),
        fontSize: moderateScale(14),
        color: text
    },
    callNameTextStyle: {
        fontFamily: Platform.select({ ios: 'Inter 18pt', android: 'Inter_Bold' }),
        fontWeight: Platform.select({ ios: '700' }),
        fontSize: moderateScale(35),
        color: text,
        marginTop: moderateVerticalScale(80)
    },
    callHashTagTextStyle: {
        fontFamily: Platform.select({ ios: 'Inter 18pt', android: 'Inter_Regular' }),
        fontWeight: Platform.select({ ios: '400' }),
        fontSize: moderateScale(23),
        color: secondaryText,
        marginTop: moderateVerticalScale(10)
    },
    callControlContainerStyle: {
        flexDirection: 'row',
        marginTop: moderateVerticalScale(40)
    },
    callTranslationContainerStyle: {
        marginTop: moderateVerticalScale(25),
        width: moderateScale(110),
        height: moderateVerticalScale(35),
        borderRadius: moderateScale(30),
        // backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center'
    },
    callTranslationButtonStyle: {
        marginTop: moderateVerticalScale(45),
        backgroundColor: 'white',
        width: moderateScale(160),
        height: moderateVerticalScale(45),
        borderRadius: moderateScale(25),
        borderColor: buttonBorderColor,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    callTranslationButtonActiveStyle: {
        backgroundColor: '#4CAF50',
        borderColor: '#45A049',
        borderWidth: 2,
    },
    callTranslationButtonPressedStyle: {
        // backgroundColor: isTranslationEnabled ? '#45A049' : '#f0f0f0',
        transform: [{ scale: 0.95 }],
    },
    callTranslationButtonTextStyle: {
        fontFamily: Platform.select({ ios: 'Inter 18pt', android: 'Inter_SemiBold' }),
        fontWeight: Platform.select({ ios: '600' }),
        fontSize: moderateScale(14),
        color: '#333',
        letterSpacing: 0.5,
    },
    callTranslationButtonTextActiveStyle: {
        color: 'white',
        fontWeight: Platform.select({ ios: '700' }),
    },
    translationStatusIndicator: {
        position: 'absolute',
        bottom: 50,
        backgroundColor: '#4CAF50',
        paddingHorizontal: moderateScale(12),
        paddingVertical: moderateVerticalScale(4),
        borderRadius: moderateScale(15),
    },
    translationStatusText: {
        fontSize: moderateScale(11),
        color: 'white',
        fontWeight: '600',
    },
    callControlButtonStyle: {
        width: moderateScale(55),
        height: moderateVerticalScale(55),
        borderRadius: moderateScale(30),
        borderColor: buttonBorderColor,
        borderWidth: 1,
        aspectRatio: 1,
        marginHorizontal: moderateScale(10),
        alignItems: 'center',
        justifyContent: 'center'
    },
    callEndButtonStyle: {
        width: moderateScale(65),
        height: moderateVerticalScale(65),
        borderRadius: moderateScale(50),
        backgroundColor: primaryButtonBackground,
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: moderateVerticalScale(80)
    },
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

export default CallScreenUI;