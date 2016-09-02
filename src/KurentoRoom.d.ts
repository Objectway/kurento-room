/**
 * Event sent by server to all other participants in the room as a result of a new user joining in.
 */
interface INotificationParticipantJoined {
    /**
     * The new participant’s id (username)
     */
    id: string;
}

/**
 * Event sent by server to all other participants in the room as a consequence of an user leaving the room.
 */
interface INotificationParticipantLeft {
    /**
     * username of the participant that has disconnected
     */
    name: string;
}

/**
 * Event sent by server to a participant in the room as a consequence of a server-side action requiring the participant to leave the room.
 */
interface INotificationParticipantEvicted {

}

/**
 * Event sent by server to all other participants in the room as a result of a user publishing her local media stream.
 */
interface INotificationParticipantPublished {

    /**
     * publisher’s username
     */
    id: string;

    /**
     * list of stream identifiers that the participant has opened to connect with the room.
     */
    streams: Array<INotificationParticipantPublishedUserStream>;
}

interface INotificationParticipantPublishedUserStream {
    /**
     * Stream identifier
     */
    id: string;

    /**
     * Stream type (EXTENSION TO THE PROTOCOL)
     */
    streamType: string;
}

/**
 * Server event that carries info about an ICE candidate gathered on the server side. This information is required to implement the trickle ICE mechanism.
 * Will be received by the client whenever a new candidate is gathered for the local peer on the server.
 */
interface INotificationReceiveICECandidate {
    /**
     * the name of the peer whose ICE candidate was found
     */
    endpointName: string;

    /**
     * streamId of the peer whose ICE candidate was found
     */
    streamId: string;

    /**
     * the candidate attribute information
     */
    candidate: string;

    /**
     * the index (starting at zero) of the m-line in the SDP this candidate is associated with
     */
    sdpMLineIndex: number;

    /**
     * media stream identification, “audio” or “video”, for the m-line this candidate is associated with
     */
    sdpMid: number;
}

/**
 * Event sent by server to all other participants in the room as a result of a user having stopped publishing her local media stream.
 */
interface INotificationParticipantUnpublished {
    /**
     * publisher’s username
     */
    name: string;

    /**
     * streamId of the peer whose ICE candidate was found
     */
    streamId: string;
}

/**
 * Broadcast event that propagates a written message to all room participants.
 */
interface INotificationMessageReceived {
    /**
     * current room name
     */
    room: string;

    /**
     * username of the text message source
     */
    name: string;

    /**
     * the text message
     */
    message: string;
}

/**
 * Event sent by server to all participants affected by an error event intercepted on a media pipeline or media element.
 */
interface INotificationMediaError {
    /**
     * description of the error
     */
    error: string;
}

interface KASConnection_Static {
    new(kasUri: string): KASConnection_Instance;
}

interface KASConnection_Instance {
    kasUri: string;
    heartbeatRate: number;
    requestTimeout: number;
    rpcParams: Object;
    state: string;
    jsonRpcClient: any;
    onStatusChangedCallback: Function;
    onNotificationParticipantJoinedCallback: (params: INotificationParticipantJoined) => any;
    onNotificationParticipantLeftCallback: (params: INotificationParticipantLeft) => any;
    onNotificationParticipantEvictedCallback: (params: INotificationParticipantEvicted) => any;
    onNotificationParticipantPublishedCallback: (params: INotificationParticipantPublished) => any;
    onNotificationReceiveICECandidateCallback: (params: INotificationReceiveICECandidate) => any;
    onNotificationParticipantUnpublishedCallback: (params: INotificationParticipantUnpublished) => any;
    onNotificationMessageReceivedCallback: (params: INotificationMessageReceived) => any;
    onNotificationMediaErrorCallback: (params: INotificationMediaError) => any;

    connect: () => void;
    disconnect: () => void;
    sendRequest: (method: string, params: Object, callback: (error: any, response: Object) => any) => void;
    connectCallback: (error: Object) => void;
    disconnectCallback: () => void;
    reconnectingCallback: () => void;
    reconnectedCallback: () => void;
    onParticipantJoined: (params: INotificationParticipantJoined) => void;
    onParticipantLeft: (params: INotificationParticipantLeft) => void;
    onParticipantEvicted: (params: INotificationParticipantEvicted) => void;
    onParticipantPublished: (params: INotificationParticipantPublished) => void;
    onParticipantUnpublished: (params: INotificationParticipantUnpublished) => void;
    onICECandidate: (params: INotificationReceiveICECandidate) => void;
    onMessageReceived: (params: INotificationMessageReceived) => void;
    onMediaError: (params: INotificationMediaError) => void;

