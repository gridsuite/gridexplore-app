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

import { deleteElements, moveElementsToDirectory } from '../../utils/rest-api';
import DeleteIcon from '@mui/icons-material/Delete';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import DeleteDialog from '../dialogs/delete-dialog';
import CommonToolbar from './common-toolbar';
import { GenericFunction, useMultipleDeferredFetch } from '../../utils/custom-hooks';
import { ElementAttributes, ElementType, useSnackMessage } from '@gridsuite/commons-ui';
import MoveDialog from '../dialogs/move-dialog';
import { DownloadForOffline, FileDownload } from '@mui/icons-material';
import { useDownloadUtils } from '../utils/caseUtils';
import ExportCaseDialog from '../dialogs/export-case-dialog';
import { DialogsId } from '../../utils/UIconstants';
import { AppState } from 'redux/reducer';
import * as constants from '../../utils/UIconstants';

interface ContentToolbarProps {
    selectedElements: ElementAttributes[];

    [key: string]: unknown;
}

const ContentToolbar = (props: ContentToolbarProps) => {
    const { selectedElements, ...others } = props;
    const userId = useSelector((state: AppState) => state.user?.profile.sub);
    const { snackError } = useSnackMessage();
    const intl = useIntl();
    const selectedDirectory = useSelector((state: AppState) => state.selectedDirectory);
    const { handleDownloadCases, handleConvertCases, stopCasesExports } = useDownloadUtils();

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

    const moveElementErrorToString = useCallback(
        (HTTPStatusCode: number) => {
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
        (errorMessages: string[], params: unknown, paramsOnErrors: unknown[]) => {
            let msg = intl.formatMessage(
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
        moveElementsToDirectory as GenericFunction<any>,
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

    const allowsDownloadExportCases = useMemo(
        () => selectedElements.some((element) => element.type === ElementType.CASE) && noCreationInProgress,
        [selectedElements, noCreationInProgress]
    );

    const [deleteError, setDeleteError] = useState('');
    const handleDeleteElements = useCallback(
        (elementsUuids: string[]) => {
            setDeleteError('');
            if (selectedDirectory) {
                deleteElements(elementsUuids, selectedDirectory.elementUuid)
                    .then(handleCloseDialog)
                    .catch((error) => {
                        //show the error message and don't close the dialog
                        setDeleteError(error.message);
                        handleLastError(error.message);
                    });
            }
        },
        [selectedDirectory, handleCloseDialog, handleLastError]
    );

    const items = useMemo(() => {
        const toolbarItems = [];

        if (selectedElements.length && (allowsDelete || allowsMove || allowsDownloadExportCases)) {
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
                    disabled: !selectedElements.length || !allowsDownloadExportCases,
                },
                {
                    tooltipTextId: 'download.export.button',
                    callback: () => handleOpenDialog(DialogsId.EXPORT),
                    icon: <DownloadForOffline fontSize="small" />,
                    disabled: !selectedElements.length || !allowsDownloadExportCases,
                }
            );
        }
        return toolbarItems;
    }, [allowsDelete, allowsDownloadExportCases, allowsMove, handleDownloadCases, selectedElements]);

    const renderDialog = () => {
        switch (openDialog) {
            case DialogsId.DELETE:
                return (
                    <DeleteDialog
                        open={true}
                        onClose={handleCloseDialog}
                        onClick={() => handleDeleteElements(selectedElements.map((e) => e.elementUuid))}
                        items={selectedElements}
                        multipleDeleteFormatMessageId={'deleteMultipleItemsDialogMessage'}
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
};

ContentToolbar.propTypes = {
    selectedElements: PropTypes.array,
};

export default ContentToolbar;