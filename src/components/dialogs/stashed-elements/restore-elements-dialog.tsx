/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { FunctionComponent, useCallback, useEffect, useState } from 'react';
import StashedElementsDialog from './stashed-elements-dialog';
import {deleteElements, getStashedElements, stashElements} from '../../../utils/rest-api';
import { useSnackMessage } from '@gridsuite/commons-ui';

interface IRestoreElementsDialog {
    open: boolean;
}

const RestoreElementsDialog: FunctionComponent<IRestoreElementsDialog> = ({
    open,
}) => {
    const [openTrash, setOpenTrash] = useState<boolean>(open);
    const [elements, setElements] = useState<any[]>([]);
    const { snackError } = useSnackMessage();

    useEffect(() => {
        getStashedElements()
            .then((response: any) => {
                setElements(response);
            })
            .catch((error) => {
                snackError({
                    messageTxt: error.message,
                });
            });
    }, []);
    const handleDelete = useCallback((elementsIds: string[]) => {
        console.log('elementsIds : ', elementsIds)
        deleteElements(elementsIds).catch((error) => {
            snackError({
                messageTxt: error.message,
            });
        });
    }, []);

    const handleRestore = useCallback((elementsIds: string[]) => {
        stashElements(elementsIds, true)
            .catch((error) => {
                snackError({
                    messageTxt: error.message,
                });
            })
    }, []);

    const handleClose = useCallback(() => {
        setOpenTrash(false);
    }, []);

    return (
        <StashedElementsDialog
            open={openTrash}
            titleId={'StashedElements'}
            elements={elements}
            getOptionLabel={(element) =>
                element.second
                    ? element.first.elementName + ' (' + element.second + ')'
                    : element.first.elementName
            }
            getElementId={(element) => element.first.elementUuid}
            onDelete={handleDelete}
            onRestore={handleRestore}
            onClose={handleClose}
        />
    );
};

export default RestoreElementsDialog;
