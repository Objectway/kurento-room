define(["require", "exports", "./KASStream"], function (require, exports, KASStream_1) {
    "use strict";
    var KASLocalWebRtcPeerConstants = (function () {
        function KASLocalWebRtcPeerConstants() {
        }
        Object.defineProperty(KASLocalWebRtcPeerConstants, "STATES", {
            get: function () {
                return {
                    INITIALIZED: 'initialized',
                    PEERCREATED: 'peercreated',
                    PUBLISHED: 'published',
                    DISPOSED: 'disposed'
                };
            },
            enumerable: true,
            configurable: true
        });
        return KASLocalWebRtcPeerConstants;
    }());
    exports.KASLocalWebRtcPeerConstants = KASLocalWebRtcPeerConstants;
    /**
     * @class KASLocalWebRtcPeer
     * @description Represents a WebRtcPeer attached to a local stream that generates an SDP offer and exchanges ICE candidates with the KAS.
     *
     * @author Danilo Arcidiacono
     */
    var KASLocalWebRtcPeer = (function () {
        function KASLocalWebRtcPeer(stream, serverAPI, participant) {
            var _this = this;
            /**
             * Internal state of the stream (one of KASLocalWebRtcPeerConstants.STATES)
             */
            this.state = KASLocalWebRtcPeerConstants.STATES.INITIALIZED;
            /**
             * Remote loopback stream
             */
            this.remoteLoopbackStream = undefined;
            /**
             * The actual Kurento WebRtcPeer object
             */
            this.webRtcPeer = undefined;
            /**
             * The locally generated SDP offer
             * @type {any}
             */
            this.sdpOffer = undefined;
            /**
             * The remote generated SDP answer
             * @type {any}
             */
            this.sdpAnswer = undefined;
            /**
             * The gathered ICE candidates
             * @type {any}
             */
            this.iceCandidates = [];
            /**
             * ICE connectivity options (stun, turn)
             */
            this.iceOptions = undefined;
            /**
             * (Optional) callback called when the SDP offer has been generated
             * @type {any}
             */
            this.onSDPOfferGeneratedCallback = undefined;
            /**
             * (Optional) callback called when a ICE candidate is generated (or received)
             * @type {any}
             */
            this.onICECandidateGeneratedCallback = undefined;
            /**
             * Creates the webRtcPeer object based on the attached stream.
             */
            this.createKurentoPeer = function () {
                // Check the state
                if (_this.state !== KASLocalWebRtcPeerConstants.STATES.INITIALIZED) {
                    console.warn("Stream " + _this.stream.getId() + " webrtc peer already created");
                    return;
                }
                // Build the ice servers configuration object
                var iceServers = [];
                if (_this.iceOptions !== undefined) {
                    if (_this.iceOptions.stunUrl !== undefined) {
                        iceServers.push({ "url": _this.iceOptions.stunUrl });
                    }
                    if (_this.iceOptions.turnUrl !== undefined) {
                        // TODO: Right now if you specify the turn url you are forced to provide username and password as well
                        iceServers.push({ "url": _this.iceOptions.turnUrl,
                            "username": _this.iceOptions.turnUsername,
                            "credential": _this.iceOptions.turnPassword });
                    }
                }
                // Create the local peer
                var options = {
                    videoStream: _this.stream.getStreamObject(),
                    audioStreams: _this.stream.getStreamObject(),
                    onicecandidate: _this.onIceCandidate,
                    iceTransportPolicy: _this.iceOptions.forceTurn === true ? 'relay' : 'all',
                    configuration: {
                        iceServers: iceServers
                    }
                };
                if (true) {
                    _this.webRtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options, function (error) {
                        if (error) {
                            return console.error(error);
                        }
                        _this.webRtcPeer.generateOffer(_this.onOfferGenerated);
                    });
                }
                else {
                    _this.webRtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options, function (error) {
                        if (error) {
                            return console.error(error);
                        }
                        _this.webRtcPeer.generateOffer(_this.onOfferGenerated);
                    });
                }
                // Change state
                _this.state = KASLocalWebRtcPeerConstants.STATES.PEERCREATED;
            };
            /**
             * Internal callback invoked when the SDP offer is generated.
             * @param error
             * @param sdpOfferParam
             * @param wp
             */
            this.onOfferGenerated = function (error, sdpOfferParam, wp) {
                if (error) {
                    return console.error("(publish) SDP offer error: " + JSON.stringify(error));
                }
                // Memorize the SDP offer
                _this.sdpOffer = sdpOfferParam;
                // Invoke the callback if set
                if (_this.onSDPOfferGeneratedCallback !== undefined) {
                    _this.onSDPOfferGeneratedCallback();
                }
            };
            /**
             * Internal callback called when an ICE candidate is generated.
             */
            this.onIceCandidate = function (candidate) {
                // Store the ICE candidate
                console.trace('Local ICE Candidate for ', _this.stream.getId(), ' received: ', candidate);
                _this.iceCandidates.push(candidate);
                // Invoke the callback if set
                if (_this.onICECandidateGeneratedCallback !== undefined) {
                    _this.onICECandidateGeneratedCallback(candidate);
                }
            };
            /**
             * Tries to publish the local attached stream
             */
            this.publish = function (thenCallback, catchCallback) {
                // Check the state
                if (_this.state !== KASLocalWebRtcPeerConstants.STATES.PEERCREATED) {
                    var error = {
                        "message": "Invalid internal state, expected " + KASLocalWebRtcPeerConstants.STATES.PEERCREATED + " got " + _this.state
                    };
                    console.warn(error);
                    if (catchCallback !== undefined) {
                        catchCallback(error);
                    }
                    return;
                }
                if (_this.sdpOffer === undefined) {
                    var error = {
                        "message": "SDP offer not generated"
                    };
                    console.error(error.message);
                    if (catchCallback !== undefined) {
                        catchCallback(error);
                    }
                    return;
                }
                var request = {
                    "sdpOffer": _this.sdpOffer,
                    "streamId": _this.stream.getId(),
                    "streamType": _this.stream.getStreamType(),
                    "doLoopback": true
                };
                _this.serverAPI.sendPublishVideo(request, function (response) {
                    // Memorize the SDP answer
                    _this.sdpAnswer = response.sdpAnswer;
                    // Process the SDP answer
                    var answer = new RTCSessionDescription({
                        type: 'answer',
                        sdp: _this.sdpAnswer,
                    });
                    console.debug(_this.stream.getId() + ": set peer connection with recvd SDP answer", _this.sdpAnswer);
                    var pc = _this.webRtcPeer.peerConnection;
                    pc.setRemoteDescription(answer, function () {
                        var remoteStream = pc.getRemoteStreams()[0];
                        // Memorize the remote stream
                        _this.remoteLoopbackStream = new KASStream_1.KASStream(_this.stream.getId() + "-remote");
                        _this.remoteLoopbackStream.setStreamType(_this.stream.getStreamType());
                        _this.remoteLoopbackStream.setStreamObject(remoteStream);
                        if (thenCallback !== undefined) {
                            thenCallback();
                            // Change state
                            _this.state = KASLocalWebRtcPeerConstants.STATES.PUBLISHED;
                        }
                    }, function (error) {
                        console.error(_this.stream.getId() + ": Error setting SDP to the peer connection: " + JSON.stringify(error));
                        if (catchCallback !== undefined) {
                            catchCallback(error);
                        }
                    });
                }, function (error) {
                    console.error("Error in publishing ", error);
                    if (catchCallback !== undefined) {
                        catchCallback(error);
                    }
                });
            };
            /**
             * Tries to unpublish the video
             */
            this.unpublish = function (thenCallback, catchCallback) {
                // Check the state
                if (_this.state !== KASLocalWebRtcPeerConstants.STATES.PUBLISHED) {
                    var error = {
                        "message": "Invalid internal state, expected " + KASLocalWebRtcPeerConstants.STATES.PUBLISHED + " got " + _this.state
                    };
                    console.warn(error);
                    if (catchCallback !== undefined) {
                        catchCallback(error);
                    }
                    return;
                }
                var streamId = _this.stream.getId();
                _this.internalDispose();
                console.debug("Stream '" + streamId + "' unpublished");
                var request = {
                    "streamId": streamId
                };
                _this.serverAPI.sendUnpublishVideo(request, function (response) {
                    if (thenCallback !== undefined) {
                        thenCallback();
                    }
                }, function (error) {
                    console.error("Error in unpublishing stream ", _this.stream.getId(), " error:", error);
                    if (catchCallback !== undefined) {
                        catchCallback(error);
                    }
                });
            };
            /**
             * Disposes the peer (eventually unpublishing the attached stream)
             */
            this.dispose = function () {
                if (_this.state === KASLocalWebRtcPeerConstants.STATES.PUBLISHED) {
                    _this.unpublish();
                }
                else {
                    _this.internalDispose();
                }
            };
            /**
             * Version of dispose() that assumes that the stream is not published
             */
            this.internalDispose = function () {
                if (_this.webRtcPeer !== undefined) {
                    _this.webRtcPeer.dispose();
                }
                var streamId = _this.stream.getId();
                _this.stream.dispose();
                if (_this.remoteLoopbackStream !== undefined) {
                    _this.remoteLoopbackStream.dispose();
                }
                // Reset member variables (except for serverAPI and participant)
                _this.stream = undefined;
                _this.remoteLoopbackStream = undefined;
                _this.webRtcPeer = undefined;
                _this.sdpOffer = undefined;
                _this.sdpAnswer = undefined;
                _this.iceCandidates = [];
                _this.iceOptions = undefined;
                // Change state
                _this.state = KASLocalWebRtcPeerConstants.STATES.DISPOSED;
                // Signal the participant that the peer has been disposed
                _this.participant.localPeerDisposed(streamId);
            };
            this.isLocal = function () {
                return true;
            };
            this.getParticipant = function () {
                return _this.participant;
            };
            this.getWebRtcPeer = function () {
                return _this.webRtcPeer;
            };
            this.getStream = function () {
                return _this.remoteLoopbackStream || _this.stream;
            };
            this.getSDPOffer = function () {
                return _this.sdpOffer;
            };
            this.getSDPAnswer = function () {
                return _this.sdpAnswer;
            };
            this.getRemoteLoopbackStream = function () {
                return _this.remoteLoopbackStream;
            };
            this.setICEOptions = function (iceOptions) {
                _this.iceOptions = iceOptions;
            };
            this.setOnSDPOfferGeneratedCallback = function (onSDPOfferGeneratedCallback) {
                _this.onSDPOfferGeneratedCallback = onSDPOfferGeneratedCallback;
            };
            this.setOnICECandidateGeneratedCallback = function (onICECandidateGeneratedCallback) {
                _this.onICECandidateGeneratedCallback = onICECandidateGeneratedCallback;
            };
            this.stream = stream;
            this.serverAPI = serverAPI;
            this.participant = participant;
        }
        return KASLocalWebRtcPeer;
    }());
    exports.KASLocalWebRtcPeer = KASLocalWebRtcPeer;
});