    getState: () => string;
    setHeartbeatRate: (heartbeatRate: number) => void;
    setRequestTimeout: (requestTimeout: number) => void;
    setOnStatusChangedCallback: (onStatusChangedCallback: Function) => void;
    setOnParticipantJoinedCallback: (onNotificationParticipantJoinedCallback: (params: INotificationParticipantJoined) => any) => void;
    setOnParticipantLeftCallback: (onNotificationParticipantLeftCallback: (params: INotificationParticipantLeft) => any) => void;
    setOnParticipantEvictedCallback: (onNotificationParticipantEvictedCallback: (params: INotificationParticipantEvicted) => any) => void;
    setOnParticipantPublishedCallback: (onNotificationParticipantPublishedCallback: (params: INotificationParticipantPublished) => any) => void;
    setOnReceiveICECandidateCallback: (onNotificationReceiveICECandidateCallback: (params: INotificationReceiveICECandidate) => any) => void;
    setOnParticipantUnpublishedCallback: (onNotificationParticipantUnpublishedCallback: (params: INotificationParticipantUnpublished) => any) => void;
    setOnMessageReceivedCallback: (onNotificationMessageReceivedCallback: (params: INotificationMessageReceived) => any) => void;
    setOnMediaErrorCallback: (onNotificationMediaErrorCallback: (params: INotificationMediaError) => any) => void;
    setRpcParams: (rpcParams: Object) => void;
}

declare class KASConnectionConstants_Static {
    get CONNECTION_STATES(): any;
}

interface IStreamConstraints {
    /**
     * When streamType is VIDEO or SCREEN, indicates the preferred video width.
     * @type {any}
     */
    idealVideoWidth?: number;

    /**
     * When streamType is VIDEO or SCREEN, indicates the preferred video height.
     * @type {any}
     */
    idealVideoHeight?: number;

    /**
     * When streamType is VIDEO or SCREEN, indicates the minimum preferred frame rate.
     * @type {any}
     */
    idealFrameRate?: number;
}

interface KASLocalStream_Static {
    new(id: string): KASLocalStream_Instance;
}

interface KASLocalStream_Instance extends KASStream_Instance {
    userMediaConstraints: any;
    requestUserMediaStream: (streamConstraints: IStreamConstraints, thenCallback?: () => any, catchCallback?: (error: any) => any) => void;
    requestAudioVideoUserMediaStream: (streamConstraints: IStreamConstraints, thenCallback?: () => any, catchCallback?: (error: any) => any) => void;
    requestScreenUserMediaStream: (streamConstraints: IStreamConstraints, thenCallback?: () => any, catchCallback?: (error: any) => any) => void;
    requestScreenChromeUserMediaStream: (streamConstraints: IStreamConstraints, thenCallback?: () => any, catchCallback?: (error: any) => any) => void;
    requestScreenFirefoxUserMediaStream: (streamConstraints: IStreamConstraints, thenCallback?: () => any, catchCallback?: (error: any) => any) => void;
    getUserMediaConstraints: () => void;
}

/**
 * ICE protocol options (STUN and TURN server configuration)
 */
interface IICEOptions {
    stunUrl?: string;
    turnUrl?: string;
    turnUsername?: string;
    turnPassword?: string;

    /**
     * If TRUE, only the TURN server will be used (the turn url must be set up, though)
     */
    forceTurn: boolean;
}

/**
 * @class KASWebRtcPeer
 * @description Base class for remote or local webrtc peers
 *
 * @author Danilo Arcidiacono
 */
interface IKASWebRtcPeer {
    /**
     * Returns TRUE if the peer is local
     */
    isLocal(): boolean;

    /**
     * Returns the participant owning the peer
     */
    getParticipant(): KASParticipant_Instance;

    /**
     * Returns the Kurento WebRtc peer object
     */
    getWebRtcPeer(): any;

    /**
     * Returns the stream (could be local or remote) attached to this peer
     */
    getStream(): KASStream_Instance;

    /**
     * Disposes the webrtc peer
     */
    dispose(): void;
}

