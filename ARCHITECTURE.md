# Translation Call App - System Architecture

## Overview
A real-time audio call application with live translation capabilities, built with React Native (frontend) and integrated with Agora RTC SDK and WebSocket communication.

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REACT NATIVE CLIENT APP                           │
│                              (Frontend - iOS/Android)                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │
         ┌─────────────────────────────┴───────────────────────────────┐
         │                                                             │
         ▼                                                             ▼
┌──────────────────────┐                                    ┌──────────────────┐
│   JoinScreen.tsx     │                                    │  CallScreen.tsx  │
│  (Entry Point)       │                                    │  (Main Call UI)  │
├──────────────────────┤                                    ├──────────────────┤
│ - Channel Input      │                                    │ - Audio Controls │
│ - Language Select    │                                    │ - Mute/Speaker   │
│ - Join Button        │  ┌───────────────────────────┐     │ - Translation    │
│                      │  │  React Navigation         │     │ - User List      │
│                      │  │  (Stack Navigator)        │     │                  │
│                      │  └───────────────────────────┘     │                  │
│  1. User Enters      │                                    │  1. Joins Agora  │
│     Channel Name     │                                    │     Channel      │
│                      │                                    │  2. Connects     │
│  2. Fetches Token    │                                    │     Socket.IO    │
│     from Backend     │                                    │  3. Listens to   │
│                      │                                    │     Translation  │
│  3. Navigates to     │                                    │     Events       │
│     CallScreen       │                                    │  4. Manages      │
│                      │                                    │     Audio Streams│
└──────────────────────┘                                    └──────────────────┘
        │                                                             │
        │                                                             │
        │ HTTP GET                    HTTP POST                       │
        │ /api/token                  Socket.IO                       │
        │                                                             │
        └──────────────────────────────┼──────────────────────────────┘
                                       │
                                       │
                                       ▼
                        ┌──────────────────────────────┐
                        │   BACKEND SERVER             │
                        │   (Node.js/Python)           │
                        ├──────────────────────────────┤
                        │                              │
                        │   ┌──────────────────────┐   │
                        │   │  Token Service       │   │
                        │   │  - Generates Agora   │   │
                        │   │    RTC Tokens        │   │
                        │   │  - Channel/UID       │   │
                        │   │    Management        │   │
                        │   └──────────────────────┘   │
                        │                              │
                        │   ┌───────────────────────┐  │
                        │   │  Socket.IO Server     │  │
                        │   │  - join_channel       │  │
                        │   │  - start_translation  │  │
                        │   │  - stop_translation   │  │
                        │   │  - translation_started│  │
                        │   │  - translation_stopped│  │
                        │   └───────────────────────┘  │
                        │                              │
                        │   ┌───────────────────────┐  │
                        │   │  Translation Service  │  │
                        │   │  (Palabra AI)         │  │
                        │   │  - Creates translation│  │
                        │   │    channel            │  │
                        │   │  - Manages real-time  │  │
                        │   │    audio translation  │  │
                        │   └───────────────────────┘  │
                        │                              │
                        └──────────┬───────────────────┘
                                   │
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
        ┌──────────────────────┐    ┌──────────────────────┐
        │   AGORA RTC SDK      │    │   TRANSLATION API    │
        │   (Cloud Service)    │    │   (Palabra AI)       │
        ├──────────────────────┤    ├──────────────────────┤
        │ - Real-time Audio    │    │ - Speech-to-Text     │
        │ - Channel Management │    │ - Translation        │
        │ - Token Validation   │    │ - Text-to-Speech     │
        │ - User Management    │    │ - Real-time Streaming│
        └──────────────────────┘    └──────────────────────┘
```

## Configuration

- **Agora App ID**: `d16f5f8c92514f8c9816c41f96a4340c`
- **Server Host**: `https://untreated-nonvisional-neriah.ngrok-free.dev`
- **Token Endpoint**: `/api/token`
- **Supported Languages**: English (en), Spanish (es), French (fr), Urdu (ur), Arabic (ar), Hindi (hi)

## Sequence Diagrams

### 1. Joining a Call

