import {KASLocalStream} from "./KASLocalStream";
import {KASStream} from "./KASStream";
import {KASServerAPI, IRequestPublishVideo, IResponsePublishVideo} from "./KASServerAPI";
import {IKASWebRtcPeer, IICEOptions} from "./KASWebRtcPeer";
import {IResponseUnpublishVideo} from "./KASServerAPI";
import {IRequestUnpublishVideo} from "./KASServerAPI";
import {KASParticipant} from "./KASParticipant";

export class KASLocalWebRtcPeerConstants {
    public static get STATES(): any {
        return {
            INITIALIZED: 'initialized',
            PEERCREATED: 'peercreated',
            PUBLISHED: 'published',
            DISPOSED: 'disposed'
        };
    }
}

/**
 * @class KASLocalWebRtcPeer
 * @description Represents a WebRtcPeer attached to a local stream that generates an SDP offer and exchanges ICE candidates with the KAS.
 *
 * @author Danilo Arcidiacono
 */
export class KASLocalWebRtcPeer implements IKASWebRtcPeer {
    /**
     * Internal state of the stream (one of KASLocalWebRtcPeerConstants.STATES)
     */
    private state: string = KASLocalWebRtcPeerConstants.STATES.INITIALIZED;

    /**
     * The participant owning this peer
     */
    private participant: KASParticipant;

    /**
     * Client object to communicate with the KAS
     */
    private serverAPI: KASServerAPI;

    /**
     * Attached stream (local)
     */
    private stream: KASLocalStream;

    /**
     * Remote loopback stream
     */
    private remoteLoopbackStream: KASStream = undefined;

    /**
     * The actual Kurento WebRtcPeer object
     */
    private webRtcPeer: any = undefined;

    /**
     * The locally generated SDP offer
     * @type {any}
     */
    private sdpOffer: any = undefined;

    /**
     * The remote generated SDP answer
     * @type {any}
     */
    private sdpAnswer: any = undefined;

    /**
     * The gathered ICE candidates
     * @type {any}
     */
    private iceCandidates: Array<any> = [];

    /**
     * ICE connectivity options (stun, turn)
     */
    private iceOptions: IICEOptions = undefined;

    /**
     * (Optional) callback called when the SDP offer has been generated
     * @type {any}
     */
    private onSDPOfferGeneratedCallback: () => any = undefined;

    /**
     * (Optional) callback called when a ICE candidate is generated (or received)
     * @type {any}
     */
    private onICECandidateGeneratedCallback: (candidate: any) => any = undefined;

    public constructor(stream: KASLocalStream, serverAPI: KASServerAPI, participant: KASParticipant) {
        this.stream = stream;
        this.serverAPI = serverAPI;
        this.participant = participant;
    }

