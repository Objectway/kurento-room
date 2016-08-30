define(["require", "exports", "./KASLocalWebRtcPeer", "./KASLocalStream", "./KASRemoteWebRtcPeer", "./KASStream"], function (require, exports, KASLocalWebRtcPeer_1, KASLocalStream_1, KASRemoteWebRtcPeer_1, KASStream_1) {
    "use strict";
    /**
     * @class KASParticipant
     * @description Represents a participant of a room with its streams and WebRtcPeers.
     * @author Danilo Arcidiacono
     */
    var KASParticipant = (function () {
        function KASParticipant(id, serverAPI) {
            var _this = this;
            /**
             * Streams published by the participant
             */
            this.publishedStreams = {};
            /**
             * Streams subscribed by the participant
             */
            this.subscribedStreams = {};
            /**
             * Tries to add a new local stream with the given options.
             * @param id
             * @param streamType
             * @param streamConstraints
             * @param iceOptions
             * @param thenCallback
             * @param catchCallback
             */
            this.addLocalStream = function (id, streamType, streamConstraints, iceOptions, thenCallback, catchCallback) {
                // Check for existing streams
                if (id in _this.publishedStreams) {
                    var error = {
                        "message": "Stream " + id + " already published by participant " + id
                    };
                    console.error(error.message);
                    if (catchCallback !== undefined) {
                        catchCallback(error);
                    }
                    return;
                }
                // Create a local stream
                var localStream = new KASLocalStream_1.KASLocalStream(id);
                localStream.setStreamType(streamType);
                // Request the user media
                localStream.requestUserMediaStream(streamConstraints, function () {
                    // Create the webrtc peer
                    var peer = new KASLocalWebRtcPeer_1.KASLocalWebRtcPeer(localStream, _this.serverAPI, _this);
                    // Setup the options
                    peer.setICEOptions(iceOptions);
                    peer.setOnICECandidateGeneratedCallback(function (candidate) {
                        var request = {
                            endpointName: _this.getId(),
                            streamId: localStream.getId(),
                            candidate: candidate.candidate,
                            sdpMid: candidate.sdpMid,
                            sdpMLineIndex: candidate.sdpMLineIndex
                        };
                        // TODO: Handle errors in ICE candidates
                        _this.serverAPI.sendICECandidate(request);
                    });
                    peer.setOnSDPOfferGeneratedCallback(function () {
                        // Add the stream object
                        _this.publishedStreams[id] = peer;
                        console.info("Created local stream stream id=", id, " type=", streamType, " streamConstraints=", streamConstraints, " iceOptions=", iceOptions);
                        // Notify the user only when the SDP offer is generated
                        // TODO: Should we wait for all local ICE candidates to be sent?
                        if (thenCallback !== undefined) {
                            thenCallback(peer);
                        }
                    });
                    // Begin the creation
                    peer.createKurentoPeer();
                }, function (error) {
                    console.error("Could not create local stream id=" + id + " type=" + streamType + " streamConstraints=" + JSON.stringify(streamConstraints) + " iceOptions=" + JSON.stringify(iceOptions));
                    if (catchCallback !== undefined) {
                        catchCallback(error);
                    }
                });
            };
            /**
             * Tries to add a new remote stream with the given options.
             * @param id
             * @param streamType
             * @param iceOptions
             * @param thenCallback
             * @param catchCallback
             */
            this.addRemoteStream = function (id, streamType, iceOptions, thenCallback, catchCallback) {
                // Check for existing streams
                if (id in _this.subscribedStreams) {
                    var error = {
                        "message": "Stream " + id + " already subscribed by participant " + id
                    };
                    console.error(error.message);
                    if (catchCallback !== undefined) {
                        catchCallback(error);
                    }
                    return;
                }
                // Create a remote stream (we do NOT obtain a stream here, but only when subscribe() will be called on the peer)
                var remoteStream = new KASStream_1.KASStream(id);
                remoteStream.setStreamObject(undefined);
                remoteStream.setStreamType(streamType);
                // Create the remote peer
                var peer = new KASRemoteWebRtcPeer_1.KASRemoteWebRtcPeer(remoteStream, _this.serverAPI, _this);
                // Setup the options
                peer.setICEOptions(iceOptions);
                peer.setOnICECandidateGeneratedCallback(function (candidate) {
                    var request = {
                        endpointName: _this.getId(),
                        streamId: remoteStream.getId(),
                        candidate: candidate.candidate,
                        sdpMid: candidate.sdpMid,
                        sdpMLineIndex: candidate.sdpMLineIndex
                    };
                    // TODO: Handle errors in ICE candidates
                    _this.serverAPI.sendICECandidate(request);
                });
                peer.setOnSDPOfferGeneratedCallback(function () {
                    // Add the stream object
                    _this.subscribedStreams[id] = peer;
                    console.info("Created remote stream stream id=", id, " type=", streamType);
                    // Notify the user only when the SDP offer is generated
                    // TODO: Should we wait for all local ICE candidates to be sent?
                    if (thenCallback !== undefined) {
                        thenCallback(peer);
                    }
                });
                // Begin the creation
                peer.createKurentoPeer();
            };
            /**
             * Callback called by the local peers to signal when they are disposed
             * @param streamId
             */
            this.localPeerDisposed = function (streamId) {
                // Remove the peer from the data structure
                delete _this.publishedStreams[streamId];
            };
            /**
             * Callback called by the remote peers to signal when they are disposed
             * @param streamId
             */
            this.remotePeerDisposed = function (streamId) {
                // Remove the peer from the data structure
                delete _this.subscribedStreams[streamId];
            };
            /**
             * Disposes the participant
             */
            this.dispose = function () {
                // We need to copy the stream ids because dispose calls this.localPeerDisposed() which
                // removes elements from this.publishedStreams
                var publishedStreamsIds = Object.keys(_this.publishedStreams);
                for (var i = 0; i < publishedStreamsIds.length; i++) {
                    _this.publishedStreams[publishedStreamsIds[i]].dispose();
                }
                // We need to copy the stream ids because dispose calls this.remotePeerDisposed() which
                // removes elements from this.subscribedStreams
                var subscribedStreamsIds = Object.keys(_this.subscribedStreams);
                for (var i = 0; i < subscribedStreamsIds.length; i++) {
                    _this.subscribedStreams[subscribedStreamsIds[i]].dispose();
                }
            };
            this.getId = function () {
                return _this.id;
            };
            this.getPublishedPeerByStreamId = function (streamId) {
                return _this.publishedStreams[streamId];
            };
            this.getSubscribedPeerByStreamId = function (streamId) {
                return _this.subscribedStreams[streamId];
            };
            this.getPeerByStreamId = function (streamId) {
                return _this.getPublishedPeerByStreamId(streamId) || _this.getSubscribedPeerByStreamId(streamId);
            };
            this.id = id;
            this.serverAPI = serverAPI;
        }
        return KASParticipant;
    }());
    exports.KASParticipant = KASParticipant;
});
