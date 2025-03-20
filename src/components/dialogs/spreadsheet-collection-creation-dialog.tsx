/**
 * Copyright (c) 2025, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useCallback } from 'react';
import { UUID } from 'crypto';
import {
    type ElementAttributes,
    ElementCreationDialog,
    ElementType,
    type IElementCreationDialog,
    useSnackMessage,
} from '@gridsuite/commons-ui';
import { createSpreadsheetConfigCollectionFromConfigIds } from '../../utils/rest-api';

export interface CreateSpreadsheetCollectionProps {
    open: boolean;
    onClose: () => void;
    initDirectory: ElementAttributes;
    spreadsheetConfigIds: UUID[];
}

function CreateSpreadsheetCollectionDialog({
    open,
    onClose,
    initDirectory,
    spreadsheetConfigIds,
}: Readonly<CreateSpreadsheetCollectionProps>) {
    const { snackError, snackInfo } = useSnackMessage();

    const createCollection = useCallback(
        (element: IElementCreationDialog) => {
            createSpreadsheetConfigCollectionFromConfigIds(
                element.name,
                element.description,
                element.folderId,
                spreadsheetConfigIds
            )
                .then(() => {
                    snackInfo({
                        headerId: 'createCollectionMsg',
                        headerValues: {
                            nbModels: String(spreadsheetConfigIds?.length),
                            directory: element.folderName,
                        },
                    });
                })
                .catch((error) => {
                    console.error(error);
                    snackError({
                        messageTxt: error.message,
                        headerId: 'createCollectionError',
                    });
                });
        },
        [snackError, snackInfo, spreadsheetConfigIds]
    );

    return (
        <ElementCreationDialog
            open={open}
            onClose={onClose}
            onSave={createCollection}
            type={ElementType.SPREADSHEET_CONFIG_COLLECTION}
            titleId="createSpreadsheetCollection"
            initDirectory={initDirectory}
        />
    );
}

export default CreateSpreadsheetCollectionDialog;
