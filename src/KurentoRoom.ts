import KASConnection = require("./KASConnection");
import KASLocalStream = require("./KASLocalStream");
import KASLocalWebRtcPeer = require("./KASLocalWebRtcPeer");
import KASParticipant = require("./KASParticipant");
import KASRemoteWebRtcPeer = require("./KASRemoteWebRtcPeer");
import KASRoom = require("./KASRoom");
import KASServer = require("./KASServer");
import KASServerAPI = require("./KASServerAPI");
import KASStream = require("./KASStream");
// import KASWebRtcPeer = require("./KASWebRtcPeer");

export class KurentoRoom {
    public constructor() {
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
        }
    }
}
