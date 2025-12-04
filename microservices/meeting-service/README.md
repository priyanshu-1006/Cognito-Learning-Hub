# Meeting Service

WebRTC signaling server for peer-to-peer video meetings with direct media streaming.

## Architecture

### Key Design Principles

1. **Direct P2P Media Streaming**: Backend only handles signaling (offers, answers, ICE candidates). All audio/video streams go directly between peers.
2. **STUN/TURN for NAT Traversal**: Uses STUN servers for public IP discovery and TURN servers as fallback for strict NATs.
3. **Mesh Topology**: Each peer connects directly to all other peers (optimal for <5 participants).
4. **Redis State Management**: Participant state stored in Redis for horizontal scaling.
5. **Socket.IO for Signaling**: WebSocket-based signaling with automatic reconnection.

### Why This Architecture?

From BACKEND_OPTIMIZATION_ANALYSIS.md:
- **Problem**: Original implementation routed all WebRTC packets through backend, causing poor video quality and server bandwidth waste
- **Solution**: STUN/TURN servers enable direct P2P connections, removing backend from media path
- **Expected Impact**: 4-8x faster joins, 50+ participants per room, 90% bandwidth reduction

## Features

- ✅ WebRTC P2P signaling (offer/answer/ICE)
- ✅ STUN/TURN server configuration
- ✅ Redis-based participant tracking
- ✅ Real-time media controls (audio/video/screen share)
- ✅ Meeting CRUD operations
- ✅ Participant management
- ✅ Meeting analytics
- ✅ Chat functionality
- ✅ Horizontal scaling support

## Installation

```bash
npm install
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Server
PORT=3005
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/cognito_meetings

# Redis (for participant state)
REDIS_URL=redis://localhost:6379
REDIS_KEY_PREFIX=meeting:

# STUN Servers (for NAT traversal)
STUN_SERVERS=stun.l.google.com:19302,stun1.l.google.com:19302

# TURN Server (fallback for strict NATs)
# Get from services like Twilio, Xirsys, or self-hosted coturn
TURN_SERVER=turn.example.com:3478
TURN_USERNAME=your_username
TURN_PASSWORD=your_password

# Meeting Settings
MEETING_TTL=14400  # 4 hours in seconds
MAX_PARTICIPANTS=50

# Socket.IO
SOCKET_PING_TIMEOUT=30000  # 30 seconds

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

## API Endpoints

### Create Meeting

```http
POST /api/meetings/create
Content-Type: application/json

{
  "title": "Team Standup",
  "description": "Daily standup meeting",
  "hostId": "user123",
  "hostName": "John Doe",
  "scheduledAt": "2024-01-20T10:00:00Z",  # Optional
  "settings": {
    "maxParticipants": 50,
    "isRecordingEnabled": false,
    "isChatEnabled": true,
    "isScreenShareEnabled": true,
    "requireApproval": false,
    "allowedDomains": ["example.com"]  # Optional
  }
}
```

Response:
```json
{
  "success": true,
  "meeting": {
    "roomId": "abc123xyz",
    "title": "Team Standup",
    "hostId": "user123",
    "status": "waiting",
    "createdAt": "2024-01-20T09:00:00Z"
  }
}
```

### Get Meeting

```http
GET /api/meetings/:roomId
```

### Get Participants

```http
GET /api/meetings/:roomId/participants
```

### Update Meeting

```http
PUT /api/meetings/:roomId
Content-Type: application/json

{
  "title": "Updated Title",
  "settings": {
    "maxParticipants": 100
  }
}
```

### End Meeting

```http
POST /api/meetings/:roomId/end
Content-Type: application/json

