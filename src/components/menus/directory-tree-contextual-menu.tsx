/**
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import {
    Add as AddIcon,
    ContentPaste as ContentPasteIcon,
    Create as CreateIcon,
    CreateNewFolder as CreateNewFolderIcon,
    Delete as DeleteIcon,
    DriveFileMove as DriveFileMoveIcon,
    FolderSpecial as FolderSpecialIcon,
} from '@mui/icons-material';
import {
    ElementAttributes,
    ElementType,
    FilterCreationDialog,
    TreeViewFinderNodeProps,
    useSnackMessage,
} from '@gridsuite/commons-ui';
import { UUID } from 'crypto';
import CreateStudyForm from '../dialogs/create-study-dialog/create-study-dialog';
import CreateDirectoryDialog from '../dialogs/create-directory-dialog';
import RenameDialog from '../dialogs/rename-dialog';
import DeleteDialog from '../dialogs/delete-dialog';
import { DialogsId } from '../../utils/UIconstants';
import {
    deleteElement,
    duplicateElement,
    duplicateSpreadsheetConfig,
    duplicateSpreadsheetConfigCollection,
    insertDirectory,
    insertRootDirectory,
    moveElementsToDirectory,
    renameElement,
} from '../../utils/rest-api';

import CommonContextualMenu, { CommonContextualMenuProps, MenuItemType } from './common-contextual-menu';
import { useDeferredFetch } from '../../utils/custom-hooks';
import ContingencyListCreationDialog from '../dialogs/contingency-list/creation/contingency-list-creation-dialog';
import CreateCaseDialog from '../dialogs/create-case-dialog/create-case-dialog';
import { useParameterState } from '../dialogs/use-parameters-dialog';
import { PARAM_LANGUAGE } from '../../utils/config-params';
import { handleMaxElementsExceededError, handleNotAllowedError } from '../utils/rest-errors';
import { AppState } from '../../redux/types';
import MoveDialog from '../dialogs/move-dialog';
import { buildPathToFromMap } from '../treeview-utils';
import { checkPermissionOnDirectory } from './menus-utils';

export interface DirectoryTreeContextualMenuProps extends Omit<CommonContextualMenuProps, 'onClose'> {
    directory: ElementAttributes | null;
    onClose: () => void;
    openDialog: string;
    setOpenDialog: (dialogId: string) => void;
    restrictMenuItems: boolean;
}

export default function DirectoryTreeContextualMenu(props: Readonly<DirectoryTreeContextualMenuProps>) {
    const { directory, open, onClose, openDialog, setOpenDialog, restrictMenuItems, ...otherProps } = props;
    const userId = useSelector((state: AppState) => state.user?.profile.sub);

    const intl = useIntl();
    const [deleteError, setDeleteError] = useState('');

    const [hideMenu, setHideMenu] = useState(false);
    const { snackError } = useSnackMessage();
    const activeDirectory = useSelector((state: AppState) => state.activeDirectory);
    const treeData = useSelector((state: AppState) => state.treeData);
    const [directoryWritable, setDirectoryWritable] = useState(false);

    const [languageLocal] = useParameterState(PARAM_LANGUAGE);

    const handleOpenDialog = (dialogId: string) => {
        setHideMenu(true);
        setOpenDialog(dialogId);
    };

    const handleCloseDialog = useCallback(() => {
        onClose();
        setOpenDialog(DialogsId.NONE);
        setHideMenu(false);
        setDeleteError('');
    }, [onClose, setOpenDialog]);

    const handleGenericPermissionDeniedError = useCallback(
        (HTTPStatus: string) => {
            if (HTTPStatus === 'Forbidden') {
                return intl.formatMessage({ id: 'genericPermissionDeniedError' });
            }
            return undefined;
        },
        [intl]
    );

    const [renameCB, renameState] = useDeferredFetch(renameElement, handleCloseDialog, (HTTPStatus: string) => {
        if (HTTPStatus === 'Forbidden') {
            return intl.formatMessage({ id: 'renameDirectoryError' });
        }
        return undefined;
    });

    const [insertDirectoryCB, insertDirectoryState] = useDeferredFetch(
        insertDirectory,
        handleCloseDialog,
        handleGenericPermissionDeniedError
    );

    const [insertRootDirectoryCB, insertRootDirectoryState] = useDeferredFetch(insertRootDirectory, handleCloseDialog);

    const itemSelectionForCopy = useSelector((state: AppState) => state.itemSelectionForCopy);

    const handleError = useCallback((message: string) => snackError({ messageTxt: message }), [snackError]);

    const handlePasteError = (error: any) => {
        let msg;
        if (error.status === 'Not Found') {
            msg = intl.formatMessage({
                id: 'elementPasteFailed404',
            });
        } else if (error.status === 'Forbidden') {
            msg = intl.formatMessage({ id: 'genericPermissionDeniedError' });
        } else {
            msg = intl.formatMessage({ id: 'elementPasteFailed' }) + (error?.message ?? '');
        }
        return handleError(msg);
    };

    function pasteElement(directoryUuid: UUID, selectionForPaste: any) {
        if (!selectionForPaste.sourceItemUuid) {
            handleError(intl.formatMessage({ id: 'elementPasteFailed404' }));
            handleCloseDialog();
        } else {
            console.info('Pasting element %s into directory %s', selectionForPaste.nameItem, directoryUuid);

            switch (selectionForPaste.typeItem) {
                case ElementType.CASE:
                case ElementType.STUDY:
                case ElementType.FILTER:
                case ElementType.MODIFICATION:
                case ElementType.DIAGRAM_CONFIG:
                    duplicateElement(selectionForPaste.sourceItemUuid, directoryUuid, selectionForPaste.typeItem).catch(
                        (error: any) => {
                            if (!handleMaxElementsExceededError(error, snackError)) {
                                handlePasteError(error);
                            }
                        }
                    );
                    break;
                case ElementType.VOLTAGE_INIT_PARAMETERS:
                case ElementType.SECURITY_ANALYSIS_PARAMETERS:
                case ElementType.SENSITIVITY_PARAMETERS:
                case ElementType.LOADFLOW_PARAMETERS:
                case ElementType.SHORT_CIRCUIT_PARAMETERS:
                case ElementType.NETWORK_VISUALIZATIONS_PARAMETERS:
                    duplicateElement(
                        selectionForPaste.sourceItemUuid,
                        directoryUuid,
                        selectionForPaste.typeItem,
                        selectionForPaste.typeItem
                    ).catch((error: any) => handlePasteError(error));
                    break;
                case ElementType.CONTINGENCY_LIST:
                    duplicateElement(
                        selectionForPaste.sourceItemUuid,
                        directoryUuid,
                        selectionForPaste.typeItem,
                        selectionForPaste.specificTypeItem
                    ).catch((error: any) => handlePasteError(error));
                    break;
                case ElementType.SPREADSHEET_CONFIG:
                    duplicateSpreadsheetConfig(selectionForPaste.sourceItemUuid, directoryUuid).catch((error: any) =>
                        handlePasteError(error)
                    );
                    break;
                case ElementType.SPREADSHEET_CONFIG_COLLECTION:
                    duplicateSpreadsheetConfigCollection(selectionForPaste.sourceItemUuid, directoryUuid).catch(
                        (error: any) => handlePasteError(error)
                    );
                    break;
                default:
                    handleError(
                        intl.formatMessage({
                            id: 'unsupportedItem',
                        })
                    );
            }

            handleCloseDialog();
        }
    }

    const handleDeleteElement = useCallback(
        (elementsUuid: UUID) => {
            setDeleteError('');
            deleteElement(elementsUuid)
                .then(handleCloseDialog)
                .catch((error: any) => {
                    const errorMessage = handleGenericPermissionDeniedError(error.status) ?? error.message;
                    // show the error message and don't close the dialog
                    setDeleteError(errorMessage);
                    handleError(errorMessage);
                });
        },
        [handleCloseDialog, handleError, handleGenericPermissionDeniedError]
    );

    // Allowance
    const showMenuFromEmptyZone = useCallback(() => !directory, [directory]);

    useEffect(() => {
        if (directory !== null) {
            checkPermissionOnDirectory(directory, 'WRITE').then((b) => {
                setDirectoryWritable(b);
            });
        }
    }, [directory]);

    const buildMenu = () => {
        // build menuItems here
        const menuItems: MenuItemType[] = [];

        if (!showMenuFromEmptyZone()) {
            if (directory && directoryWritable) {
                menuItems.push(
                    {
                        messageDescriptorId: 'createNewStudy',
                        callback: () => handleOpenDialog(DialogsId.ADD_NEW_STUDY),
                        icon: <AddIcon fontSize="small" />,
                    },
                    {
                        messageDescriptorId: 'createNewContingencyList',
                        callback: () => handleOpenDialog(DialogsId.ADD_NEW_CONTINGENCY_LIST),
                        icon: <AddIcon fontSize="small" />,
                    },
                    {
                        messageDescriptorId: 'createNewFilter',
                        callback: () => handleOpenDialog(DialogsId.ADD_NEW_FILTER),
                        icon: <AddIcon fontSize="small" />,
                    },
                    {
                        messageDescriptorId: 'ImportNewCase',
                        callback: () => handleOpenDialog(DialogsId.ADD_NEW_CASE),
                        icon: <AddIcon fontSize="small" />,
                    }
                );
            }

            menuItems.push({ isDivider: true });

            if (!restrictMenuItems) {
                if (directory && directoryWritable) {
                    menuItems.push(
                        {
                            messageDescriptorId: 'renameFolder',
                            callback: () => handleOpenDialog(DialogsId.RENAME_DIRECTORY),
                            icon: <CreateIcon fontSize="small" />,
                        },
                        {
                            messageDescriptorId: 'deleteFolder',
                            callback: () => handleOpenDialog(DialogsId.DELETE_DIRECTORY),
                            icon: <DeleteIcon fontSize="small" />,
                        }
                    );
                    menuItems.push(
                        {
                            messageDescriptorId: 'moveDirectory',
                            callback: () => handleOpenDialog(DialogsId.MOVE_DIRECTORY),
                            icon: <DriveFileMoveIcon fontSize="small" />,
                        },
                        { isDivider: true }
                    );
                }
            }

            if (directory && directoryWritable) {
                menuItems.push(
                    {
                        messageDescriptorId: 'paste',
                        callback: () => pasteElement(directory.elementUuid, itemSelectionForCopy),
                        icon: <ContentPasteIcon fontSize="small" />,
                        disabled: !itemSelectionForCopy.sourceItemUuid,
                    },
                    { isDivider: true }
                );
            }

            if (directory && directoryWritable) {
                menuItems.push({
                    messageDescriptorId: 'createFolder',
                    callback: () => handleOpenDialog(DialogsId.ADD_DIRECTORY),
                    icon: <CreateNewFolderIcon fontSize="small" />,
                });
            }
        }

        menuItems.push({
            messageDescriptorId: 'createRootFolder',
            callback: () => handleOpenDialog(DialogsId.ADD_ROOT_DIRECTORY),
            icon: <FolderSpecialIcon fontSize="small" />,
        });

        return menuItems;
    };

    const handleMoveDirectory = useCallback(
        (selectedDir: TreeViewFinderNodeProps[]) => {
            if (selectedDir.length === 1 && directory) {
                moveElementsToDirectory([directory.elementUuid], selectedDir[0].id as UUID).catch((error) => {
                    if (!handleNotAllowedError(error, snackError)) {
                        const path = buildPathToFromMap(directory.elementUuid, treeData.mapData)
                            ?.map((el) => el.elementName)
                            .join('/');
                        snackError({
                            messageId: 'MovingDirectoryError',
                            messageValues: { elementPath: path },
                        });
                    }
                });
            }
            handleCloseDialog();
        },
        [directory, handleCloseDialog, snackError, treeData.mapData]
    );

    const renderDialog = () => {
        switch (openDialog) {
            case DialogsId.ADD_NEW_STUDY:
                return <CreateStudyForm open onClose={handleCloseDialog} />;
            case DialogsId.ADD_NEW_CONTINGENCY_LIST:
                return (
                    <ContingencyListCreationDialog
                        open
                        titleId="createNewContingencyList"
                        onClose={handleCloseDialog}
                    />
                );
            case DialogsId.ADD_DIRECTORY:
                return (
                    <CreateDirectoryDialog
                        open
                        onClick={(elementName: string) =>
                            // @ts-expect-error TODO TS2345: Type undefined is not assignable to type UUID
                            insertDirectoryCB(elementName, directory?.elementUuid, userId)
                        }
                        onClose={handleCloseDialog}
                        title={intl.formatMessage({
                            id: 'insertNewDirectoryDialogTitle',
                        })}
                        parentDirectory={directory?.elementUuid}
                        error={insertDirectoryState?.errorMessage}
                    />
                );
            case DialogsId.ADD_ROOT_DIRECTORY:
                return (
                    <CreateDirectoryDialog
                        open
                        // @ts-expect-error TODO TS2345: Type undefined is not assignable to type UUID
                        onClick={(elementName: string) => insertRootDirectoryCB(elementName, userId)}
                        onClose={handleCloseDialog}
                        title={intl.formatMessage({
                            id: 'insertNewRootDirectoryDialogTitle',
                        })}
                        error={insertRootDirectoryState?.errorMessage}
                    />
                );
            case DialogsId.RENAME_DIRECTORY:
                return (
                    directory && (
                        <RenameDialog
                            message="renameElementMsg"
                            currentName={directory.elementName}
                            open
                            onClick={(newName: string) => renameCB(directory.elementUuid, newName)}
                            onClose={handleCloseDialog}
                            title={intl.formatMessage({
                                id: 'renameDirectoryDialogTitle',
                            })}
                            error={renameState.errorMessage}
                            type={ElementType.DIRECTORY}
                            parentDirectory={directory.parentUuid}
                        />
                    )
                );
            case DialogsId.DELETE_DIRECTORY:
                return (
                    <DeleteDialog
                        items={directory ? [directory] : []}
                        multipleDeleteFormatMessageId="deleteMultipleDirectoriesDialogMessage"
                        simpleDeleteFormatMessageId="deleteDirectoryDialogMessage"
                        open
                        // @ts-expect-error TODO: manage undefined case
                        onClick={() => handleDeleteElement(directory.elementUuid)}
                        onClose={handleCloseDialog}
                        error={deleteError}
                    />
                );
            case DialogsId.ADD_NEW_FILTER:
                return (
                    <FilterCreationDialog
                        open
                        onClose={handleCloseDialog}
                        activeDirectory={activeDirectory}
                        language={languageLocal}
                    />
                );
            case DialogsId.ADD_NEW_CASE:
                return <CreateCaseDialog open onClose={handleCloseDialog} />;
            case DialogsId.MOVE_DIRECTORY:
                return (
                    <MoveDialog
                        open
                        onClose={handleMoveDirectory}
                        title={intl.formatMessage(
                            { id: 'moveDirectoryTitle' },
                            { directoryName: directory?.elementName }
                        )}
                        validationButtonText={intl.formatMessage({ id: 'moveDirectoryValidate' })}
                    />
                );
            default:
                return null;
        }
    };
    return (
        <>
            {open && (
                <CommonContextualMenu
                    {...otherProps}
                    menuItems={buildMenu()}
                    open={open && !hideMenu}
                    onClose={() => onClose()}
                />
            )}
            {renderDialog()}
        </>
    );
}