declare class KASLocalWebRtcPeerConstants_Static {
    get STATES(): any;
}

interface KASLocalWebRtcPeer_Static {
    new(stream: KASLocalStream_Static, serverAPI: KASServerAPI_Static, participant: KASParticipant_Static);
}

interface KASLocalWebRtcPeer_Instance {
    state: string;
    participant: KASParticipant_Instance;
    serverAPI: KASServerAPI_Instance;
    stream: KASLocalStream_Instance;
    remoteLoopbackStream: KASStream_Instance;
    webRtcPeer: any;
    sdpOffer: any;
    sdpAnswer: any;
    iceCandidates: Array<any>;
    iceOptions: IICEOptions;
    onSDPOfferGeneratedCallback: () => any;
    onICECandidateGeneratedCallback: (candidate: any) => any;

    createKurentoPeer: () => void;
    onOfferGenerated: (error: any, sdpOfferParam: any, wp: any) => void;
    onIceCandidate: (candidate: any) => void;
    publish: (thenCallback?: () => any, catchCallback?: (error: any) => any) => void;
    unpublish: (thenCallback?: () => any, catchCallback?: (error: any) => any) => void;
    dispose: () => void;
    internalDispose: () => void;
    isLocal: () => boolean;
    getParticipant: () => KASParticipant_Instance;
    getWebRtcPeer: () => any;
    getStream: () => KASStream_Instance;
    getSDPOffer: () => void;
    getSDPAnswer: () => void;
    getRemoteLoopbackStream: () => KASStream_Instance;
    setICEOptions: (iceOptions: IICEOptions) => void;
    setOnSDPOfferGeneratedCallback: (onSDPOfferGeneratedCallback: () => any) => void;
    setOnICECandidateGeneratedCallback: (onICECandidateGeneratedCallback: (candidate: any) => any) => void;
}

interface KASParticipant_Static {
    new(id: string, serverAPI: KASServerAPI_Instance): KASParticipant_Instance;
}

interface KASParticipant_Instance {
    id: string;
    serverAPI: KASServerAPI_Instance;
    publishedStreams: { [ streamId: string ]: KASLocalWebRtcPeer_Instance };
    subscribedStreams: { [ streamId: string ]: KASRemoteWebRtcPeer_Instance };

    addLocalStream: (id: string, streamType: string, streamConstraints: IStreamConstraints, iceOptions: IICEOptions, thenCallback?: (stream: KASLocalWebRtcPeer_Instance) => any, catchCallback?: (error: any) => any) => void;
    addRemoteStream: (id: string, streamType: string, iceOptions: IICEOptions, thenCallback?: (stream: KASRemoteWebRtcPeer_Instance) => any, catchCallback?: (error: any) => any) => void;
    localPeerDisposed: (streamId: string) => void;
    remotePeerDisposed: (streamId: string) => void;
    dispose: () => void;
    getId: () => string;
    getPublishedPeers: () => { [ streamId: string ]: KASLocalWebRtcPeer_Instance };
    getSubscribedPeers: () => { [ streamId: string ]: KASRemoteWebRtcPeer_Instance };
    getPublishedPeerByStreamId: (streamId: string) => KASLocalWebRtcPeer_Instance;
    getSubscribedPeerByStreamId: (streamId: string) => KASRemoteWebRtcPeer_Instance;
    getPeerByStreamId: (streamId: string) => IKASWebRtcPeer;
}

declare class KASRemoteWebRtcPeerConstants_Static {
    get STATES(): any;
}

interface KASRemoteWebRtcPeer_Static {
    new(stream: KASStream_Instance, serverAPI: KASServerAPI_Instance, participant: KASParticipant_Instance): KASRemoteWebRtcPeer_Instance;
}

interface KASRemoteWebRtcPeer_Instance {
    state: string;
    serverAPI: KASServerAPI_Instance;
    participant: KASParticipant_Instance;
    stream: KASStream_Instance;
    webRtcPeer: any;
    sdpOffer: any;
    sdpAnswer: any;
    iceCandidates: Array<any>;
    iceOptions: IICEOptions;
    onSDPOfferGeneratedCallback: () => any;
    onICECandidateGeneratedCallback: (candidate: any) => any;

