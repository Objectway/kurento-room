import {KASStream} from "./KASStream";
import {KASParticipant} from "./KASParticipant";
/**
 * ICE protocol options (STUN and TURN server configuration)
 */
export interface IICEOptions {
    stunUrl?: string;
    turnUrl?: string;
    turnUsername?: string;
    turnPassword?: string;

    /**
     * If TRUE, only the TURN server will be used (the turn url must be set up, though)
     */
    forceTurn: boolean;
}

/**
 * @class KASWebRtcPeer
 * @description Base class for remote or local webrtc peers
 *
 * @author Danilo Arcidiacono
 */
export interface IKASWebRtcPeer {
    /**
     * Returns TRUE if the peer is local
     */
    isLocal(): boolean;

    /**
     * Returns the participant owning the peer
     */
    getParticipant(): KASParticipant;

    /**
     * Returns the Kurento WebRtc peer object
     */
    getWebRtcPeer(): any;

    /**
     * Returns the stream (could be local or remote) attached to this peer
     */
    getStream(): KASStream;

    /**
     * Disposes the webrtc peer
     */
    dispose(): void;
}