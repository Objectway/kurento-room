import {KASServerAPI, IRequestJoinRoom, IResponseJoinRoom, IRequestLeaveRoom, IResponseLeaveRoom} from "./KASServerAPI";
import {
    KASConnection,
    INotificationParticipantJoined,
    INotificationParticipantLeft,
    INotificationParticipantEvicted,
    INotificationParticipantPublished,
    INotificationReceiveICECandidate,
    INotificationParticipantUnpublished,
    INotificationMediaError
} from "./KASConnection"
import {KASRoom} from "./KASRoom";
import {KASParticipant} from "./KASParticipant";
import {KASRemoteWebRtcPeer} from "./KASRemoteWebRtcPeer";
import {INotificationMessageReceived} from "./KASConnection";
import {IICEOptions} from "./KASWebRtcPeer";

/**
 * @class KASServer
 * @description Main class that interfaces with the Kurento Application Server. It handles rooms and participants.
 *              It users a KASConnection but it does NOT manage its lifecycle (connect, disconnect).
 * @author Danilo Arcidiacono
 */
export class KASServer {

    /**
     * Connection to the KAS
     */
    private connection: KASConnection;

    /**
     * Client object to communicate with the KAS
     */
    private serverAPI: KASServerAPI;

    /**
     * ICE options (used when subscribing to remote sterams)
     */
    private iceOptions: IICEOptions = {
        forceTurn: false
    };

    /**
     * Rooms
     * TODO: For now, there can be only one room per connection
     */
    private rooms: { [ roomId: string ]: KASRoom } = {};

    /**
     * Id of the participant associated to the connectio
     * TODO: For now, there can be only one user per connection
     */
    private localParticipantId: string = undefined;

    /**
     * (Optional) callback invoked when a new message is received.
     * @type {undefined}
     */
    private onMessageReceivedCallback: (params: INotificationMessageReceived) => any = undefined;

    /**
     * (Optional) callback invoked when subscribing to a new remote stream
     * @type {undefined}
     */
    private onRemoteStreamSubscribedCallback: (participant: KASParticipant, peer: KASRemoteWebRtcPeer) => any = undefined;

    /**
     * (Optional) callback invoked when a remote peer unpublishes his steram
     * @type {undefined}
     */
    private onRemoteStreamUnpublishedCallback: (participant: KASParticipant, streamId: string, peer: KASRemoteWebRtcPeer) => any = undefined;

    public constructor(connection: KASConnection) {
        this.connection = connection;
        this.serverAPI = new KASServerAPI(connection);

        // Setup notifications handlers
        this.connection.setOnParticipantJoinedCallback(this.onParticipantJoined);
        this.connection.setOnParticipantLeftCallback(this.onParticipantLeft);
        this.connection.setOnParticipantEvictedCallback(this.onParticipantEvicted);
        this.connection.setOnParticipantPublishedCallback(this.onParticipantPublished);
        this.connection.setOnReceiveICECandidateCallback(this.onReceiveICECandidate);
        this.connection.setOnParticipantUnpublishedCallback(this.onParticipantUnpublished);
        this.connection.setOnMessageReceivedCallback(this.onMessageReceived);
        this.connection.setOnMediaErrorCallback(this.onMediaError);
    }

