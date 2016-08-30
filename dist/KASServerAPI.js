define(["require", "exports"], function (require, exports) {
    "use strict";
    /**
     * @class KASServerAPI
     * @description This class handles the Kurento-Room websocket protocol
     *
     * @author Danilo Arcidiacono
     */
    var KASServerAPI = (function () {
        function KASServerAPI(kasConnection) {
            var _this = this;
            /**
             * Sends a joinRoom request, calling the appropriate callbacks.
             * @param request
             * @param thenCallback
             * @param catchCallback
             */
            this.sendJoinRoom = function (request, thenCallback, catchCallback) {
                _this.kasConnection.sendRequest('joinRoom', request, function (error, response) {
                    if (error) {
                        if (catchCallback !== undefined) {
                            catchCallback(error);
                        }
                    }
                    else {
                        if (thenCallback !== undefined) {
                            thenCallback(response);
                        }
                    }
                });
            };
            /**
             * Sends a leaveRoom request, calling the appropriate callbacks.
             * @param request
             * @param thenCallback
             * @param catchCallback
             */
            this.sendLeaveRoom = function (request, thenCallback, catchCallback) {
                _this.kasConnection.sendRequest('leaveRoom', request, function (error, response) {
                    if (error) {
                        if (catchCallback !== undefined) {
                            catchCallback(error);
                        }
                    }
                    else {
                        if (thenCallback !== undefined) {
                            thenCallback(response);
                        }
                    }
                });
            };
            /**
             * Sends a publishVideo request, calling the appropriate callbacks.
             * @param request
             * @param thenCallback
             * @param catchCallback
             */
            this.sendPublishVideo = function (request, thenCallback, catchCallback) {
                _this.kasConnection.sendRequest('publishVideo', request, function (error, response) {
                    if (error) {
                        if (catchCallback !== undefined) {
                            catchCallback(error);
                        }
                    }
                    else {
                        if (thenCallback !== undefined) {
                            thenCallback(response);
                        }
                    }
                });
            };
            /**
             * Sends an unpublishVideo request, calling the appropriate callbacks.
             * @param request
             * @param thenCallback
             * @param catchCallback
             */
            this.sendUnpublishVideo = function (request, thenCallback, catchCallback) {
                _this.kasConnection.sendRequest('unpublishVideo', request, function (error, response) {
                    if (error) {
                        if (catchCallback !== undefined) {
                            catchCallback(error);
                        }
                    }
                    else {
                        if (thenCallback !== undefined) {
                            thenCallback(response);
                        }
                    }
                });
            };
            /**
             * Sends a receiveVideoFrom request, calling the appropriate callbacks.
             * @param request
             * @param thenCallback
             * @param catchCallback
             */
            this.sendReceiveVideoFrom = function (request, thenCallback, catchCallback) {
                _this.kasConnection.sendRequest('receiveVideoFrom', request, function (error, response) {
                    if (error) {
                        if (catchCallback !== undefined) {
                            catchCallback(error);
                        }
                    }
                    else {
                        if (thenCallback !== undefined) {
                            thenCallback(response);
                        }
                    }
                });
            };
            /**
             * Sends a unsubscribeFromVideo request, calling the appropriate callbacks.
             * @param request
             * @param thenCallback
             * @param catchCallback
             */
            this.sendUnsubscribeFrom = function (request, thenCallback, catchCallback) {
                _this.kasConnection.sendRequest('unsubscribeFromVideo', request, function (error, response) {
                    if (error) {
                        if (catchCallback !== undefined) {
                            catchCallback(error);
                        }
                    }
                    else {
                        if (thenCallback !== undefined) {
                            thenCallback(response);
                        }
                    }
                });
            };
            /**
             * Sends a onIceCandidate request, calling the appropriate callbacks.
             * @param request
             * @param thenCallback
             * @param catchCallback
             */
            this.sendICECandidate = function (request, thenCallback, catchCallback) {
                _this.kasConnection.sendRequest('onIceCandidate', request, function (error, response) {
                    if (error) {
                        if (catchCallback !== undefined) {
                            catchCallback(error);
                        }
                    }
                    else {
                        if (thenCallback !== undefined) {
                            thenCallback(response);
                        }
                    }
                });
            };
            /**
             * Sends a sendMessage request, calling the appropriate callbacks.
             * @param request
             * @param thenCallback
             * @param catchCallback
             */
            this.sendMessage = function (request, thenCallback, catchCallback) {
                _this.kasConnection.sendRequest('sendMessage', request, function (error, response) {
                    if (error) {
                        if (catchCallback !== undefined) {
                            catchCallback(error);
                        }
                    }
                    else {
                        if (thenCallback !== undefined) {
                            thenCallback(response);
                        }
                    }
                });
            };
            this.kasConnection = kasConnection;
        }
        return KASServerAPI;
    }());
    exports.KASServerAPI = KASServerAPI;
});
