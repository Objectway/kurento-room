declare module "KASConnection" {
    export class KASConnectionConstants {
        static CONNECTION_STATES: any;
    }
    export interface INotificationParticipantJoined {
        id: string;
    }
    export interface INotificationParticipantLeft {
        name: string;
    }
    export interface INotificationParticipantEvicted {
    }
    export interface INotificationParticipantPublished {
        id: string;
        streams: Array<INotificationParticipantPublishedUserStream>;
    }
    export interface INotificationParticipantPublishedUserStream {
        id: string;
        streamType: string;
    }
    export interface INotificationReceiveICECandidate {
        endpointName: string;
        streamId: string;
        candidate: string;
        sdpMLineIndex: number;
        sdpMid: number;
    }
    export interface INotificationParticipantUnpublished {
        name: string;
        streamId: string;
    }
    export interface INotificationMessageReceived {
        room: string;
        name: string;
        message: string;
    }
    export interface INotificationMediaError {
        error: string;
    }
    export class KASConnection {
        private kasUri;
        private heartbeatRate;
        private requestTimeout;
        private rpcParams;
        private state;
        private jsonRpcClient;
        private onStatusChangedCallback;
        private onNotificationParticipantJoinedCallback;
        private onNotificationParticipantLeftCallback;
        private onNotificationParticipantEvictedCallback;
        private onNotificationParticipantPublishedCallback;
        private onNotificationReceiveICECandidateCallback;
        private onNotificationParticipantUnpublishedCallback;
        private onNotificationMessageReceivedCallback;
        private onNotificationMediaErrorCallback;
        constructor(kasUri: string);
        connect: () => void;
        disconnect: () => void;
        sendRequest: (method: string, params: Object, callback: (error: any, response: Object) => any) => void;
        private connectCallback;
        private disconnectCallback;
        private reconnectingCallback;
        private reconnectedCallback;
        private onParticipantJoined;
        private onParticipantLeft;
        private onParticipantEvicted;
        private onParticipantPublished;
        private onParticipantUnpublished;
        private onICECandidate;
        private onMessageReceived;
        private onMediaError;
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
}
declare module "KASStream" {
    export class KASStreamConstants {
        static STREAM_TYPE: any;
    }
    export class KASStream {
        protected id: string;
        protected streamType: string;
        protected userMediaStream: any;
        constructor(id: string);
        generateHTMLElement: (id?: string) => HTMLVideoElement | HTMLAudioElement;
        dispose: () => void;
        getId: () => string;
        getStreamType: () => string;
        getStreamObject: () => any;
        setStreamType: (streamType: string) => void;
        setStreamObject: (userMediaStream: any) => void;
    }
}
declare module "KASLocalStream" {
    import { KASStream } from "KASStream";
    export interface IStreamConstraints {
        idealVideoWidth?: number;
        idealVideoHeight?: number;
        idealFrameRate?: number;
    }
    export class KASLocalStream extends KASStream {
        private userMediaConstraints;
        constructor(id: string);
        requestUserMediaStream: (streamConstraints: IStreamConstraints, thenCallback?: () => any, catchCallback?: (error: any) => any) => void;
        private requestAudioVideoUserMediaStream;
        private requestScreenUserMediaStream;
        private requestScreenChromeUserMediaStream;
        private requestScreenFirefoxUserMediaStream;
        getUserMediaConstraints: () => void;
    }
}
declare module "KASServerAPI" {
    import { KASConnection } from "KASConnection";
    export interface IRequestJoinRoom {
        user: string;
        room: string;
        dataChannels?: boolean;
    }
    export interface IResponseJoinRoom {
        sessionId: string;
        value: Array<IResponseJoinRoomUser>;
    }
    export interface IResponseJoinRoomUser {
        id: string;
        streams: Array<IResponseJoinRoomUserStream>;
        status: string;
    }
    export interface IResponseJoinRoomUserStream {
        id: string;
    }
    export interface IRequestLeaveRoom {
    }
    export interface IResponseLeaveRoom {
        sessionId: string;
    }
    export interface IRequestPublishVideo {
        sdpOffer: string;
        streamId: string;
        streamType: string;
        doLoopback: boolean;
    }
    export interface IResponsePublishVideo {
        sessionId: string;
        sdpAnswer: string;
    }
    export interface IRequestUnpublishVideo {
        streamId: string;
    }
    export interface IResponseUnpublishVideo {
        sessionId: string;
        streamId: string;
    }
    export interface IRequestReceiveVideo {
        sender: string;
        streamId: string;
        sdpOffer: string;
    }
    export interface IResponseReceiveVideo {
        sessionId: string;
        sdpAnswer: string;
    }
    export interface IRequestUnsubscribeFromVideo {
        sender: string;
        streamId: string;
    }
    export interface IResponseUnsubscribeFromVideo {
        sessionId: string;
    }
    export interface IRequestSendICECandidate {
        endpointName: string;
        streamId: string;
        candidate: string;
        sdpMLineIndex: number;
        sdpMid: number;
    }
    export interface IResponseSendICECandidate {
        sessionId: string;
    }
    export interface IRequestSendMessage {
        message: string;
        userMessage: string;
        roomMessage: string;
    }
    export interface IResponseSendMessage {
        sessionId: string;
    }
    export class KASServerAPI {
        private kasConnection;
        constructor(kasConnection: KASConnection);
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
}
declare module "KASRemoteWebRtcPeer" {
    import { KASStream } from "KASStream";
    import { KASServerAPI } from "KASServerAPI";
    import { IICEOptions, IKASWebRtcPeer } from "KASWebRtcPeer";
    import { KASParticipant } from "KASParticipant";
    export class KASRemoteWebRtcPeerConstants {
        static STATES: any;
    }
    export class KASRemoteWebRtcPeer implements IKASWebRtcPeer {
        private state;
        private serverAPI;
        private participant;
        private stream;
        private webRtcPeer;
        private sdpOffer;
        private sdpAnswer;
        private iceCandidates;
        private iceOptions;
        private onSDPOfferGeneratedCallback;
        private onICECandidateGeneratedCallback;
        constructor(stream: KASStream, serverAPI: KASServerAPI, participant: KASParticipant);
        createKurentoPeer: () => void;
        private onOfferGenerated;
        private onIceCandidate;
        subscribe: (thenCallback?: () => any, catchCallback?: (error: any) => any) => void;
        unsubscribe: (thenCallback?: () => any, catchCallback?: (error: any) => any) => void;
        dispose: () => void;
        private internalDispose;
        isLocal: () => boolean;
        getParticipant: () => KASParticipant;
        getWebRtcPeer: () => any;
        getStream: () => KASStream;
        getSDPOffer: () => void;
        getSDPAnswer: () => void;
        setICEOptions: (iceOptions: IICEOptions) => void;
        setOnSDPOfferGeneratedCallback: (onSDPOfferGeneratedCallback: () => any) => void;
        setOnICECandidateGeneratedCallback: (onICECandidateGeneratedCallback: (candidate: any) => any) => void;
    }
}
declare module "KASParticipant" {
    import { KASLocalWebRtcPeer } from "KASLocalWebRtcPeer";
    import { IStreamConstraints } from "KASLocalStream";
    import { KASServerAPI } from "KASServerAPI";
    import { KASRemoteWebRtcPeer } from "KASRemoteWebRtcPeer";
    import { IICEOptions, IKASWebRtcPeer } from "KASWebRtcPeer";
    export class KASParticipant {
        private id;
        private serverAPI;
        private publishedStreams;
        private subscribedStreams;
        constructor(id: string, serverAPI: KASServerAPI);
        addLocalStream: (id: string, streamType: string, streamConstraints: IStreamConstraints, iceOptions: IICEOptions, thenCallback?: (stream: KASLocalWebRtcPeer) => any, catchCallback?: (error: any) => any) => void;
        addRemoteStream: (id: string, streamType: string, iceOptions: IICEOptions, thenCallback?: (stream: KASRemoteWebRtcPeer) => any, catchCallback?: (error: any) => any) => void;
        localPeerDisposed: (streamId: string) => void;
        remotePeerDisposed: (streamId: string) => void;
        dispose: () => void;
        getId: () => string;
        getPublishedPeers: () => {
            [streamId: string]: KASLocalWebRtcPeer;
        };
        getPublishedPeerByStreamId: (streamId: string) => KASLocalWebRtcPeer;
        getSubscribedPeers: () => {
            [streamId: string]: KASRemoteWebRtcPeer;
        };
        getSubscribedPeerByStreamId: (streamId: string) => KASRemoteWebRtcPeer;
        getPeerByStreamId: (streamId: string) => IKASWebRtcPeer;
    }
}
declare module "KASWebRtcPeer" {
    import { KASStream } from "KASStream";
    import { KASParticipant } from "KASParticipant";
    export interface IICEOptions {
        stunUrl?: string;
        turnUrl?: string;
        turnUsername?: string;
        turnPassword?: string;
        forceTurn: boolean;
    }
    export interface IKASWebRtcPeer {
        isLocal(): boolean;
        getParticipant(): KASParticipant;
        getWebRtcPeer(): any;
        getStream(): KASStream;
        dispose(): void;
    }
}
declare module "KASLocalWebRtcPeer" {
    import { KASLocalStream } from "KASLocalStream";
    import { KASStream } from "KASStream";
    import { KASServerAPI } from "KASServerAPI";
    import { IKASWebRtcPeer, IICEOptions } from "KASWebRtcPeer";
    import { KASParticipant } from "KASParticipant";
    export class KASLocalWebRtcPeerConstants {
        static STATES: any;
    }
    export class KASLocalWebRtcPeer implements IKASWebRtcPeer {
        private state;
        private participant;
        private serverAPI;
        private stream;
        private remoteLoopbackStream;
        private webRtcPeer;
        private sdpOffer;
        private sdpAnswer;
        private iceCandidates;
        private iceOptions;
        private onSDPOfferGeneratedCallback;
        private onICECandidateGeneratedCallback;
        constructor(stream: KASLocalStream, serverAPI: KASServerAPI, participant: KASParticipant);
        createKurentoPeer: () => void;
        private onOfferGenerated;
        private onIceCandidate;
        publish: (thenCallback?: () => any, catchCallback?: (error: any) => any) => void;
        unpublish: (thenCallback?: () => any, catchCallback?: (error: any) => any) => void;
        dispose: () => void;
        private internalDispose;
        isLocal: () => boolean;
        getParticipant: () => KASParticipant;
        getWebRtcPeer: () => any;
        getStream: () => KASStream;
        getSDPOffer: () => void;
        getSDPAnswer: () => void;
        getRemoteLoopbackStream: () => KASStream;
        setICEOptions: (iceOptions: IICEOptions) => void;
        setOnSDPOfferGeneratedCallback: (onSDPOfferGeneratedCallback: () => any) => void;
        setOnICECandidateGeneratedCallback: (onICECandidateGeneratedCallback: (candidate: any) => any) => void;
    }
}
declare module "KASRoom" {
    import { KASParticipant } from "KASParticipant";
    import { KASServerAPI } from "KASServerAPI";
    export class KASRoom {
        private id;
        private serverAPI;
        private participants;
        constructor(id: string, serverAPI: KASServerAPI);
        addParticipant: (participantId: string) => KASParticipant;
        removeParticipant: (participantId: string) => KASParticipant;
        getParticipantById: (participantId: string) => KASParticipant;
        dispose: () => void;
        getId: () => string;
        getParticipants: () => {
            [participantId: string]: KASParticipant;
        };
    }
}
declare module "KASServer" {
    import { IResponseJoinRoom } from "KASServerAPI";
    import { KASConnection } from "KASConnection";
    import { INotificationParticipantLeft } from "KASConnection";
    import { INotificationParticipantEvicted } from "KASConnection";
    import { KASRoom } from "KASRoom";
    import { KASParticipant } from "KASParticipant";
    import { KASRemoteWebRtcPeer } from "KASRemoteWebRtcPeer";
    import { INotificationMessageReceived } from "KASConnection";
    import { IICEOptions } from "KASWebRtcPeer";
    export class KASServer {
        private connection;
        private serverAPI;
        private iceOptions;
        private rooms;
        private localParticipantId;
        private onParticipantLeftCallback;
        private onParticipantEvictedCallback;
        private onMessageReceivedCallback;
        private onRemoteStreamSubscribedCallback;
        private onRemoteStreamUnpublishedCallback;
        constructor(connection: KASConnection);
        joinRoom: (roomId: string, username: string, thenCallback?: (room: KASRoom, response: IResponseJoinRoom) => any, catchCallback?: (error: Object) => any) => void;
        leaveRoom: (roomId: string, username: string, thenCallback?: () => any, catchCallback?: (error: Object) => any) => void;
        sendMessage: (message: string, username: string, roomId: string, thenCallback?: () => any, catchCallback?: (error: Object) => any) => void;
        sendCustomRequest: (customRequest: Object, thenCallback?: (response: any) => any, catchCallback?: (error: Object) => any) => void;
        dispose: (forced: boolean, thenCallback?: () => any, catchCallback?: (error: Object) => any) => void;
        private onParticipantJoined;
        private onParticipantLeft;
        private onParticipantEvicted;
        private onParticipantPublished;
        private onReceiveICECandidate;
        private onParticipantUnpublished;
        private onMessageReceived;
        private onMediaError;
        setIceOptions: (iceOptions: IICEOptions) => void;
        setOnParticipantLeftCallback: (onParticipantLeftCallback: (params: INotificationParticipantLeft) => any) => void;
        setOnParticipantEvictedCallback: (onParticipantEvicted: (params: INotificationParticipantEvicted) => any) => void;
        setOnMessageReceivedCallback: (onMessageReceivedCallback: (params: INotificationMessageReceived) => any) => void;
        setOnRemoteStreamSubscribedCallback: (onRemoteStreamSubscribedCallback: (participant: KASParticipant, peer: KASRemoteWebRtcPeer) => any) => void;
        setOnRemoteStreamUnpublishedCallback: (onRemoteStreamUnpublishedCallback: (participant: KASParticipant, streamId: string, peer: KASRemoteWebRtcPeer) => any) => void;
        private getOnlyRoom;
        private getOnlyParticipantId;
        private getOnlyParticipant;
    }
}
declare module "KurentoRoom" {
    export class KurentoRoom {
        constructor();
    }
}
