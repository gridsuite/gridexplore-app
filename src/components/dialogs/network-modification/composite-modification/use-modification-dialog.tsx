/**
 * Copyright (c) 2025, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
    fetchNetworkModification,
    FetchStatus,
    ModificationType,
    snackWithFallback,
    SubstationCreationDialog,
    useSnackMessage,
} from '@gridsuite/commons-ui';
import { UUID } from 'node:crypto';
import { type FunctionComponent, type ReactElement, useCallback, useState } from 'react';

const MODIFICATION_DIALOG_MAPPING = new Map<ModificationType, FunctionComponent<any>>([
    [ModificationType.SUBSTATION_CREATION, SubstationCreationDialog],
]);

interface NetworkModificationData {
    uuid: UUID;
    type: string;
    [key: string]: any;
}

export function useModificationDialog() {
    const [modificationDialog, setModificationDialog] = useState<ReactElement>();
    const [editData, setEditData] = useState<NetworkModificationData>();
    const { snackError } = useSnackMessage();

    const createDialogWithProps = useCallback(
        (Dialog: FunctionComponent<any>) => (
            <Dialog
                editData={editData}
                isUpdate
                onClose={() => {
                    setModificationDialog(undefined);
                    setEditData(undefined);
                }}
                editDataFetchStatus={FetchStatus.IDLE}
            />
        ),
        [editData]
    );

    const handleOpenModificationDialog = useCallback(
        (modificationId: UUID, modificationType: ModificationType) => {
            const mapping = MODIFICATION_DIALOG_MAPPING.get(modificationType);
            const dialog = mapping ? createDialogWithProps(mapping) : undefined;
            if (!dialog) {
                return;
            }
            // we can open the dialog in fetching mode
            setModificationDialog(dialog);

            // Fetch modification data
            //setEditDataFetchStatus(FetchStatus.);
            fetchNetworkModification(modificationId)
                .then((res) => {
                    return res.json().then((data: NetworkModificationData) => {
                        //remove all null values to avoid showing a "null" in the forms
                        setEditData(data);
                        //setEditDataFetchStatus(FetchStatus.SUCCEED);
                    });
                })
                .catch((error: Error) => {
                    snackWithFallback(snackError, error);
                    //setEditDataFetchStatus(FetchStatus.FAILED);
                });
        },
        [createDialogWithProps, snackError]
    );

    const isModificationEditable = (modificationType: ModificationType) =>
        MODIFICATION_DIALOG_MAPPING.has(modificationType);

    return { modificationDialog, handleOpenModificationDialog, isModificationEditable };
}
