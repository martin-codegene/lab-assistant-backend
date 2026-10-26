# Real-Time Experiment Guidance via WebSocket
## React Native Expo Implementation Guide

This document provides a complete guide to implementing the real-time Nova streaming feature in React Native Expo, including live video guidance during laboratory experiments.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Setup & Dependencies](#setup--dependencies)
3. [WebSocket Connection Management](#websocket-connection-management)
4. [Camera Frame Capture](#camera-frame-capture)
5. [Audio Recording & Streaming](#audio-recording--streaming)
6. [Message Protocol](#message-protocol)
7. [Complete Implementation](#complete-implementation)
8. [Error Handling & Reconnection](#error-handling--reconnection)
9. [Performance Optimization](#performance-optimization)
10. [Testing & Debugging](#testing--debugging)

---

## Architecture Overview

### System Flow

```
┌─────────────────────────────────────────────────────────────┐
│ React Native Expo App (Client)                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Camera     │  │   Audio      │  │   WebSocket  │     │
│  │   Capture    │  │   Recording  │  │   Manager    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                 │                  │             │
│         └─────────────────┼──────────────────┘             │
│                           │                                │
├───────────────────────────┼────────────────────────────────┤
│                    WebSocket (TCP)                         │
│              GET /api/experiments/{id}/guidance            │
├─────────────────────────────────────────────────────────────┤
│ Backend (Hono + Node.js)                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ experimentWebSocketHandler                           │ │
│  │  • Manages session state                             │ │
│  │  • Routes messages to use cases                      │ │
│  │  • Broadcasts AI responses                           │ │
│  └──────────────────────────────────────────────────────┘ │
│                           │                                │
│           ┌───────────────┘                                │
│           │                                                │
│  ┌────────▼────────────────────────────────────────────┐  │
│  │ experimentUseCases                                  │  │
│  │  • Orchestrates streaming session                   │  │
│  │  • Validates frames/audio                           │  │
│  │  • Manages protocol context                         │  │
│  └────────┬────────────────────────────────────────────┘  │
│           │                                                │
│           │ Dependency Injection                          │
│  ┌────────▼────────────────────────────────────────────┐  │
│  │ NovaAIService (IRealtimeAIService)                 │  │
│  │  • Real-time Bedrock ConverseStream                │  │
│  │  • Frame analysis (vision)                          │  │
│  │  • Audio processing                                 │  │
│  │  • Text streaming callbacks                         │  │
│  └────────┬────────────────────────────────────────────┘  │
│           │                                                │
│           │ AWS SDK                                       │
│  ┌────────▼────────────────────────────────────────────┐  │
│  │ Amazon Bedrock ConverseStream (Nova Model)         │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Message Flow

1. **Client connects** → WebSocket upgrade at `/api/experiments/{id}/guidance?protocolId={protocolId}`
2. **Client sends** `start_guidance` → Backend initializes Nova session with protocol context
3. **Client captures frames** → Encodes to base64 → Sends via `send_frame` message
4. **Backend processes** → Sends frame to Nova via Bedrock with streaming
5. **Nova responds** → Streams text chunks back via callbacks
6. **Backend broadcasts** → Sends `text_delta` messages back to client
7. **Client receives** → Displays guidance text in real-time

---

## Setup & Dependencies

### 1. Install Required Packages

```bash
# WebSocket support
bunx expo install expo-web-sockets

# Camera functionality
bunx expo install expo-camera

# Audio recording
bunx expo install expo-audio

# For base64 encoding
bunx expo install expo-file-system

# JWT authentication (if not already installed)
bunx expo install @react-native-community/async-storage

# Type safety
bun install --save-dev @types/react-native
```

### 2. Configure App.json

```json
{
  "expo": {
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Allow camera access to provide live guidance during experiments"
        }
      ],
      [
        "expo-av",
        {
          "microphonePermission": "Allow microphone access for voice-enabled guidance"
        }
      ]
    ]
  }
}
```

### 3. Environment Configuration

Create `config/constants.ts`:

```typescript
// API Configuration
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
export const GUIDANCE_ENDPOINT = '/api/experiments';

// WebSocket Configuration
export const WS_PROTOCOL = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
export const WS_BASE_URL = `${WS_PROTOCOL}://${API_BASE_URL.split('://')[1]}`;

// Camera Configuration
export const CAMERA_CONFIG = {
  FPS: 1, // Frames per second (adjust based on bandwidth)
  QUALITY: 0.7, // JPEG quality (0-1)
  WIDTH: 640,
  HEIGHT: 480,
};

// Audio Configuration
export const AUDIO_CONFIG = {
  SAMPLE_RATE: 16000,
  CHANNELS: 1,
  BIT_DEPTH: 16,
  FORMAT: 'wav',
};

// Session Configuration
export const SESSION_CONFIG = {
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY_MS: 2000,
  FRAME_CAPTURE_INTERVAL_MS: 1000, // Send a frame every 1s
  AUDIO_CHUNK_SIZE_MS: 500, // 500ms audio chunks
  HEARTBEAT_INTERVAL_MS: 5000, // Keep-alive ping every 5s
};
```

---

## WebSocket Connection Management

### 1. Create WebSocket Manager

Create `services/GuidanceWebSocketManager.ts`:

```typescript
import type { ExperimentSession } from '@/types/guidance';

export type WSMessageType = 
  | 'start_guidance'
  | 'send_frame'
  | 'send_audio'
  | 'interrupt'
  | 'end_session'
  | 'heartbeat';

export type WSResponseType =
  | 'session_started'
  | 'text_delta'
  | 'audio_chunk'
  | 'session_ended'
  | 'error'
  | 'ack';

// Outgoing message structure
export interface WSMessage {
  type: WSMessageType;
  experimentId?: string;
  protocolId?: string;
  frameData?: string; // base64
  audioData?: string; // base64
  mimeType?: string;
  systemContext?: string;
  timestamp?: number;
}

// Incoming response structure
export interface WSResponse {
  type: WSResponseType;
  content?: string; // For text_delta
  streamId?: string;
  sessionActive?: boolean;
  error?: string;
  timestamp: number;
}

// Callbacks for different response types
export interface WSCallbacks {
  onSessionStarted: (streamId: string) => void;
  onTextDelta: (text: string) => void;
  onAudioChunk: (audioBase64: string) => void;
  onSessionEnded: () => void;
  onError: (error: string) => void;
  onConnectionStateChange: (connected: boolean) => void;
}

export class GuidanceWebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private authToken: string;
  private callbacks: WSCallbacks;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 2000;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private messageQueue: WSMessage[] = [];
  private sessionId: string | null = null;

  constructor(
    experimentId: string,
    protocolId: string,
    authToken: string,
    callbacks: WSCallbacks,
    baseUrl: string = 'ws://localhost:3000',
  ) {
    this.url = `${baseUrl}/api/experiments/${experimentId}/guidance?protocolId=${protocolId}`;
    this.authToken = authToken;
    this.callbacks = callbacks;
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('[WebSocket] Connecting to:', this.url);
        
        this.ws = new WebSocket(this.url, []);

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.callbacks.onConnectionStateChange(true);
          
          // Send auth token
          this.send({
            type: 'heartbeat',
            timestamp: Date.now(),
          });

          // Start heartbeat
          this.startHeartbeat();

          // Flush queued messages
          this.flushMessageQueue();

          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          this.isConnected = false;
          this.callbacks.onConnectionStateChange(false);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[WebSocket] Disconnected');
          this.isConnected = false;
          this.callbacks.onConnectionStateChange(false);
          this.stopHeartbeat();
          this.attemptReconnect();
        };
      } catch (error) {
        console.error('[WebSocket] Connection error:', error);
        reject(error);
      }
    });
  }

  /**
   * Send message to server
   */
  send(message: WSMessage): void {
    if (!this.isConnected) {
      console.warn('[WebSocket] Not connected, queuing message');
      this.messageQueue.push(message);
      return;
    }

    try {
      this.ws?.send(JSON.stringify({
        ...message,
        timestamp: message.timestamp || Date.now(),
      }));
      console.log(`[WebSocket] Sent: ${message.type}`);
    } catch (error) {
      console.error('[WebSocket] Send error:', error);
      this.messageQueue.push(message);
    }
  }

  /**
   * Handle incoming messages from server
   */
  private handleMessage(data: string): void {
    try {
      const response: WSResponse = JSON.parse(data);

      switch (response.type) {
        case 'session_started':
          console.log('[WebSocket] Session started:', response.streamId);
          this.sessionId = response.streamId || null;
          this.callbacks.onSessionStarted(response.streamId || '');
          break;

        case 'text_delta':
          console.log('[WebSocket] Text delta:', response.content?.substring(0, 50));
          this.callbacks.onTextDelta(response.content || '');
          break;

        case 'audio_chunk':
          console.log('[WebSocket] Audio chunk received');
          this.callbacks.onAudioChunk(response.content || '');
          break;

        case 'session_ended':
          console.log('[WebSocket] Session ended');
          this.callbacks.onSessionEnded();
          break;

        case 'error':
          console.error('[WebSocket] Server error:', response.error);
          this.callbacks.onError(response.error || 'Unknown error');
          break;

        case 'ack':
          console.log('[WebSocket] Message acknowledged');
          break;

        default:
          console.warn('[WebSocket] Unknown response type:', response.type);
      }
    } catch (error) {
      console.error('[WebSocket] Message parsing error:', error);
      this.callbacks.onError('Failed to parse server message');
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send({
          type: 'heartbeat',
          timestamp: Date.now(),
        });
      }
    }, 5000);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Flush queued messages
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  /**
   * Attempt to reconnect on disconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(
        `[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
      );

      setTimeout(() => {
        this.connect().catch((error) => {
          console.error('[WebSocket] Reconnection failed:', error);
        });
      }, delay);
    } else {
      console.error('[WebSocket] Max reconnection attempts reached');
      this.callbacks.onError('Connection lost. Max reconnection attempts exceeded.');
    }
  }

  /**
   * Start guidance session
   */
  startGuidance(experimentId: string, protocolId: string, systemContext?: string): void {
    this.send({
      type: 'start_guidance',
      experimentId,
      protocolId,
      systemContext,
    });
  }

  /**
   * Send video frame for analysis
   */
  sendFrame(frameBase64: string, mimeType: string = 'image/jpeg'): void {
    this.send({
      type: 'send_frame',
      frameData: frameBase64,
      mimeType,
    });
  }

  /**
   * Send audio chunk
   */
  sendAudio(audioBase64: string): void {
    this.send({
      type: 'send_audio',
      audioData: audioBase64,
    });
  }

  /**
   * Interrupt current AI response
   */
  interrupt(): void {
    this.send({
      type: 'interrupt',
    });
  }

  /**
   * End guidance session
   */
  endSession(): void {
    this.send({
      type: 'end_session',
    });
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    this.stopHeartbeat();
    this.endSession();
    
    setTimeout(() => {
      if (this.ws) {
        this.ws.close();
        this.ws = null;
        this.isConnected = false;
      }
    }, 500);
  }

  /**
   * Check if connected
   */
  getIsConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }
}
```

---

## Camera Frame Capture

### 1. Camera Permission & Capture Manager

Create `services/CameraManager.ts`:

```typescript
import { Camera, CameraType } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import * as FileSystem from 'expo-file-system';

