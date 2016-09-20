import {KASStream, KASStreamConstants} from "./KASStream";

export interface IStreamConstraints {
    /**
     * When streamType is VIDEO or SCREEN, indicates the preferred video width.
     * @type {any}
     */
    idealVideoWidth?: number;

    /**
     * When streamType is VIDEO or SCREEN, indicates the preferred video height.
     * @type {any}
     */
    idealVideoHeight?: number;

    /**
     * When streamType is VIDEO or SCREEN, indicates the minimum preferred frame rate.
     * @type {any}
     */
    idealFrameRate?: number;
};

/**
 * @class KASLocalStream
 * @description Represents a local stream
 * @author Danilo Arcidiacono
 */
export class KASLocalStream extends KASStream {

    /**
     * User media constraints
     * @type {any}
     */
    private userMediaConstraints: any = undefined;

    public constructor(id: string) {
        super(id);
    }

    /**
     * Initializes the userMediaStream object with getUserMedia(), calling the appropriate callbacks.
     * @param thenCallback
     * @param catchCallback
     */
    public requestUserMediaStream = (streamConstraints: IStreamConstraints,
                                     thenCallback?: () => any,
                                     catchCallback?: (error: any) => any): void => {
        if (this.streamType === KASStreamConstants.STREAM_TYPE.AUDIO ||
            this.streamType === KASStreamConstants.STREAM_TYPE.VIDEO) {
            this.requestAudioVideoUserMediaStream(streamConstraints, thenCallback, catchCallback);
        }

        if (this.streamType === KASStreamConstants.STREAM_TYPE.SCREEN) {
            this.requestScreenUserMediaStream(streamConstraints, thenCallback, catchCallback);
        }
    };

    /**
     * Internal method for requesting the audio and/or video using getUserMedia()
     */
    private requestAudioVideoUserMediaStream = (streamConstraints: IStreamConstraints,
                                                thenCallback?: () => any,
                                                catchCallback?: (error: any) => any): void => {
        this.userMediaConstraints = {
            audio: this.streamType === KASStreamConstants.STREAM_TYPE.AUDIO || this.streamType === KASStreamConstants.STREAM_TYPE.VIDEO,
            video: this.streamType === KASStreamConstants.STREAM_TYPE.VIDEO
        };

        // If we have requested the VIDEO, and there is at least one constraint,
        // we refine the "video" property of userMediaConstraints
        if (this.userMediaConstraints.video === true &&
            (streamConstraints.idealVideoWidth !== undefined ||
            streamConstraints.idealVideoHeight !== undefined ||
            streamConstraints.idealFrameRate !== undefined)) {
            this.userMediaConstraints.video = { };

            if (streamConstraints.idealVideoWidth !== undefined) {
                this.userMediaConstraints.video.width = { ideal: streamConstraints.idealVideoWidth };
            }

            if (streamConstraints.idealVideoHeight !== undefined) {
                this.userMediaConstraints.video.height = { ideal: streamConstraints.idealVideoHeight };
            }

            if (streamConstraints.idealFrameRate !== undefined) {
                this.userMediaConstraints.video.frameRate = { ideal: streamConstraints.idealFrameRate };
            }
        }

        if (this.streamType === KASStreamConstants.STREAM_TYPE.DATA) {
            if (thenCallback !== undefined) {
                thenCallback();
            }
        } else {
            // Call getUserMedia
            getUserMedia(this.userMediaConstraints, (userStream: any) => {
                this.userMediaStream = userStream;

                if (thenCallback !== undefined) {
                    thenCallback();
                }
            }, (error: any) => {
                console.error("Access denied", error, " with constraints ", this.userMediaConstraints);
                if (catchCallback !== undefined) {
                    catchCallback(error);
                }
            });
        }
    };

    /**
     * Internal method for requesting the screen using getUserMedia()
     */
    private requestScreenUserMediaStream = (streamConstraints: IStreamConstraints,
                                            thenCallback?: () => any,
                                            catchCallback?: (error: any) => any): void => {
        // Detect the browser
        const isChrome: boolean = window.navigator.userAgent.match('Chrome') !== null;
        const isFirefox: boolean = window.navigator.userAgent.match('Firefox') !== null;

        // Init
        if (isChrome === true) {
            this.requestScreenChromeUserMediaStream(streamConstraints, thenCallback, catchCallback);
        } else if (isFirefox === true) {
            this.requestScreenFirefoxUserMediaStream(streamConstraints, thenCallback, catchCallback);
        } else {
            var error = "Unknown browser";
            console.error("Access denied", error);

            if (catchCallback !== undefined) {
                catchCallback(error);
            }
        }
    };

