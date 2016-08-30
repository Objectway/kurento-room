define(["require", "exports"], function (require, exports) {
    "use strict";
    var KASConnectionConstants = (function () {
        function KASConnectionConstants() {
        }
        Object.defineProperty(KASConnectionConstants, "CONNECTION_STATES", {
            get: function () {
                return {
                    OFFLINE: 'offline',
                    RECONNECTING: 'reconnecting',
                    CONNECTED: 'connected'
                };
            },
            enumerable: true,
            configurable: true
        });
        return KASConnectionConstants;
    }());
    exports.KASConnectionConstants = KASConnectionConstants;
    /**
     * @class KASConnection
     * @description This class handles the websocket messaging with the Kurento Application Server.
     *
     * @author Danilo Arcidiacono
     */
    var KASConnection = (function () {
        function KASConnection(kasUri) {
            var _this = this;
            /**
             * The frequency of the heartbeat (ping/pong) messages in milliseconds
             */
            this.heartbeatRate = 3000;
            /**
             * The timeout of each websocket request in milliseconds
             */
            this.requestTimeout = 15000;
            /**
             * Additional parameters to include in each websocket request
             */
            this.rpcParams = undefined;
            /**
             * Connection state (one of KASConnectionConstants.CONNECTION_STATES)
             */
            this.state = KASConnectionConstants.CONNECTION_STATES.OFFLINE;
            /**
             * (Optional) callback invoked when the connection state changes.
             * @type {any}
             */
            this.onStatusChangedCallback = undefined;
            /**
             * (Optional) callback invoked when (another) participant has joined a room.
             * @type {any}
             */
            this.onNotificationParticipantJoinedCallback = undefined;
            /**
             * (Optional) callback invoked when (another) participant has left a room.
             * @type {any}
             */
            this.onNotificationParticipantLeftCallback = undefined;
            /**
             * (Optional) callback invoked when (the) participant has been evicted.
             * @type {any}
             */
            this.onNotificationParticipantEvictedCallback = undefined;
            /**
             * (Optional) callback invoked when (another) participant has published a stream
             * @type {any}
             */
            this.onNotificationParticipantPublishedCallback = undefined;
            /**
             * (Optional) callback invoked when receiving an ICE candidate for a specific endpoint
             * @type {any}
             */
            this.onNotificationReceiveICECandidateCallback = undefined;
            /**
             * (Optional) callback invoked when (another) participant has unpublished a stream
             * @type {any}
             */
            this.onNotificationParticipantUnpublishedCallback = undefined;
            /**
             * (Optional) callback invoked when receiving a message.
             * @type {undefined}
             */
            this.onNotificationMessageReceivedCallback = undefined;
            /**
             * (Optional) callback invoked when a media error occurs.
             * @type {any}
             */
            this.onNotificationMediaErrorCallback = undefined;
            /**
             * Connects to the KAS
             */
            this.connect = function () {
                if (_this.state !== KASConnectionConstants.CONNECTION_STATES.OFFLINE) {
                    console.warn("Client already connected to the KAS");
                    return;
                }
                // Build the configuration object
                var config = {
                    heartbeat: _this.heartbeatRate,
                    sendCloseMessage: false,
                    ws: {
                        uri: _this.kasUri,
                        useSockJS: false,
                        onconnected: _this.connectCallback,
                        ondisconnect: _this.disconnectCallback,
                        onreconnecting: _this.reconnectingCallback,
                        onreconnected: _this.reconnectedCallback
                    },
                    rpc: {
                        requestTimeout: _this.requestTimeout,
                        // Notifications
                        participantJoined: _this.onParticipantJoined,
                        participantLeft: _this.onParticipantLeft,
                        participantEvicted: _this.onParticipantEvicted,
                        participantPublished: _this.onParticipantPublished,
                        participantUnpublished: _this.onParticipantUnpublished,
                        iceCandidate: _this.onICECandidate,
                        sendMessage: _this.onMessageReceived,
                        mediaError: _this.onMediaError
                    }
                };
                _this.jsonRpcClient = new RpcBuilder.clients.JsonRpcClient(config);
            };
            /**
             * Closes the connection (if any) to the KAS.
             */
            this.disconnect = function () {
                if (_this.state !== KASConnectionConstants.CONNECTION_STATES.CONNECTED) {
                    console.warn("Client already disconnected to KAS");
                    return;
                }
                _this.state = KASConnectionConstants.CONNECTION_STATES.OFFLINE;
                _this.jsonRpcClient.close();
                _this.jsonRpcClient = undefined;
                // Invoke the callback
                if (_this.onStatusChangedCallback !== undefined) {
                    _this.onStatusChangedCallback();
                }
            };
            /**
             * Sends a request having the given method and parameters.
             *
             * @param method
             * @param params
             * @param callback
             */
            this.sendRequest = function (method, params, callback) {
                if (_this.state !== KASConnectionConstants.CONNECTION_STATES.CONNECTED) {
                    var error = {
                        "message": "Client is not connected to the KAS"
                    };
                    console.warn(error.message);
                    callback(error, undefined);
                    return;
                }
                // Clip undefined or null values
                params = params || {};
                // Add the rpc parameters to the request
                if (_this.rpcParams !== undefined) {
                    for (var index in _this.rpcParams) {
                        if (_this.rpcParams.hasOwnProperty(index)) {
                            params[index] = _this.rpcParams[index];
                        }
                    }
                }
                // Send it
                console.trace('Sending request: { method:"' + method + '", params: ' + JSON.stringify(params) + ' }');
                _this.jsonRpcClient.send(method, params, callback);
            };
            this.connectCallback = function (error) {
                // There is a bug in webSocketWithReconnection.js
                // The ws.onerror(evt) parameter does not have a data object!
                if (error) {
                    _this.state = KASConnectionConstants.CONNECTION_STATES.OFFLINE;
                    // Invoke the callback
                    if (_this.onStatusChangedCallback !== undefined) {
                        _this.onStatusChangedCallback();
                    }
                    return;
                }
                _this.state = KASConnectionConstants.CONNECTION_STATES.CONNECTED;
                // Invoke the callback
                if (_this.onStatusChangedCallback !== undefined) {
                    _this.onStatusChangedCallback();
                }
            };
            this.disconnectCallback = function () {
                console.warn('Websocket connection lost');
                // TODO: Does jsonRpcClient try to connect again? If so, we should not dispose the jsonRpcClient object!
                _this.state = KASConnectionConstants.CONNECTION_STATES.OFFLINE;
                _this.jsonRpcClient = undefined;
                // Invoke the callback
                if (_this.onStatusChangedCallback !== undefined) {
                    _this.onStatusChangedCallback();
                }
            };
            this.reconnectingCallback = function () {
                _this.state = KASConnectionConstants.CONNECTION_STATES.RECONNECTING;
                // Invoke the callback
                if (_this.onStatusChangedCallback !== undefined) {
                    _this.onStatusChangedCallback();
                }
            };
            this.reconnectedCallback = function () {
                _this.state = KASConnectionConstants.CONNECTION_STATES.CONNECTED;
                // Invoke the callback
                if (_this.onStatusChangedCallback !== undefined) {
                    _this.onStatusChangedCallback();
                }
            };
            // Notifications wrappers
            this.onParticipantJoined = function (params) {
                if (_this.onNotificationParticipantJoinedCallback !== undefined) {
                    _this.onNotificationParticipantJoinedCallback(params);
                }
            };
            this.onParticipantLeft = function (params) {
                if (_this.onNotificationParticipantLeftCallback !== undefined) {
                    _this.onNotificationParticipantLeftCallback(params);
                }
            };
            this.onParticipantEvicted = function (params) {
                if (_this.onNotificationParticipantEvictedCallback !== undefined) {
                    _this.onNotificationParticipantEvictedCallback(params);
                }
            };
            this.onParticipantPublished = function (params) {
                if (_this.onNotificationParticipantPublishedCallback !== undefined) {
                    _this.onNotificationParticipantPublishedCallback(params);
                }
            };
            this.onParticipantUnpublished = function (params) {
                if (_this.onNotificationParticipantUnpublishedCallback !== undefined) {
                    _this.onNotificationParticipantUnpublishedCallback(params);
                }
            };
            this.onICECandidate = function (params) {
                if (_this.onNotificationReceiveICECandidateCallback !== undefined) {
                    _this.onNotificationReceiveICECandidateCallback(params);
                }
            };
            this.onMessageReceived = function (params) {
                if (_this.onNotificationMessageReceivedCallback !== undefined) {
                    _this.onNotificationMessageReceivedCallback(params);
                }
            };
            this.onMediaError = function (params) {
                if (_this.onNotificationMediaErrorCallback !== undefined) {
                    _this.onNotificationMediaErrorCallback(params);
                }
            };
            /**
             * Returns the current connection state
             * @returns {string}
             */
            this.getState = function () {
                return _this.state;
            };
            this.setHeartbeatRate = function (heartbeatRate) {
                _this.heartbeatRate = heartbeatRate;
            };
            this.setRequestTimeout = function (requestTimeout) {
                _this.requestTimeout = requestTimeout;
            };
            this.setOnStatusChangedCallback = function (onStatusChangedCallback) {
                _this.onStatusChangedCallback = onStatusChangedCallback;
            };
            this.setOnParticipantJoinedCallback = function (onNotificationParticipantJoinedCallback) {
                _this.onNotificationParticipantJoinedCallback = onNotificationParticipantJoinedCallback;
            };
            this.setOnParticipantLeftCallback = function (onNotificationParticipantLeftCallback) {
                _this.onNotificationParticipantLeftCallback = onNotificationParticipantLeftCallback;
            };
            this.setOnParticipantEvictedCallback = function (onNotificationParticipantEvictedCallback) {
                _this.onNotificationParticipantEvictedCallback = onNotificationParticipantEvictedCallback;
            };
            this.setOnParticipantPublishedCallback = function (onNotificationParticipantPublishedCallback) {
                _this.onNotificationParticipantPublishedCallback = onNotificationParticipantPublishedCallback;
            };
            this.setOnReceiveICECandidateCallback = function (onNotificationReceiveICECandidateCallback) {
                _this.onNotificationReceiveICECandidateCallback = onNotificationReceiveICECandidateCallback;
            };
            this.setOnParticipantUnpublishedCallback = function (onNotificationParticipantUnpublishedCallback) {
                _this.onNotificationParticipantUnpublishedCallback = onNotificationParticipantUnpublishedCallback;
            };
            this.setOnMessageReceivedCallback = function (onNotificationMessageReceivedCallback) {
                _this.onNotificationMessageReceivedCallback = onNotificationMessageReceivedCallback;
            };
            this.setOnMediaErrorCallback = function (onNotificationMediaErrorCallback) {
                _this.onNotificationMediaErrorCallback = onNotificationMediaErrorCallback;
            };
            this.setRpcParams = function (rpcParams) {
                _this.rpcParams = rpcParams;
            };
            this.kasUri = kasUri;
        }
        return KASConnection;
    }());
    exports.KASConnection = KASConnection;
});
