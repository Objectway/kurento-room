(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module unless amdModuleId is set
        define([], function () {
            return (factory());
        });
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        factory();
    }
}(this,
// Stream --------------------------------

/*
 * options: name: XXX data: true (Maybe this is based on webrtc) audio: true,
 * video: true, url: "file:///..." > Player screen: true > Desktop (implicit
 * video:true, audio:false) audio: true, video: true > Webcam
 *
 * stream.hasAudio(); stream.hasVideo(); stream.hasData();
 */
function Stream(kurento, local, room, options) {

    function jq( myid ) {
        return "#" + myid.replace( /(@|:|\.|\[|\]|,)/g, "\\$1" );
    };

    var that = this;

    that.room = room;

    var ee = new EventEmitter();
    var sdpOffer;
    var wrStream;
    var wp;
    var id;
    if (options.id) {
        id = options.id;
    } else {
        id = "webcam";
    }
    var video;

    var videoElements = [];
    var elements = [];
    var participant = options.participant;

    var speechEvent;

    var recvVideo = options.recvVideo;
    this.getRecvVideo = function () {
        return recvVideo;
    }

    var recvAudio = options.recvAudio;
    this.getRecvAudio = function () {
        return recvAudio;
    }

    var showMyRemote = false;
    this.subscribeToMyRemote = function () {
        showMyRemote = true;
    }
    this.displayMyRemote = function () {
        return showMyRemote;
    }

    var localMirrored = false;
    this.mirrorLocalStream = function (wr) {
        showMyRemote = true;
        localMirrored = true;
        if (wr)
            wrStream = wr;
    }
    this.isLocalMirrored = function () {
        return localMirrored;
    }

    this.getWrStream = function () {
        return wrStream;
    }

    this.getWebRtcPeer = function () {
        return wp;
    }

    this.addEventListener = function (eventName, listener) {
        ee.addListener(eventName, listener);
    }

    function showSpinner(spinnerParentId) {
        var progress = document.createElement('div');
        progress.id = 'progress-' + that.getGlobalID();
        progress.style.background = "center transparent url('img/spinner.gif') no-repeat";
        document.getElementById(spinnerParentId).appendChild(progress);
    }

    function hideSpinner(spinnerId) {
        spinnerId = (typeof spinnerId === 'undefined') ? that.getGlobalID() : spinnerId;
        $(jq('progress-' + spinnerId)).hide();
    }

    this.playOnlyVideo = function (parentElement, thumbnailId) {
        video = document.createElement('video');

        video.id = 'native-video-' + that.getGlobalID();
        video.autoplay = true;
        video.controls = false;
        if (wrStream) {
            video.src = URL.createObjectURL(wrStream);
            $(jq(thumbnailId)).show();
            hideSpinner();
        } else
            console.log("No wrStream yet for", that.getGlobalID());

        videoElements.push({
            thumb: thumbnailId,
            video: video
        });

        if (local) {
            video.muted = true;
        }

        if (typeof parentElement === "string") {
            document.getElementById(parentElement).appendChild(video);
        } else {
            parentElement.appendChild(video);
        }
    }

    this.playThumbnail = function (thumbnailId) {

        var container = document.createElement('div');
        container.className = "participant";
        container.id = that.getGlobalID();
        document.getElementById(thumbnailId).appendChild(container);

        elements.push(container);

        var name = document.createElement('div');
        container.appendChild(name);
        name.appendChild(document.createTextNode(that.getGlobalID()));
        name.id = "name-" + that.getGlobalID();
        name.className = "name";

        showSpinner(thumbnailId);

        that.playOnlyVideo(container, thumbnailId);
    }

    this.getID = function () {
        return id;
    }

    this.getParticipant = function() {
        return participant;
    }

    this.getGlobalID = function () {
        if (participant) {
            return participant.getID() + "_" + id;
        } else {
            return id + "_webcam";
        }
    }

    this.initScreen = function () {
        participant.addStream(that);

        if (sessionStorage.getScreenMediaJSExtensionId) {
            chrome.runtime.sendMessage(sessionStorage.getScreenMediaJSExtensionId,
                {
                    type: 'getScreen',
                    id: 1
                },
                null,
                function (data) {
                    if (!data || data.sourceId === '') {
                        // user canceled
                        console.error("Access denied");
                        ee.emitEvent('access-denied', null);
                        //var error = new Error('NavigatorUserMediaError');
                        //error.name = 'PERMISSION_DENIED';
                        //callback(error);
                    } else {
                        // User accepted
                        var constraints = {
                            audio: false,
                            video: {
                                mandatory: {
                                    chromeMediaSource: 'desktop',
                                    maxWidth: window.screen.width,
                                    maxHeight: window.screen.height,
                                    maxFrameRate: 60
                                },

                                optional: [
                                    {googLeakyBucket: true},
                                    {googTemporalLayeredScreencast: true}
                                ]
                            }
                        };

                        constraints.video.mandatory.chromeMediaSourceId = data.sourceId;

                        getUserMedia(constraints, function (userStream) {
                            wrStream = userStream;
                            ee.emitEvent('access-accepted', null);
                        }, function (error) {
                            console.error("Access denied", error);
                            ee.emitEvent('access-denied', null);
                        });
                    }
                });
        }
    }

    this.init = function () {
        if (options.screen === true) {
            this.initScreen();
            return;
        }

        participant.addStream(that);

        var constraints = {
            audio: true,
            video: {
                mandatory: {
                    maxWidth: 640
                },
                optional: [
                    {maxFrameRate: 15},
                    {minFrameRate: 15}
                ]
            }
        };

        getUserMedia(constraints, function (userStream) {
            wrStream = userStream;
            ee.emitEvent('access-accepted', null);
        }, function (error) {
            console.error("Access denied", error);
            ee.emitEvent('access-denied', null);
        });
    }

    this.publishVideoCallback = function (error, sdpOfferParam, wp) {
        if (error) {
            return console.error("(publish) SDP offer error: "
                + JSON.stringify(error));
        }
        console.log("Sending SDP offer to publish as "
            + that.getGlobalID(), sdpOfferParam);
        kurento.sendRequest("publishVideo", {
            sdpOffer: sdpOfferParam,
            doLoopback: that.displayMyRemote() || false
        }, function (error, response) {
            if (error) {
                console.error("Error on publishVideo: " + JSON.stringify(error));
            } else {
                that.room.emitEvent('stream-published', [{
                    stream: that
                }])
                that.processSdpAnswer(response.sdpAnswer);
            }
        });
    }

    this.startVideoCallback = function (error, sdpOfferParam, wp) {
        if (error) {
            return console.error("(subscribe) SDP offer error: "
                + JSON.stringify(error));
        }
        console.log("Sending SDP offer to subscribe to "
            + that.getGlobalID(), sdpOfferParam);
        kurento.sendRequest("receiveVideoFrom", {
            sender: that.getGlobalID(),
            sdpOffer: sdpOfferParam
        }, function (error, response) {
            if (error) {
                console.error("Error on recvVideoFrom: " + JSON.stringify(error));
            } else {
                that.processSdpAnswer(response.sdpAnswer);
            }
        });
    }

    function initWebRtcPeer(sdpOfferCallback) {
        if (local) {
            var options = {
                videoStream: wrStream,
                onicecandidate: participant.sendIceCandidate.bind(participant)
            }
            if (that.displayMyRemote()) {
                wp = new kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options, function (error) {
                    if(error) {
                        return console.error(error);
                    }
                    this.generateOffer(sdpOfferCallback.bind(that));
                });
            } else {
                wp = new kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options, function (error) {
                    if(error) {
                        return console.error(error);
                    }
                    this.generateOffer(sdpOfferCallback.bind(that));
                });
            }
        } else {
            var offerConstraints = {
                mandatory : {
                    OfferToReceiveVideo: recvVideo,
                    OfferToReceiveAudio: recvAudio
                }
            };
            console.log("Constraints of generate SDP offer (subscribing)",
                offerConstraints);
            var options = {
                onicecandidate: participant.sendIceCandidate.bind(participant),
                connectionConstraints: offerConstraints
            }
            wp = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, function (error) {
                if(error) {
                    return console.error(error);
                }
                this.generateOffer(sdpOfferCallback.bind(that));
            });
        }
        console.log("Waiting for SDP offer to be generated ("
            + (local ? "local" : "remote") + " peer: " + that.getGlobalID() + ")");
    }

    this.publish = function () {

        // FIXME: Throw error when stream is not local

        initWebRtcPeer(that.publishVideoCallback);

        // FIXME: Now we have coupled connecting to a room and adding a
        // stream to this room. But in the new API, there are two steps.
        // This is the second step. For now, it do nothing.

    }

    this.subscribe = function () {

        // FIXME: In the current implementation all participants are subscribed
        // automatically to all other participants. We use this method only to
        // negotiate SDP

        initWebRtcPeer(that.startVideoCallback);
    }

    this.processSdpAnswer = function (sdpAnswer) {
        var answer = new RTCSessionDescription({
            type: 'answer',
            sdp: sdpAnswer,
        });
        console.log(that.getGlobalID() + ": set peer connection with recvd SDP answer",
            sdpAnswer);
        var participantId = that.getGlobalID();
        var pc = wp.peerConnection;
        pc.setRemoteDescription(answer, function () {
            // Avoids to subscribe to your own stream remotely
            // except when showMyRemote is true
            if (!local || that.displayMyRemote()) {
                wrStream = pc.getRemoteStreams()[0];
                console.log("Peer remote stream", wrStream);
                if (wrStream != undefined) {
                    speechEvent = kurentoUtils.WebRtcPeer.hark(wrStream, {threshold:that.room.thresholdSpeaker});
                    speechEvent.on('speaking', function () {
                        that.room.addParticipantSpeaking(participantId);
                        that.room.emitEvent('stream-speaking', [{
                            participantId: participantId
                        }]);
                    });
                    speechEvent.on('stopped_speaking', function () {
                        that.room.removeParticipantSpeaking(participantId);
                        that.room.emitEvent('stream-stopped-speaking', [{
                            participantId: participantId
                        }]);
                    });
                }
                for (i = 0; i < videoElements.length; i++) {
                    var thumbnailId = videoElements[i].thumb;
                    var video = videoElements[i].video;
                    video.src = URL.createObjectURL(wrStream);
                    video.onplay = function() {
                        //is ('native-video-' + that.getGlobalID())
                        var elementId = this.id;
                        var videoId = elementId.split("-");
                        $(jq(thumbnailId)).show();
                        hideSpinner(videoId[2]);
                    };
                }
                that.room.emitEvent('stream-subscribed', [{
                    stream: that
                }]);
            }
        }, function (error) {
            console.error(that.getGlobalID() + ": Error setting SDP to the peer connection: "
                + JSON.stringify(error));
        });
    }

    this.unpublish = function () {
        if (wp) {
            wp.dispose();
        } else {
            if (wrStream) {
                wrStream.getAudioTracks().forEach(function (track) {
                    track.stop && track.stop()
                })
                wrStream.getVideoTracks().forEach(function (track) {
                    track.stop && track.stop()
                })
                speechEvent.stop();
            }
        }

        kurento.sendRequest('unpublishVideo', function (error, response) {
            if (error) {
                console.error(error);
            } else {
                that.room.emitEvent('stream-unpublished', [{
                    stream: that
                }]);
                console.log(that.getGlobalID() + ": Stream '" + id + "' unpublished");
            }
        });
    }

    this.dispose = function () {

        function disposeElement(element) {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }

        for (i = 0; i < elements.length; i++) {
            disposeElement(elements[i]);
        }

        for (i = 0; i < videoElements.length; i++) {
            disposeElement(videoElements[i].video);
        }

        if (wp) {
            wp.dispose();
        } else {
            if (wrStream) {
                wrStream.getAudioTracks().forEach(function (track) {
                    track.stop && track.stop()
                })
                wrStream.getVideoTracks().forEach(function (track) {
                    track.stop && track.stop()
                })
            }
        }

        console.log(that.getGlobalID() + ": Stream '" + id + "' disposed");
    }
}));