    /**
     * Internal method for requesting the screen using getUserMedia() that works in Chrome
     */
    private requestScreenChromeUserMediaStream = (streamConstraints: IStreamConstraints,
                                                  thenCallback?: () => any,
                                                  catchCallback?: (error: any) => any): void => {
        if (sessionStorage.getScreenMediaJSExtensionId === undefined) {
            const error: string = "No extension found";
            console.error("Access denied", error);

            if (catchCallback !== undefined) {
                catchCallback(error);
            }

            return;
        }

        const params: Object = {
            type: 'getScreen',
            id: 1
        };

        // This shows the screen selection popup
        chrome.runtime.sendMessage(sessionStorage.getScreenMediaJSExtensionId, params, null, (data: any) => {
            if (!data || data.sourceId === '') {
                // User has clicked cancel
                const error: string = "User has canceled";
                console.error("Access denied: ", error);

                if (catchCallback !== undefined) {
                    catchCallback(error);
                }
            } else {
                // User has selected a window to share
                this.userMediaConstraints = {
                    audio: false, // audio: true does not work in Chrome (https://github.com/muaz-khan/getScreenId/issues/1)
                    video: {
                        mandatory: {
                            chromeMediaSource: 'desktop',
                            // maxWidth: window.screen.width,
                            // maxHeight: window.screen.height,
                            // maxFrameRate: 60,
                            chromeMediaSourceId: data.sourceId
                        },
                        optional: [
                            { googLeakyBucket: true },
                            { googTemporalLayeredScreencast: true }
                        ]
                    }
                };

                // If there is at least one constraint, we refine the "video" property of userMediaConstraints
                if (streamConstraints.idealVideoWidth !== undefined) {
                    this.userMediaConstraints.video.width = { ideal: streamConstraints.idealVideoWidth };
                }

                if (streamConstraints.idealVideoHeight !== undefined) {
                    this.userMediaConstraints.video.height = { ideal: streamConstraints.idealVideoHeight };
                }

                if (streamConstraints.idealFrameRate !== undefined) {
                    this.userMediaConstraints.video.frameRate = { ideal: streamConstraints.idealFrameRate };
                }

                // Call getUserMedia
                getUserMedia(this.userMediaConstraints, (userStream: any) => {
                    this.userMediaStream = userStream;

                    if (thenCallback !== undefined) {
                        thenCallback();
                    }
                }, (error: any) => {
                    console.error("Access denied", error);

                    if (catchCallback !== undefined) {
                        catchCallback(error);
                    }
                });
            }
        });
    };

    /**
     * Internal method for requesting the screen using getUserMedia() that works in Firefox
     */
    private requestScreenFirefoxUserMediaStream = (streamConstraints: IStreamConstraints,
                                                   thenCallback?: () => any,
                                                   catchCallback?: (error: any) => any): void => {
        const ffver: number = parseInt(window.navigator.userAgent.match(/Firefox\/(.*)/)[1], 10);
        if (ffver < 33) {
            var error = "Firefox version must be >= 33";
            console.error("Access denied", error);

            if (catchCallback !== undefined) {
                catchCallback(error);
            }

            return;
        }

        this.userMediaConstraints = {
            audio: true,
            video: {
                mozMediaSource: 'screen',
                mediaSource: 'screen'
            }
        };

        // If there is at least one constraint, refine the "video" property of userMediaConstraints
        if (streamConstraints.idealVideoWidth !== undefined) {
            this.userMediaConstraints.video.width = { ideal: streamConstraints.idealVideoWidth };
        }

        if (streamConstraints.idealVideoHeight !== undefined) {
            this.userMediaConstraints.video.height = { ideal: streamConstraints.idealVideoHeight };
        }

        if (streamConstraints.idealFrameRate !== undefined) {
            this.userMediaConstraints.video.frameRate = { ideal: streamConstraints.idealFrameRate };
        }

        // Call getUserMedia
        getUserMedia(this.userMediaConstraints, (userStream: any) => {
            this.userMediaStream = userStream;

            if (thenCallback !== undefined) {
                thenCallback();
            }

            // workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=1045810
            var lastTime = userStream.currentTime;
            var polly = window.setInterval(function () {
                if (!userStream) window.clearInterval(polly);
                if (userStream.currentTime == lastTime) {
                    window.clearInterval(polly);
                    if (userStream.onended) {
                        userStream.onended();
                    }
                }
                lastTime = userStream.currentTime;
            }, 500);
        }, (err: any) => {
            console.error("Access denied", err);

            if (catchCallback !== undefined) {
                catchCallback(error);
            }
        });
    };

    /**
     * Returns the media constraints that have been passed to getUserMedia()
     * @returns {any}
     */
    public getUserMediaConstraints = (): void => {
        return this.userMediaConstraints;
    }
}