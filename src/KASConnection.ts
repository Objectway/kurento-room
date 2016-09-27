export class KASConnectionConstants {
    public static get CONNECTION_STATES(): any {
        return {
            OFFLINE: 'offline',
            RECONNECTING: 'reconnecting',
            CONNECTED: 'connected'
        };
    }
}

/**
 * Event sent by server to all other participants in the room as a result of a new user joining in.
 */
export interface INotificationParticipantJoined {
    /**
     * The new participant’s id (username)
     */
    id: string;
}

/**
 * Event sent by server to all other participants in the room as a consequence of an user leaving the room.
 */
export interface INotificationParticipantLeft {
    /**
     * username of the participant that has disconnected
     */
    name: string;
}

/**
 * Event sent by server to a participant in the room as a consequence of a server-side action requiring the participant to leave the room.
 */
export interface INotificationParticipantEvicted {

}

/**
 * Event sent by server to all other participants in the room as a result of a user publishing her local media stream.
 */
export interface INotificationParticipantPublished {

    /**
     * publisher’s username
     */
    id: string;

    /**
     * list of stream identifiers that the participant has opened to connect with the room.
     */
    streams: Array<INotificationParticipantPublishedUserStream>;
}

export interface INotificationParticipantPublishedUserStream {
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
export interface INotificationReceiveICECandidate {
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
export interface INotificationParticipantUnpublished {
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
export interface INotificationMessageReceived {
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
export interface INotificationMediaError {
    /**
     * description of the error
     */
    error: string;
}

/**
 * @class KASConnection
 * @description This class handles the websocket messaging with the Kurento Application Server.
 *
 * @author Danilo Arcidiacono
 */
export class KASConnection {
    /**
     * The URI of the Kurento Application Server
     */
    private kasUri: string;

    /**
     * The frequency of the heartbeat (ping/pong) messages in milliseconds
     */
    private heartbeatRate: number = 3000;

    /**
     * The timeout of each websocket request in milliseconds
     */
    private requestTimeout: number = 15000;

    /**
     * Additional parameters to include in each websocket request
     */
    private rpcParams: Object = undefined;

    /**
     * Connection state (one of KASConnectionConstants.CONNECTION_STATES)
     */
    private state: string = KASConnectionConstants.CONNECTION_STATES.OFFLINE;

    /**
     * The actual Json-Rpc client object
     */
    private jsonRpcClient: any;

    /**
     * (Optional) callback invoked when the connection state changes.
     * @type {any}
     */
    private onStatusChangedCallback: Function = undefined;

    /**
     * (Optional) callback invoked when (another) participant has joined a room.
     * @type {any}
     */
    private onNotificationParticipantJoinedCallback: (params: INotificationParticipantJoined) => any = undefined;

    /**
     * (Optional) callback invoked when (another) participant has left a room.
     * @type {any}
     */
    private onNotificationParticipantLeftCallback: (params: INotificationParticipantLeft) => any = undefined;

    /**
     * (Optional) callback invoked when (the) participant has been evicted.
     * @type {any}
     */
    private onNotificationParticipantEvictedCallback: (params: INotificationParticipantEvicted) => any = undefined;

    /**
     * (Optional) callback invoked when (another) participant has published a stream
     * @type {any}
     */
    private onNotificationParticipantPublishedCallback: (params: INotificationParticipantPublished) => any = undefined;

    /**
     * (Optional) callback invoked when receiving an ICE candidate for a specific endpoint
     * @type {any}
     */
    private onNotificationReceiveICECandidateCallback: (params: INotificationReceiveICECandidate) => any = undefined;

    /**
     * (Optional) callback invoked when (another) participant has unpublished a stream
     * @type {any}
     */
    private onNotificationParticipantUnpublishedCallback: (params: INotificationParticipantUnpublished) => any = undefined;

    /**
     * (Optional) callback invoked when receiving a message.
     * @type {undefined}
     */
    private onNotificationMessageReceivedCallback: (params: INotificationMessageReceived) => any = undefined;

    /**
     * (Optional) callback invoked when a media error occurs.
     * @type {any}
     */
    private onNotificationMediaErrorCallback: (params: INotificationMediaError) => any = undefined;

    public constructor(kasUri: string) {
        this.kasUri = kasUri;
    }