    /**
     * Tries to join a room with the given id on behalf of the given username.
     */
    public joinRoom = (roomId: string, username: string, thenCallback?: () => any, catchCallback?: (error: Object) => any): void => {
        // TODO: For now, there can be only one room per connection
        if (Object.keys(this.rooms).length != 0) {
            const error: Object = {
                "message:": "A room has already been joined"
            };

            if (catchCallback !== undefined) {
                catchCallback(error);
            }

            // Stop
            return;
        }

        const request: IRequestJoinRoom = {
            "user": username,
            "room": roomId,
            "dataChannels": true
        };

        this.serverAPI.sendJoinRoom(request, (response: IResponseJoinRoom) => {
            // Add the room
            const room: KASRoom = new KASRoom(roomId, this.serverAPI);
            this.rooms[roomId] = room;

            // TODO: For now, there can be only one room per connection
            // Store the local participant id
            this.localParticipantId = username;

            // Add myself
            room.addParticipant(username);

            // Add the existing participants to the room
            for (var i = 0; i < response.value.length; i++) {
                var remoteParticipant: KASParticipant = room.addParticipant(response.value[i].id);

                // Add existing streams to the participants
                /*
                 for (var j = 0; j < response.value[i].streams.length; j++) {
                 remoteParticipant.addStream(response.value[i].streams[j].id);
                 }*/
            }
        }, (error:any) => {
            if (catchCallback !== undefined) {
                catchCallback(error);
            }
        });
    };

    /**
     * Tries to leave the joined room.
     * TODO: For now, the roomId and username are ignored.
     * @param roomId
     * @param username
     * @param thenCallback
     * @param catchCallback
     */
    public leaveRoom = (roomId: string, username: string, thenCallback?: () => any, catchCallback?: (error: Object) => any): void => {
        // TODO: For now, there can be only one room per connection
        if (Object.keys(this.rooms).length !== 1) {
            const error: Object = {
                "message:": "No room has been joined"
            };

            if (catchCallback !== undefined) {
                catchCallback(error);
            }

            // Stop
            return;
        }

        const request: IRequestLeaveRoom = { };

        // Dispose the room
        // TODO: For now, there can be only one room per connection
        var room: KASRoom = this.getOnlyRoom();
        room.dispose();

        this.serverAPI.sendLeaveRoom(request, (response: IResponseLeaveRoom) => {
            // TODO: For now, there can be only one room per connection
            this.rooms = {};
        }, (error: any) => {
            if (catchCallback !== undefined) {
                catchCallback(error);
            }
        });
    };

    /**
     * Disposes the rooms
     */
    public dispose = (): void => {
        // Leave each room
        // TODO: For now, there can be only one room per connection
        this.leaveRoom(this.getOnlyRoom().getId(), this.getOnlyParticipantId());
    };

    private onParticipantJoined = (params: INotificationParticipantJoined): void => {
        console.info("Participant " + params.id + " joined");

        const room:KASRoom = this.getOnlyRoom();
        room.addParticipant(params.id);
    };

    private onParticipantLeft = (params: INotificationParticipantLeft): void => {
        console.info("Participant " + params.name + " has left");

        const room: KASRoom = this.getOnlyRoom();
        room.removeParticipant(params.name);
    };

    private onParticipantEvicted = (params: INotificationParticipantEvicted): void => {
        console.info("You have been evicted by the KAS");

        // TODO: For now, there can be only one room/participant per connection
        const room:KASRoom = this.getOnlyRoom();
        const participant:KASParticipant = room.removeParticipant(this.getOnlyParticipantId());
    };

    private onParticipantPublished = (params: INotificationParticipantPublished): void => {
        console.info("Published ", params);

        // TODO: For now, there can be only one room/participant per connection
        const room:KASRoom = this.getOnlyRoom();

        // Get existing participant or create a new one
        const participant:KASParticipant = room.getParticipantById(params.id) || room.addParticipant(params.id);

        // Add the new remote stream
        for (var i = 0; i < params.streams.length; i++) {
            participant.addRemoteStream(params.streams[i].id,
                                        params.streams[i].streamType,
                                        this.iceOptions,
                                        (peer:KASRemoteWebRtcPeer) => {
                                            if (true) { // subscribeToStreams
                                                // TODO: For now, there can be only one room/participant per connection
                                                peer.subscribe(() => {
                                                    if (this.onRemoteStreamSubscribedCallback !== undefined) {
                                                        this.onRemoteStreamSubscribedCallback(participant, peer);
                                                    }
                                                }, (error: any) => {
                                                    console.error(error);
                                                });
                                            }
                                        }, (error: any) => {
                                        });
        }
    };