export interface CameraFrame {
  base64: string;
  timestamp: number;
  width: number;
  height: number;
}

export class CameraManager {
  private cameraRef: Camera | null = null;
  private isCapturing: boolean = false;
  private captureInterval: NodeJS.Timeout | null = null;

  /**
   * Request camera permissions
   */
  static async requestPermissions(): Promise<boolean> {
    const { status } = await Camera.requestCameraPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Set camera reference
   */
  setCameraRef(ref: Camera | null) {
    this.cameraRef = ref;
  }

  /**
   * Start capturing frames at specified interval
   */
  startCapturing(intervalMs: number = 1000): void {
    if (this.isCapturing) {
      console.warn('[Camera] Already capturing');
      return;
    }

    console.log('[Camera] Starting frame capture every', intervalMs, 'ms');
    this.isCapturing = true;

    this.captureInterval = setInterval(async () => {
      try {
        await this.captureFrame();
      } catch (error) {
        console.error('[Camera] Capture error:', error);
      }
    }, intervalMs);
  }

  /**
   * Stop capturing frames
   */
  stopCapturing(): void {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
    this.isCapturing = false;
    console.log('[Camera] Stopped capturing');
  }

  /**
   * Capture single frame
   */
  private async captureFrame(): Promise<CameraFrame | null> {
    if (!this.cameraRef) {
      console.warn('[Camera] Camera ref not set');
      return null;
    }

    try {
      const photo = await this.cameraRef.takePictureAsync({
        base64: true,
        quality: 0.7,
        width: 640,
        height: 480,
      });

      if (!photo.uri || !photo.base64) {
        console.warn('[Camera] Invalid photo data');
        return null;
      }

      return {
        base64: photo.base64,
        timestamp: Date.now(),
        width: photo.width,
        height: photo.height,
      };
    } catch (error) {
      console.error('[Camera] Capture failed:', error);
      return null;
    }
  }

  /**
   * Capture single frame on demand
   */
  async captureFrameManual(): Promise<CameraFrame | null> {
    return this.captureFrame();
  }

  /**
   * Check if currently capturing
   */
  getIsCapturing(): boolean {
    return this.isCapturing;
  }
}

// React Hook for camera management
export function useCameraManager(intervalMs: number = 1000) {
  const cameraRef = useRef<Camera>(null);
  const managerRef = useRef(new CameraManager());
  const [permission, setPermission] = useState<boolean | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    CameraManager.requestPermissions().then(setPermission);
  }, []);

  return {
    cameraRef,
    manager: managerRef.current,
    permission,
    isCapturing,
    startCapturing: () => {
      if (!permission) {
        console.error('[Camera] Permission not granted');
        return;
      }
      managerRef.current.setCameraRef(cameraRef.current);
      managerRef.current.startCapturing(intervalMs);
      setIsCapturing(true);
    },
    stopCapturing: () => {
      managerRef.current.stopCapturing();
      setIsCapturing(false);
    },
  };
}
```

### 2. Camera View Component

Create `components/CameraGuidanceView.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Camera } from 'expo-camera';
import { useCameraManager } from '@/services/CameraManager';