    /**
     * Connects to the KAS
     */
    public connect = (): void => {
        if (this.state !== KASConnectionConstants.CONNECTION_STATES.OFFLINE) {
            console.warn("Client already connected to the KAS");
            return;
        }

        // Build the configuration object
        const config: Object = {
            heartbeat: this.heartbeatRate,
            sendCloseMessage: false,
            ws: {
                uri: this.kasUri,
                useSockJS: false,
                onconnected: this.connectCallback,
                ondisconnect: this.disconnectCallback,
                onreconnecting: this.reconnectingCallback,
                onreconnected: this.reconnectedCallback
            },
            rpc: {
                requestTimeout: this.requestTimeout,

                // Notifications
                participantJoined: this.onParticipantJoined,
                participantLeft: this.onParticipantLeft,
                participantEvicted: this.onParticipantEvicted,
                participantPublished: this.onParticipantPublished,
                participantUnpublished: this.onParticipantUnpublished,
                iceCandidate: this.onICECandidate,
                sendMessage: this.onMessageReceived,
                mediaError: this.onMediaError
            }
        };

        this.jsonRpcClient = new RpcBuilder.clients.JsonRpcClient(config);
    };

    /**
     * Closes the connection (if any) to the KAS.
     */
    public disconnect = (): void => {
        if (this.state !== KASConnectionConstants.CONNECTION_STATES.CONNECTED) {
            console.warn("Client already disconnected to KAS");
            return;
        }

        this.state = KASConnectionConstants.CONNECTION_STATES.OFFLINE;
        this.jsonRpcClient.close();
        this.jsonRpcClient = undefined;

        // Invoke the callback
        if (this.onStatusChangedCallback !== undefined) {
            this.onStatusChangedCallback();
        }
    };

    /**
     * Sends a request having the given method and parameters.
     *
     * @param method
     * @param params
     * @param callback
     */
    public sendRequest = (method: string, params: Object, callback: (error: any, response: Object) => any): void => {
        if (this.state !== KASConnectionConstants.CONNECTION_STATES.CONNECTED) {
            const error: any = {
                "message": "Client is not connected to the KAS"
            };

            console.warn(error.message);
            callback(error, undefined);
            return;
        }

        // Clip undefined or null values
        params = params || {};

        // Add the rpc parameters to the request
        if (this.rpcParams !== undefined) {
            for (var index in this.rpcParams) {
                if (this.rpcParams.hasOwnProperty(index)) {
                    params[index] = this.rpcParams[index];
                }
            }
        }

        // Send it
        // console.trace('Sending request: { method:"' + method + '", params: ' + JSON.stringify(params) + ' }');
        this.jsonRpcClient.send(method, params, callback);
    };

    private connectCallback = (error: Object): void => {
        // There is a bug in webSocketWithReconnection.js
        // The ws.onerror(evt) parameter does not have a data object!
        if (error) {
            this.state = KASConnectionConstants.CONNECTION_STATES.OFFLINE;

            // Invoke the callback
            if (this.onStatusChangedCallback !== undefined) {
                this.onStatusChangedCallback();
            }

            return;
        }

        this.state = KASConnectionConstants.CONNECTION_STATES.CONNECTED;

        // Invoke the callback
        if (this.onStatusChangedCallback !== undefined) {
            this.onStatusChangedCallback();
        }
    };

    private disconnectCallback = (): void => {
        console.warn('Websocket connection lost');

        // TODO: Does jsonRpcClient try to connect again? If so, we should not dispose the jsonRpcClient object!
        this.state = KASConnectionConstants.CONNECTION_STATES.OFFLINE;
        this.jsonRpcClient = undefined;

        // Invoke the callback
        if (this.onStatusChangedCallback !== undefined) {
            this.onStatusChangedCallback();
        }
    };

    private reconnectingCallback = (): void => {
        this.state = KASConnectionConstants.CONNECTION_STATES.RECONNECTING;

        // Invoke the callback
        if (this.onStatusChangedCallback !== undefined) {
            this.onStatusChangedCallback();
        }
    };

    private reconnectedCallback = (): void => {
        this.state = KASConnectionConstants.CONNECTION_STATES.CONNECTED;

        // Invoke the callback
        if (this.onStatusChangedCallback !== undefined) {
            this.onStatusChangedCallback();
        }
    };

