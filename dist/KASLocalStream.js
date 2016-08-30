var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", "./KASStream"], function (require, exports, KASStream_1) {
    "use strict";
    ;
    /**
     * @class KASLocalStream
     * @description Represents a local stream
     * @author Danilo Arcidiacono
     */
    var KASLocalStream = (function (_super) {
        __extends(KASLocalStream, _super);
        function KASLocalStream(id) {
            var _this = this;
            _super.call(this, id);
            /**
             * User media constraints
             * @type {any}
             */
            this.userMediaConstraints = undefined;
            /**
             * Initializes the userMediaStream object with getUserMedia(), calling the appropriate callbacks.
             * @param thenCallback
             * @param catchCallback
             */
            this.requestUserMediaStream = function (streamConstraints, thenCallback, catchCallback) {
                if (_this.streamType === KASStream_1.KASStreamConstants.STREAM_TYPE.AUDIO ||
                    _this.streamType === KASStream_1.KASStreamConstants.STREAM_TYPE.VIDEO) {
                    _this.requestAudioVideoUserMediaStream(streamConstraints, thenCallback, catchCallback);
                }
                if (_this.streamType === KASStream_1.KASStreamConstants.STREAM_TYPE.SCREEN) {
                    _this.requestScreenUserMediaStream(streamConstraints, thenCallback, catchCallback);
                }
            };
            /**
             * Internal method for requesting the audio and/or video using getUserMedia()
             */
            this.requestAudioVideoUserMediaStream = function (streamConstraints, thenCallback, catchCallback) {
                _this.userMediaConstraints = {
                    audio: _this.streamType === KASStream_1.KASStreamConstants.STREAM_TYPE.AUDIO || _this.streamType === KASStream_1.KASStreamConstants.STREAM_TYPE.VIDEO,
                    video: _this.streamType === KASStream_1.KASStreamConstants.STREAM_TYPE.VIDEO
                };
                // If we have requested the VIDEO, and there is at least one constraint,
                // we refine the "video" property of userMediaConstraints
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
                    // Call getUserMedia
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
            /**
             * Internal method for requesting the screen using getUserMedia()
             */
            this.requestScreenUserMediaStream = function (streamConstraints, thenCallback, catchCallback) {
                // Detect the browser
                var isChrome = window.navigator.userAgent.match('Chrome') !== null;
                var isFirefox = window.navigator.userAgent.match('Firefox') !== null;
                // Init
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
            /**
             * Internal method for requesting the screen using getUserMedia() that works in Chrome
             */
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
                // This shows the screen selection popup
                chrome.runtime.sendMessage(sessionStorage.getScreenMediaJSExtensionId, params, null, function (data) {
                    if (!data || data.sourceId === '') {
                        // User has clicked cancel
                        var error = "User has canceled";
                        console.error("Access denied: ", error);
                        if (catchCallback !== undefined) {
                            catchCallback(error);
                        }
                    }
                    else {
                        // User has selected a window to share
                        _this.userMediaConstraints = {
                            audio: false,
                            video: {
                                mandatory: {
                                    chromeMediaSource: 'desktop',
                                    // maxWidth: window.screen.width,
                                    // maxHeight: window.screen.height,
                                    // maxFrameRate: 60,
                                    chromeMediaSourceId: data.sourceId
                                },
                                optional: [
                                    { googLeakyBucket: true },
                                    { googTemporalLayeredScreencast: true }
                                ]
                            }
                        };
                        // If there is at least one constraint, we refine the "video" property of userMediaConstraints
                        if (streamConstraints.idealVideoWidth !== undefined) {
                            _this.userMediaConstraints.video.width = { ideal: streamConstraints.idealVideoWidth };
                        }
                        if (streamConstraints.idealVideoHeight !== undefined) {
                            _this.userMediaConstraints.video.height = { ideal: streamConstraints.idealVideoHeight };
                        }
                        if (streamConstraints.idealFrameRate !== undefined) {
                            _this.userMediaConstraints.video.frameRate = { ideal: streamConstraints.idealFrameRate };
                        }
                        // Call getUserMedia
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
            /**
             * Internal method for requesting the screen using getUserMedia() that works in Firefox
             */
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
                        mozMediaSource: 'window',
                        mediaSource: 'window'
                    }
                };
                // If there is at least one constraint, refine the "video" property of userMediaConstraints
                if (streamConstraints.idealVideoWidth !== undefined) {
                    _this.userMediaConstraints.video.width = { ideal: streamConstraints.idealVideoWidth };
                }
                if (streamConstraints.idealVideoHeight !== undefined) {
                    _this.userMediaConstraints.video.height = { ideal: streamConstraints.idealVideoHeight };
                }
                if (streamConstraints.idealFrameRate !== undefined) {
                    _this.userMediaConstraints.video.frameRate = { ideal: streamConstraints.idealFrameRate };
                }
                // Call getUserMedia
                getUserMedia(_this.userMediaConstraints, function (userStream) {
                    _this.userMediaStream = userStream;
                    if (thenCallback !== undefined) {
                        thenCallback();
                    }
                    // workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=1045810
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
            /**
             * Returns the media constraints that have been passed to getUserMedia()
             * @returns {any}
             */
            this.getUserMediaConstraints = function () {
                return _this.userMediaConstraints;
            };
        }
        return KASLocalStream;
    }(KASStream_1.KASStream));
    exports.KASLocalStream = KASLocalStream;
});