type Props = {
  isActive: boolean;
  onFrameCapture: (frame: CameraFrame) => void;
};

export function CameraGuidanceView({ isActive, onFrameCapture }: Props) {
  const { cameraRef, permission, startCapturing, stopCapturing, isCapturing } = 
    useCameraManager(1000);

  useEffect(() => {
    if (isActive && permission) {
      startCapturing();
    } else {
      stopCapturing();
    }
  }, [isActive, permission]);

  if (permission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Requesting camera permissions...</Text>
      </View>
    );
  }

  if (permission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Camera permission denied</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={CameraType.back}
        ratio="16:9"
      >
        {isCapturing && (
          <View style={styles.indicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>Recording...</Text>
          </View>
        )}
      </Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  indicator: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF0000',
    marginRight: 8,
  },
  recordingText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  error: {
    color: '#FF0000',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
});
```

---

## Audio Recording & Streaming

### 1. Audio Manager

Create `services/AudioManager.ts`:

```typescript
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export interface AudioChunk {
  base64: string;
  timestamp: number;
  duration: number; // ms
}

export class AudioManager {
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;
  private isRecording: boolean = false;
  private recordingStartTime: number = 0;

  /**
   * Request audio permissions
   */
  static async requestPermissions(): Promise<boolean> {
    const { status } = await Audio.requestMicrophonePermissionsAsync();
    return status === 'granted';
  }

