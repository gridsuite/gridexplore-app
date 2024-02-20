/**
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import {
    getStashedElements,
    moveElementToDirectory,
    stashElements,
} from '../../utils/rest-api';
import DeleteIcon from '@mui/icons-material/Delete';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';

import DeleteDialog from '../dialogs/delete-dialog';
import CommonToolbar from './common-toolbar';

import { useMultipleDeferredFetch } from '../../utils/custom-hooks';
import { useSnackMessage } from '@gridsuite/commons-ui';
import MoveDialog from '../dialogs/move-dialog';
import { ElementType } from '../../utils/elementType';
import { FileDownload, RestoreFromTrash } from '@mui/icons-material';
import { useDownloadUtils } from '../utils/caseUtils';
import React from 'react';
import StashedElementsDialog from '../dialogs/stashed-elements/stashed-elements-dialog';
import { useEffect } from 'react';

const DialogsId = {
    DELETE: 'delete',
    MOVE: 'move',
    STASHED_ELEMENTS: 'stashed_elements',
    NONE: 'none',
};

const ContentToolbar = (props) => {
    const { selectedElements, ...others } = props;
    const userId = useSelector((state) => state.user.profile.sub);
    const { snackError } = useSnackMessage();
    const intl = useIntl();
    const { handleDownloadCases } = useDownloadUtils();

    const [openDialog, setOpenDialog] = useState(null);

    const handleLastError = useCallback(
        (message) => {
            snackError({
                messageTxt: message,
            });
        },
        [snackError]
    );

    const handleOpenDialog = (DialogId) => {
        setOpenDialog(DialogId);
    };

    const handleCloseDialog = useCallback(() => {
        setOpenDialog(DialogsId.NONE);
    }, []);

    const [deleteError, setDeleteError] = useState('');
    const handleStashElements = useCallback(
        (elementsUuids) => {
            stashElements(elementsUuids, true)
                .catch((error) => {
                    setDeleteError(error.message);
                })
                .finally(() => handleCloseDialog());
        },
        [handleCloseDialog]
    );

    const moveElementErrorToString = useCallback(
        (HTTPStatusCode) => {
            if (HTTPStatusCode === 403) {
                return intl.formatMessage({
                    id: 'moveElementNotAllowedError',
                });
            } else if (HTTPStatusCode === 404) {
                return intl.formatMessage({ id: 'moveElementNotFoundError' });
            }
        },
        [intl]
    );

    const moveElementOnError = useCallback(
        (errorMessages, params, paramsOnErrors) => {
            let msg = intl.formatMessage(
                { id: 'moveElementsFailure' },
                {
                    pbn: errorMessages.length,
                    stn: paramsOnErrors.length,
                    problematic: paramsOnErrors.map((p) => p[0]).join(' '),
                }
            );
            console.debug(msg);
            handleLastError(msg);
        },
        [handleLastError, intl]
    );

    const [moveCB] = useMultipleDeferredFetch(
        moveElementToDirectory,
        undefined,
        moveElementErrorToString,
        moveElementOnError,
        false
    );

    // Allowance
    const isUserAllowed = useMemo(
        () => selectedElements.every((el) => el.owner === userId),
        [selectedElements, userId]
    );

    const noCreationInProgress = useMemo(
        () => selectedElements.every((el) => el.hasMetadata),
        [selectedElements]
    );

    const allowsDelete = useMemo(
        () => isUserAllowed && noCreationInProgress,
        [isUserAllowed, noCreationInProgress]
    );

    const allowsMove = useMemo(
        () =>
            selectedElements.every(
                (element) => element.type !== ElementType.DIRECTORY
            ) &&
            isUserAllowed &&
            noCreationInProgress,
        [isUserAllowed, selectedElements, noCreationInProgress]
    );

    const allowsDownloadCases = useMemo(
        () =>
            selectedElements.some(
                (element) => element.type === ElementType.CASE
            ) && noCreationInProgress,
        [selectedElements, noCreationInProgress]
    );

    const [stashedElements, setStashedElements] = useState([]);
    const handleGetStashedElement = useCallback(() => {
        getStashedElements()
            .then(setStashedElements)
            .catch((error) => {
                snackError({
                    messageTxt: error.message,
                });
            });
    }, [snackError]);

    useEffect(() => {
        handleGetStashedElement();
    }, [handleGetStashedElement]);

    const items = useMemo(() => {
        const toolbarItems = [];

        if (
            selectedElements.length &&
            (allowsDelete || allowsMove || allowsDownloadCases)
        ) {
            toolbarItems.push(
                {
                    tooltipTextId: 'delete',
                    callback: () => {
                        handleOpenDialog(DialogsId.DELETE);
                    },
                    icon: <DeleteIcon fontSize="small" />,
                    disabled: !selectedElements.length || !allowsDelete,
                },
                {
                    tooltipTextId: 'move',
                    callback: () => {
                        handleOpenDialog(DialogsId.MOVE);
                    },
                    icon: <DriveFileMoveIcon fontSize="small" />,
                    disabled: !selectedElements.length || !allowsMove,
                },
                {
                    tooltipTextId: 'download.button',
                    callback: () => handleDownloadCases(selectedElements),
                    icon: <FileDownload fontSize="small" />,
                    disabled: !selectedElements.length || !allowsDownloadCases,
                }
            );
        }

        toolbarItems.push({
            tooltipTextId: 'StashedElements',
            callback: () => handleOpenDialog(DialogsId.STASHED_ELEMENTS),
            icon: <RestoreFromTrash fontSize="small" />,
            disabled: stashedElements.length === 0,
        });

        return toolbarItems;
    }, [
        allowsDelete,
        allowsDownloadCases,
        allowsMove,
        handleDownloadCases,
        selectedElements,
        stashedElements,
    ]);

    const renderDialog = () => {
        switch (openDialog) {
            case DialogsId.DELETE:
                return (
                    <DeleteDialog
                        open={true}
                        onClose={handleCloseDialog}
                        onClick={() =>
                            handleStashElements(
                                selectedElements.map((e) => e.elementUuid)
                            )
                        }
                        items={selectedElements}
                        multipleDeleteFormatMessageId={
                            'deleteMultipleItemsDialogMessage'
                        }
                        simpleDeleteFormatMessageId={'deleteItemDialogMessage'}
                        error={deleteError}
                    />
                );
            case DialogsId.MOVE:
                return (
                    <MoveDialog
                        open={true}
                        onClose={(selectedDir) => {
                            if (selectedDir.length > 0) {
                                moveCB(
                                    selectedElements.map((element) => {
                                        return [
                                            element.elementUuid,
                                            selectedDir[0].id,
                                        ];
                                    })
                                );
                            }
                            handleCloseDialog();
                        }}
                        items={selectedElements}
                    />
                );
            case DialogsId.STASHED_ELEMENTS:
                return (
                    <StashedElementsDialog
                        open
                        onClose={handleCloseDialog}
                        stashedElements={stashedElements}
                        onStashedElementChange={handleGetStashedElement}
                    />
                );
            default:
                return null;
        }
    };
    return (
        <>
            <CommonToolbar {...others} items={items} />
            {renderDialog()}
        </>
    );
};

ContentToolbar.propTypes = {
    selectedElements: PropTypes.array,
};

export default ContentToolbar;
