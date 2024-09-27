/**
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { useIntl } from 'react-intl';

import DeleteIcon from '@mui/icons-material/Delete';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import AddIcon from '@mui/icons-material/Add';
import CreateIcon from '@mui/icons-material/Create';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import CreateStudyForm from '../dialogs/create-study-dialog/create-study-dialog';
import CreateDirectoryDialog from '../dialogs/create-directory-dialog';
import RenameDialog from '../dialogs/rename-dialog';
import DeleteDialog from '../dialogs/delete-dialog';

import { DialogsId } from '../../utils/UIconstants';

import {
    deleteElement,
    duplicateElement,
    elementExists,
    insertDirectory,
    insertRootDirectory,
    renameElement,
} from '../../utils/rest-api';

import CommonContextualMenu, { MenuItemType } from './common-contextual-menu';
import { useDeferredFetch } from '../../utils/custom-hooks';
import { ElementAttributes, ElementType, FilterCreationDialog, useSnackMessage } from '@gridsuite/commons-ui';
import ContingencyListCreationDialog from '../dialogs/contingency-list/creation/contingency-list-creation-dialog';
import CreateCaseDialog from '../dialogs/create-case-dialog/create-case-dialog';
import { useParameterState } from '../dialogs/use-parameters-dialog';
import { PARAM_LANGUAGE } from '../../utils/config-params';
import { handleMaxElementsExceededError } from '../utils/rest-errors';
import { PopoverPosition, PopoverReference } from '@mui/material';
import { AppState } from 'redux/reducer';

interface DirectoryTreeContextualMenuProps {
    directory: ElementAttributes | null;
    open: boolean;
    onClose: (e: unknown, nextSelectedDirectoryId?: string | null) => void;
    openDialog: string;
    setOpenDialog: (dialogId: string) => void;
    restrictMenuItems: boolean;
    anchorReference?: PopoverReference;
    anchorPosition?: PopoverPosition;
}

const DirectoryTreeContextualMenu: React.FC<DirectoryTreeContextualMenuProps> = (props) => {
    const { directory, open, onClose, openDialog, setOpenDialog, restrictMenuItems, ...others } = props;
    const userId = useSelector((state: AppState) => state.user?.profile.sub);

    const intl = useIntl();

    const [hideMenu, setHideMenu] = useState(false);
    const { snackError } = useSnackMessage();
    const activeDirectory = useSelector((state: AppState) => state.activeDirectory);

    const [languageLocal] = useParameterState(PARAM_LANGUAGE);

    const handleOpenDialog = (dialogId: string) => {
        setHideMenu(true);
        setOpenDialog(dialogId);
    };

    const handleCloseDialog = useCallback(
        (e: unknown, nextSelectedDirectoryId: string | null = null) => {
            onClose(e, nextSelectedDirectoryId);
            setOpenDialog(DialogsId.NONE);
            setHideMenu(false);
            setDeleteError('');
        },
        [onClose, setOpenDialog]
    );

    const [renameCB, renameState] = useDeferredFetch(
        renameElement,
        () => handleCloseDialog(null, null),
        (HTTPStatusCode: number) => {
            if (HTTPStatusCode === 403) {
                return intl.formatMessage({ id: 'renameDirectoryError' });
            }
        },
        undefined,
        false
    );

    const [insertDirectoryCB, insertDirectoryState] = useDeferredFetch(insertDirectory, (response: ElementAttributes) =>
        handleCloseDialog(null, response?.elementUuid)
    );

    const [insertRootDirectoryCB, insertRootDirectoryState] = useDeferredFetch(
        insertRootDirectory,
        (response: ElementAttributes) => handleCloseDialog(null, response?.elementUuid)
    );

    const selectionForCopy = useSelector((state: AppState) => state.selectionForCopy);

    const handleError = useCallback(
        (message: string) => {
            snackError({
                messageTxt: message,
            });
        },
        [snackError]
    );

    const handlePasteError = (error: any) => {
        let msg;
        if (error.status === 404) {
            msg = intl.formatMessage({
                id: 'elementPasteFailed404',
            });
        } else {
            msg = intl.formatMessage({ id: 'elementPasteFailed' }) + error?.message;
        }
        return handleError(msg);
    };

    function pasteElement(directoryUuid: string, selectionForCopy: any) {
        if (!selectionForCopy.sourceItemUuid) {
            handleError(intl.formatMessage({ id: 'elementPasteFailed404' }));
            handleCloseDialog(null);
        } else {
            console.info('Pasting element %s into directory %s', selectionForCopy.nameItem, directoryUuid);

            switch (selectionForCopy.typeItem) {
                case ElementType.CASE:
                case ElementType.STUDY:
                case ElementType.FILTER:
                case ElementType.MODIFICATION:
                    duplicateElement(selectionForCopy.sourceItemUuid, directoryUuid, selectionForCopy.typeItem).catch(
                        (error: any) => {
                            if (handleMaxElementsExceededError(error, snackError)) {
                                return;
                            }
                            handlePasteError(error);
                        }
                    );
                    break;
                case ElementType.VOLTAGE_INIT_PARAMETERS:
                case ElementType.SECURITY_ANALYSIS_PARAMETERS:
                case ElementType.SENSITIVITY_PARAMETERS:
                case ElementType.LOADFLOW_PARAMETERS:
                case ElementType.SHORT_CIRCUIT_PARAMETERS:
                    duplicateElement(
                        selectionForCopy.sourceItemUuid,
                        directoryUuid,
                        ElementType.PARAMETERS,
                        selectionForCopy.typeItem
                    ).catch((error: any) => {
                        handlePasteError(error);
                    });
                    break;
                case ElementType.CONTINGENCY_LIST:
                    duplicateElement(
                        selectionForCopy.sourceItemUuid,
                        directoryUuid,
                        selectionForCopy.typeItem,
                        selectionForCopy.specificTypeItem
                    ).catch((error: any) => {
                        handlePasteError(error);
                    });
                    break;
                default:
                    handleError(
                        intl.formatMessage({
                            id: 'unsupportedItem',
                        })
                    );
            }

            handleCloseDialog(null);
        }
    }

    const [deleteError, setDeleteError] = useState('');
    const handleDeleteElement = useCallback(
        (elementsUuid: string) => {
            setDeleteError('');
            deleteElement(elementsUuid)
                .then(() => handleCloseDialog(null, directory?.parentUuid))
                .catch((error: any) => {
                    //show the error message and don't close the dialog
                    setDeleteError(error.message);
                    handleError(error.message);
                });
        },
        [handleCloseDialog, directory?.parentUuid, handleError]
    );

    // Allowance
    const showMenuFromEmptyZone = useCallback(() => {
        return !directory;
    }, [directory]);

    const isAllowed = useCallback(() => {
        return directory && directory.owner === userId;
    }, [directory, userId]);

    const buildMenu = () => {
        // build menuItems here
        let menuItems: MenuItemType[] = [];

        if (!showMenuFromEmptyZone()) {
            menuItems.push(
                {
                    messageDescriptorId: 'createNewStudy',
                    callback: () => {
                        handleOpenDialog(DialogsId.ADD_NEW_STUDY);
                    },
                    icon: <AddIcon fontSize="small" />,
                },
                {
                    messageDescriptorId: 'createNewContingencyList',
                    callback: () => {
                        handleOpenDialog(DialogsId.ADD_NEW_CONTINGENCY_LIST);
                    },
                    icon: <AddIcon fontSize="small" />,
                },
                {
                    messageDescriptorId: 'createNewFilter',
                    callback: () => {
                        handleOpenDialog(DialogsId.ADD_NEW_FILTER);
                    },
                    icon: <AddIcon fontSize="small" />,
                },
                {
                    messageDescriptorId: 'ImportNewCase',
                    callback: () => {
                        handleOpenDialog(DialogsId.ADD_NEW_CASE);
                    },
                    icon: <AddIcon fontSize="small" />,
                }
            );

            menuItems.push({ isDivider: true });

            if (isAllowed() && !restrictMenuItems) {
                menuItems.push(
                    {
                        messageDescriptorId: 'renameFolder',
                        callback: () => {
                            handleOpenDialog(DialogsId.RENAME_DIRECTORY);
                        },
                        icon: <CreateIcon fontSize="small" />,
                    },
                    {
                        messageDescriptorId: 'deleteFolder',
                        callback: () => {
                            handleOpenDialog(DialogsId.DELETE_DIRECTORY);
                        },
                        icon: <DeleteIcon fontSize="small" />,
                    },
                    { isDivider: true }
                );
            }

            menuItems.push(
                {
                    messageDescriptorId: 'paste',
                    callback: () => {
                        // @ts-expect-error TODO: manage null case
                        pasteElement(directory.elementUuid, selectionForCopy);
                    },
                    icon: <ContentPasteIcon fontSize="small" />,
                    disabled: !selectionForCopy.sourceItemUuid,
                },
                { isDivider: true }
            );

            menuItems.push({
                messageDescriptorId: 'createFolder',
                callback: () => {
                    handleOpenDialog(DialogsId.ADD_DIRECTORY);
                },
                icon: <CreateNewFolderIcon fontSize="small" />,
            });
        }

        menuItems.push({
            messageDescriptorId: 'createRootFolder',
            callback: () => {
                handleOpenDialog(DialogsId.ADD_ROOT_DIRECTORY);
            },
            icon: <FolderSpecialIcon fontSize="small" />,
        });

        return menuItems;
    };

    const renderDialog = () => {
        switch (openDialog) {
            case DialogsId.ADD_NEW_STUDY:
                return <CreateStudyForm open={true} onClose={handleCloseDialog} />;
            case DialogsId.ADD_NEW_CONTINGENCY_LIST:
                return (
                    <ContingencyListCreationDialog
                        open={true}
                        titleId={'createNewContingencyList'}
                        onClose={handleCloseDialog}
                    />
                );
            case DialogsId.ADD_DIRECTORY:
                return (
                    <CreateDirectoryDialog
                        open={true}
                        onClick={(elementName: string) =>
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
                        open={true}
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
                    <RenameDialog
                        message={'renameElementMsg'}
                        // @ts-expect-error TODO: manage null case(s) here
                        currentName={directory.elementName}
                        open={true}
                        onClick={(newName: string) => renameCB(directory?.elementUuid, newName)}
                        onClose={handleCloseDialog}
                        title={intl.formatMessage({
                            id: 'renameDirectoryDialogTitle',
                        })}
                        error={renameState.errorMessage}
                        type={ElementType.DIRECTORY}
                        parentDirectory={directory?.parentUuid}
                    />
                );
            case DialogsId.DELETE_DIRECTORY:
                return (
                    <DeleteDialog
                        items={directory ? [directory] : []}
                        multipleDeleteFormatMessageId={'deleteMultipleDirectoriesDialogMessage'}
                        simpleDeleteFormatMessageId={'deleteDirectoryDialogMessage'}
                        open={true}
                        onClick={() => {
                            // @ts-expect-error TODO: manage undefined case
                            handleDeleteElement(directory.elementUuid);
                        }}
                        onClose={handleCloseDialog}
                        error={deleteError}
                    />
                );
            case DialogsId.ADD_NEW_FILTER:
                return (
                    <FilterCreationDialog
                        open={true}
                        onClose={handleCloseDialog}
                        activeDirectory={activeDirectory}
                        elementExists={elementExists}
                        language={languageLocal}
                    />
                );
            case DialogsId.ADD_NEW_CASE:
                return <CreateCaseDialog open={true} onClose={handleCloseDialog} />;
            default:
                return null;
        }
    };
    return (
        <>
            {open && (
                <CommonContextualMenu {...others} menuItems={buildMenu()} open={open && !hideMenu} onClose={onClose} />
            )}
            {renderDialog()}
        </>
    );
};

export default DirectoryTreeContextualMenu;
