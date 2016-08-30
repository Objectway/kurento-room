define(["require", "exports", "./KASParticipant"], function (require, exports, KASParticipant_1) {
    "use strict";
    /**
     * @class KASRoom
     * @description Represents a single room with its participants.
     * @author Danilo Arcidiacono
     */
    var KASRoom = (function () {
        function KASRoom(id, serverAPI) {
            var _this = this;
            /**
             * Participants
             */
            this.participants = {};
            /**
             * Adds a new participant to the room.
             * Returns the newly generated participant.
             * @param participantId
             */
            this.addParticipant = function (participantId) {
                if (participantId in _this.participants) {
                    console.error("Participant " + participantId + " already exists in room " + participantId);
                    return undefined;
                }
                var participant = new KASParticipant_1.KASParticipant(participantId, _this.serverAPI);
                _this.participants[participantId] = participant;
                return participant;
            };
            /**
             * Removes a participant from the room. Returns the removed participant.
             * @param participantId
             * @returns {undefined}
             */
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
            /**
             * Returns the participant having the specified id.
             * @param participantId
             * @returns {any}
             */
            this.getParticipantById = function (participantId) {
                if (!(participantId in _this.participants)) {
                    console.error("Participant " + participantId + " not found in room " + participantId);
                    return undefined;
                }
                return _this.participants[participantId];
            };
            /**
             * Disposes the room
             */
            this.dispose = function () {
                // Copy the participant ids because the inner loop removes elements from participants
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
