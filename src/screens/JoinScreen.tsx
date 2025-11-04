import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import {Picker} from '@react-native-picker/picker';
import { APP_CONFIG, fetchWithTimeout, withBase } from '../config';
import { logger } from '../utils/logger';
import { TokenApiResponse } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Join'>;

// All server URLs now come from APP_CONFIG
  

export default function JoinScreen({ navigation }: Props) {
    const [channel, setChannel] = useState('');
    const [language, setLanguage] = useState('en');
    const [loading, setLoading] = useState(false);

    const join = async () => {
      if (!channel.trim()) {
        return Alert.alert('Please enter channel name');
      }
      try {
        setLoading(true);
        const url = withBase(`${APP_CONFIG.TOKEN_ENDPOINT}?channel=${encodeURIComponent(channel)}`);

        const res = await fetchWithTimeout(url, {
          headers: { 'ngrok-skip-browser-warning': 'true' },
          timeoutMs: APP_CONFIG.REQUEST_TIMEOUT_MS,
        });
        logger.debug('Token response status', res.status);

        if (!res.ok) throw new Error('Token request failed');
        const { data } = (await res.json()) as TokenApiResponse; // { token, uid, channel, expiresAt }
        logger.debug('Token data', data);
        console.log('Token data', data);
        
        setLoading(false);
        if(!data.token) throw new Error("Unsuccessfull Token Generation .");  
        navigation.navigate('Call', {
          channel,
          language,
          channelTokenData: data,
          uid: Number(data.uid),
          expiresAt: data.expiresAt,
        });
      } catch (err: any) {
        setLoading(false);
        logger.error('Join error', err);
        Alert.alert('Error', err?.message ?? 'Failed to join. Check your network and try again.');
      }
    };
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Join/Create a Call</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter channel name"
                value={channel}
                onChangeText={setChannel}
            />
            <Picker
                selectedValue={language}
                onValueChange={(val) => setLanguage(val)}
                style={{ width: '80%', color: 'black' }}
            >
                <Picker.Item label="English" value="en" />
                <Picker.Item label="Spanish" value="es" />
                <Picker.Item label="French" value="fr" />
            </Picker>

            {/* <Button
                title="Join"
                onPress={() => navigation.navigate('Call', { channel, language })}
            /> */}
                <Button title={loading ? 'Joining...' : 'Join'} onPress={join} />

            {/* <Button
                title="Join"
                onPress={() => {
                    if (channel.trim()) {
                        navigation.navigate('Call', { channel });
                    }
                }}
            /> */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 20, marginBottom: 16 },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        width: '80%',
        marginBottom: 12,
    },
});