    // Notifications wrappers
    private onParticipantJoined = (params: INotificationParticipantJoined): void => {
        if (this.onNotificationParticipantJoinedCallback !== undefined) {
            this.onNotificationParticipantJoinedCallback(params);
        }
    };

    private onParticipantLeft = (params: INotificationParticipantLeft): void => {
        if (this.onNotificationParticipantLeftCallback !== undefined) {
            this.onNotificationParticipantLeftCallback(params);
        }
    };

    private onParticipantEvicted = (params: INotificationParticipantEvicted): void => {
        if (this.onNotificationParticipantEvictedCallback !== undefined) {
            this.onNotificationParticipantEvictedCallback(params);
        }
    };

    private onParticipantPublished = (params: INotificationParticipantPublished): void => {
        if (this.onNotificationParticipantPublishedCallback !== undefined) {
            this.onNotificationParticipantPublishedCallback(params);
        }
    };

    private onParticipantUnpublished = (params: INotificationParticipantUnpublished): void => {
        if (this.onNotificationParticipantUnpublishedCallback !== undefined) {
            this.onNotificationParticipantUnpublishedCallback(params);
        }
    };

    private onICECandidate = (params: INotificationReceiveICECandidate): void => {
        if (this.onNotificationReceiveICECandidateCallback !== undefined) {
            this.onNotificationReceiveICECandidateCallback(params);
        }
    };

    private onMessageReceived = (params: INotificationMessageReceived): void => {
        if (this.onNotificationMessageReceivedCallback !== undefined) {
            this.onNotificationMessageReceivedCallback(params);
        }
    };

    private onMediaError = (params: INotificationMediaError): void => {
        if (this.onNotificationMediaErrorCallback !== undefined) {
            this.onNotificationMediaErrorCallback(params);
        }
    };

    /**
     * Returns the current connection state
     * @returns {string}
     */
    public getState = (): string => {
        return this.state;
    };

    public setHeartbeatRate = (heartbeatRate: number): void => {
        this.heartbeatRate = heartbeatRate;
    };

    public setRequestTimeout = (requestTimeout: number): void => {
        this.requestTimeout = requestTimeout;
    };

    public setOnStatusChangedCallback = (onStatusChangedCallback: Function): void => {
        this.onStatusChangedCallback = onStatusChangedCallback;
    };

    public setOnParticipantJoinedCallback = (onNotificationParticipantJoinedCallback: (params: INotificationParticipantJoined) => any): void => {
        this.onNotificationParticipantJoinedCallback = onNotificationParticipantJoinedCallback;
    };

    public setOnParticipantLeftCallback = (onNotificationParticipantLeftCallback: (params: INotificationParticipantLeft) => any): void => {
        this.onNotificationParticipantLeftCallback = onNotificationParticipantLeftCallback;
    };

    public setOnParticipantEvictedCallback = (onNotificationParticipantEvictedCallback: (params: INotificationParticipantEvicted) => any): void => {
        this.onNotificationParticipantEvictedCallback = onNotificationParticipantEvictedCallback;
    };

    public setOnParticipantPublishedCallback = (onNotificationParticipantPublishedCallback: (params: INotificationParticipantPublished) => any): void => {
        this.onNotificationParticipantPublishedCallback = onNotificationParticipantPublishedCallback;
    };

    public setOnReceiveICECandidateCallback = (onNotificationReceiveICECandidateCallback: (params: INotificationReceiveICECandidate) => any): void => {
        this.onNotificationReceiveICECandidateCallback = onNotificationReceiveICECandidateCallback;
    };

    public setOnParticipantUnpublishedCallback = (onNotificationParticipantUnpublishedCallback : (params: INotificationParticipantUnpublished) => any): void => {
        this.onNotificationParticipantUnpublishedCallback = onNotificationParticipantUnpublishedCallback;
    };

    public setOnMessageReceivedCallback = (onNotificationMessageReceivedCallback: (params: INotificationMessageReceived) => any): void => {
      this.onNotificationMessageReceivedCallback = onNotificationMessageReceivedCallback;
    };

    public setOnMediaErrorCallback = (onNotificationMediaErrorCallback: (params: INotificationMediaError) => any): void => {
        this.onNotificationMediaErrorCallback = onNotificationMediaErrorCallback;
    };

    public setRpcParams = (rpcParams: Object): void => {
        this.rpcParams = rpcParams;
    };
}