{
  "hostId": "user123"
}
```

### Get Meeting Stats

```http
GET /api/meetings/:roomId/stats
```

### Get User Meetings

```http
GET /api/meetings/user/:userId?status=active&limit=20&skip=0
```

## Socket.IO Events

### Client → Server

#### Join Meeting
```javascript
socket.emit('join-meeting', {
  roomId: 'abc123',
  userId: 'user123',
  userName: 'John Doe',
  userPicture: 'https://...',
  isVideoEnabled: true,
  isAudioEnabled: true
});
```

#### WebRTC Offer
```javascript
socket.emit('webrtc-offer', {
  roomId: 'abc123',
  targetUserId: 'user456',
  offer: { type: 'offer', sdp: '...' }
});
```

#### WebRTC Answer
```javascript
socket.emit('webrtc-answer', {
  roomId: 'abc123',
  targetUserId: 'user123',
  answer: { type: 'answer', sdp: '...' }
});
```

#### ICE Candidate
```javascript
socket.emit('ice-candidate', {
  roomId: 'abc123',
  targetUserId: 'user456',
  candidate: { candidate: '...', sdpMLineIndex: 0 }
});
```

#### Toggle Audio
```javascript
socket.emit('toggle-audio', {
  roomId: 'abc123',
  isEnabled: false
});
```

#### Toggle Video
```javascript
socket.emit('toggle-video', {
  roomId: 'abc123',
  isEnabled: false
});
```

#### Toggle Screen Share
```javascript
socket.emit('toggle-screen-share', {
  roomId: 'abc123',
  isSharing: true
});
```

#### Chat Message
```javascript
socket.emit('meeting-chat-message', {
  roomId: 'abc123',
  message: 'Hello everyone!'
});
```

#### Leave Meeting
```javascript
socket.emit('leave-meeting', {
  roomId: 'abc123'
});
```

### Server → Client

#### ICE Servers (on join)
```javascript
socket.on('ice-servers', (data) => {
  // data.iceServers = [{ urls: 'stun:...' }, { urls: 'turn:...', username, credential }]
});
```

#### Existing Participants
```javascript
socket.on('existing-participants', (data) => {
  // data.participants = [{ userId, userName, peerId, isAudioEnabled, isVideoEnabled }]
});
```

#### Joined Meeting (confirmation)
```javascript
socket.on('joined-meeting', (data) => {
  // data = { roomId, userId, peerId, meeting: { title, hostId, settings } }
});
```

#### Participant Joined
```javascript
socket.on('participant-joined', (data) => {
  // data = { userId, userName, peerId, isAudioEnabled, isVideoEnabled }
});
```

#### WebRTC Offer (from peer)
```javascript
socket.on('webrtc-offer', (data) => {
  // data = { fromUserId, fromPeerId, offer }
});
```

#### WebRTC Answer (from peer)
```javascript
socket.on('webrtc-answer', (data) => {
  // data = { fromUserId, fromPeerId, answer }
});
```

#### ICE Candidate (from peer)
```javascript
socket.on('ice-candidate', (data) => {
  // data = { fromUserId, fromPeerId, candidate }
});
```

#### Participant Audio Changed
```javascript
socket.on('participant-audio-changed', (data) => {
  // data = { userId, isAudioEnabled }
});
```

#### Participant Video Changed
```javascript
socket.on('participant-video-changed', (data) => {
  // data = { userId, isVideoEnabled }
});
```

#### Participant Screen Share Changed
```javascript
socket.on('participant-screen-share-changed', (data) => {
  // data = { userId, isScreenSharing }
});
```

#### Chat Message
```javascript
socket.on('meeting-chat-message', (data) => {
  // data = { userId, userName, message, timestamp }
});
```

#### Participant Left
```javascript
socket.on('participant-left', (data) => {
  // data = { userId }
});
```

#### Meeting Error
```javascript
socket.on('meeting-error', (data) => {
  // data = { error: 'Meeting not found' }
});
```

## Client Implementation Example

```javascript
// 1. Connect to signaling server
const socket = io('http://localhost:3005');

// 2. Join meeting
socket.emit('join-meeting', {
  roomId: 'abc123',
  userId: 'user123',
  userName: 'John Doe',
  isVideoEnabled: true,
  isAudioEnabled: true
});

// 3. Receive ICE servers
socket.on('ice-servers', ({ iceServers }) => {
  // Store ICE servers for WebRTC configuration
  this.iceServers = iceServers;
});

// 4. Receive existing participants
socket.on('existing-participants', ({ participants }) => {
  // Create peer connections for each existing participant
  participants.forEach(participant => {
    createPeerConnection(participant.userId, true); // initiator
  });
});

// 5. Handle new participant joined
socket.on('participant-joined', (participant) => {
  createPeerConnection(participant.userId, false); // not initiator
});

// 6. Create peer connection
function createPeerConnection(userId, isInitiator) {
  const pc = new RTCPeerConnection({ iceServers: this.iceServers });
  
  // Add local stream
  localStream.getTracks().forEach(track => {
    pc.addTrack(track, localStream);
  });
  
  // Handle remote stream
  pc.ontrack = (event) => {
    // Display remote stream in video element
    remoteVideoElement.srcObject = event.streams[0];
  };
  
  // Handle ICE candidates
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('ice-candidate', {
        roomId: 'abc123',
        targetUserId: userId,
        candidate: event.candidate
      });
    }
  };
  
  // If initiator, create offer
  if (isInitiator) {
    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .then(() => {
        socket.emit('webrtc-offer', {
          roomId: 'abc123',
          targetUserId: userId,
          offer: pc.localDescription
        });
      });
  }
  
  return pc;
}

// 7. Handle incoming WebRTC offer
socket.on('webrtc-offer', async ({ fromUserId, offer }) => {
  const pc = peerConnections[fromUserId];
  await pc.setRemoteDescription(new RTCSessionDescription(offer));
  
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  
  socket.emit('webrtc-answer', {
    roomId: 'abc123',
    targetUserId: fromUserId,
    answer: pc.localDescription
  });
});

// 8. Handle incoming WebRTC answer
socket.on('webrtc-answer', async ({ fromUserId, answer }) => {
  const pc = peerConnections[fromUserId];
  await pc.setRemoteDescription(new RTCSessionDescription(answer));
});