  /**
   * Start recording audio
   */
  async startRecording(): Promise<void> {
    try {
      // Set up audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionMode: Audio.INTERRUPTION_MODE_DO_NOT_MIX,
      });

      // Create recording
      const recording = new Audio.Recording();
      
      await recording.prepareToRecordAsync({
        android: {
          extension: '.wav',
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      });

      await recording.startAsync();
      
      this.recording = recording;
      this.isRecording = true;
      this.recordingStartTime = Date.now();
      
      console.log('[Audio] Recording started');
    } catch (error) {
      console.error('[Audio] Failed to start recording:', error);
      throw error;
    }
  }

  /**
   * Stop recording and get audio chunk
   */
  async stopRecording(): Promise<AudioChunk | null> {
    if (!this.recording) {
      console.warn('[Audio] No recording in progress');
      return null;
    }

    try {
      await this.recording.stopAndUnloadAsync();
      
      const uri = this.recording.getURI();
      this.isRecording = false;

      if (!uri) {
        console.warn('[Audio] No recording URI');
        return null;
      }

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const duration = Date.now() - this.recordingStartTime;

      // Clean up file
      try {
        await FileSystem.deleteAsync(uri);
      } catch (e) {
        console.warn('[Audio] Failed to delete recording file');
      }

      this.recording = null;

      return {
        base64,
        timestamp: Date.now(),
        duration,
      };
    } catch (error) {
      console.error('[Audio] Failed to stop recording:', error);
      this.recording = null;
      return null;
    }
  }

  /**
   * Play audio chunk
   */
  async playAudio(audioBase64: string): Promise<void> {
    try {
      const uri = `${FileSystem.cacheDirectory}guidance_audio.wav`;
      
      // Write base64 to file
      await FileSystem.writeAsStringAsync(uri, audioBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Create and play sound
      const { sound } = await Audio.Sound.createAsync({ uri });
      this.sound = sound;

      await this.sound.playAsync();
    } catch (error) {
      console.error('[Audio] Failed to play audio:', error);
    }
  }

  /**
   * Stop playback
   */
  async stopPlayback(): Promise<void> {
    if (this.sound) {
      await this.sound.stopAsync();
    }
  }

  /**
   * Check if recording
   */
  getIsRecording(): boolean {
    return this.isRecording;
  }
}

