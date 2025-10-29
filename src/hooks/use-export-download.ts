/**
 * Copyright (c) 2025, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useSnackMessage } from '@gridsuite/commons-ui';
import { useCallback } from 'react';
import { UUID } from 'node:crypto';
import { useIntl } from 'react-intl';
import { triggerDownload } from '../components/utils/downloadUtils';
import { fetchExportNetworkFile } from '../utils/rest-api';

export function useExportDownload() {
    const { snackError, snackInfo } = useSnackMessage();
    const intl = useIntl();

    const downloadExportFile = useCallback(
        (exportUuid: UUID) => {
            let filename = 'export.zip';
            fetchExportNetworkFile(exportUuid)
                .then(async (response) => {
                    const contentDisposition = response.headers.get('Content-Disposition');
                    if (contentDisposition?.includes('filename=')) {
                        const regex = /filename="?([^"]+)"?/;
                        const [, extractedFilename] = regex.exec(contentDisposition) ?? [];
                        if (extractedFilename) {
                            filename = extractedFilename;
                        }
                    }

                    const blob = await response.blob();
                    triggerDownload({ blob, filename });
                })
                .catch((error: Error) => {
                    snackError({
                        messageTxt: intl.formatMessage({ id: 'export.message.failed' }, { error: error.message }),
                    });
                })
                .finally(() => {
                    snackInfo({
                        messageTxt: intl.formatMessage({ id: 'export.message.succeeded' }, { fileName: filename }),
                    });
                });
        },
        [intl, snackError, snackInfo]
    );
    return { downloadExportFile };
}
