/**
 * Copyright (c) 2025, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { UUID } from 'crypto';
import { ElementCreationDialog, ElementType, IElementCreationDialog, useSnackMessage } from '@gridsuite/commons-ui';
import { ElementAttributes } from '@gridsuite/commons-ui/dist/utils';
import { createSpreadsheetConfigCollectionFromConfigIds } from '../../utils/rest-api';

interface CreateSpreadsheetCollectionProps {
    open: boolean;
    onClose: () => void;
    initDirectory: ElementAttributes | undefined;
    spreadsheetConfigIds: UUID[];
}

function CreateSpreadsheetCollectionDialog({
    open,
    onClose,
    initDirectory,
    spreadsheetConfigIds,
}: Readonly<CreateSpreadsheetCollectionProps>) {
    const { snackError, snackInfo } = useSnackMessage();

    const createCollection = ({ name, description, folderId, folderName }: IElementCreationDialog) => {
        createSpreadsheetConfigCollectionFromConfigIds(name, description, folderId, spreadsheetConfigIds)
            .then(() => {
                snackInfo({
                    headerId: 'createCollectionMsg',
                    headerValues: {
                        nbModels: String(spreadsheetConfigIds?.length),
                        directory: folderName,
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
    };

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