// React Hook for audio management
export function useAudioManager() {
  const [permission, setPermission] = React.useState<boolean | null>(null);
  const [isRecording, setIsRecording] = React.useState(false);
  const managerRef = React.useRef(new AudioManager());

  React.useEffect(() => {
    AudioManager.requestPermissions().then(setPermission);
  }, []);

  return {
    manager: managerRef.current,
    permission,
    isRecording,
    startRecording: async () => {
      if (!permission) {
        console.error('[Audio] Permission not granted');
        return;
      }
      try {
        await managerRef.current.startRecording();
        setIsRecording(true);
      } catch (error) {
        console.error('[Audio] Start failed:', error);
      }
    },
    stopRecording: async () => {
      const chunk = await managerRef.current.stopRecording();
      setIsRecording(false);
      return chunk;
    },
  };
}
```

---

## Message Protocol

### 1. Type Definitions

Create `types/guidance.ts`:

```typescript
export interface ExperimentSession {
  experimentId: string;
  protocolId: string;
  userId: string;
  sessionStartTime: number;
  isActive: boolean;
}

export interface GuidanceState {
  isConnected: boolean;
  sessionActive: boolean;
  currentGuidance: string;
  isProcessing: boolean;
  error: string | null;
  lastUpdate: number;
}

export interface WSMessage {
  type:
    | 'start_guidance'
    | 'send_frame'
    | 'send_audio'
    | 'interrupt'
    | 'end_session'
    | 'heartbeat';
  experimentId?: string;
  protocolId?: string;
  frameData?: string;
  audioData?: string;
  mimeType?: string;
  systemContext?: string;
  timestamp?: number;
}

export interface WSResponse {
  type:
    | 'session_started'
    | 'text_delta'
    | 'audio_chunk'
    | 'session_ended'
    | 'error'
    | 'ack';
  content?: string;
  streamId?: string;
  sessionActive?: boolean;
  error?: string;
  timestamp: number;
}
```

---

## Complete Implementation

### 1. Guidance Screen Component

Create `screens/ExperimentGuidanceScreen.tsx`:

```typescript
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { CameraGuidanceView } from '@/components/CameraGuidanceView';
import { GuidanceWebSocketManager, type WSCallbacks } from '@/services/GuidanceWebSocketManager';
import { useCameraManager, type CameraFrame } from '@/services/CameraManager';
import { useAudioManager } from '@/services/AudioManager';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-community/async-storage';

type Props = {
  route: {
    params: {
      experimentId: string;
      protocolId: string;
      protocolTitle: string;
      protocolDescription: string;
    };
  };
  navigation: any;
};

