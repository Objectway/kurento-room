var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define("KASConnection", ["require", "exports"], function (require, exports) {
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
    var KASConnection = (function () {
        function KASConnection(kasUri) {
            var _this = this;
            this.heartbeatRate = 3000;
            this.requestTimeout = 15000;
            this.rpcParams = undefined;
            this.state = KASConnectionConstants.CONNECTION_STATES.OFFLINE;
            this.onStatusChangedCallback = undefined;
            this.onNotificationParticipantJoinedCallback = undefined;
            this.onNotificationParticipantLeftCallback = undefined;
            this.onNotificationParticipantEvictedCallback = undefined;
            this.onNotificationParticipantPublishedCallback = undefined;
            this.onNotificationReceiveICECandidateCallback = undefined;
            this.onNotificationParticipantUnpublishedCallback = undefined;
            this.onNotificationMessageReceivedCallback = undefined;
            this.onNotificationMediaErrorCallback = undefined;
            this.connect = function () {
                if (_this.state !== KASConnectionConstants.CONNECTION_STATES.OFFLINE) {
                    console.warn("Client already connected to the KAS");
                    return;
                }
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
            this.disconnect = function () {
                if (_this.state !== KASConnectionConstants.CONNECTION_STATES.CONNECTED) {
                    console.warn("Client already disconnected to KAS");
                    return;
                }
                _this.state = KASConnectionConstants.CONNECTION_STATES.OFFLINE;
                _this.jsonRpcClient.close();
                _this.jsonRpcClient = undefined;
                if (_this.onStatusChangedCallback !== undefined) {
                    _this.onStatusChangedCallback();
                }
            };
            this.sendRequest = function (method, params, callback) {
                if (_this.state !== KASConnectionConstants.CONNECTION_STATES.CONNECTED) {
                    var error = {
                        "message": "Client is not connected to the KAS"
                    };
                    console.warn(error.message);
                    callback(error, undefined);
                    return;
                }
                params = params || {};
                if (_this.rpcParams !== undefined) {
                    for (var index in _this.rpcParams) {
                        if (_this.rpcParams.hasOwnProperty(index)) {
                            params[index] = _this.rpcParams[index];
                        }
                    }
                }
                _this.jsonRpcClient.send(method, params, callback);
            };
            this.connectCallback = function (error) {
                if (error) {
                    _this.state = KASConnectionConstants.CONNECTION_STATES.OFFLINE;
                    if (_this.onStatusChangedCallback !== undefined) {
                        _this.onStatusChangedCallback();
                    }
                    return;
                }
                _this.state = KASConnectionConstants.CONNECTION_STATES.CONNECTED;
                if (_this.onStatusChangedCallback !== undefined) {
                    _this.onStatusChangedCallback();
                }
            };
            this.disconnectCallback = function () {
                console.warn('Websocket connection lost');
                _this.state = KASConnectionConstants.CONNECTION_STATES.OFFLINE;
                _this.jsonRpcClient = undefined;
                if (_this.onStatusChangedCallback !== undefined) {
                    _this.onStatusChangedCallback();
                }
            };
            this.reconnectingCallback = function () {
                _this.state = KASConnectionConstants.CONNECTION_STATES.RECONNECTING;
                if (_this.onStatusChangedCallback !== undefined) {
                    _this.onStatusChangedCallback();
                }
            };
            this.reconnectedCallback = function () {
                _this.state = KASConnectionConstants.CONNECTION_STATES.CONNECTED;
                if (_this.onStatusChangedCallback !== undefined) {
                    _this.onStatusChangedCallback();
                }
            };
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
define("KASStream", ["require", "exports"], function (require, exports) {
    "use strict";
    var KASStreamConstants = (function () {
        function KASStreamConstants() {
        }
        Object.defineProperty(KASStreamConstants, "STREAM_TYPE", {
            get: function () {
                return {
                    DATA: 'data',
                    AUDIO: 'audio',
                    VIDEO: 'video',
                    SCREEN: 'screen'
                };
            },
            enumerable: true,
            configurable: true
        });
        return KASStreamConstants;
    }());
    exports.KASStreamConstants = KASStreamConstants;
    var KASStream = (function () {
        function KASStream(id) {
            var _this = this;
            this.streamType = KASStreamConstants.STREAM_TYPE.DATA;
            this.userMediaStream = undefined;
            this.generateHTMLElement = function (id) {
                if (_this.getStreamType() === KASStreamConstants.STREAM_TYPE.AUDIO) {
                    var audio = document.createElement('audio');
                    audio.id = id || ('native-audio-' + _this.id);
                    audio.autoplay = true;
                    audio.controls = false;
                    audio.src = URL.createObjectURL(_this.userMediaStream);
                    return audio;
                }
                if (_this.getStreamType() === KASStreamConstants.STREAM_TYPE.VIDEO ||
                    _this.getStreamType() === KASStreamConstants.STREAM_TYPE.SCREEN) {
                    var video = document.createElement('video');
                    video.id = id || ('native-video-' + _this.id);
                    video.autoplay = true;
                    video.controls = false;
                    video.src = URL.createObjectURL(_this.userMediaStream);
                    return video;
                }
                return undefined;
            };
            this.dispose = function () {
                if (_this.userMediaStream !== undefined) {
                    _this.userMediaStream.getAudioTracks().forEach(function (track) {
                        track.stop && track.stop();
                    });
                    _this.userMediaStream.getVideoTracks().forEach(function (track) {
                        track.stop && track.stop();
                    });
                }
            };
            this.getId = function () {
                return _this.id;
            };
            this.getStreamType = function () {
                return _this.streamType;
            };
            this.getStreamObject = function () {
                return _this.userMediaStream;
            };
            this.setStreamType = function (streamType) {
                _this.streamType = streamType;
            };
            this.setStreamObject = function (userMediaStream) {
                _this.userMediaStream = userMediaStream;
            };
            this.id = id;
        }
        return KASStream;
    }());
    exports.KASStream = KASStream;
});
define("KASLocalStream", ["require", "exports", "KASStream"], function (require, exports, KASStream_1) {
    "use strict";
    ;
    var KASLocalStream = (function (_super) {
        __extends(KASLocalStream, _super);
        function KASLocalStream(id) {
            var _this = this;
            _super.call(this, id);
            this.userMediaConstraints = undefined;
            this.requestUserMediaStream = function (streamConstraints, thenCallback, catchCallback) {
                if (_this.streamType === KASStream_1.KASStreamConstants.STREAM_TYPE.AUDIO ||
                    _this.streamType === KASStream_1.KASStreamConstants.STREAM_TYPE.VIDEO) {
                    _this.requestAudioVideoUserMediaStream(streamConstraints, thenCallback, catchCallback);
                }
                if (_this.streamType === KASStream_1.KASStreamConstants.STREAM_TYPE.SCREEN) {
                    _this.requestScreenUserMediaStream(streamConstraints, thenCallback, catchCallback);
                }
            };
            this.requestAudioVideoUserMediaStream = function (streamConstraints, thenCallback, catchCallback) {
                _this.userMediaConstraints = {
                    audio: _this.streamType === KASStream_1.KASStreamConstants.STREAM_TYPE.AUDIO || _this.streamType === KASStream_1.KASStreamConstants.STREAM_TYPE.VIDEO,
                    video: _this.streamType === KASStream_1.KASStreamConstants.STREAM_TYPE.VIDEO
                };
                if (_this.userMediaConstraints.video === true &&
                    (streamConstraints.idealVideoWidth !== undefined ||
                        streamConstraints.idealVideoHeight !== undefined ||
                        streamConstraints.idealFrameRate !== undefined)) {
                    _this.userMediaConstraints.video = {};
                    if (streamConstraints.idealVideoWidth !== undefined) {
                        _this.userMediaConstraints.video.width = { ideal: streamConstraints.idealVideoWidth };
                    }
                    if (streamConstraints.idealVideoHeight !== undefined) {
                        _this.userMediaConstraints.video.height = { ideal: streamConstraints.idealVideoHeight };
                    }
                    if (streamConstraints.idealFrameRate !== undefined) {
                        _this.userMediaConstraints.video.frameRate = { ideal: streamConstraints.idealFrameRate };
                    }
                }
                if (_this.streamType === KASStream_1.KASStreamConstants.STREAM_TYPE.DATA) {
                    if (thenCallback !== undefined) {
                        thenCallback();
                    }
                }
                else {
                    getUserMedia(_this.userMediaConstraints, function (userStream) {
                        _this.userMediaStream = userStream;
                        if (thenCallback !== undefined) {
                            thenCallback();
                        }
                    }, function (error) {
                        console.error("Access denied", error, " with constraints ", _this.userMediaConstraints);
                        if (catchCallback !== undefined) {
                            catchCallback(error);
                        }
                    });
                }
            };
            this.requestScreenUserMediaStream = function (streamConstraints, thenCallback, catchCallback) {
                var isChrome = window.navigator.userAgent.match('Chrome') !== null;
                var isFirefox = window.navigator.userAgent.match('Firefox') !== null;
                if (isChrome === true) {
                    _this.requestScreenChromeUserMediaStream(streamConstraints, thenCallback, catchCallback);
                }
                else if (isFirefox === true) {
                    _this.requestScreenFirefoxUserMediaStream(streamConstraints, thenCallback, catchCallback);
                }
                else {
                    var error = "Unknown browser";
                    console.error("Access denied", error);
                    if (catchCallback !== undefined) {
                        catchCallback(error);
                    }
                }
            };
            this.requestScreenChromeUserMediaStream = function (streamConstraints, thenCallback, catchCallback) {
                if (sessionStorage.getScreenMediaJSExtensionId === undefined) {
                    var error = "No extension found";
                    console.error("Access denied", error);
                    if (catchCallback !== undefined) {
                        catchCallback(error);
                    }
                    return;
                }
                var params = {
                    type: 'getScreen',
                    id: 1
                };
                chrome.runtime.sendMessage(sessionStorage.getScreenMediaJSExtensionId, params, null, function (data) {
                    if (!data || data.sourceId === '') {
                        var error = "User has canceled";
                        console.error("Access denied: ", error);
                        if (catchCallback !== undefined) {
                            catchCallback(error);
                        }
                    }
                    else {
                        _this.userMediaConstraints = {
                            audio: false,
                            video: {
                                mandatory: {
                                    chromeMediaSource: 'desktop',
                                    chromeMediaSourceId: data.sourceId
                                },
                                optional: [
                                    { googLeakyBucket: true },
                                    { googTemporalLayeredScreencast: true }
                                ]
                            }
                        };
                        if (streamConstraints.idealVideoWidth !== undefined) {
                            _this.userMediaConstraints.video.width = { ideal: streamConstraints.idealVideoWidth };
                        }
                        if (streamConstraints.idealVideoHeight !== undefined) {
                            _this.userMediaConstraints.video.height = { ideal: streamConstraints.idealVideoHeight };
                        }
                        if (streamConstraints.idealFrameRate !== undefined) {
                            _this.userMediaConstraints.video.frameRate = { ideal: streamConstraints.idealFrameRate };
                        }
                        getUserMedia(_this.userMediaConstraints, function (userStream) {
                            _this.userMediaStream = userStream;
                            if (thenCallback !== undefined) {
                                thenCallback();
                            }
                        }, function (error) {
                            console.error("Access denied", error);
                            if (catchCallback !== undefined) {
                                catchCallback(error);
                            }
                        });
                    }
                });
            };
            this.requestScreenFirefoxUserMediaStream = function (streamConstraints, thenCallback, catchCallback) {
                var ffver = parseInt(window.navigator.userAgent.match(/Firefox\/(.*)/)[1], 10);
                if (ffver < 33) {
                    var error = "Firefox version must be >= 33";
                    console.error("Access denied", error);
                    if (catchCallback !== undefined) {
                        catchCallback(error);
                    }
                    return;
                }
                _this.userMediaConstraints = {
                    audio: true,
                    video: {
                        mozMediaSource: 'screen',
                        mediaSource: 'screen'
                    }
                };
                if (streamConstraints.idealVideoWidth !== undefined) {
                    _this.userMediaConstraints.video.width = { ideal: streamConstraints.idealVideoWidth };
                }
                if (streamConstraints.idealVideoHeight !== undefined) {
                    _this.userMediaConstraints.video.height = { ideal: streamConstraints.idealVideoHeight };
                }
                if (streamConstraints.idealFrameRate !== undefined) {
                    _this.userMediaConstraints.video.frameRate = { ideal: streamConstraints.idealFrameRate };
                }
                getUserMedia(_this.userMediaConstraints, function (userStream) {
                    _this.userMediaStream = userStream;
                    if (thenCallback !== undefined) {
                        thenCallback();
                    }
                    var lastTime = userStream.currentTime;
                    var polly = window.setInterval(function () {
                        if (!userStream)
                            window.clearInterval(polly);
                        if (userStream.currentTime == lastTime) {
                            window.clearInterval(polly);
                            if (userStream.onended) {
                                userStream.onended();
                            }
                        }
                        lastTime = userStream.currentTime;
                    }, 500);
                }, function (err) {
                    console.error("Access denied", err);
                    if (catchCallback !== undefined) {
                        catchCallback(error);
                    }
                });
            };
            this.getUserMediaConstraints = function () {
                return _this.userMediaConstraints;
            };
        }
        return KASLocalStream;
    }(KASStream_1.KASStream));
    exports.KASLocalStream = KASLocalStream;
});
define("KASServerAPI", ["require", "exports"], function (require, exports) {
    "use strict";
    var KASServerAPI = (function () {
        function KASServerAPI(kasConnection) {
            var _this = this;
            this.sendJoinRoom = function (request, thenCallback, catchCallback) {
                _this.kasConnection.sendRequest('joinRoom', request, function (error, response) {
                    if (error) {
                        if (catchCallback !== undefined) {
                            catchCallback(error);
                        }
                    }
                    else {
                        if (thenCallback !== undefined) {
                            thenCallback(response);
                        }
                    }
                });
            };
            this.sendLeaveRoom = function (request, thenCallback, catchCallback) {
                _this.kasConnection.sendRequest('leaveRoom', request, function (error, response) {
                    if (error) {
                        if (catchCallback !== undefined) {
                            catchCallback(error);
                        }
                    }
                    else {
                        if (thenCallback !== undefined) {
                            thenCallback(response);
                        }
                    }
                });
            };
            this.sendPublishVideo = function (request, thenCallback, catchCallback) {
                _this.kasConnection.sendRequest('publishVideo', request, function (error, response) {
                    if (error) {
                        if (catchCallback !== undefined) {
                            catchCallback(error);
                        }
                    }
                    else {
                        if (thenCallback !== undefined) {
                            thenCallback(response);
                        }
                    }
                });
            };
            this.sendUnpublishVideo = function (request, thenCallback, catchCallback) {
                _this.kasConnection.sendRequest('unpublishVideo', request, function (error, response) {
                    if (error) {
                        if (catchCallback !== undefined) {
                            catchCallback(error);
                        }
                    }
                    else {
                        if (thenCallback !== undefined) {
                            thenCallback(response);
                        }
                    }
                });
            };
            this.sendReceiveVideoFrom = function (request, thenCallback, catchCallback) {
                _this.kasConnection.sendRequest('receiveVideoFrom', request, function (error, response) {
                    if (error) {
                        if (catchCallback !== undefined) {
                            catchCallback(error);
                        }
                    }
                    else {
                        if (thenCallback !== undefined) {
                            thenCallback(response);
                        }
                    }
                });
            };
            this.sendUnsubscribeFrom = function (request, thenCallback, catchCallback) {
                _this.kasConnection.sendRequest('unsubscribeFromVideo', request, function (error, response) {
                    if (error) {
                        if (catchCallback !== undefined) {
                            catchCallback(error);
                        }
                    }
                    else {
                        if (thenCallback !== undefined) {
                            thenCallback(response);
                        }
                    }
                });
            };
            this.sendICECandidate = function (request, thenCallback, catchCallback) {
                _this.kasConnection.sendRequest('onIceCandidate', request, function (error, response) {
                    if (error) {
                        if (catchCallback !== undefined) {
                            catchCallback(error);
                        }
                    }
                    else {
                        if (thenCallback !== undefined) {
                            thenCallback(response);
                        }
                    }
                });
            };
            this.sendMessage = function (request, thenCallback, catchCallback) {
                _this.kasConnection.sendRequest('sendMessage', request, function (error, response) {
                    if (error) {
                        if (catchCallback !== undefined) {
                            catchCallback(error);
                        }
                    }
                    else {
                        if (thenCallback !== undefined) {
                            thenCallback(response);
                        }
                    }
                });
            };
            this.sendCustomRequest = function (customRequest, thenCallback, catchCallback) {
                _this.kasConnection.sendRequest('customRequest', customRequest, function (error, response) {
                    if (error) {
                        if (catchCallback !== undefined) {
                            catchCallback(error);
                        }
                    }
                    else {
                        if (thenCallback !== undefined) {
                            thenCallback(response);
                        }
                    }
                });
            };
            this.kasConnection = kasConnection;
        }
        return KASServerAPI;
    }());
    exports.KASServerAPI = KASServerAPI;
});
define("KASRemoteWebRtcPeer", ["require", "exports", "KASStream"], function (require, exports, KASStream_2) {
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
    var KASRemoteWebRtcPeer = (function () {
        function KASRemoteWebRtcPeer(stream, serverAPI, participant) {
            var _this = this;
            this.state = KASRemoteWebRtcPeerConstants.STATES.INITIALIZED;
            this.webRtcPeer = undefined;
            this.sdpOffer = undefined;
            this.sdpAnswer = undefined;
            this.iceCandidates = [];
            this.iceOptions = undefined;
            this.onSDPOfferGeneratedCallback = undefined;
            this.onICECandidateGeneratedCallback = undefined;
            this.createKurentoPeer = function () {
                if (_this.state !== KASRemoteWebRtcPeerConstants.STATES.INITIALIZED) {
                    console.warn("Stream " + _this.stream.getId() + " webrtc peer already created");
                    return;
                }
                var iceServers = [];
                if (_this.iceOptions !== undefined) {
                    if (_this.iceOptions.stunUrl !== undefined) {
                        iceServers.push({ "url": _this.iceOptions.stunUrl });
                    }
                    if (_this.iceOptions.turnUrl !== undefined) {
                        iceServers.push({ "url": _this.iceOptions.turnUrl,
                            "username": _this.iceOptions.turnUsername,
                            "credential": _this.iceOptions.turnPassword });
                    }
                }
                var offerConstraints = {
                    mandatory: {
                        OfferToReceiveVideo: _this.stream.getStreamType() === KASStream_2.KASStreamConstants.STREAM_TYPE.VIDEO ||
                            _this.stream.getStreamType() === KASStream_2.KASStreamConstants.STREAM_TYPE.SCREEN,
                        OfferToReceiveAudio: _this.stream.getStreamType() === KASStream_2.KASStreamConstants.STREAM_TYPE.AUDIO ||
                            _this.stream.getStreamType() === KASStream_2.KASStreamConstants.STREAM_TYPE.VIDEO ||
                            _this.stream.getStreamType() === KASStream_2.KASStreamConstants.STREAM_TYPE.SCREEN
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
                _this.state = KASRemoteWebRtcPeerConstants.STATES.PEERCREATED;
            };
            this.onOfferGenerated = function (error, sdpOfferParam, wp) {
                if (error) {
                    return console.error("(publish) SDP offer error: " + JSON.stringify(error));
                }
                _this.sdpOffer = sdpOfferParam;
                if (_this.onSDPOfferGeneratedCallback !== undefined) {
                    _this.onSDPOfferGeneratedCallback();
                }
            };
            this.onIceCandidate = function (candidate) {
                console.trace('Remote ICE Candidate for ', _this.stream.getId(), ' received: ', candidate);
                _this.iceCandidates.push(candidate);
                if (_this.onICECandidateGeneratedCallback !== undefined) {
                    _this.onICECandidateGeneratedCallback(candidate);
                }
            };
            this.subscribe = function (thenCallback, catchCallback) {
                var senderName = _this.participant.getId();
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
                    _this.sdpAnswer = response.sdpAnswer;
                    var answer = new RTCSessionDescription({
                        type: 'answer',
                        sdp: _this.sdpAnswer,
                    });
                    console.debug(_this.stream.getId() + ": set peer connection with recvd SDP answer", _this.sdpAnswer);
                    var pc = _this.webRtcPeer.peerConnection;
                    pc.setRemoteDescription(answer, function () {
                        var remoteStream = pc.getRemoteStreams()[0];
                        _this.stream.setStreamObject(remoteStream);
                        if (thenCallback !== undefined) {
                            thenCallback();
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
            this.unsubscribe = function (thenCallback, catchCallback) {
                var senderName = _this.participant.getId();
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
            this.dispose = function () {
                if (_this.state === KASRemoteWebRtcPeerConstants.STATES.SUBSCRIBED) {
                    _this.unsubscribe();
                }
                else {
                    _this.internalDispose();
                }
            };
            this.internalDispose = function () {
                if (_this.webRtcPeer !== undefined) {
                    _this.webRtcPeer.dispose();
                }
                var streamId = _this.stream.getId();
                _this.stream.dispose();
                _this.stream = undefined;
                _this.webRtcPeer = undefined;
                _this.sdpOffer = undefined;
                _this.sdpAnswer = undefined;
                _this.iceCandidates = [];
                _this.iceOptions = undefined;
                _this.state = KASRemoteWebRtcPeerConstants.STATES.DISPOSED;
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
define("KASParticipant", ["require", "exports", "KASLocalWebRtcPeer", "KASLocalStream", "KASRemoteWebRtcPeer", "KASStream"], function (require, exports, KASLocalWebRtcPeer_1, KASLocalStream_1, KASRemoteWebRtcPeer_1, KASStream_3) {
    "use strict";
    var KASParticipant = (function () {
        function KASParticipant(id, serverAPI) {
            var _this = this;
            this.publishedStreams = {};
            this.subscribedStreams = {};
            this.addLocalStream = function (id, streamType, streamConstraints, iceOptions, thenCallback, catchCallback) {
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
                var localStream = new KASLocalStream_1.KASLocalStream(id);
                localStream.setStreamType(streamType);
                localStream.requestUserMediaStream(streamConstraints, function () {
                    var peer = new KASLocalWebRtcPeer_1.KASLocalWebRtcPeer(localStream, _this.serverAPI, _this);
                    peer.setICEOptions(iceOptions);
                    peer.setOnICECandidateGeneratedCallback(function (candidate) {
                        var request = {
                            endpointName: _this.getId(),
                            streamId: localStream.getId(),
                            candidate: candidate.candidate,
                            sdpMid: candidate.sdpMid,
                            sdpMLineIndex: candidate.sdpMLineIndex
                        };
                        _this.serverAPI.sendICECandidate(request);
                    });
                    peer.setOnSDPOfferGeneratedCallback(function () {
                        _this.publishedStreams[id] = peer;
                        console.info("Created local stream stream id=", id, " type=", streamType, " streamConstraints=", streamConstraints, " iceOptions=", iceOptions);
                        if (thenCallback !== undefined) {
                            thenCallback(peer);
                        }
                    });
                    peer.createKurentoPeer();
                }, function (error) {
                    console.error("Could not create local stream id=" + id + " type=" + streamType + " streamConstraints=" + JSON.stringify(streamConstraints) + " iceOptions=" + JSON.stringify(iceOptions));
                    if (catchCallback !== undefined) {
                        catchCallback(error);
                    }
                });
            };
            this.addRemoteStream = function (id, streamType, iceOptions, thenCallback, catchCallback) {
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
                var remoteStream = new KASStream_3.KASStream(id);
                remoteStream.setStreamObject(undefined);
                remoteStream.setStreamType(streamType);
                var peer = new KASRemoteWebRtcPeer_1.KASRemoteWebRtcPeer(remoteStream, _this.serverAPI, _this);
                peer.setICEOptions(iceOptions);
                peer.setOnICECandidateGeneratedCallback(function (candidate) {
                    var request = {
                        endpointName: _this.getId(),
                        streamId: remoteStream.getId(),
                        candidate: candidate.candidate,
                        sdpMid: candidate.sdpMid,
                        sdpMLineIndex: candidate.sdpMLineIndex
                    };
                    _this.serverAPI.sendICECandidate(request);
                });
                peer.setOnSDPOfferGeneratedCallback(function () {
                    _this.subscribedStreams[id] = peer;
                    console.info("Created remote stream stream id=", id, " type=", streamType);
                    if (thenCallback !== undefined) {
                        thenCallback(peer);
                    }
                });
                peer.createKurentoPeer();
            };
            this.localPeerDisposed = function (streamId) {
                delete _this.publishedStreams[streamId];
            };
            this.remotePeerDisposed = function (streamId) {
                delete _this.subscribedStreams[streamId];
            };
            this.dispose = function () {
                var publishedStreamsIds = Object.keys(_this.publishedStreams);
                for (var i = 0; i < publishedStreamsIds.length; i++) {
                    _this.publishedStreams[publishedStreamsIds[i]].dispose();
                }
                var subscribedStreamsIds = Object.keys(_this.subscribedStreams);
                for (var i = 0; i < subscribedStreamsIds.length; i++) {
                    _this.subscribedStreams[subscribedStreamsIds[i]].dispose();
                }
            };
            this.getId = function () {
                return _this.id;
            };
            this.getPublishedPeers = function () {
                return _this.publishedStreams;
            };
            this.getPublishedPeerByStreamId = function (streamId) {
                return _this.publishedStreams[streamId];
            };
            this.getSubscribedPeers = function () {
                return _this.subscribedStreams;
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
define("KASWebRtcPeer", ["require", "exports"], function (require, exports) {
    "use strict";
});
define("KASLocalWebRtcPeer", ["require", "exports", "KASStream"], function (require, exports, KASStream_4) {
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
    var KASLocalWebRtcPeer = (function () {
        function KASLocalWebRtcPeer(stream, serverAPI, participant) {
            var _this = this;
            this.state = KASLocalWebRtcPeerConstants.STATES.INITIALIZED;
            this.remoteLoopbackStream = undefined;
            this.webRtcPeer = undefined;
            this.sdpOffer = undefined;
            this.sdpAnswer = undefined;
            this.iceCandidates = [];
            this.iceOptions = undefined;
            this.onSDPOfferGeneratedCallback = undefined;
            this.onICECandidateGeneratedCallback = undefined;
            this.createKurentoPeer = function () {
                if (_this.state !== KASLocalWebRtcPeerConstants.STATES.INITIALIZED) {
                    console.warn("Stream " + _this.stream.getId() + " webrtc peer already created");
                    return;
                }
                var iceServers = [];
                if (_this.iceOptions !== undefined) {
                    if (_this.iceOptions.stunUrl !== undefined) {
                        iceServers.push({ "url": _this.iceOptions.stunUrl });
                    }
                    if (_this.iceOptions.turnUrl !== undefined) {
                        iceServers.push({ "url": _this.iceOptions.turnUrl,
                            "username": _this.iceOptions.turnUsername,
                            "credential": _this.iceOptions.turnPassword });
                    }
                }
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
                _this.state = KASLocalWebRtcPeerConstants.STATES.PEERCREATED;
            };
            this.onOfferGenerated = function (error, sdpOfferParam, wp) {
                if (error) {
                    return console.error("(publish) SDP offer error: " + JSON.stringify(error));
                }
                _this.sdpOffer = sdpOfferParam;
                if (_this.onSDPOfferGeneratedCallback !== undefined) {
                    _this.onSDPOfferGeneratedCallback();
                }
            };
            this.onIceCandidate = function (candidate) {
                console.trace('Local ICE Candidate for ', _this.stream.getId(), ' received: ', candidate);
                _this.iceCandidates.push(candidate);
                if (_this.onICECandidateGeneratedCallback !== undefined) {
                    _this.onICECandidateGeneratedCallback(candidate);
                }
            };
            this.publish = function (thenCallback, catchCallback) {
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
                    _this.sdpAnswer = response.sdpAnswer;
                    var answer = new RTCSessionDescription({
                        type: 'answer',
                        sdp: _this.sdpAnswer,
                    });
                    console.debug(_this.stream.getId() + ": set peer connection with recvd SDP answer", _this.sdpAnswer);
                    var pc = _this.webRtcPeer.peerConnection;
                    pc.setRemoteDescription(answer, function () {
                        var remoteStream = pc.getRemoteStreams()[0];
                        _this.remoteLoopbackStream = new KASStream_4.KASStream(_this.stream.getId() + "-remote");
                        _this.remoteLoopbackStream.setStreamType(_this.stream.getStreamType());
                        _this.remoteLoopbackStream.setStreamObject(remoteStream);
                        if (thenCallback !== undefined) {
                            thenCallback();
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
            this.unpublish = function (thenCallback, catchCallback) {
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
            this.dispose = function () {
                if (_this.state === KASLocalWebRtcPeerConstants.STATES.PUBLISHED) {
                    _this.unpublish();
                }
                else {
                    _this.internalDispose();
                }
            };
            this.internalDispose = function () {
                if (_this.webRtcPeer !== undefined) {
                    _this.webRtcPeer.dispose();
                }
                var streamId = _this.stream.getId();
                _this.stream.dispose();
                if (_this.remoteLoopbackStream !== undefined) {
                    _this.remoteLoopbackStream.dispose();
                }
                _this.stream = undefined;
                _this.remoteLoopbackStream = undefined;
                _this.webRtcPeer = undefined;
                _this.sdpOffer = undefined;
                _this.sdpAnswer = undefined;
                _this.iceCandidates = [];
                _this.iceOptions = undefined;
                _this.state = KASLocalWebRtcPeerConstants.STATES.DISPOSED;
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
define("KASRoom", ["require", "exports", "KASParticipant"], function (require, exports, KASParticipant_1) {
    "use strict";
    var KASRoom = (function () {
        function KASRoom(id, serverAPI) {
            var _this = this;
            this.participants = {};
            this.addParticipant = function (participantId) {
                if (participantId in _this.participants) {
                    console.error("Participant " + participantId + " already exists in room " + participantId);
                    return undefined;
                }
                var participant = new KASParticipant_1.KASParticipant(participantId, _this.serverAPI);
                _this.participants[participantId] = participant;
                return participant;
            };
            this.removeParticipant = function (participantId) {
                if (!(participantId in _this.participants)) {
                    console.error("Participant " + participantId + " not found in room " + participantId);
                    return undefined;
                }
                var participant = _this.participants[participantId];
                participant.dispose();
                delete _this.participants[participantId];
                return participant;
            };
            this.getParticipantById = function (participantId) {
                if (!(participantId in _this.participants)) {
                    console.error("Participant " + participantId + " not found in room " + participantId);
                    return undefined;
                }
                return _this.participants[participantId];
            };
            this.dispose = function () {
                var ids = Object.keys(_this.participants);
                for (var i = 0; i < ids.length; i++) {
                    _this.removeParticipant(ids[i]);
                }
            };
            this.getId = function () {
                return _this.id;
            };
            this.getParticipants = function () {
                return _this.participants;
            };
            this.id = id;
            this.serverAPI = serverAPI;
        }
        return KASRoom;
    }());
    exports.KASRoom = KASRoom;
});
define("KASServer", ["require", "exports", "KASServerAPI", "KASRoom"], function (require, exports, KASServerAPI_1, KASRoom_1) {
    "use strict";
    var KASServer = (function () {
        function KASServer(connection) {
            var _this = this;
            this.iceOptions = {
                forceTurn: false
            };
            this.rooms = {};
            this.localParticipantId = undefined;
            this.onParticipantLeftCallback = undefined;
            this.onParticipantEvictedCallback = undefined;
            this.onMessageReceivedCallback = undefined;
            this.onRemoteStreamSubscribedCallback = undefined;
            this.onRemoteStreamUnpublishedCallback = undefined;
            this.joinRoom = function (roomId, username, thenCallback, catchCallback) {
                if (Object.keys(_this.rooms).length != 0) {
                    var error = {
                        "message:": "A room has already been joined"
                    };
                    if (catchCallback !== undefined) {
                        catchCallback(error);
                    }
                    return;
                }
                var request = {
                    "user": username,
                    "room": roomId,
                    "dataChannels": true
                };
                _this.serverAPI.sendJoinRoom(request, function (response) {
                    var room = new KASRoom_1.KASRoom(roomId, _this.serverAPI);
                    _this.rooms[roomId] = room;
                    _this.localParticipantId = username;
                    room.addParticipant(username);
                    for (var i = 0; i < response.value.length; i++) {
                        var remoteParticipant = room.addParticipant(response.value[i].id);
                    }
                    if (thenCallback !== undefined) {
                        thenCallback(room, response);
                    }
                }, function (error) {
                    if (catchCallback !== undefined) {
                        catchCallback(error);
                    }
                });
            };
            this.leaveRoom = function (roomId, username, thenCallback, catchCallback) {
                if (Object.keys(_this.rooms).length !== 1) {
                    var error = {
                        "message:": "No room has been joined"
                    };
                    if (catchCallback !== undefined) {
                        catchCallback(error);
                    }
                    return;
                }
                var request = {};
                var room = _this.getOnlyRoom();
                room.dispose();
                _this.serverAPI.sendLeaveRoom(request, function (response) {
                    _this.rooms = {};
                }, function (error) {
                    if (catchCallback !== undefined) {
                        catchCallback(error);
                    }
                });
            };
            this.sendMessage = function (message, username, roomId, thenCallback, catchCallback) {
                var request = {
                    "message": message,
                    "userMessage": username,
                    "roomMessage": roomId
                };
                _this.serverAPI.sendMessage(request, thenCallback, catchCallback);
            };
            this.sendCustomRequest = function (customRequest, thenCallback, catchCallback) {
                _this.serverAPI.sendCustomRequest(customRequest, thenCallback, catchCallback);
            };
            this.dispose = function (forced, thenCallback, catchCallback) {
                if (!forced) {
                    _this.leaveRoom(_this.getOnlyRoom().getId(), _this.getOnlyParticipantId(), thenCallback, catchCallback);
                }
                else {
                    if (thenCallback !== undefined) {
                        thenCallback();
                    }
                }
            };
            this.onParticipantJoined = function (params) {
                console.info("Participant " + params.id + " joined");
                var room = _this.getOnlyRoom();
                room.addParticipant(params.id);
            };
            this.onParticipantLeft = function (params) {
                console.info("Participant " + params.name + " has left");
                var room = _this.getOnlyRoom();
                if (_this.onParticipantLeftCallback !== undefined) {
                    _this.onParticipantLeftCallback(params);
                }
                room.removeParticipant(params.name);
            };
            this.onParticipantEvicted = function (params) {
                console.info("You have been evicted by the KAS");
                var room = _this.getOnlyRoom();
                if (_this.onParticipantEvictedCallback !== undefined) {
                    _this.onParticipantEvictedCallback(params);
                }
                var participant = room.removeParticipant(_this.getOnlyParticipantId());
            };
            this.onParticipantPublished = function (params) {
                console.info("Published ", params);
                var room = _this.getOnlyRoom();
                var participant = room.getParticipantById(params.id) || room.addParticipant(params.id);
                var _loop_1 = function() {
                    var streamType = params.streams[i].streamType;
                    participant.addRemoteStream(params.streams[i].id, params.streams[i].streamType, _this.iceOptions, function (peer) {
                        if (true) {
                            peer.subscribe(function () {
                                if (_this.onRemoteStreamSubscribedCallback !== undefined) {
                                    _this.onRemoteStreamSubscribedCallback(participant, peer, streamType);
                                }
                            }, function (error) {
                                console.error(error);
                            });
                        }
                    }, function (error) {
                    });
                };
                for (var i = 0; i < params.streams.length; i++) {
                    _loop_1();
                }
            };
            this.onReceiveICECandidate = function (params) {
                var candidate = {
                    candidate: params.candidate,
                    sdpMid: params.sdpMid,
                    sdpMLineIndex: params.sdpMLineIndex
                };
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
                var participant = _this.getOnlyRoom().getParticipantById(params.name);
                var peer = participant.getSubscribedPeerByStreamId(params.streamId);
                if (peer !== undefined) {
                    var streamId = peer.getStream().getId();
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
            this.setOnParticipantLeftCallback = function (onParticipantLeftCallback) {
                _this.onParticipantLeftCallback = onParticipantLeftCallback;
            };
            this.setOnParticipantEvictedCallback = function (onParticipantEvicted) {
                _this.onParticipantEvictedCallback = onParticipantEvicted;
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
            this.getOnlyRoom = function () {
                if (Object.keys(_this.rooms).length !== 1) {
                    return undefined;
                }
                return _this.rooms[Object.keys(_this.rooms)[0]];
            };
            this.getOnlyParticipantId = function () {
                return _this.localParticipantId;
            };
            this.getOnlyParticipant = function () {
                return _this.getOnlyRoom().getParticipantById(_this.getOnlyParticipantId());
            };
            this.connection = connection;
            this.serverAPI = new KASServerAPI_1.KASServerAPI(connection);
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
define(["require", "exports", "KASConnection", "KASLocalStream", "KASLocalWebRtcPeer", "KASParticipant", "KASRemoteWebRtcPeer", "KASRoom", "KASServer", "KASServerAPI", "KASStream"], function (require, exports, KASConnection, KASLocalStream, KASLocalWebRtcPeer, KASParticipant, KASRemoteWebRtcPeer, KASRoom, KASServer, KASServerAPI, KASStream) {
    "use strict";
    var KurentoRoom = (function () {
        function KurentoRoom() {
            return {
                "KASConnection": KASConnection.KASConnection,
                "KASConnectionConstants": KASConnection.KASConnectionConstants,
                "KASLocalStream": KASLocalStream.KASLocalStream,
                "KASLocalWebRtcPeer": KASLocalWebRtcPeer.KASLocalWebRtcPeer,
                "KASLocalWebRtcPeerConstants": KASLocalWebRtcPeer.KASLocalWebRtcPeerConstants,
                "KASParticipant": KASParticipant.KASParticipant,
                "KASRemoteWebRtcPeer": KASRemoteWebRtcPeer.KASRemoteWebRtcPeer,
                "KASRemoteWebRtcPeerConstants": KASRemoteWebRtcPeer.KASRemoteWebRtcPeerConstants,
                "KASRoom": KASRoom.KASRoom,
                "KASServer": KASServer.KASServer,
                "KASServerAPI": KASServerAPI.KASServerAPI,
                "KASStream": KASStream.KASStream,
                "KASStreamConstants": KASStream.KASStreamConstants
            };
        }
        return KurentoRoom;
    }());
    exports.KurentoRoom = KurentoRoom;
});