    /**
     * Creates the webRtcPeer object based on the attached stream.
     */
    public createKurentoPeer = (): void => {

        // Check the state
        if (this.state !== KASLocalWebRtcPeerConstants.STATES.INITIALIZED) {
            console.warn("Stream " + this.stream.getId() + " webrtc peer already created");
            return;
        }

        // Build the ice servers configuration object
        const iceServers: Array<Object> = [ ];
        if (this.iceOptions !== undefined) {
            if (this.iceOptions.stunUrl !== undefined) {
                iceServers.push({ "url": this.iceOptions.stunUrl });
            }

            if (this.iceOptions.turnUrl !== undefined) {
                // TODO: Right now if you specify the turn url you are forced to provide username and password as well
                iceServers.push({ "url": this.iceOptions.turnUrl,
                                  "username": this.iceOptions.turnUsername,
                                  "credential": this.iceOptions.turnPassword });
            }
        }

        // Create the local peer
        const options: Object = {
            videoStream: this.stream.getStreamObject(),
            audioStreams: this.stream.getStreamObject(),
            onicecandidate: this.onIceCandidate,
            configuration: {
                iceServers: iceServers,
                iceTransportPolicy: this.iceOptions.forceTurn === true ? 'relay' : 'all'
            }
        };

        if (true) { // that.displayMyRemote()) {
            this.webRtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options, (error: any) => {
                if (error) {
                    return console.error(error);
                }

                this.webRtcPeer.generateOffer(this.onOfferGenerated);
            });
        } else {
            this.webRtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options, (error: any) => {
                if (error) {
                    return console.error(error);
                }

                this.webRtcPeer.generateOffer(this.onOfferGenerated);
            });
        }

        // Change state
        this.state = KASLocalWebRtcPeerConstants.STATES.PEERCREATED;
    };

    /**
     * Internal callback invoked when the SDP offer is generated.
     * @param error
     * @param sdpOfferParam
     * @param wp
     */
    private onOfferGenerated = (error: any, sdpOfferParam: any, wp: any): void => {
        if (error) {
            return console.error("(publish) SDP offer error: " + JSON.stringify(error));
        }

        // Memorize the SDP offer
        this.sdpOffer = sdpOfferParam;

        // Invoke the callback if set
        if (this.onSDPOfferGeneratedCallback !== undefined) {
            this.onSDPOfferGeneratedCallback();
        }
    };

    /**
     * Internal callback called when an ICE candidate is generated.
     */
    private onIceCandidate = (candidate: any): void => {
        // Store the ICE candidate
        console.trace('Local ICE Candidate for ', this.stream.getId(),' received: ', candidate);
        this.iceCandidates.push(candidate);

        // Invoke the callback if set
        if (this.onICECandidateGeneratedCallback !== undefined) {
            this.onICECandidateGeneratedCallback(candidate);
        }
    };

    /**
     * Tries to publish the local attached stream
     */
    public publish = (thenCallback?: () => any, catchCallback?: (error: any) => any): void => {
        // Check the state
        if (this.state !== KASLocalWebRtcPeerConstants.STATES.PEERCREATED) {
            const error: any = {
                "message": "Invalid internal state, expected " + KASLocalWebRtcPeerConstants.STATES.PEERCREATED + " got " + this.state
            };
            console.warn(error);
            if (catchCallback !== undefined) {
                catchCallback(error);
            }
            return;
        }

        if (this.sdpOffer === undefined) {
            const error: any = {
                "message": "SDP offer not generated"
            };

            console.error(error.message);
            if (catchCallback !== undefined) {
                catchCallback(error);
            }
            return;
        }

        const request: IRequestPublishVideo = <IRequestPublishVideo> {
            "sdpOffer": this.sdpOffer,
            "streamId": this.stream.getId(),
            "streamType": this.stream.getStreamType(),
            "doLoopback": true
        };

        this.serverAPI.sendPublishVideo(request, (response: IResponsePublishVideo) => {
            // Memorize the SDP answer
            this.sdpAnswer = response.sdpAnswer;

            // Process the SDP answer
            const answer: any = new RTCSessionDescription({
                type: 'answer',
                sdp: this.sdpAnswer,
            });
            console.debug(this.stream.getId() + ": set peer connection with recvd SDP answer", this.sdpAnswer);

            const pc: any = this.webRtcPeer.peerConnection;
            pc.setRemoteDescription(answer, () => {
                const remoteStream: any = pc.getRemoteStreams()[0];

                // Memorize the remote stream
                this.remoteLoopbackStream = new KASStream(this.stream.getId() + "-remote");
                this.remoteLoopbackStream.setStreamType(this.stream.getStreamType());
                this.remoteLoopbackStream.setStreamObject(remoteStream);

                // Change state
                this.state = KASLocalWebRtcPeerConstants.STATES.PUBLISHED;

                if (thenCallback !== undefined) {
                    thenCallback();
                }
            }, (error: any) => {
                console.error(this.stream.getId() + ": Error setting SDP to the peer connection: " + JSON.stringify(error));
                if (catchCallback !== undefined) {
                    catchCallback(error);
                }
            });
        }, (error: any) => {
            console.error("Error in publishing ", error);
            if (catchCallback !== undefined) {
                catchCallback(error);
            }
        });
    };

    /**
     * Tries to unpublish the video
     */
    public unpublish = (thenCallback?: () => any, catchCallback?: (error: any) => any): void => {
        // Check the state
        if (this.state !== KASLocalWebRtcPeerConstants.STATES.PUBLISHED) {
            const error: any = {
                "message": "Invalid internal state, expected " + KASLocalWebRtcPeerConstants.STATES.PUBLISHED + " got " + this.state
            };
            console.warn(error);
            if (catchCallback !== undefined) {
                catchCallback(error);
            }
            return;
        }

        const streamId: string = this.stream.getId();
        this.internalDispose();

        console.debug("Stream '" + streamId + "' unpublished");
        const request: IRequestUnpublishVideo = <IRequestUnpublishVideo> {
            "streamId": streamId
        };

        this.serverAPI.sendUnpublishVideo(request, (response: IResponseUnpublishVideo) => {
            if (thenCallback !== undefined) {
                thenCallback();
            }
        }, (error: any) => {
            console.error("Error in unpublishing stream ", this.stream.getId(), " error:" , error);
            if (catchCallback !== undefined) {
                catchCallback(error);
            }
        });
    };

    /**
     * Disposes the peer (eventually unpublishing the attached stream)
     */
    public dispose = (): void => {
        if (this.state === KASLocalWebRtcPeerConstants.STATES.PUBLISHED) {
            this.unpublish();
        } else {
            this.internalDispose();
        }
    };

    /**
     * Version of dispose() that assumes that the stream is not published
     */
    private internalDispose = (): void => {
        if (this.webRtcPeer !== undefined) {
            this.webRtcPeer.dispose();
        }

        const streamId: string = this.stream.getId();
        this.stream.dispose();
        if (this.remoteLoopbackStream !== undefined) {
            this.remoteLoopbackStream.dispose();
        }

        // Reset member variables (except for serverAPI and participant)
        this.stream = undefined;
        this.remoteLoopbackStream = undefined;
        this.webRtcPeer = undefined;
        this.sdpOffer = undefined;
        this.sdpAnswer = undefined;
        this.iceCandidates = [ ];
        this.iceOptions = undefined;

        // Change state
        this.state = KASLocalWebRtcPeerConstants.STATES.DISPOSED;

        // Signal the participant that the peer has been disposed
        this.participant.localPeerDisposed(streamId);
    };

    public isLocal = (): boolean => {
        return true;
    };

    public getParticipant = (): KASParticipant => {
        return this.participant;
    };

    public getWebRtcPeer = (): any => {
        return this.webRtcPeer;
    };

    public getStream = (): KASStream => {
        return this.remoteLoopbackStream || this.stream;
    };

    public getSDPOffer = (): void => {
        return this.sdpOffer;
    };

    public getSDPAnswer = (): void => {
        return this.sdpAnswer;
    };

    public getRemoteLoopbackStream = (): KASStream => {
        return this.remoteLoopbackStream;
    };

    public setICEOptions = (iceOptions: IICEOptions): void => {
        this.iceOptions = iceOptions;
    };

    public setOnSDPOfferGeneratedCallback = (onSDPOfferGeneratedCallback: () => any): void => {
        this.onSDPOfferGeneratedCallback = onSDPOfferGeneratedCallback;
    };

    public setOnICECandidateGeneratedCallback = (onICECandidateGeneratedCallback: (candidate: any) => any): void => {
        this.onICECandidateGeneratedCallback = onICECandidateGeneratedCallback;
    };
}