export function ExperimentGuidanceScreen({ route, navigation }: Props) {
  const { experimentId, protocolId, protocolTitle, protocolDescription } = route.params;
  const { authToken } = useAuth();

  // State management
  const [guidanceText, setGuidanceText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingAudio, setRecordingAudio] = useState(false);

  // WebSocket manager
  const wsManagerRef = useRef<GuidanceWebSocketManager | null>(null);

  // Camera and audio hooks
  const { startCapturing, stopCapturing } = useCameraManager(1000);
  const { startRecording, stopRecording } = useAudioManager();

  // Initialize WebSocket
  useEffect(() => {
    initializeWebSocket();
    return () => {
      wsManagerRef.current?.disconnect();
    };
  }, [experimentId, protocolId, authToken]);

  const initializeWebSocket = async () => {
    try {
      const apiUrl = await AsyncStorage.getItem('API_BASE_URL') || 'http://localhost:3000';
      const wsBaseUrl = apiUrl.replace('http', 'ws');

      const callbacks: WSCallbacks = {
        onSessionStarted: (streamId) => {
          console.log('[Guidance] Session started:', streamId);
          setIsSessionActive(true);
          setIsProcessing(false);
          startCapturing();
        },
        onTextDelta: (text) => {
          setGuidanceText((prev) => prev + text);
          setIsProcessing(false);
        },
        onAudioChunk: (audioBase64) => {
          // Play audio response
          console.log('[Guidance] Playing audio response');
        },
        onSessionEnded: () => {
          console.log('[Guidance] Session ended');
          setIsSessionActive(false);
          stopCapturing();
        },
        onError: (error) => {
          console.error('[Guidance] Error:', error);
          setError(error);
          Alert.alert('Guidance Error', error);
        },
        onConnectionStateChange: (connected) => {
          setIsConnected(connected);
          if (!connected) {
            setError('Connection lost');
          }
        },
      };

      wsManagerRef.current = new GuidanceWebSocketManager(
        experimentId,
        protocolId,
        authToken || '',
        callbacks,
        wsBaseUrl,
      );

      await wsManagerRef.current.connect();
      
      // Start guidance session
      wsManagerRef.current.startGuidance(
        experimentId,
        protocolId,
        `Protocol: ${protocolTitle}\n\n${protocolDescription}`,
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to initialize guidance';
      setError(errorMsg);
      Alert.alert('Connection Error', errorMsg);
    }
  };

  const handleRecordAudio = async () => {
    try {
      if (!recordingAudio) {
        await startRecording();
        setRecordingAudio(true);
      } else {
        const chunk = await stopRecording();
        setRecordingAudio(false);

        if (chunk) {
          setIsProcessing(true);
          wsManagerRef.current?.sendAudio(chunk.base64);
        }
      }
    } catch (err) {
      Alert.alert('Audio Error', err instanceof Error ? err.message : 'Failed to record audio');
    }
  };

  const handleInterrupt = () => {
    wsManagerRef.current?.interrupt();
    setGuidanceText('');
  };

  const handleEndSession = () => {
    Alert.alert('End Guidance?', 'Are you sure you want to end the guidance session?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'End',
        onPress: () => {
          wsManagerRef.current?.disconnect();
          stopCapturing();
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Camera View */}
      <View style={styles.cameraContainer}>
        {isSessionActive ? (
          <CameraGuidanceView
            isActive={true}
            onFrameCapture={(frame) => {
              wsManagerRef.current?.sendFrame(frame.base64, 'image/jpeg');
            }}
          />
        ) : (
          <View style={styles.placeholderCamera}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text>Initializing guidance session...</Text>
          </View>
        )}

        {/* Status Indicator */}
        <View style={styles.statusBar}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isConnected ? '#00FF00' : '#FF0000' },
            ]}
          />
          <Text style={styles.statusText}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
      </View>

      {/* Guidance Text Display */}
      <ScrollView style={styles.guidanceContainer}>
        {guidanceText ? (
          <Text style={styles.guidanceText}>{guidanceText}</Text>
        ) : (
          <Text style={styles.placeholderText}>Waiting for guidance...</Text>
        )}
      </ScrollView>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            recordingAudio ? styles.buttonActive : styles.buttonInactive,
          ]}
          onPress={handleRecordAudio}
          disabled={!isSessionActive}
        >
          <Text style={styles.buttonText}>
            {recordingAudio ? '🎤 Stop Recording' : '🎤 Record Audio'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonDanger]}
          onPress={handleInterrupt}
          disabled={!isProcessing}
        >
          <Text style={styles.buttonText}>🛑 Interrupt</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonDanger]}
          onPress={handleEndSession}
        >
          <Text style={styles.buttonText}>❌ End Session</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  placeholderCamera: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  statusBar: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  guidanceContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  guidanceText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#ffcdd2',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  controlsContainer: {
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonInactive: {
    backgroundColor: '#e0e0e0',
  },
  buttonActive: {
    backgroundColor: '#2196F3',
  },
  buttonDanger: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
```

---

## Error Handling & Reconnection

### 1. Error Recovery Strategy

```typescript
// In GuidanceWebSocketManager

class ErrorHandler {
  private static readonly RETRYABLE_ERRORS = [
    'ECONNREFUSED',
    'ECONNRESET',
    'ETIMEDOUT',
    'Connection lost',
    'WebSocket closed',
  ];

  static isRetryable(error: string): boolean {
    return this.RETRYABLE_ERRORS.some((e) => error.includes(e));
  }

  static getRetryDelay(attempt: number): number {
    // Exponential backoff: 2s, 4s, 8s, 16s, 32s
    return Math.min(2000 * Math.pow(2, attempt), 32000);
  }
}

// Usage in reconnection logic
private attemptReconnect(): void {
  if (
    this.reconnectAttempts < this.maxReconnectAttempts &&
    ErrorHandler.isRetryable(this.lastError)
  ) {
    const delay = ErrorHandler.getRetryDelay(this.reconnectAttempts);
    // Reconnect with exponential backoff
  }
}
```

### 2. Session Recovery

```typescript
// Persist session state
interface SessionState {
  experimentId: string;
  protocolId: string;
  guidanceHistory: string[];
  lastUpdate: number;
}