```
┌─────────────┐    ┌──────────────┐    ┌───────────┐    ┌──────────────┐
│JoinScreen   │    │Backend Server│    │Agora RTC  │    │CallScreen    │
│             │    │              │    │Platform   │    │              │
└──────┬──────┘    └──────┬───────┘    └─────┬─────┘    └──────┬───────┘
       │                  │                  │                  │
       │ 1. Enter Channel │                  │                  │
       │    Name          │                  │                  │
       │                  │                  │                  │
       │ 2. HTTP GET      │                  │                  │
       │    /api/token?   │                  │                  │
       │    channel=xxx   │                  │                  │
       ├─────────────────>│                  │                  │
       │                  │                  │                  │
       │                  │ 3. Generate Token│                  │
       │                  ├─────────────────>│                  │
       │                  │                  │                  │
       │                  │ 4. Token + UID   │                  │
       │                  │<─────────────────┤                  │
       │                  │                  │                  │
       │ 5. Return Token  │                  │                  │
       │    Data          │                  │                  │
       │<─────────────────┤                  │                  │
       │                  │                  │                  │
       │ 6. Navigate to   │                  │                  │
       │    CallScreen    │                  │                  │
       ├───────────────────────────────────────────────────────>│
       │                  │                  │                  │
       │                  │                  │  7. Initialize  │
       │                  │                  │     Agora Engine│
       │                  │                  │<─────────────────┤
       │                  │                  │                  │
       │                  │                  │  8. Join Channel│
       │                  │                  │     with Token  │
       │                  │                  │<─────────────────┤
       │                  │                  │                  │
       │                  │                  │  9. Success     │
       │                  │                  │─────────────────>│
       │                  │                  │                  │
       │                  │                  │ 10. Socket.IO   │
       │                  │                  │     Connect     │
       │                  ├────────────────────────────────────>│
       │                  │                  │                  │
       │                  │ 11. Emit         │                  │
       │                  │     join_channel │                  │
       │                  │<────────────────────────────────────┤
       │                  │                  │                  │
       │                  │ 12. User Joined  │                  │
       │                  │     Notification │                  │
       │                  ├────────────────────────────────────>│
       │                  │                  │                  │
```

### 2. Starting Translation Flow

```
┌─────────────┐  ┌──────────────┐  ┌───────────┐  ┌──────────────┐  ┌──────────────┐
│  User A     │  │   Backend    │  │   Agora   │  │  Palabra AI  │  │  User B      │
│ (Speaker)   │  │   Server     │  │   RTC     │  │              │  │ (Listener)   │
└──────┬──────┘  └──────┬───────┘  └─────┬─────┘  └──────┬───────┘  └──────┬───────┘
       │                │                 │              │                 │
       │ 1. Click       │                 │              │                 │
       │    "Start      │                 │              │                 │
       │    Translation"│                 │              │                 │
       │                │                 │              │                 │
       │ 2. Select      │                 │              │                 │
       │    Languages   │                 │              │                 │
       │    (en -> ur)  │                 │              │                 │
       │                │                 │              │                 │
       │ 3. Emit        │                 │              │                 │
       │    start_trans-│                 │              │                 │
       │    lation      │                 │              │                 │
       ├───────────────>│                 │              │                 │
       │                │                 │              │                 │
       │                │ 4. Create       │              │                 │
       │                │    Translation  │              │                 │
       │                │    Task         │              │                 │
       │                ├───────────────────────────────>│                 │
       │                │                 │              │                 │
       │                │                 │              │ 5. Start Real-  │
       │                │                 │              │    time Trans.  │
       │                │                 │              │    (Voice)      │
       │                │                 │              │                 │
       │                │ 6. Return Task  │              │                 │
       │                │    Details      │              │                 │
       │                │<───────────────────────────────────────────────┤
       │                │                 │              │                 │
       │                │ 7. Broadcast    │              │                 │
       │                │    translation_ │              │                 │
       │                │    started      │              │                 │
       │                ├───────────────────────────────>│                 │
       │                │                 │              │                 │
       │ 8. Receive     │                 │              │                 │
       │    Event       │                 │              │                 │
       │<───────────────┤                 │              │                 │
       │                │                 │              │                 │
       │ 9. Mute        │                 │              │                 │
       │    Translated  │                 │              │                 │
       │    Stream      │                 │              │                 │
       │    (UID: 400)  │                 │              │                 │
       │                │                 │              │                 │
       │ 10. Continue   │                 │              │                 │
       │     Sending    │                 │              │                 │
       │     Original   │                 │              │                 │
       │                │                 │              │                 │
       │                │                 │              │                 │
       │                │                 │              │                 │
       │ 11. Receive    │                 │              │                 │
       │     Event      │                 │              │                 │
       │                ├────────────────────────────────────────────────>│
       │                │                 │              │                 │
       │                │                 │              │  12. Mute       │
       │                │                 │              │      Original   │
       │                │                 │              │      (UID: 100) │
       │                │                 │              │                 │
       │                │                 │              │  13. Unmute     │
       │                │                 │              │      Translated │
       │                │                 │              │      (UID: 400) │
       │                │                 │              │                 │
       │                │                 │              │  14. Listen     │
       │                │                 │              │      Translation│
       │                │                 │              │                 │
```

