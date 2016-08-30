define(["require", "exports", "./KASStream"], function (require, exports, KASStream_1) {
    "use strict";
    var KASRemoteWebRtcPeerConstants = (function () {
        function KASRemoteWebRtcPeerConstants() {
        }
        Object.defineProperty(KASRemoteWebRtcPeerConstants, "STATES", {
            get: function () {
                return {
                    INITIALIZED: 'initialized',
                    PEERCREATED: 'peercreated',
                    SUBSCRIBED: 'subscribed',
                    DISPOSED: 'disposed'
                };
            },
            enumerable: true,
            configurable: true
        });
        return KASRemoteWebRtcPeerConstants;
    }());
    exports.KASRemoteWebRtcPeerConstants = KASRemoteWebRtcPeerConstants;
    /**
     * @class KASRemoteWebRtcPeer
     * @description Represents a WebRtcPeer attached to a remote stream that generates an SDP offer and exchanges ICE candidates with the KAS.
     *
     * @author Danilo Arcidiacono
     */
    var KASRemoteWebRtcPeer = (function () {
        function KASRemoteWebRtcPeer(stream, serverAPI, participant) {
            var _this = this;
            /**
             * Internal state of the stream (one of KASLocalWebRtcPeerConstants.STATES)
             */
            this.state = KASRemoteWebRtcPeerConstants.STATES.INITIALIZED;
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
                if (_this.state !== KASRemoteWebRtcPeerConstants.STATES.INITIALIZED) {
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
                // Create the webrtc peer
                var offerConstraints = {
                    mandatory: {
                        OfferToReceiveVideo: _this.stream.getStreamType() === KASStream_1.KASStreamConstants.STREAM_TYPE.VIDEO ||
                            _this.stream.getStreamType() === KASStream_1.KASStreamConstants.STREAM_TYPE.SCREEN,
                        OfferToReceiveAudio: _this.stream.getStreamType() === KASStream_1.KASStreamConstants.STREAM_TYPE.AUDIO ||
                            _this.stream.getStreamType() === KASStream_1.KASStreamConstants.STREAM_TYPE.VIDEO ||
                            _this.stream.getStreamType() === KASStream_1.KASStreamConstants.STREAM_TYPE.SCREEN
                    }
                };
                console.debug("Constraints of generate SDP offer (subscribing)", offerConstraints);
                var options = {
                    onicecandidate: _this.onIceCandidate,
                    connectionConstraints: offerConstraints,
                    iceTransportPolicy: _this.iceOptions.forceTurn === true ? 'relay' : 'all',
                    configuration: {
                        iceServers: iceServers
                    }
                };
                _this.webRtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, function (error) {
                    if (error) {
                        return console.error(error);
                    }
                    _this.webRtcPeer.generateOffer(_this.onOfferGenerated);
                });
                // Change state
                _this.state = KASRemoteWebRtcPeerConstants.STATES.PEERCREATED;
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
                console.trace('Remote ICE Candidate for ', _this.stream.getId(), ' received: ', candidate);
                _this.iceCandidates.push(candidate);
                // Invoke the callback if set
                if (_this.onICECandidateGeneratedCallback !== undefined) {
                    _this.onICECandidateGeneratedCallback(candidate);
                }
            };
            /**
             * Tries to subscribe to this remote peer
             * @param thenCallback
             * @param catchCallback
             */
            this.subscribe = function (thenCallback, catchCallback) {
                var senderName = _this.participant.getId();
                // Check the state
                if (_this.state !== KASRemoteWebRtcPeerConstants.STATES.PEERCREATED) {
                    var error = {
                        "message": "Invalid internal state, expected " + KASRemoteWebRtcPeerConstants.STATES.PEERCREATED + " got " + _this.state
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
                    "sender": senderName,
                    "sdpOffer": _this.sdpOffer,
                    "streamId": _this.stream.getId(),
                };
                _this.serverAPI.sendReceiveVideoFrom(request, function (response) {
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
                        _this.stream.setStreamObject(remoteStream);
                        if (thenCallback !== undefined) {
                            thenCallback();
                            // Change state
                            _this.state = KASRemoteWebRtcPeerConstants.STATES.SUBSCRIBED;
                        }
                    }, function (error) {
                        console.error(_this.stream.getId() + ": Error setting SDP to the peer connection: " + JSON.stringify(error));
                        if (catchCallback !== undefined) {
                            catchCallback(error);
                        }
                    });
                }, function (error) {
                    console.error("Error in subscribing ", error);
                    if (catchCallback !== undefined) {
                        catchCallback(error);
                    }
                });
            };
            /**
             * Tries to unsubscribe from the peer
             * @param thenCallback
             * @param catchCallback
             */
            this.unsubscribe = function (thenCallback, catchCallback) {
                var senderName = _this.participant.getId();
                // Check the state
                if (_this.state !== KASRemoteWebRtcPeerConstants.STATES.SUBSCRIBED) {
                    var error = {
                        "message": "Invalid internal state, expected " + KASRemoteWebRtcPeerConstants.STATES.SUBSCRIBED + " got " + _this.state
                    };
                    console.warn(error);
                    if (catchCallback !== undefined) {
                        catchCallback(error);
                    }
                    return;
                }
                var streamId = _this.stream.getId();
                _this.internalDispose();
                console.debug("Stream '" + streamId + "' unsubscribed");
                var request = {
                    "sender": senderName,
                    "streamId": streamId
                };
                _this.serverAPI.sendUnsubscribeFrom(request, function (response) {
                    if (thenCallback !== undefined) {
                        thenCallback();
                    }
                }, function (error) {
                    console.error("Error in unsubscribing stream ", _this.stream.getId(), " error:", error);
                    if (catchCallback !== undefined) {
                        catchCallback(error);
                    }
                });
            };
            /**
             * Disposes the peer (eventually unsubscribing from the attached stream)
             */
            this.dispose = function () {
                if (_this.state === KASRemoteWebRtcPeerConstants.STATES.SUBSCRIBED) {
                    _this.unsubscribe();
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
                // Reset member variables (except for serverAPI and participant)
                _this.stream = undefined;
                _this.webRtcPeer = undefined;
                _this.sdpOffer = undefined;
                _this.sdpAnswer = undefined;
                _this.iceCandidates = [];
                _this.iceOptions = undefined;
                // Change state
                _this.state = KASRemoteWebRtcPeerConstants.STATES.DISPOSED;
                // Signal the participant that the peer has been disposed
                _this.participant.remotePeerDisposed(streamId);
            };
            this.isLocal = function () {
                return false;
            };
            this.getParticipant = function () {
                return _this.participant;
            };
            this.getWebRtcPeer = function () {
                return _this.webRtcPeer;
            };
            this.getStream = function () {
                return _this.stream;
            };
            this.getSDPOffer = function () {
                return _this.sdpOffer;
            };
            this.getSDPAnswer = function () {
                return _this.sdpAnswer;
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
        return KASRemoteWebRtcPeer;
    }());
    exports.KASRemoteWebRtcPeer = KASRemoteWebRtcPeer;
});