// Store in AsyncStorage
async function persistSession(session: SessionState) {
  await AsyncStorage.setItem('activeSession', JSON.stringify(session));
}

// Restore on reconnect
async function restoreSession(): Promise<SessionState | null> {
  const stored = await AsyncStorage.getItem('activeSession');
  return stored ? JSON.parse(stored) : null;
}
```

---

## Performance Optimization

### 1. Frame Sampling

```typescript
// Adaptive frame rate based on connection quality
class AdaptiveFrameRate {
  private frameRate: number = 1; // fps
  private lastFrameTime: number = Date.now();
  private droppedFrames: number = 0;

  shouldCaptureFrame(): boolean {
    const now = Date.now();
    const interval = 1000 / this.frameRate;

    if (now - this.lastFrameTime > interval) {
      this.lastFrameTime = now;
      return true;
    }
    return false;
  }

  adjustFrameRate(quality: number) {
    // quality: 0-1 (0 = poor connection)
    this.frameRate = Math.max(0.5, quality * 2); // 0.5-2 fps
  }
}
```

### 2. Audio Chunking

```typescript
// Efficient audio streaming
const AUDIO_CHUNK_DURATION_MS = 500;
const AUDIO_SAMPLE_RATE = 16000;
const BYTES_PER_CHUNK = (AUDIO_SAMPLE_RATE * AUDIO_CHUNK_DURATION_MS) / 1000 * 2; // 16-bit PCM

