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

import DeleteIcon from '@mui/icons-material/Delete';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import { ElementAttributes, ElementType, useSnackMessage } from '@gridsuite/commons-ui';
import { DownloadForOffline, FileDownload } from '@mui/icons-material';
import { AppState } from 'redux/reducer';
import { deleteElements, moveElementsToDirectory } from '../../utils/rest-api';
import DeleteDialog from '../dialogs/delete-dialog';
import CommonToolbar, { CommonToolbarProps } from './common-toolbar';
import { useMultipleDeferredFetch } from '../../utils/custom-hooks';
import MoveDialog from '../dialogs/move-dialog';
import { useDownloadUtils } from '../utils/downloadUtils';
import ExportCaseDialog from '../dialogs/export-case-dialog';
import * as constants from '../../utils/UIconstants';
import { DialogsId } from '../../utils/UIconstants';

export type ContentToolbarProps = Omit<CommonToolbarProps, 'items'> & {
    selectedElements: ElementAttributes[];
};

function ContentToolbar(props: ContentToolbarProps) {
    const { selectedElements, ...others } = props;
    const userId = useSelector((state: AppState) => state.user?.profile.sub);
    const { snackError } = useSnackMessage();
    const intl = useIntl();
    const selectedDirectory = useSelector((state: AppState) => state.selectedDirectory);
    const { downloadElements, handleConvertCases, stopCasesExports } = useDownloadUtils();

    const [openDialog, setOpenDialog] = useState(constants.DialogsId.NONE);

    const handleLastError = useCallback(
        (message: string) => {
            snackError({
                messageTxt: message,
            });
        },
        [snackError]
    );

    const handleOpenDialog = (DialogId: string) => {
        setOpenDialog(DialogId);
    };

    const handleCloseDialog = useCallback(() => {
        setOpenDialog(DialogsId.NONE);
        setDeleteError('');
    }, []);

    const handleCloseExportDialog = useCallback(() => {
        stopCasesExports();
        handleCloseDialog();
    }, [handleCloseDialog, stopCasesExports]);

    // TODO: duplicate code detected with content-contextual-menu.tsx (moveElementErrorToString, moveElementOnError and moveCB)
    const moveElementErrorToString = useCallback(
        (HTTPStatusCode: number) => {
            if (HTTPStatusCode === 403) {
                return intl.formatMessage({
                    id: 'moveElementNotAllowedError',
                });
            }
            if (HTTPStatusCode === 404) {
                return intl.formatMessage({ id: 'moveElementNotFoundError' });
            }
        },
        [intl]
    );

    const moveElementOnError = useCallback(
        (errorMessages: string[], params: unknown, paramsOnErrors: unknown[]) => {
            const msg = intl.formatMessage(
                { id: 'moveElementsFailure' },
                {
                    pbn: errorMessages.length,
                    stn: paramsOnErrors.length,
                    problematic: paramsOnErrors.map((p) => (p as string[])[0]).join(' '),
                }
            );
            console.debug(msg);
            handleLastError(msg);
        },
        [handleLastError, intl]
    );

    const [moveCB] = useMultipleDeferredFetch(
        moveElementsToDirectory,
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

    const noCreationInProgress = useMemo(() => selectedElements.every((el) => el.hasMetadata), [selectedElements]);

    const allowsDelete = useMemo(
        () => isUserAllowed && selectedElements.every((el) => el.elementUuid != null),
        [isUserAllowed, selectedElements]
    );

    const allowsMove = useMemo(
        () =>
            selectedElements.every((element) => element.type !== ElementType.DIRECTORY) &&
            isUserAllowed &&
            noCreationInProgress,
        [isUserAllowed, selectedElements, noCreationInProgress]
    );

    const allowsDownload = useMemo(() => {
        const allowedTypes = [ElementType.CASE, ElementType.SPREADSHEET_CONFIG];
        // if selectedElements contains at least one of the allowed types
        return selectedElements.some((element) => allowedTypes.includes(element.type)) && noCreationInProgress;
    }, [selectedElements, noCreationInProgress]);

    const allowsExportCases = useMemo(
        () => selectedElements.some((element) => element.type === ElementType.CASE) && noCreationInProgress,
        [selectedElements, noCreationInProgress]
    );

    const [deleteError, setDeleteError] = useState('');
    const handleDeleteElements = useCallback(
        (elementsUuids: string[]) => {
            setDeleteError('');
            // @ts-expect-error TODO: manage null case
            deleteElements(elementsUuids, selectedDirectory.elementUuid)
                .then(handleCloseDialog)
                .catch((error) => {
                    // show the error message and don't close the dialog
                    setDeleteError(error.message);
                    handleLastError(error.message);
                });
        },
        [selectedDirectory, handleCloseDialog, handleLastError]
    );

    const items = useMemo(() => {
        const toolbarItems = [];

        if (selectedElements.length && (allowsDelete || allowsMove || allowsDownload || allowsExportCases)) {
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
                    callback: () => downloadElements(selectedElements),
                    icon: <FileDownload fontSize="small" />,
                    disabled: !selectedElements.length || !allowsDownload,
                },
                {
                    tooltipTextId: 'download.export.button',
                    callback: () => handleOpenDialog(DialogsId.EXPORT),
                    icon: <DownloadForOffline fontSize="small" />,
                    disabled: !selectedElements.length || !allowsExportCases,
                }
            );
        }
        return toolbarItems;
    }, [allowsDelete, allowsDownload, allowsExportCases, allowsMove, downloadElements, selectedElements]);

    const renderDialog = () => {
        switch (openDialog) {
            case DialogsId.DELETE:
                return (
                    <DeleteDialog
                        open
                        onClose={handleCloseDialog}
                        onClick={() => handleDeleteElements(selectedElements.map((e) => e.elementUuid))}
                        items={selectedElements}
                        multipleDeleteFormatMessageId="deleteMultipleItemsDialogMessage"
                        simpleDeleteFormatMessageId="deleteItemDialogMessage"
                        error={deleteError}
                    />
                );
            case DialogsId.MOVE:
                return (
                    <MoveDialog
                        open
                        onClose={(selectedDir) => {
                            if (selectedDir.length > 0) {
                                moveCB([[selectedElements.map((element) => element.elementUuid), selectedDir[0].id]]);
                            }
                            handleCloseDialog();
                        }}
                        itemsCount={selectedElements.length}
                    />
                );
            case DialogsId.EXPORT:
                return (
                    <ExportCaseDialog
                        selectedElements={selectedElements}
                        onClose={handleCloseExportDialog}
                        onExport={handleConvertCases}
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
}

ContentToolbar.propTypes = {
    selectedElements: PropTypes.array,
};

export default ContentToolbar;
