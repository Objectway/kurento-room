define(["require", "exports", "./KASConnection", "./KASLocalStream", "./KASLocalWebRtcPeer", "./KASParticipant", "./KASRemoteWebRtcPeer", "./KASRoom", "./KASServer", "./KASServerAPI", "./KASStream"], function (require, exports, KASConnection, KASLocalStream, KASLocalWebRtcPeer, KASParticipant, KASRemoteWebRtcPeer, KASRoom, KASServer, KASServerAPI, KASStream) {
    "use strict";
    // import KASWebRtcPeer = require("./KASWebRtcPeer");
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