async function streamAudioChunks(audioBase64: string) {
  const audioData = Buffer.from(audioBase64, 'base64');
  
  for (let i = 0; i < audioData.length; i += BYTES_PER_CHUNK) {
    const chunk = audioData.slice(i, i + BYTES_PER_CHUNK);
    wsManager.sendAudio(chunk.toString('base64'));
    
    // Small delay between chunks
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}
```

### 3. Memory Management

```typescript
// Clear old guidance history periodically
class GuidanceHistoryManager {
  private maxItems: number = 100;
  private items: string[] = [];

  add(item: string) {
    this.items.push(item);
    
    // Keep only recent items
    if (this.items.length > this.maxItems) {
      this.items = this.items.slice(-this.maxItems);
    }
  }

  getHistory(): string {
    return this.items.join('');
  }

  clear() {
    this.items = [];
  }
}
```

---

## Testing & Debugging

### 1. Mock WebSocket for Testing

Create `__mocks__/WebSocket.ts`:

```typescript
export class MockWebSocket {
  static instances: MockWebSocket[] = [];
  
  url: string;
  readyState: number = 0;
  onopen: (() => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onerror: ((error: any) => void) | null = null;
  onclose: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    
    // Simulate connection
    setTimeout(() => {
      this.readyState = 1;
      this.onopen?.();
    }, 100);
  }

  send(data: string) {
    const message = JSON.parse(data);
    
    // Simulate responses
    if (message.type === 'start_guidance') {
      this.simulateResponse({
        type: 'session_started',
        streamId: 'mock-session-123',
        timestamp: Date.now(),
      });
    }
  }

  simulateResponse(response: any) {
    setTimeout(() => {
      this.onmessage?.({ data: JSON.stringify(response) });
    }, 100);
  }

  close() {
    this.readyState = 3;
    this.onclose?.();
  }
}

// Replace global WebSocket in tests
global.WebSocket = MockWebSocket as any;
```

### 2. Test Suite Example

```typescript
import { GuidanceWebSocketManager } from '@/services/GuidanceWebSocketManager';

describe('GuidanceWebSocketManager', () => {
  let manager: GuidanceWebSocketManager;
  const callbacks = {
    onSessionStarted: jest.fn(),
    onTextDelta: jest.fn(),
    onAudioChunk: jest.fn(),
    onSessionEnded: jest.fn(),
    onError: jest.fn(),
    onConnectionStateChange: jest.fn(),
  };

  beforeEach(() => {
    manager = new GuidanceWebSocketManager(
      'exp-123',
      'proto-456',
      'token-xyz',
      callbacks,
      'ws://localhost:3000',
    );
  });

  test('should connect to WebSocket', async () => {
    await manager.connect();
    expect(manager.getIsConnected()).toBe(true);
    expect(callbacks.onConnectionStateChange).toHaveBeenCalledWith(true);
  });

  test('should send frame data', async () => {
    await manager.connect();
    const frameBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB...';
    
    manager.sendFrame(frameBase64);
    
    // Verify message was queued/sent
    expect(manager.getIsConnected()).toBe(true);
  });

  test('should handle reconnection on disconnect', async () => {
    await manager.connect();
    
    // Simulate disconnect
    MockWebSocket.instances[0]?.close();
    
    // Should attempt to reconnect
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(callbacks.onConnectionStateChange).toHaveBeenCalledWith(false);
  });
});
```

### 3. Debug Logging

```typescript
// services/DebugLogger.ts
export class DebugLogger {
  private logs: string[] = [];
  private maxLogs: number = 1000;

  log(module: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] [${module}] ${message}`;
    
    this.logs.push(entry);
    
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    if (__DEV__) {
      console.log(entry, data || '');
    }
  }

  exportLogs(): string {
    return this.logs.join('\n');
  }

  clearLogs() {
    this.logs = [];
  }
}

// Usage
const logger = new DebugLogger();
logger.log('WebSocket', 'Frame sent', { size: frameBase64.length });
```

---

## API Reference

### WebSocket Connection

```
GET ws://host/api/experiments/{experimentId}/guidance?protocolId={protocolId}

Headers:
  Authorization: Bearer {JWT_TOKEN}

Query Parameters:
  - experimentId: string (required) - Experiment ID
  - protocolId: string (required) - Protocol ID to provide context
```

### Message Types

**Client→Server:**

| Type | Fields | Description |
|------|--------|-------------|
| `start_guidance` | `experimentId`, `protocolId`, `systemContext?` | Initialize guidance session |
| `send_frame` | `frameData`, `mimeType?` | Send video frame for analysis |
| `send_audio` | `audioData` | Send audio chunk |
| `interrupt` | — | Stop current AI response |
| `end_session` | — | Close guidance session |
| `heartbeat` | `timestamp` | Keep-alive signal |

**Server→Client:**

| Type | Fields | Description |
|------|--------|-------------|
| `session_started` | `streamId`, `sessionActive` | Session initialized |
| `text_delta` | `content` | Text chunk from AI |
| `audio_chunk` | `content` (base64) | Audio response from AI |
| `session_ended` | — | Session closed |
| `error` | `error` | Error message |
| `ack` | — | Message acknowledged |

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "WebSocket closed" | Connection timeout | Check network, increase heartbeat interval |
| Frames not being captured | Camera permission denied | Request permission explicitly |
| Audio not recording | Microphone permission missing | Add audio permission in app.json |
| High latency | Many frames per second | Reduce FPS or frame quality |
| Memory leak | Unclosed connections | Always call `disconnect()` on screen unmount |

### Debug Mode

Enable detailed logging:

```typescript
// In app entry point
if (__DEV__) {
  // Enable verbose WebSocket logging
  global.__DEV_LOG__ = true;
  
  // Log all guidance updates
  callbacks.onTextDelta = (text) => {
    console.log('[GUIDANCE]', text.substring(0, 100));
  };
}
```

---

## Best Practices

1. **Always clean up on unmount** - Call `disconnect()` when leaving guidance screen
2. **Handle permissions early** - Request camera/audio permissions during onboarding
3. **Monitor connection state** - Show user indicators for connection quality
4. **Implement retry logic** - Use exponential backoff for reconnection
5. **Optimize frame rate** - Reduce FPS on slow connections
6. **Cache protocol context** - Store frequently used protocol info locally
7. **Log errors** - Keep debug logs for troubleshooting
8. **Test with real devices** - Simulator may have different behavior

---

## Example Integration in Navigation

```typescript
// Define navigation type
type ExperimentStackParamList = {
  ReadyScreen: undefined;
  GuidanceScreen: {
    experimentId: string;
    protocolId: string;
    protocolTitle: string;
    protocolDescription: string;
  };
  ResultsScreen: {
    experimentId: string;
    success: boolean;
  };
};

// Navigate to guidance
navigation.navigate('GuidanceScreen', {
  experimentId: 'exp-123',
  protocolId: 'proto-456',
  protocolTitle: 'Protein Gel Electrophoresis',
  protocolDescription: 'Separate proteins by size...',
});
```

---

## Summary

This implementation provides:

✅ **Real-time WebSocket** connection with automatic reconnection  
✅ **Live camera** frame capture and encoding  
✅ **Audio recording** for voice-enabled guidance  
✅ **Streaming responses** from Nova AI  
✅ **Error handling** with graceful degradation  
✅ **Performance optimization** for mobile constraints  
✅ **TypeScript types** for type safety  
✅ **Testing utilities** for reliability  

The architecture maintains clean separation between WebSocket, camera, audio, and AI logic, allowing easy maintenance and testing.
