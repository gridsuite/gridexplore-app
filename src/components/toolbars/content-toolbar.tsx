/**
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import {
    Delete as DeleteIcon,
    DriveFileMove as DriveFileMoveIcon,
    FileDownload,
    TableView as TableViewIcon,
    DownloadForOffline,
} from '@mui/icons-material';
import { ElementAttributes, ElementType, useSnackMessage, PARAM_DEVELOPER_MODE } from '@gridsuite/commons-ui';
import { deleteElements, moveElementsToDirectory, PermissionType } from '../../utils/rest-api';
import DeleteDialog from '../dialogs/delete-dialog';
import CommonToolbar, { CommonToolbarProps } from './common-toolbar';
import { useMultipleDeferredFetch } from '../../utils/custom-hooks';
import MoveDialog from '../dialogs/move-dialog';
import { useDownloadUtils } from '../utils/downloadUtils';
import ExportCaseDialog from '../dialogs/export-case-dialog';
import * as constants from '../../utils/UIconstants';
import { DialogsId } from '../../utils/UIconstants';
import { AppState } from '../../redux/types';
import CreateSpreadsheetCollectionDialog from '../dialogs/spreadsheet-collection-creation-dialog';
import { checkPermissionOnDirectory } from '../menus/menus-utils';
import { handleDeleteError, handleMoveError } from '../utils/rest-errors';
import { useParameterState } from '../dialogs/use-parameters-dialog';

export type ContentToolbarProps = Omit<CommonToolbarProps, 'items'> & {
    selectedElements: ElementAttributes[];
};

export default function ContentToolbar(props: Readonly<ContentToolbarProps>) {
    const { selectedElements, ...others } = props;
    const { snackError } = useSnackMessage();
    const intl = useIntl();
    const selectedDirectory = useSelector((state: AppState) => state.selectedDirectory);
    const { downloadElements, handleConvertCases, stopCasesExports } = useDownloadUtils();
    const [deleteError, setDeleteError] = useState('');
    const [openDialog, setOpenDialog] = useState(constants.DialogsId.NONE);
    const [directoryWritable, setDirectoryWritable] = useState(false);
    const [enableDeveloperMode] = useParameterState(PARAM_DEVELOPER_MODE);

    useEffect(() => {
        if (selectedDirectory !== null) {
            checkPermissionOnDirectory(selectedDirectory, PermissionType.WRITE).then((b) => {
                setDirectoryWritable(b);
            });
        }
    }, [selectedDirectory]);

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

    const [moveCB] = useMultipleDeferredFetch(moveElementsToDirectory, undefined, handleMoveError);

    const noCreationInProgress = useMemo(() => selectedElements.every((el) => el.hasMetadata), [selectedElements]);

    const allowsDelete = useMemo(() => selectedElements.every((el) => el.elementUuid != null), [selectedElements]);

    const allowsMove = useMemo(
        () => selectedElements.every((element) => element.type !== ElementType.DIRECTORY) && noCreationInProgress,
        [selectedElements, noCreationInProgress]
    );

    const allowsDownload = useMemo(() => {
        const allowedTypes = [
            ElementType.CASE,
            ElementType.SPREADSHEET_CONFIG,
            ElementType.SPREADSHEET_CONFIG_COLLECTION,
        ];
        // if selectedElements contains at least one of the allowed types
        return selectedElements.some((element) => allowedTypes.includes(element.type)) && noCreationInProgress;
    }, [selectedElements, noCreationInProgress]);

    const allowsSpreadsheetCollection = useMemo(() => {
        return selectedElements.every((element) => ElementType.SPREADSHEET_CONFIG === element.type);
    }, [selectedElements]);

    const allowsExportCases = useMemo(
        () => selectedElements.some((element) => element.type === ElementType.CASE) && noCreationInProgress,
        [selectedElements, noCreationInProgress]
    );

    const handleDeleteElements = useCallback(
        (elementsUuids: string[]) => {
            setDeleteError('');
            // @ts-expect-error TODO: manage null case
            deleteElements(elementsUuids, selectedDirectory.elementUuid)
                .then(handleCloseDialog)
                .catch((error) => {
                    handleDeleteError(setDeleteError, error, intl, snackError);
                });
        },
        [selectedDirectory?.elementUuid, handleCloseDialog, intl, snackError]
    );

    const items = useMemo(() => {
        const toolbarItems = [];

        if (selectedElements.length) {
            if (allowsDelete || allowsMove || allowsDownload || allowsExportCases) {
                // actions callable for several element types
                if (directoryWritable) {
                    toolbarItems.push({
                        tooltipTextId: 'delete',
                        callback: () => {
                            handleOpenDialog(DialogsId.DELETE);
                        },
                        icon: <DeleteIcon fontSize="small" />,
                        disabled: !allowsDelete,
                    });

                    toolbarItems.push({
                        tooltipTextId: 'move',
                        callback: () => {
                            handleOpenDialog(DialogsId.MOVE);
                        },
                        icon: <DriveFileMoveIcon fontSize="small" />,
                        disabled: !allowsMove,
                    });
                }

                if (allowsDownload) {
                    toolbarItems.push({
                        tooltipTextId: 'download.button',
                        callback: () => downloadElements(selectedElements),
                        icon: <FileDownload fontSize="small" />,
                        disabled: !allowsDownload,
                    });
                }
                if (enableDeveloperMode && allowsExportCases) {
                    toolbarItems.push({
                        tooltipTextId: 'download.export.button',
                        callback: () => handleOpenDialog(DialogsId.EXPORT),
                        icon: <DownloadForOffline fontSize="small" />,
                        disabled: !selectedElements.length || !allowsExportCases,
                    });
                }
            }
            if (allowsSpreadsheetCollection) {
                // action specific to spreadsheet models
                toolbarItems.push({
                    tooltipTextId: 'createSpreadsheetCollection',
                    callback: () => {
                        handleOpenDialog(DialogsId.CREATE_SPREADSHEET_COLLECTION);
                    },
                    icon: <TableViewIcon fontSize="small" />,
                    disabled: false,
                });
            }
        }
        return toolbarItems;
    }, [
        allowsDelete,
        allowsDownload,
        allowsExportCases,
        allowsMove,
        allowsSpreadsheetCollection,
        downloadElements,
        selectedElements,
        directoryWritable,
        enableDeveloperMode,
    ]);

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
                        title={intl.formatMessage({ id: 'moveItemTitle' })}
                        validationButtonText={intl.formatMessage(
                            { id: 'moveItemValidate' },
                            { nbElements: selectedElements.length }
                        )}
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
            case DialogsId.CREATE_SPREADSHEET_COLLECTION:
                return (
                    selectedDirectory && (
                        <CreateSpreadsheetCollectionDialog
                            open
                            onClose={handleCloseDialog}
                            initDirectory={selectedDirectory}
                            spreadsheetConfigIds={selectedElements?.map((e) => e.elementUuid)}
                        />
                    )
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
