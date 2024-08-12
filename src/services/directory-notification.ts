/*
 * Copyright © 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import ReconnectingWebSocket from 'reconnecting-websocket';
import { WsService } from '@gridsuite/commons-ui';
import { getUser } from '../redux/store';

export default class DirectoryNotificationSvc extends WsService {
    public constructor() {
        super(getUser, 'directory-notification');
    }

    /**
     * Function will be called to connect with notification websocket to update directories list
     * @returns {ReconnectingWebSocket}
     */
    public connectNotificationsWsUpdateDirectories() {
        const webSocketUrl = `${this.queryPrefix}/notify?updateType=directories`;
        const reconnectingWebSocket = new ReconnectingWebSocket(() => this.getUrlWithToken(webSocketUrl), undefined, {
            debug: `${import.meta.env.VITE_DEBUG_REQUESTS}` === 'true',
        });
        reconnectingWebSocket.onopen = function () {
            console.debug('Connected Websocket update studies:', webSocketUrl);
        };
        return reconnectingWebSocket;
    }
}
