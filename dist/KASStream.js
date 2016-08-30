define(["require", "exports"], function (require, exports) {
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
    /**
     * @class KASStream
     * @description Represents a stream (local or remote)
     * @author Danilo Arcidiacono
     */
    var KASStream = (function () {
        function KASStream(id) {
            var _this = this;
            /**
             * Type of stream (one of KASStreamConstants.STREAM_TYPE values)
             */
            this.streamType = KASStreamConstants.STREAM_TYPE.DATA;
            /**
             * Stream object obtained via getUserMedia() native call.
             * Will be undefined for DATA stream type.
             * @type {any}
             */
            this.userMediaStream = undefined;
            /**
             * Generates a <video> or <audio> tag with the given id based on the stream type.
             * @returns {any}
             */
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
                // No corresponding HTML element for streams of type DATA!
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