### 3. Audio Stream Management During Translation

```
┌──────────────┐                ┌──────────────┐                ┌──────────────┐
│  User A      │                │  Agora RTC   │                │  User B      │
│ (Speaker)    │                │  Channel     │                │ (Listener)   │
│ UID: 100     │                │              │                │ UID: 200     │
└──────┬───────┘                └──────┬───────┘                └──────┬───────┘
       │                               │                               │
       │  Sends: English Audio         │                               │
       ├──────────────────────────────>│                               │
       │                               │                               │
       │                               │                               │  Receives:
       │                               │                               │  ORIGINAL
       │                               │                               │  AUDIO
       │                               ├──────────────────────────────>│
       │                               │                               │
       │                               │ [TRANSLATION STARTS]          │
       │                               │                               │
       │                               │                               │
       │                               │                               │
       │                               │  ┌─────────────────────┐     │
       │                               │  │ Translator Bot      │     │
       │                               │  │ UID: 400            │     │
       │                               │  │ Translates EN->UR   │     │
       │                               │  └─────────────────────┘     │
       │                               │                               │
       │  Instruction:                 │                               │
       │  Mute UID 400                 │                               │
       │  (prevent echo)               │                               │
       │                               │                               │
       │                               │                               │  Instruction:
       │                               │                               │  Mute UID 100
       │                               │                               │  Unmute UID 400
       │                               │                               │
       │                               │                               │
       │  Sends: English Audio         │                               │
       ├──────────────────────────────>│                               │
       │                               │                               │
       │                               │  Translator receives          │
       │                               │  and translates               │
       │                               │                               │
       │                               │                               │  Receives:
       │                               │                               │  TRANSLATED
       │                               │                               │  AUDIO (Urdu)
       │                               ├──────────────────────────────>│
       │                               │                               │
       │  Receives: Nothing (muted)    │                               │
       │                               │                               │
```

### 4. Token Renewal Flow

```
┌─────────────┐    ┌──────────────┐    ┌───────────┐
│CallScreen   │    │Backend Server│    │Agora RTC  │
│             │    │              │    │Platform   │
└──────┬──────┘    └──────┬───────┘    └─────┬─────┘
       │                  │                  │
       │ Token valid for  │                  │
       │ 3600 seconds     │                  │
       │                  │                  │
       │ [Wait for 30 sec │                  │
       │  before expiry]  │                  │
       │                  │                  │
       │ 2 minutes: 30s   │                  │
       │ remaining        │                  │
       │                  │                  │
       │ 1. HTTP GET      │                  │
       │    /api/token    │                  │
       ├─────────────────>│                  │
       │                  │                  │
       │                  │ 2. Generate      │
       │                  │    New Token     │
       │                  ├─────────────────>│
       │                  │                  │
       │                  │ 3. New Token     │
       │                  │<─────────────────┤
       │                  │                  │
       │ 4. Return New    │                  │
       │    Token         │                  │
       │<─────────────────┤                  │
       │                  │                  │
       │ 5. Renew Token   │                  │
       │    on Agora      │                  │
       │    Engine        │                  │
       ├─────────────────────────────────────>│
       │                  │                  │
       │                  │ 6. Token         │
       │                  │    Updated       │
       │                  │<─────────────────┤
       │                  │                  │
```

### 5. Leaving the Call

```
┌─────────────┐    ┌──────────────┐    ┌───────────┐    ┌──────────────┐
│CallScreen   │    │Backend Server│    │Agora RTC  │    │JoinScreen    │
│             │    │              │    │Platform   │    │              │
└──────┬──────┘    └──────┬───────┘    └─────┬─────┘    └──────┬───────┘
       │                  │                  │                  │
       │ 1. Click "Leave" │                  │                  │
       │                  │                  │                  │
       │ 2. Leave Channel │                  │                  │
       ├─────────────────────────────────────>│                  │
       │                  │                  │                  │
       │                  │ 3. User Offline  │                  │
       │                  │     Broadcast    │                  │
       │                  │                  │                  │
       │ 4. Release       │                  │                  │
       │    Engine        │                  │                  │
       ├─────────────────────────────────────>│                  │
       │                  │                  │                  │
       │ 5. Disconnect    │                  │                  │
       │    Socket.IO     │                  │                  │
       ├──────────────────>│                  │                  │
       │                  │                  │                  │
       │ 6. Navigate Back │                  │                  │
       │                  │                  │                  │
       ├───────────────────────────────────────────────────────>│
       │                  │                  │                  │
       │                  │                  │                  │
```
