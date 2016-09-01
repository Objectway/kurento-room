import {KASLocalWebRtcPeer} from "./KASLocalWebRtcPeer";
import {KASLocalStream, IStreamConstraints} from "./KASLocalStream";
import {KASServerAPI, IRequestSendICECandidate} from "./KASServerAPI";
import {KASRemoteWebRtcPeer} from "./KASRemoteWebRtcPeer";
import {IICEOptions, IKASWebRtcPeer} from "./KASWebRtcPeer";
import {KASStream} from "./KASStream";

/**
 * @class KASParticipant
 * @description Represents a participant of a room with its streams and WebRtcPeers.
 * @author Danilo Arcidiacono
 */
export class KASParticipant {

    /**
     * Id of the participant
     */
    private id: string;

    /**
     * Client object to communicate with the KAS
     */
    private serverAPI: KASServerAPI;

    /**
     * Streams published by the participant
     */
    private publishedStreams: { [ streamId: string ]: KASLocalWebRtcPeer } = { };

    /**
     * Streams subscribed by the participant
     */
    private subscribedStreams: { [ streamId: string ]: KASRemoteWebRtcPeer } = { };

    public constructor(id: string, serverAPI: KASServerAPI) {
        this.id = id;
        this.serverAPI = serverAPI;
    }

    /**
     * Tries to add a new local stream with the given options.
     * @param id
     * @param streamType
     * @param streamConstraints
     * @param iceOptions
     * @param thenCallback
     * @param catchCallback
     */
    public addLocalStream = (id: string, streamType: string, streamConstraints: IStreamConstraints, iceOptions: IICEOptions,
                             thenCallback?: (stream: KASLocalWebRtcPeer) => any,
                             catchCallback?: (error: any) => any): void => {
        // Check for existing streams
        if (id in this.publishedStreams) {
            const error: any = {
                "message": "Stream " + id + " already published by participant " + id
            };

            console.error(error.message);
            if (catchCallback !== undefined) {
                catchCallback(error);
            }
            return;
        }

        // Create a local stream
        const localStream: KASLocalStream = new KASLocalStream(id);
        localStream.setStreamType(streamType);

        // Request the user media
        localStream.requestUserMediaStream(streamConstraints, () => {
            // Create the webrtc peer
            const peer: KASLocalWebRtcPeer = new KASLocalWebRtcPeer(localStream, this.serverAPI, this);

            // Setup the options
            peer.setICEOptions(iceOptions);

            peer.setOnICECandidateGeneratedCallback((candidate: any) => {
                const request: IRequestSendICECandidate = {
                    endpointName: this.getId(),
                    streamId: localStream.getId(),
                    candidate: candidate.candidate,
                    sdpMid: candidate.sdpMid,
                    sdpMLineIndex: candidate.sdpMLineIndex
                };

                // TODO: Handle errors in ICE candidates
                this.serverAPI.sendICECandidate(request);
            });

            peer.setOnSDPOfferGeneratedCallback(() => {
                // Add the stream object
                this.publishedStreams[id] = peer;
                console.info("Created local stream stream id=", id, " type=", streamType, " streamConstraints=", streamConstraints, " iceOptions=", iceOptions);

                // Notify the user only when the SDP offer is generated
                // TODO: Should we wait for all local ICE candidates to be sent?
                if (thenCallback !== undefined) {
                    thenCallback(peer);
                }
            });

            // Begin the creation
            peer.createKurentoPeer();
        }, (error: any) => {
            console.error("Could not create local stream id="+ id+ " type="+ streamType+ " streamConstraints=" + JSON.stringify(streamConstraints) + " iceOptions=" +  JSON.stringify(iceOptions));
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
    public addRemoteStream = (id: string,
                              streamType: string,
                              iceOptions: IICEOptions,
                              thenCallback?: (stream: KASRemoteWebRtcPeer) => any,
                              catchCallback?: (error: any) => any): void => {
        // Check for existing streams
        if (id in this.subscribedStreams) {
            const error: any = {
                "message": "Stream " + id + " already subscribed by participant " + id
            };

            console.error(error.message);
            if (catchCallback !== undefined) {
                catchCallback(error);
            }
            return;
        }

        // Create a remote stream (we do NOT obtain a stream here, but only when subscribe() will be called on the peer)
        const remoteStream: KASStream = new KASStream(id);
        remoteStream.setStreamObject(undefined);
        remoteStream.setStreamType(streamType);

        // Create the remote peer
        const peer: KASRemoteWebRtcPeer = new KASRemoteWebRtcPeer(remoteStream, this.serverAPI, this);

        // Setup the options
        peer.setICEOptions(iceOptions);

        peer.setOnICECandidateGeneratedCallback((candidate: any) => {
            const request: IRequestSendICECandidate = {
                endpointName: this.getId(),
                streamId: remoteStream.getId(),
                candidate: candidate.candidate,
                sdpMid: candidate.sdpMid,
                sdpMLineIndex: candidate.sdpMLineIndex
            };

            // TODO: Handle errors in ICE candidates
            this.serverAPI.sendICECandidate(request);
        });

        peer.setOnSDPOfferGeneratedCallback(() => {
            // Add the stream object
            this.subscribedStreams[id] = peer;
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
    public localPeerDisposed = (streamId: string): void => {
        // Remove the peer from the data structure
        delete this.publishedStreams[streamId];
    };

    /**
     * Callback called by the remote peers to signal when they are disposed
     * @param streamId
     */
    public remotePeerDisposed = (streamId: string): void => {
        // Remove the peer from the data structure
        delete this.subscribedStreams[streamId];
    };

    /**
     * Disposes the participant
     */
    public dispose = (): void => {
        // We need to copy the stream ids because dispose calls this.localPeerDisposed() which
        // removes elements from this.publishedStreams
        const publishedStreamsIds: Array<string> = Object.keys(this.publishedStreams);
        for (var i = 0; i < publishedStreamsIds.length; i++) {
            this.publishedStreams[publishedStreamsIds[i]].dispose();
        }

        // We need to copy the stream ids because dispose calls this.remotePeerDisposed() which
        // removes elements from this.subscribedStreams
        const subscribedStreamsIds: Array<string> = Object.keys(this.subscribedStreams);
        for (var i = 0; i < subscribedStreamsIds.length; i++) {
            this.subscribedStreams[subscribedStreamsIds[i]].dispose();
        }
    };

    public getId = (): string => {
        return this.id;
    };

    public getPublishedPeers = (): { [ streamId: string ]: KASLocalWebRtcPeer } => {
        return this.publishedStreams;
    };

    public getPublishedPeerByStreamId = (streamId: string): KASLocalWebRtcPeer => {
        return this.publishedStreams[streamId];
    };

    public getSubscribedPeers = (): { [ streamId: string ]: KASRemoteWebRtcPeer } => {
        return this.subscribedStreams;
    };

    public getSubscribedPeerByStreamId = (streamId: string): KASRemoteWebRtcPeer => {
        return this.subscribedStreams[streamId];
    };

    public getPeerByStreamId = (streamId: string): IKASWebRtcPeer => {
        return this.getPublishedPeerByStreamId(streamId) || this.getSubscribedPeerByStreamId(streamId);
    };
}