// 9. Handle incoming ICE candidate
socket.on('ice-candidate', async ({ fromUserId, candidate }) => {
  const pc = peerConnections[fromUserId];
  await pc.addIceCandidate(new RTCIceCandidate(candidate));
});
```

## STUN/TURN Server Setup

### Free STUN Servers

Already configured in `.env.example`:
- `stun.l.google.com:19302` (Google)
- `stun1.l.google.com:19302` (Google)

### TURN Server Options

#### 1. Self-Hosted (coturn)

```bash
# Install coturn
sudo apt-get install coturn

# Edit /etc/turnserver.conf
listening-port=3478
fingerprint
lt-cred-mech
use-auth-secret
static-auth-secret=your_secret_key
realm=yourdomain.com

# Start service
sudo systemctl start coturn
```

#### 2. Twilio (Commercial)

```javascript
// Get ICE servers from Twilio
const accountSid = 'your_account_sid';
const authToken = 'your_auth_token';
const client = require('twilio')(accountSid, authToken);

client.tokens.create()
  .then(token => {
    const iceServers = token.iceServers;
  });
```

#### 3. Xirsys (Commercial)

```javascript
// Get ICE servers from Xirsys API
fetch('https://global.xirsys.net/_turn/your-channel', {
  method: 'PUT',
  headers: {
    'Authorization': 'Basic ' + btoa('username:secret'),
    'Content-Type': 'application/json'
  }
})
  .then(res => res.json())
  .then(data => {
    const iceServers = data.v.iceServers;
  });
```

## Performance Optimizations

### 1. Direct P2P Media

- ✅ Backend only relays signaling (offers, answers, ICE)
- ✅ All media streams go directly between peers
- ✅ 90% reduction in server bandwidth usage

### 2. Redis State Management

- ✅ Participant state in Redis (not in-memory)
- ✅ Atomic operations (HSET, HDEL)
- ✅ Horizontal scaling support

### 3. Efficient Participant Tracking

- ✅ Redis Hash for participant details (O(1) lookup)
- ✅ Socket-to-room mapping for disconnect cleanup
- ✅ No N database queries on join

### 4. Quality Adaptation

- ✅ Simulcast support (multiple quality layers)
- ✅ Client can request quality level
- ✅ Adaptive bitrate based on network

### 5. Connection Management

- ✅ ICE connection state monitoring
- ✅ Automatic reconnection
- ✅ Graceful degradation (TURN fallback)

## Scaling

### Horizontal Scaling

This service can be horizontally scaled with Redis pub/sub:

1. **Multiple instances**: Run multiple Meeting Service instances behind a load balancer
2. **Socket.IO sticky sessions**: Use `socket.io-redis` for multi-server Socket.IO
3. **Redis pub/sub**: Signaling messages are published to Redis channels

```javascript
// Enable Redis adapter for Socket.IO
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

### Load Balancing

```nginx
upstream meeting_service {
    ip_hash;  # Sticky sessions for Socket.IO
    server meeting-1:3005;
    server meeting-2:3005;
    server meeting-3:3005;
}

server {
    location / {
        proxy_pass http://meeting_service;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Monitoring

### Key Metrics

1. **Active meetings**: Number of meetings in progress
2. **Total participants**: Participants across all meetings
3. **Connection success rate**: % of successful peer connections
4. **TURN usage**: % of connections requiring TURN fallback
5. **Average meeting duration**: Meeting analytics

### Logging

Logs are structured and include:
- Meeting lifecycle events (created, started, ended)
- Participant events (joined, left, disconnected)
- WebRTC signaling events (offer, answer, ICE)
- Errors and warnings

## Security

- ✅ Rate limiting on HTTP endpoints
- ✅ CORS configuration
- ✅ Helmet.js security headers
- ✅ Host verification for meeting operations
- ✅ Domain whitelisting (optional)
- ✅ Require approval mode (optional)

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## Deployment

```bash
# Build (if using TypeScript)
npm run build

# Start production
npm start

# Using PM2
pm2 start index.js --name meeting-service -i max
```

## Troubleshooting

### Participants can't connect

1. **Check STUN/TURN configuration**: Verify `.env` has valid STUN servers
2. **Test TURN server**: Use https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
3. **Check firewall**: Ensure UDP ports are open for WebRTC
4. **Network restrictions**: Some corporate networks block WebRTC

### Poor video quality

1. **Check bandwidth**: Use `getStats()` API to monitor bitrate
2. **Enable simulcast**: Multiple quality layers for adaptation
3. **Reduce participant count**: Mesh topology optimal for <5 participants
4. **Upgrade to SFU**: For larger meetings, consider SFU architecture

### Redis connection issues

1. **Check Redis URL**: Verify `REDIS_URL` is correct
2. **Test connection**: `redis-cli -h host -p port ping`
3. **Check Redis logs**: Look for connection errors
4. **Increase timeout**: Adjust `connectTimeout` in Redis options

## License

MIT

## Support

For issues or questions, open an issue on GitHub or contact the development team.
