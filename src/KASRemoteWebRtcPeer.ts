import kurentoUtils = require('kurento-utils');

import {KASStream, KASStreamConstants} from "./KASStream";
import {KASServerAPI, IRequestReceiveVideo, IResponseReceiveVideo} from "./KASServerAPI";
import {IICEOptions, IKASWebRtcPeer} from "./KASWebRtcPeer";
import {KASParticipant} from "./KASParticipant";
import {IRequestUnsubscribeFromVideo} from "./KASServerAPI";
import {IResponseUnsubscribeFromVideo} from "./KASServerAPI";

export class KASRemoteWebRtcPeerConstants {
    public static get STATES(): any {
        return {
            INITIALIZED: 'initialized',
            PEERCREATED: 'peercreated',
            SUBSCRIBED: 'subscribed',
            DISPOSED: 'disposed'
        };
    }
}
/**
 * @class KASRemoteWebRtcPeer
 * @description Represents a WebRtcPeer attached to a remote stream that generates an SDP offer and exchanges ICE candidates with the KAS.
 *
 * @author Danilo Arcidiacono
 */
export class KASRemoteWebRtcPeer implements IKASWebRtcPeer {
    /**
     * Internal state of the stream (one of KASLocalWebRtcPeerConstants.STATES)
     */
    private state: string = KASRemoteWebRtcPeerConstants.STATES.INITIALIZED;

    /**
     * Client object to communicate with the KAS
     */
    private serverAPI: KASServerAPI;

    /**
     * The participant owning this peer
     */
    private participant: KASParticipant;

    /**
     * Attached stream (remote)
     */
    private stream: KASStream;

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

    public constructor(stream: KASStream, serverAPI: KASServerAPI, participant: KASParticipant) {
        this.stream = stream;
        this.serverAPI = serverAPI;
        this.participant = participant;
    }

    /**
     * Creates the webRtcPeer object based on the attached stream.
     */
    public createKurentoPeer = (): void => {
        // Check the state
        if (this.state !== KASRemoteWebRtcPeerConstants.STATES.INITIALIZED) {
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

        // Create the webrtc peer
        const offerConstraints: Object = {
            mandatory: {
                OfferToReceiveVideo: this.stream.getStreamType() === KASStreamConstants.STREAM_TYPE.VIDEO ||
                this.stream.getStreamType() === KASStreamConstants.STREAM_TYPE.SCREEN,

                OfferToReceiveAudio: this.stream.getStreamType() === KASStreamConstants.STREAM_TYPE.AUDIO ||
                this.stream.getStreamType() === KASStreamConstants.STREAM_TYPE.VIDEO ||
                this.stream.getStreamType() === KASStreamConstants.STREAM_TYPE.SCREEN
            }
        };
        console.debug("Constraints of generate SDP offer (subscribing)", offerConstraints);
        const options: Object = {
            onicecandidate: this.onIceCandidate,
            connectionConstraints: offerConstraints,
            configuration: {
                iceServers: iceServers,
                iceTransportPolicy: this.iceOptions.forceTurn === true ? 'relay' : 'all'
            }
        };

        this.webRtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, (error: any) => {
            if (error) {
                return console.error(error);
            }

            this.webRtcPeer.generateOffer(this.onOfferGenerated);
        });

        // Change state
        this.state = KASRemoteWebRtcPeerConstants.STATES.PEERCREATED;
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
        console.trace('Remote ICE Candidate for ', this.stream.getId(),' received: ', candidate);
        this.iceCandidates.push(candidate);

        // Invoke the callback if set
        if (this.onICECandidateGeneratedCallback !== undefined) {
            this.onICECandidateGeneratedCallback(candidate);
        }
    };

    /**
     * Tries to subscribe to this remote peer
     * @param thenCallback
     * @param catchCallback
     */
    public subscribe = (thenCallback?: () => any, catchCallback?: (error: any) => any): void => {
        const senderName: string = this.participant.getId();

        // Check the state
        if (this.state !== KASRemoteWebRtcPeerConstants.STATES.PEERCREATED) {
            const error: any = {
                "message": "Invalid internal state, expected " + KASRemoteWebRtcPeerConstants.STATES.PEERCREATED + " got " + this.state
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

        const request: IRequestReceiveVideo = <IRequestReceiveVideo> {
            "sender": senderName,
            "sdpOffer": this.sdpOffer,
            "streamId": this.stream.getId(),
        };

        this.serverAPI.sendReceiveVideoFrom(request, (response: IResponseReceiveVideo) => {
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
                this.stream.setStreamObject(remoteStream);

                // Change state
                this.state = KASRemoteWebRtcPeerConstants.STATES.SUBSCRIBED;

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
    public unsubscribe = (thenCallback?: () => any, catchCallback?: (error: any) => any): void => {
        const senderName: string = this.participant.getId();

        // Check the state
        if (this.state !== KASRemoteWebRtcPeerConstants.STATES.SUBSCRIBED) {
            const error: any = {
                "message": "Invalid internal state, expected " + KASRemoteWebRtcPeerConstants.STATES.SUBSCRIBED + " got " + this.state
            };
            console.warn(error);
            if (catchCallback !== undefined) {
                catchCallback(error);
            }
            return;
        }

        const streamId: string = this.stream.getId();
        this.internalDispose();

        console.debug("Stream '" + streamId + "' unsubscribed");
        const request: IRequestUnsubscribeFromVideo = <IRequestUnsubscribeFromVideo> {
            "sender": senderName,
            "streamId": streamId
        };

        this.serverAPI.sendUnsubscribeFrom(request, (response: IResponseUnsubscribeFromVideo) => {
            if (thenCallback !== undefined) {
                thenCallback();
            }
        }, (error: any) => {
            console.error("Error in unsubscribing stream ", this.stream.getId(), " error:" , error);
            if (catchCallback !== undefined) {
                catchCallback(error);
            }
        });
    };

    /**
     * Disposes the peer (eventually unsubscribing from the attached stream)
     */
    public dispose = (): void => {
        if (this.state === KASRemoteWebRtcPeerConstants.STATES.SUBSCRIBED) {
            this.unsubscribe();
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

        // Reset member variables (except for serverAPI and participant)
        this.stream = undefined;
        this.webRtcPeer = undefined;
        this.sdpOffer = undefined;
        this.sdpAnswer = undefined;
        this.iceCandidates = [ ];
        this.iceOptions = undefined;

        // Change state
        this.state = KASRemoteWebRtcPeerConstants.STATES.DISPOSED;

        // Signal the participant that the peer has been disposed
        this.participant.remotePeerDisposed(streamId);
    };

    public isLocal = (): boolean => {
        return false;
    };

    public getParticipant = (): KASParticipant => {
        return this.participant;
    };

    public getWebRtcPeer = (): any => {
        return this.webRtcPeer;
    };

    public getStream = (): KASStream => {
        return this.stream;
    };

    public getSDPOffer = (): void => {
        return this.sdpOffer;
    };

    public getSDPAnswer = (): void => {
        return this.sdpAnswer;
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