    createKurentoPeer: () => void;
    onOfferGenerated: (error: any, sdpOfferParam: any, wp: any) => void;
    onIceCandidate: (candidate: any) => void;
    subscribe: (thenCallback?: () => any, catchCallback?: (error: any) => any) => void;
    unsubscribe: (thenCallback?: () => any, catchCallback?: (error: any) => any) => void;
    dispose: () => void;
    internalDispose: () => void;
    isLocal: () => boolean;
    getParticipant: () => KASParticipant_Instance;
    getWebRtcPeer: () => any;
    getStream: () => KASStream_Instance;
    getSDPOffer: () => void;
    getSDPAnswer: () => void;
    setICEOptions: (iceOptions: IICEOptions) => void;
    setOnSDPOfferGeneratedCallback: (onSDPOfferGeneratedCallback: () => any) => void;
    setOnICECandidateGeneratedCallback: (onICECandidateGeneratedCallback: (candidate: any) => any) => void;
}

interface KASRoom_Static {
    new(id: string, serverAPI: KASServerAPI_Instance): KASRoom_Instance;
}

interface KASRoom_Instance {
    id: string;
    serverAPI: KASServerAPI_Instance;
    participants: { [ participantId: string ]: KASParticipant_Instance };

    addParticipant: (participantId: string) => KASParticipant_Instance;
    removeParticipant: (participantId: string) => KASParticipant_Instance;
    getParticipantById: (participantId: string) => KASParticipant_Instance;
    dispose: () => void;
    getId: () => string;
    getParticipants: () => { [ participantId: string ]: KASParticipant_Instance; };
}

interface KASServer_Static {
    new(connection: KASConnection_Instance): KASServer_Instance;
}

interface KASServer_Instance {
    connection: KASConnection_Instance;
    serverAPI: KASServerAPI_Instance;
    iceOptions: IICEOptions;
    rooms: { [ roomId: string ]: KASRoom_Instance };
    localParticipantId: string;
    onMessageReceivedCallback: (params: INotificationMessageReceived) => any;
    onParticipantLeftCallback: (params: INotificationParticipantLeft) => any;
    onParticipantEvictedCallback: (params: INotificationParticipantEvicted) => any;
    onRemoteStreamSubscribedCallback: (participant: KASParticipant_Instance, peer: KASRemoteWebRtcPeer_Instance, streamType: string) => any;
    onRemoteStreamUnpublishedCallback: (participant: KASParticipant_Instance, streamId: string, peer: KASRemoteWebRtcPeer_Instance) => any;
    joinRoom: (roomId: string, username: string, thenCallback?: (room: KASRoom_Instance, response: IResponseJoinRoom) => any, catchCallback?: (error: Object) => any) => void;
    leaveRoom: (roomId: string, username: string, thenCallback?: () => any, catchCallback?: (error: Object) => any) => void;
    sendMessage: (message: string, username: string, roomId: string, thenCallback?: () => any, catchCallback?: (error: Object) => any) => void;
    sendCustomRequest: (customRequest: Object, thenCallback?: (response: any) => any, catchCallback?: (error: Object) => any) => void;
    dispose: (forced: boolean, thenCallback?: () => any, catchCallback?: (error: Object) => any) => void;
    onParticipantJoined: (params: INotificationParticipantJoined) => void;
    onParticipantLeft: (params: INotificationParticipantLeft) => void;
    onParticipantEvicted: (params: INotificationParticipantEvicted) => void;
    onParticipantPublished: (params: INotificationParticipantPublished) => void;
    onReceiveICECandidate: (params: INotificationReceiveICECandidate) => void;
    onParticipantUnpublished: (params: INotificationParticipantUnpublished) => void;
    onMessageReceived: (params: INotificationMessageReceived) => void;
    onMediaError: (params: INotificationMediaError) => void;
    setIceOptions: (iceOptions: IICEOptions) => void;
    setOnParticipantLeftCallback: (onParticipantLeftCallback: (params: INotificationParticipantLeft) => any) => void;
    setOnParticipantEvictedCallback: (onParticipantEvicted: (params: INotificationParticipantEvicted) => any) => void;
    setOnMessageReceivedCallback: (onMessageReceivedCallback: (params: INotificationMessageReceived) => any) => void;
    setOnRemoteStreamSubscribedCallback: (onRemoteStreamSubscribedCallback: (participant: KASParticipant_Instance, peer: KASRemoteWebRtcPeer_Instance, streamType: string) => any) => void;
    setOnRemoteStreamUnpublishedCallback: (onRemoteStreamUnpublishedCallback: (participant: KASParticipant_Instance, streamId: string, peer: KASRemoteWebRtcPeer_Instance) => any) => void;
    getOnlyRoom: () => KASRoom_Instance;
    getOnlyParticipantId: () => string;
    getOnlyParticipant: () => KASParticipant_Instance;
}

