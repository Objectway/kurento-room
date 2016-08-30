import {KASConnection, KASConnectionConstants} from "./KASConnection";

// JoinRoom
export interface IRequestJoinRoom {
    user: string;
    room: string;
    dataChannels?: boolean;
}

export interface IResponseJoinRoom {

    /**
     * id of the WebSocket session between the browser and the server
     */
    sessionId: string;

    /**
     * list of existing users in this room, empty when the room is a fresh one
     */
    value: Array<IResponseJoinRoomUser>;
}

export interface IResponseJoinRoomUser {
    /**
     * an already existing user’s name
     */
    id: string;

    /**
     * List of stream identifiers that the other participant has opened to connect with the room.
     */
    streams: Array<IResponseJoinRoomUserStream>;
}

export interface IResponseJoinRoomUserStream {
    /**
     * Stream identifier
     */
    id: string;
}

// LeaveRoom
export interface IRequestLeaveRoom {
}

export interface IResponseLeaveRoom {

    /**
     * id of the WebSocket session between the browser and the server
     */
    sessionId: string;
}

/**
 * Represents a client’s request to start streaming her local media to anyone inside the room.
 */
export interface IRequestPublishVideo {
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

export interface IResponsePublishVideo {

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
export interface IRequestUnpublishVideo {
    /**
     * The name of the stream whose ICE candidate was found (EXTENSION TO THE PROTOCOL)
     */
    streamId: string;
}

export interface IResponseUnpublishVideo {
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
export interface IRequestReceiveVideo {
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

export interface IResponseReceiveVideo {
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
export interface IRequestUnsubscribeFromVideo {
    /**
     * id of the publisher’s endpoint, build by appending the publisher’s name and her currently opened stream (usually webcam)
     */
    sender: string;

    /**
     * The name of the stream whose ICE candidate was found (EXTENSION TO THE PROTOCOL)
     */
    streamId: string;
}

export interface IResponseUnsubscribeFromVideo {
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
export interface IRequestSendICECandidate {
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

export interface IResponseSendICECandidate {
    /**
     * id of the WebSocket session
     */
    sessionId: string;
}

/**
 * Used by clients to send written messages to all other participants in the room.
 */
export interface IRequestSendMessage {
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

export interface IResponseSendMessage {
    /**
     * id of the WebSocket session
     */
    sessionId: string;
}

/**
 * @class KASServerAPI
 * @description This class handles the Kurento-Room websocket protocol
 *
 * @author Danilo Arcidiacono
 */
export class KASServerAPI {
    /**
     * The connection to the KAS
     */
    private kasConnection: KASConnection;

    public constructor(kasConnection: KASConnection) {
        this.kasConnection = kasConnection;
    }

    /**
     * Sends a joinRoom request, calling the appropriate callbacks.
     * @param request
     * @param thenCallback
     * @param catchCallback
     */
    public sendJoinRoom = (request: IRequestJoinRoom,
                           thenCallback?: (response: IResponseJoinRoom) => any,
                           catchCallback?: (error: any) => any): void => {
        this.kasConnection.sendRequest('joinRoom', request, (error: any, response: IResponseJoinRoom) => {
            if (error) {
                if (catchCallback !== undefined) {
                    catchCallback(error);
                }
            } else {
                if (thenCallback !== undefined) {
                    thenCallback(response);
                }
            }
        });
    };

    /**
     * Sends a leaveRoom request, calling the appropriate callbacks.
     * @param request
     * @param thenCallback
     * @param catchCallback
     */
    public sendLeaveRoom = (request: IRequestLeaveRoom,
                            thenCallback?: (response: IResponseLeaveRoom) => any,
                            catchCallback?: (error: any) => any): void => {
        this.kasConnection.sendRequest('leaveRoom', request, (error: any, response: IResponseLeaveRoom) => {
            if (error) {
                if (catchCallback !== undefined) {
                    catchCallback(error);
                }
            } else {
                if (thenCallback !== undefined) {
                    thenCallback(response);
                }
            }
        });
    };

