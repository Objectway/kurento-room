export class KASStreamConstants {
    public static get STREAM_TYPE(): any {
        return {
            DATA: 'data',
            AUDIO: 'audio',
            VIDEO: 'video',
            SCREEN: 'screen'
        };
    }
}

/**
 * @class KASStream
 * @description Represents a stream (local or remote)
 * @author Danilo Arcidiacono
 */
export class KASStream {
    /**
     * Id of the stream. It must be unique within the same participant.
     */
    protected id: string;

    /**
     * Type of stream (one of KASStreamConstants.STREAM_TYPE values)
     */
    protected streamType: string = KASStreamConstants.STREAM_TYPE.DATA;

    /**
     * Stream object obtained via getUserMedia() native call.
     * Will be undefined for DATA stream type.
     * @type {any}
     */
    protected userMediaStream: any = undefined;

    public constructor(id: string) {
        this.id = id;
    }

    /**
     * Generates a <video> or <audio> tag with the given id based on the stream type.
     * @returns {any}
     */
    public generateHTMLElement = (id?: string): HTMLVideoElement | HTMLAudioElement => {
        if (this.getStreamType() === KASStreamConstants.STREAM_TYPE.AUDIO) {
            const audio: HTMLAudioElement = document.createElement('audio');
            audio.id = id || ('native-audio-' + this.id);
            audio.autoplay = true;
            audio.controls = false;
            audio.src = URL.createObjectURL(this.userMediaStream);

            return audio;
        }

        if (this.getStreamType() === KASStreamConstants.STREAM_TYPE.VIDEO ||
            this.getStreamType() === KASStreamConstants.STREAM_TYPE.SCREEN) {

            const video: HTMLVideoElement = document.createElement('video');
            video.id = id || ('native-video-' + this.id);
            video.autoplay = true;
            video.controls = false;
            video.src = URL.createObjectURL(this.userMediaStream);

            return video;
        }

        // No corresponding HTML element for streams of type DATA!
        return undefined;
    };

    public dispose = (): void => {
        if (this.userMediaStream !== undefined) {
            this.userMediaStream.getAudioTracks().forEach(function (track) {
                track.stop && track.stop()
            });
            this.userMediaStream.getVideoTracks().forEach(function (track) {
                track.stop && track.stop()
            });
        }
    };

    public getId = (): string => {
        return this.id;
    };

    public getStreamType = (): string => {
        return this.streamType;
    };

    public getStreamObject = (): any => {
        return this.userMediaStream;
    };

    public setStreamType = (streamType: string): void => {
        this.streamType = streamType;
    };

    public setStreamObject = (userMediaStream: any): void => {
        this.userMediaStream = userMediaStream;
    };
}