// JoinRoom
interface IRequestJoinRoom {
    user: string;
    room: string;
    dataChannels?: boolean;
}

interface IResponseJoinRoom {

    /**
     * id of the WebSocket session between the browser and the server
     */
    sessionId: string;

    /**
     * list of existing users in this room, empty when the room is a fresh one
     */
    value: Array<IResponseJoinRoomUser>;
}

interface IResponseJoinRoomUser {
    /**
     * an already existing user’s name
     */
    id: string;

    /**
     * List of stream identifiers that the other participant has opened to connect with the room.
     */
    streams: Array<IResponseJoinRoomUserStream>;

    /**
     * Status of the user (EXTENSION OF THE PROTOCOL)
     */
    status: string;
}

interface IResponseJoinRoomUserStream {
    /**
     * Stream identifier
     */
    id: string;
}

// LeaveRoom
interface IRequestLeaveRoom {
}

interface IResponseLeaveRoom {

    /**
     * id of the WebSocket session between the browser and the server
     */
    sessionId: string;
}

/**
 * Represents a client’s request to start streaming her local media to anyone inside the room.
 */
interface IRequestPublishVideo {
    /**
     * SDP offer sent by this client
     */
    sdpOffer: string;

    /**
     * The name of the stream whose ICE candidate was found (EXTENSION TO THE PROTOCOL)
     */
    streamId: string;

    /**
     * The type of the stream (EXTENSION TO THE PROTOCOL)
     * One of KASStreamConstants.STREAM_TYPE values
     */
    streamType: string;

    /**
     * boolean enabling media loopback
     */
    doLoopback: boolean;
}

interface IResponsePublishVideo {

    /**
     * id of the WebSocket session between the browser and the server
     */
    sessionId: string;

    /**
     * SDP answer build by the the user’s server WebRTC endpoint
     */
    sdpAnswer: string;
}

/**
 * Represents a client’s request to stop streaming her local media to her room peers.
 */
interface IRequestUnpublishVideo {
    /**
     * The name of the stream whose ICE candidate was found (EXTENSION TO THE PROTOCOL)
     */
    streamId: string;
}

interface IResponseUnpublishVideo {
    /**
     * id of the WebSocket session
     */
    sessionId: string;

    /**
     * The name of the stream whose ICE candidate was found (EXTENSION TO THE PROTOCOL)
     */
    streamId: string;
}

/**
 * Represents a client’s request to receive media from participants in the room that published their media.
 * This method can also be used for loopback connections.
 */
interface IRequestReceiveVideo {
    /**
     * id of the publisher’s endpoint, build by appending the publisher’s name and her currently opened stream
     */
    sender: string;

    /**
     * The name of the stream whose ICE candidate was found (EXTENSION TO THE PROTOCOL)
     */
    streamId: string;

    /**
     * SDP offer sent by this client
     */
    sdpOffer: string;
}

interface IResponseReceiveVideo {
    /**
     * id of the WebSocket session
     */
    sessionId: string;

    /**
     * SDP answer build by the other participant’s WebRTC endpoint
     */
    sdpAnswer: string;
}

/**
 * Represents a client’s request to stop receiving media from a given publisher.
 */
interface IRequestUnsubscribeFromVideo {
    /**
     * id of the publisher’s endpoint, build by appending the publisher’s name and her currently opened stream (usually webcam)
     */
    sender: string;

    /**
     * The name of the stream whose ICE candidate was found (EXTENSION TO THE PROTOCOL)
     */
    streamId: string;
}

interface IResponseUnsubscribeFromVideo {
    /**
     * id of the WebSocket session
     */
    sessionId: string;
}

/**
 * Request that carries info about an ICE candidate gathered on the client side.
 * This information is required to implement the trickle ICE mechanism.
 * Should be sent whenever an ICECandidate event is created by a RTCPeerConnection.
 */
interface IRequestSendICECandidate {
    /**
     * the name of the peer whose ICE candidate was found
     */
    endpointName: string;

    /**
     * The name of the stream whose ICE candidate was found (EXTENSION TO THE PROTOCOL)
     */
    streamId: string;