    /**
     * Sends a publishVideo request, calling the appropriate callbacks.
     * @param request
     * @param thenCallback
     * @param catchCallback
     */
    public sendPublishVideo = (request: IRequestPublishVideo,
                            thenCallback?: (response: IResponsePublishVideo) => any,
                            catchCallback?: (error: any) => any): void => {
        this.kasConnection.sendRequest('publishVideo', request, (error: any, response: IResponsePublishVideo) => {
            if (error) {
                if (catchCallback !== undefined) {
                    catchCallback(error);
                }
            } else {
                if (thenCallback !== undefined) {
                    thenCallback(response);
                }
            }
        });
    };

    /**
     * Sends an unpublishVideo request, calling the appropriate callbacks.
     * @param request
     * @param thenCallback
     * @param catchCallback
     */
    public sendUnpublishVideo = (request: IRequestUnpublishVideo,
                               thenCallback?: (response: IResponseLeaveRoom) => any,
                               catchCallback?: (error: any) => any): void => {
        this.kasConnection.sendRequest('unpublishVideo', request, (error: any, response: IResponseUnpublishVideo) => {
            if (error) {
                if (catchCallback !== undefined) {
                    catchCallback(error);
                }
            } else {
                if (thenCallback !== undefined) {
                    thenCallback(response);
                }
            }
        });
    };

    /**
     * Sends a receiveVideoFrom request, calling the appropriate callbacks.
     * @param request
     * @param thenCallback
     * @param catchCallback
     */
    public sendReceiveVideoFrom = (request: IRequestReceiveVideo,
                                 thenCallback?: (response: IResponseLeaveRoom) => any,
                                 catchCallback?: (error: any) => any): void => {
        this.kasConnection.sendRequest('receiveVideoFrom', request, (error: any, response: IResponseReceiveVideo) => {
            if (error) {
                if (catchCallback !== undefined) {
                    catchCallback(error);
                }
            } else {
                if (thenCallback !== undefined) {
                    thenCallback(response);
                }
            }
        });
    };

    /**
     * Sends a unsubscribeFromVideo request, calling the appropriate callbacks.
     * @param request
     * @param thenCallback
     * @param catchCallback
     */
    public sendUnsubscribeFrom = (request: IRequestUnsubscribeFromVideo,
                                 thenCallback?: (response: IResponseLeaveRoom) => any,
                                 catchCallback?: (error: any) => any): void => {
        this.kasConnection.sendRequest('unsubscribeFromVideo', request, (error: any, response: IResponseUnsubscribeFromVideo) => {
            if (error) {
                if (catchCallback !== undefined) {
                    catchCallback(error);
                }
            } else {
                if (thenCallback !== undefined) {
                    thenCallback(response);
                }
            }
        });
    };

    /**
     * Sends a onIceCandidate request, calling the appropriate callbacks.
     * @param request
     * @param thenCallback
     * @param catchCallback
     */
    public sendICECandidate = (request: IRequestSendICECandidate,
                                 thenCallback?: (response: IResponseLeaveRoom) => any,
                                 catchCallback?: (error: any) => any): void => {
        this.kasConnection.sendRequest('onIceCandidate', request, (error: any, response: IResponseSendICECandidate) => {
            if (error) {
                if (catchCallback !== undefined) {
                    catchCallback(error);
                }
            } else {
                if (thenCallback !== undefined) {
                    thenCallback(response);
                }
            }
        });
    };

    /**
     * Sends a sendMessage request, calling the appropriate callbacks.
     * @param request
     * @param thenCallback
     * @param catchCallback
     */
    public sendMessage = (request: IRequestSendMessage,
                             thenCallback?: (response: IResponseLeaveRoom) => any,
                             catchCallback?: (error: any) => any): void => {
        this.kasConnection.sendRequest('sendMessage', request, (error: any, response: IResponseSendMessage) => {
            if (error) {
                if (catchCallback !== undefined) {
                    catchCallback(error);
                }
            } else {
                if (thenCallback !== undefined) {
                    thenCallback(response);
                }
            }
        });
    };
}