    private onReceiveICECandidate = (params: INotificationReceiveICECandidate): void => {
        const candidate:any = {
            candidate: params.candidate,
            sdpMid: params.sdpMid,
            sdpMLineIndex: params.sdpMLineIndex
        };

        // TODO: For now, there can be only one room/participant per connection
        const participant:KASParticipant = this.getOnlyRoom().getParticipantById(params.endpointName);
        if (participant === undefined) {
            console.error("Participant not found for endpoint " + params.endpointName + ". Ice candidate will be ignored.", candidate);
            return;
        }

        participant.getPeerByStreamId(params.streamId).getWebRtcPeer().addIceCandidate(candidate, (error:any) => {
            if (error) {
                console.error("Error adding candidate for " + params.streamId
                    + " stream of endpoint " + params.endpointName
                    + ": " + error);
                return;
            }
        });
    };

    private onParticipantUnpublished = (params: INotificationParticipantUnpublished): void => {
        console.info("unpublished ", params);

        // TODO: For now, there can be only one room/participant per connection
        const participant: KASParticipant = this.getOnlyRoom().getParticipantById(params.name);
        const peer: KASRemoteWebRtcPeer = participant.getSubscribedPeerByStreamId(params.streamId);

        if (peer !== undefined) {
            // Save the streamId (the stream reference inside peer will be set to undefined by unsubscribe())
            const streamId: string = peer.getStream().getId();

            // Note: This is not needed (from the KMS point of view), because the subscriber endpoints are
            // already released when the remote peer calls unpublishMedia(). However, we still call unsubscribe() here
            // because we need to reset our internal data structures (the KMS will simply notify that "there is no such subscriber endpoint").
            peer.unsubscribe();

            if (this.onRemoteStreamUnpublishedCallback !== undefined) {
                this.onRemoteStreamUnpublishedCallback(participant, streamId, peer);
            }
        } else {
            console.warn("Received unpublished for not subscribed video");
        }
    };

    private onMessageReceived = (params: INotificationMessageReceived): void => {
        if (this.onMessageReceivedCallback !== undefined) {
            this.onMessageReceivedCallback(params);
        }
    };

    private onMediaError = (params: INotificationMediaError): void => {
        console.info("media error ", params);
    };

    public setIceOptions = (iceOptions: IICEOptions): void => {
        this.iceOptions = iceOptions;
    };

    public setOnMessageReceivedCallback = (onMessageReceivedCallback:(params: INotificationMessageReceived) => any): void => {
        this.onMessageReceivedCallback = onMessageReceivedCallback;
    };

    public setOnRemoteStreamSubscribedCallback = (onRemoteStreamSubscribedCallback: (participant: KASParticipant, peer: KASRemoteWebRtcPeer) => any): void => {
        this.onRemoteStreamSubscribedCallback = onRemoteStreamSubscribedCallback;
    };

    public setOnRemoteStreamUnpublishedCallback = (onRemoteStreamUnpublishedCallback: (participant: KASParticipant, streamId: string, peer: KASRemoteWebRtcPeer) => any): void => {
        this.onRemoteStreamUnpublishedCallback = onRemoteStreamUnpublishedCallback;
    };

    /**
     * Returns the only room joined
     * TODO: Extend this mechanism
     */
    private getOnlyRoom = (): KASRoom => {
        if (Object.keys(this.rooms).length !== 1) {
            return undefined;
        }

        return this.rooms[Object.keys(this.rooms)[0]];
    };

    /**
     * Returns the only participant id associated to the connection
     * TODO: Extend this mechanism
     */
    private getOnlyParticipantId = (): string => {
        return this.localParticipantId;
    };

    /**
     * Returns the only participant associated to the connection
     * TODO: Extend this mechanism
     */
    private getOnlyParticipant = (): KASParticipant => {
        return this.getOnlyRoom().getParticipantById(this.getOnlyParticipantId());
    };
}