    /**
     * the candidate attribute information
     */
    candidate: string;

    /**
     * the index (starting at zero) of the m-line in the SDP this candidate is associated with
     */
    sdpMLineIndex: number;

    /**
     * media stream identification, “audio” or “video”, for the m-line this candidate is associated with
     */
    sdpMid: number;
}

interface IResponseSendICECandidate {
    /**
     * id of the WebSocket session
     */
    sessionId: string;
}

/**
 * Used by clients to send written messages to all other participants in the room.
 */
interface IRequestSendMessage {
    /**
     * the text message
     */
    message: string;

    /**
     * message originator (username)
     */
    userMessage: string;

    /**
     * room identifier (room name)
     */
    roomMessage: string;
}

interface IResponseSendMessage {
    /**
     * id of the WebSocket session
     */
    sessionId: string;
}

interface KASServerAPI_Static {
    new(kasConnection: KASConnection_Instance): KASServerAPI_Instance;
}

interface KASServerAPI_Instance {
    kasConnection: KASConnection_Instance;

    sendJoinRoom: (request: IRequestJoinRoom, thenCallback?: (response: IResponseJoinRoom) => any, catchCallback?: (error: any) => any) => void;
    sendLeaveRoom: (request: IRequestLeaveRoom, thenCallback?: (response: IResponseLeaveRoom) => any, catchCallback?: (error: any) => any) => void;
    sendPublishVideo: (request: IRequestPublishVideo, thenCallback?: (response: IResponsePublishVideo) => any, catchCallback?: (error: any) => any) => void;
    sendUnpublishVideo: (request: IRequestUnpublishVideo, thenCallback?: (response: IResponseLeaveRoom) => any, catchCallback?: (error: any) => any) => void;
    sendReceiveVideoFrom: (request: IRequestReceiveVideo, thenCallback?: (response: IResponseLeaveRoom) => any, catchCallback?: (error: any) => any) => void;
    sendUnsubscribeFrom: (request: IRequestUnsubscribeFromVideo, thenCallback?: (response: IResponseLeaveRoom) => any, catchCallback?: (error: any) => any) => void;
    sendICECandidate: (request: IRequestSendICECandidate, thenCallback?: (response: IResponseLeaveRoom) => any, catchCallback?: (error: any) => any) => void;
    sendMessage: (request: IRequestSendMessage, thenCallback?: (response: IResponseLeaveRoom) => any, catchCallback?: (error: any) => any) => void;
    sendCustomRequest: (customRequest: Object, thenCallback?: (response: any) => any, catchCallback?: (error: any) => any) => void;
}

declare class KASStreamConstants_Static {
    get STREAM_TYPE(): any;
}

interface KASStream_Static {
    new(id: string): KASStream_Instance;
}

interface KASStream_Instance {
    id: string;
    streamType: string;
    userMediaStream: any;

    generateHTMLElement: (id?: string) => HTMLVideoElement | HTMLAudioElement;
    dispose: () => void;
    getId: () => string;
    getStreamType: () => string;
    getStreamObject: () => any;
    setStreamType: (streamType: string) => void;
    setStreamObject: (userMediaStream: any) => void;
}

interface KurentoRoom_Instance {
    KASConnection: KASConnection_Static;
    KASConnectionConstants: KASConnectionConstants_Static;
    KASStreamConstants: KASStreamConstants_Static;
    KASStream: KASStream_Static;
    KASLocalStream: KASLocalStream_Static;
    KASLocalWebRtcPeer: KASLocalWebRtcPeer_Static;
    KASLocalWebRtcPeerConstants: KASLocalWebRtcPeerConstants_Static;
    KASParticipant: KASParticipant_Static;
    KASRemoteWebRtcPeer: KASRemoteWebRtcPeer_Static;
    KASRemoteWebRtcPeerConstants: KASRemoteWebRtcPeerConstants_Static;
    KASRoom: KASRoom_Static;
    KASServer: KASServer_Static;
    KASServerAPI: KASServerAPI_Static;
}

interface KurentoRoom_Static {
    new(): KurentoRoom_Instance;
}

interface KurentoRoomModule_Static {
    KurentoRoom: KurentoRoom_Static;
}

declare var KurentoRoom: KurentoRoomModule_Static;

declare module 'kurentoRoom' {
    export = KurentoRoom;
}
