define(["require", "exports", "./KASServerAPI", "./KASRoom"], function (require, exports, KASServerAPI_1, KASRoom_1) {
    "use strict";
    /**
     * @class KASServer
     * @description Main class that interfaces with the Kurento Application Server. It handles rooms and participants.
     *              It users a KASConnection but it does NOT manage its lifecycle (connect, disconnect).
     * @author Danilo Arcidiacono
     */
    var KASServer = (function () {
        function KASServer(connection) {
            var _this = this;
            /**
             * ICE options (used when subscribing to remote sterams)
             */
            this.iceOptions = {
                forceTurn: false
            };
            /**
             * Rooms
             * TODO: For now, there can be only one room per connection
             */
            this.rooms = {};
            /**
             * Id of the participant associated to the connectio
             * TODO: For now, there can be only one user per connection
             */
            this.localParticipantId = undefined;
            /**
             * (Optional) callback invoked when a new message is received.
             * @type {undefined}
             */
            this.onMessageReceivedCallback = undefined;
            /**
             * (Optional) callback invoked when subscribing to a new remote stream
             * @type {undefined}
             */
            this.onRemoteStreamSubscribedCallback = undefined;
            /**
             * (Optional) callback invoked when a remote peer unpublishes his steram
             * @type {undefined}
             */
            this.onRemoteStreamUnpublishedCallback = undefined;
            /**
             * Tries to join a room with the given id on behalf of the given username.
             */
            this.joinRoom = function (roomId, username, thenCallback, catchCallback) {
                // TODO: For now, there can be only one room per connection
                if (Object.keys(_this.rooms).length != 0) {
                    var error = {
                        "message:": "A room has already been joined"
                    };
                    if (catchCallback !== undefined) {
                        catchCallback(error);
                    }
                    // Stop
                    return;
                }
                var request = {
                    "user": username,
                    "room": roomId,
                    "dataChannels": true
                };
                _this.serverAPI.sendJoinRoom(request, function (response) {
                    // Add the room
                    var room = new KASRoom_1.KASRoom(roomId, _this.serverAPI);
                    _this.rooms[roomId] = room;
                    // TODO: For now, there can be only one room per connection
                    // Store the local participant id
                    _this.localParticipantId = username;
                    // Add myself
                    room.addParticipant(username);
                    // Add the existing participants to the room
                    for (var i = 0; i < response.value.length; i++) {
                        var remoteParticipant = room.addParticipant(response.value[i].id);
                    }
                }, function (error) {
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
            this.leaveRoom = function (roomId, username, thenCallback, catchCallback) {
                // TODO: For now, there can be only one room per connection
                if (Object.keys(_this.rooms).length !== 1) {
                    var error = {
                        "message:": "No room has been joined"
                    };
                    if (catchCallback !== undefined) {
                        catchCallback(error);
                    }
                    // Stop
                    return;
                }
                var request = {};
                // Dispose the room
                // TODO: For now, there can be only one room per connection
                var room = _this.getOnlyRoom();
                room.dispose();
                _this.serverAPI.sendLeaveRoom(request, function (response) {
                    // TODO: For now, there can be only one room per connection
                    _this.rooms = {};
                }, function (error) {
                    if (catchCallback !== undefined) {
                        catchCallback(error);
                    }
                });
            };
            /**
             * Disposes the rooms
             */
            this.dispose = function () {
                // Leave each room
                // TODO: For now, there can be only one room per connection
                _this.leaveRoom(_this.getOnlyRoom().getId(), _this.getOnlyParticipantId());
            };
            this.onParticipantJoined = function (params) {
                console.info("Participant " + params.id + " joined");
                var room = _this.getOnlyRoom();
                room.addParticipant(params.id);
            };
            this.onParticipantLeft = function (params) {
                console.info("Participant " + params.name + " has left");
                var room = _this.getOnlyRoom();
                room.removeParticipant(params.name);
            };
            this.onParticipantEvicted = function (params) {
                console.info("You have been evicted by the KAS");
                // TODO: For now, there can be only one room/participant per connection
                var room = _this.getOnlyRoom();
                var participant = room.removeParticipant(_this.getOnlyParticipantId());
            };
            this.onParticipantPublished = function (params) {
                console.info("Published ", params);
                // TODO: For now, there can be only one room/participant per connection
                var room = _this.getOnlyRoom();
                // Get existing participant or create a new one
                var participant = room.getParticipantById(params.id) || room.addParticipant(params.id);
                // Add the new remote stream
                for (var i = 0; i < params.streams.length; i++) {
                    participant.addRemoteStream(params.streams[i].id, params.streams[i].streamType, _this.iceOptions, function (peer) {
                        if (true) {
                            // TODO: For now, there can be only one room/participant per connection
                            peer.subscribe(function () {
                                if (_this.onRemoteStreamSubscribedCallback !== undefined) {
                                    _this.onRemoteStreamSubscribedCallback(participant, peer);
                                }
                            }, function (error) {
                                console.error(error);
                            });
                        }
                    }, function (error) {
                    });
                }
            };
            this.onReceiveICECandidate = function (params) {
                var candidate = {
                    candidate: params.candidate,
                    sdpMid: params.sdpMid,
                    sdpMLineIndex: params.sdpMLineIndex
                };
                // TODO: For now, there can be only one room/participant per connection
                var participant = _this.getOnlyRoom().getParticipantById(params.endpointName);
                if (participant === undefined) {
                    console.error("Participant not found for endpoint " + params.endpointName + ". Ice candidate will be ignored.", candidate);
                    return;
                }
                participant.getPeerByStreamId(params.streamId).getWebRtcPeer().addIceCandidate(candidate, function (error) {
                    if (error) {
                        console.error("Error adding candidate for " + params.streamId
                            + " stream of endpoint " + params.endpointName
                            + ": " + error);
                        return;
                    }
                });
            };
            this.onParticipantUnpublished = function (params) {
                console.info("unpublished ", params);
                // TODO: For now, there can be only one room/participant per connection
                var participant = _this.getOnlyRoom().getParticipantById(params.name);
                var peer = participant.getSubscribedPeerByStreamId(params.streamId);
                if (peer !== undefined) {
                    // Save the streamId (the stream reference inside peer will be set to undefined by unsubscribe())
                    var streamId = peer.getStream().getId();
                    // Note: This is not needed (from the KMS point of view), because the subscriber endpoints are
                    // already released when the remote peer calls unpublishMedia(). However, we still call unsubscribe() here
                    // because we need to reset our internal data structures (the KMS will simply notify that "there is no such subscriber endpoint").
                    peer.unsubscribe();
                    if (_this.onRemoteStreamUnpublishedCallback !== undefined) {
                        _this.onRemoteStreamUnpublishedCallback(participant, streamId, peer);
                    }
                }
                else {
                    console.warn("Received unpublished for not subscribed video");
                }
            };
            this.onMessageReceived = function (params) {
                if (_this.onMessageReceivedCallback !== undefined) {
                    _this.onMessageReceivedCallback(params);
                }
            };
            this.onMediaError = function (params) {
                console.info("media error ", params);
            };
            this.setIceOptions = function (iceOptions) {
                _this.iceOptions = iceOptions;
            };
            this.setOnMessageReceivedCallback = function (onMessageReceivedCallback) {
                _this.onMessageReceivedCallback = onMessageReceivedCallback;
            };
            this.setOnRemoteStreamSubscribedCallback = function (onRemoteStreamSubscribedCallback) {
                _this.onRemoteStreamSubscribedCallback = onRemoteStreamSubscribedCallback;
            };
            this.setOnRemoteStreamUnpublishedCallback = function (onRemoteStreamUnpublishedCallback) {
                _this.onRemoteStreamUnpublishedCallback = onRemoteStreamUnpublishedCallback;
            };
            /**
             * Returns the only room joined
             * TODO: Extend this mechanism
             */
            this.getOnlyRoom = function () {
                if (Object.keys(_this.rooms).length !== 1) {
                    return undefined;
                }
                return _this.rooms[Object.keys(_this.rooms)[0]];
            };
            /**
             * Returns the only participant id associated to the connection
             * TODO: Extend this mechanism
             */
            this.getOnlyParticipantId = function () {
                return _this.localParticipantId;
            };
            /**
             * Returns the only participant associated to the connection
             * TODO: Extend this mechanism
             */
            this.getOnlyParticipant = function () {
                return _this.getOnlyRoom().getParticipantById(_this.getOnlyParticipantId());
            };
            this.connection = connection;
            this.serverAPI = new KASServerAPI_1.KASServerAPI(connection);
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
        return KASServer;
    }());
    exports.KASServer = KASServer;
});
