/**
 * Copyright (c) 2025, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useIntl } from 'react-intl';
import { NotificationsUrlKeys, useNotificationsListener, useSnackMessage } from '@gridsuite/commons-ui';
import { useSelector } from 'react-redux';
import { useCallback } from 'react';
import { AppState } from '../redux/types';
import { buildExportIdentifier, isExportSubscribed, unsetExportSubscription } from '../utils/case-export-utils';
import { useExportDownload } from './use-export-download';

export function useExportNotification() {
    const intl = useIntl();
    const { snackError, snackInfo } = useSnackMessage();
    const { downloadExportFile } = useExportDownload();
    const userIdProfile = useSelector((state: AppState) => state.user?.profile.sub);
    const handleExportNotification = useCallback(
        (event: MessageEvent<string>) => {
            const eventData = JSON.parse(event.data);
            if (eventData?.headers?.notificationType === 'caseExportSucceeded') {
                const { caseUuid, userId, exportUuid, error } = eventData.headers;
                const exportIdentifierNotif = buildExportIdentifier({
                    caseUuid,
                    exportUuid,
                });
                const isSubscribed = isExportSubscribed(exportIdentifierNotif);
                if (isSubscribed && userIdProfile === userId) {
                    unsetExportSubscription(exportIdentifierNotif);

                    if (error) {
                        snackError({
                            messageTxt: error,
                        });
                    } else {
                        downloadExportFile(exportUuid);
                        snackInfo({
                            messageTxt: intl.formatMessage({ id: 'export.message.succeeded' }),
                        });
                    }
                }
            }
        },
        [userIdProfile, snackError, downloadExportFile, snackInfo, intl]
    );

    useNotificationsListener(NotificationsUrlKeys.DIRECTORY, { listenerCallbackMessage: handleExportNotification });
}
