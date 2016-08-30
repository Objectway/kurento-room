import {KASParticipant} from "./KASParticipant";
import {KASServerAPI} from "./KASServerAPI";

/**
 * @class KASRoom
 * @description Represents a single room with its participants.
 * @author Danilo Arcidiacono
 */
export class KASRoom {

    /**
     * Id of the room
     */
    private id: string;

    /**
     * Client object to communicate with the KAS
     */
    private serverAPI: KASServerAPI;

    /**
     * Participants
     */
    private participants: { [ participantId: string ]: KASParticipant } = { };

    public constructor(id: string, serverAPI: KASServerAPI) {
        this.id = id;
        this.serverAPI = serverAPI;
    }

    /**
     * Adds a new participant to the room.
     * Returns the newly generated participant.
     * @param participantId
     */
    public addParticipant = (participantId: string): KASParticipant => {
        if (participantId in this.participants) {
            console.error("Participant " + participantId + " already exists in room " + participantId);
            return undefined;
        }

        const participant: KASParticipant = new KASParticipant(participantId, this.serverAPI);
        this.participants[participantId] = participant;

        return participant;
    };

    /**
     * Removes a participant from the room. Returns the removed participant.
     * @param participantId
     * @returns {undefined}
     */
    public removeParticipant = (participantId: string): KASParticipant => {
        if (!(participantId in this.participants)) {
            console.error("Participant " + participantId + " not found in room " + participantId);
            return undefined;
        }

        const participant: KASParticipant = this.participants[participantId];
        participant.dispose();
        delete this.participants[participantId];

        return participant;
    };

    /**
     * Returns the participant having the specified id.
     * @param participantId
     * @returns {any}
     */
    public getParticipantById = (participantId: string): KASParticipant => {
        if (!(participantId in this.participants)) {
            console.error("Participant " + participantId + " not found in room " + participantId);
            return undefined;
        }

        return this.participants[participantId];
    };

    /**
     * Disposes the room
     */
    public dispose = (): void => {
        // Copy the participant ids because the inner loop removes elements from participants
        const ids: Array<string> = Object.keys(this.participants);

        for (let i = 0; i < ids.length; i++) {
            this.removeParticipant(ids[i]);
        }
    };

    public getId = (): string => {
        return this.id;
    };

    public getParticipants = (): { [ participantId: string ]: KASParticipant } => {
        return this.participants;
    };
}
