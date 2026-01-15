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
    Settings as SettingsIcon,
} from '@mui/icons-material';
import {
    ElementAttributes,
    ElementType,
    FilterCreationDialog,
    PARAM_DEVELOPER_MODE,
    PARAM_LANGUAGE,
    PermissionType,
    TreeViewFinderNodeProps,
    useSnackMessage,
} from '@gridsuite/commons-ui';
import type { UUID } from 'node:crypto';
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
import ExplicitNamingCreationDialog from '../dialogs/contingency-list/explicit-naming/explicit-naming-creation-dialog';
import CreateCaseDialog from '../dialogs/create-case-dialog/create-case-dialog';
import { useParameterState } from '../dialogs/use-parameters-dialog';
import {
    buildSnackMessage,
    generateGenericPermissionErrorMessages,
    generateRenameErrorMessages,
    handleDeleteError,
    handleGenericTxtError,
    handleMaxElementsExceededError,
    handleMoveDirectoryConflictError,
    handleMoveNameConflictError,
    handleNotAllowedError,
    handlePasteError,
} from '../utils/rest-errors';
import { AppState } from '../../redux/types';
import MoveDialog from '../dialogs/move-dialog';
import { buildPathToFromMap } from '../treeview-utils';
import { checkPermissionOnDirectory } from './menus-utils';
import DirectoryPropertiesDialog from '../dialogs/directory-properties/directory-properties-dialog';
import { FilterType } from '../../utils/elementType';
import FilterBasedContingencyListDialog from '../dialogs/contingency-list/filter-based/contingency-list-filter-based-dialog';

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
    const [isDeveloperMode] = useParameterState(PARAM_DEVELOPER_MODE);

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

    const [renameCB, renameErrorMessage] = useDeferredFetch(
        renameElement,
        handleCloseDialog,
        generateRenameErrorMessages(intl)
    );

    const [insertDirectoryCB, insertDirectoryErrorMessage] = useDeferredFetch(
        insertDirectory,
        handleCloseDialog,
        generateGenericPermissionErrorMessages(intl)
    );

    const [insertRootDirectoryCB, insertRootDirectoryErrorMessage] = useDeferredFetch(
        insertRootDirectory,
        handleCloseDialog
    );

    const itemSelectionForCopy = useSelector((state: AppState) => state.itemSelectionForCopy);

    function pasteElement(directoryUuid: UUID, selectionForPaste: any) {
        if (!selectionForPaste.sourceItemUuid) {
            handleGenericTxtError(intl.formatMessage({ id: 'elementPasteFailed404' }), snackError);
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
                        (error) => {
                            if (handleMaxElementsExceededError(error, snackError)) {
                                return;
                            }
                            handlePasteError(error, intl, snackError);
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
                    ).catch((error) => handlePasteError(error, intl, snackError));
                    break;
                case ElementType.CONTINGENCY_LIST:
                    duplicateElement(
                        selectionForPaste.sourceItemUuid,
                        directoryUuid,
                        selectionForPaste.typeItem,
                        selectionForPaste.specificTypeItem
                    ).catch((error) => handlePasteError(error, intl, snackError));
                    break;
                case ElementType.SPREADSHEET_CONFIG:
                    duplicateSpreadsheetConfig(selectionForPaste.sourceItemUuid, directoryUuid).catch((error) =>
                        handlePasteError(error, intl, snackError)
                    );
                    break;
                case ElementType.SPREADSHEET_CONFIG_COLLECTION:
                    duplicateSpreadsheetConfigCollection(selectionForPaste.sourceItemUuid, directoryUuid).catch(
                        (error) => handlePasteError(error, intl, snackError)
                    );
                    break;
                default:
                    handleGenericTxtError(
                        intl.formatMessage({
                            id: 'unsupportedItem',
                        }),
                        snackError
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
                .catch((error) => {
                    handleDeleteError(setDeleteError, error, intl, snackError);
                });
        },
        [handleCloseDialog, intl, snackError]
    );

    // Allowance
    const showMenuFromEmptyZone = useCallback(() => !directory, [directory]);

    useEffect(() => {
        if (directory !== null) {
            checkPermissionOnDirectory(directory, PermissionType.WRITE).then((b) => {
                setDirectoryWritable(b);
            });
        }
    }, [directory]);

    const buildMenu = () => {
        // build menuItems here
        const menuItems: MenuItemType[] = [];

        if (showMenuFromEmptyZone()) {
            menuItems.push({
                messageDescriptorId: 'createRootFolder',
                callback: () => handleOpenDialog(DialogsId.ADD_ROOT_DIRECTORY),
                icon: <FolderSpecialIcon fontSize="small" data-testid="CreateRootFolderIcon" />,
            });
            return menuItems;
        }

        if (directory && directoryWritable) {
            menuItems.push(
                {
                    messageDescriptorId: 'createNewStudy',
                    callback: () => handleOpenDialog(DialogsId.ADD_NEW_STUDY),
                    icon: <AddIcon fontSize="small" data-testid="CreateNewStudyIcon" />,
                },
                {
                    messageDescriptorId: 'createNewContingencyList',
                    icon: <AddIcon fontSize="small" data-testid="CreateNewContingencyListIcon" />,
                    subMenuItems: [
                        {
                            messageDescriptorId: 'contingencyList.explicitNaming',
                            callback: () => handleOpenDialog(DialogsId.ADD_NEW_EXPLICIT_NAMING_CONTINGENCY_LIST),
                            icon: null,
                        },
                        {
                            messageDescriptorId: 'contingencyList.filterBased',
                            callback: () => handleOpenDialog(DialogsId.ADD_NEW_FILTERS_CONTINGENCY_LIST),
                            icon: null,
                        },
                    ],
                },
                {
                    messageDescriptorId: 'createNewFilter',
                    callback: () => handleOpenDialog(DialogsId.ADD_NEW_FILTER),
                    icon: <AddIcon fontSize="small" data-testid="CreateNewFilterIcon" />,
                    subMenuItems: [
                        {
                            messageDescriptorId: FilterType.EXPLICIT_NAMING.label,
                            callback: () => handleOpenDialog(DialogsId.ADD_NEW_EXPLICIT_NAMING_FILTER),
                            icon: null,
                        },
                        {
                            messageDescriptorId: FilterType.EXPERT.label,
                            callback: () => handleOpenDialog(DialogsId.ADD_NEW_CRITERIA_FILTER),
                            icon: null,
                        },
                    ],
                },
                {
                    messageDescriptorId: 'ImportNewCase',
                    callback: () => handleOpenDialog(DialogsId.ADD_NEW_CASE),
                    icon: <AddIcon fontSize="small" data-testid="ImportNewCaseIcon" />,
                },
                { isDivider: true }
            );
        }

        if (!restrictMenuItems) {
            if (directory && directoryWritable) {
                menuItems.push(
                    {
                        messageDescriptorId: 'renameFolder',
                        callback: () => handleOpenDialog(DialogsId.RENAME_DIRECTORY),
                        icon: <CreateIcon fontSize="small" data-testid="RenameIcon" />,
                    },
                    {
                        messageDescriptorId: 'deleteFolder',
                        callback: () => handleOpenDialog(DialogsId.DELETE_DIRECTORY),
                        icon: <DeleteIcon fontSize="small" data-testid="DeleteIcon" />,
                    }
                );
                menuItems.push(
                    {
                        messageDescriptorId: 'moveDirectory',
                        callback: () => handleOpenDialog(DialogsId.MOVE_DIRECTORY),
                        icon: <DriveFileMoveIcon fontSize="small" data-testid="MoveIcon" />,
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
                    icon: <ContentPasteIcon fontSize="small" data-testid="PasteIcon" />,
                    disabled: !itemSelectionForCopy.sourceItemUuid,
                },
                { isDivider: true },
                {
                    messageDescriptorId: 'createFolder',
                    callback: () => handleOpenDialog(DialogsId.ADD_DIRECTORY),
                    icon: <CreateNewFolderIcon fontSize="small" data-testid="CreateFolderIcon" />,
                }
            );
        }

        menuItems.push(
            {
                messageDescriptorId: 'createRootFolder',
                callback: () => handleOpenDialog(DialogsId.ADD_ROOT_DIRECTORY),
                icon: <FolderSpecialIcon fontSize="small" data-testid="CreateRootFolderIcon" />,
            },
            { isDivider: true }
        );

        if (directory) {
            menuItems.push({
                messageDescriptorId: 'properties',
                callback: () => handleOpenDialog(DialogsId.DIRECTORY_PROPERTIES),
                icon: <SettingsIcon fontSize="small" data-testid="PropertiesIcon" />,
            });
        }

        return menuItems;
    };

    const handleMoveDirectory = useCallback(
        (selectedDir: TreeViewFinderNodeProps[]) => {
            if (selectedDir.length === 1 && directory) {
                moveElementsToDirectory([directory.elementUuid], selectedDir[0].id as UUID).catch((error) => {
                    if (handleMoveDirectoryConflictError(error, snackError)) {
                        return;
                    }
                    if (handleNotAllowedError(error, snackError)) {
                        return;
                    }
                    if (handleMoveNameConflictError(error, snackError)) {
                        return;
                    }
                    const path = buildPathToFromMap(directory.elementUuid, treeData.mapData)
                        ?.map((el) => el.elementName)
                        .join('/');
                    snackError({
                        messageId: buildSnackMessage(error, 'MovingDirectoryError'),
                        messageValues: { elementPath: path },
                    });
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
            case DialogsId.ADD_NEW_EXPLICIT_NAMING_CONTINGENCY_LIST:
                return (
                    <ExplicitNamingCreationDialog open titleId="createNewContingencyList" onClose={handleCloseDialog} />
                );
            case DialogsId.ADD_NEW_FILTERS_CONTINGENCY_LIST:
                return (
                    <FilterBasedContingencyListDialog
                        titleId="createNewFilterBasedContingencyList"
                        open
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
                        error={insertDirectoryErrorMessage}
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
                        error={insertRootDirectoryErrorMessage}
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
                            error={renameErrorMessage}
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
            case DialogsId.ADD_NEW_EXPLICIT_NAMING_FILTER:
                return (
                    <FilterCreationDialog
                        open
                        onClose={handleCloseDialog}
                        activeDirectory={activeDirectory}
                        language={languageLocal}
                        filterType={FilterType.EXPLICIT_NAMING}
                        isDeveloperMode={isDeveloperMode}
                    />
                );
            case DialogsId.ADD_NEW_CRITERIA_FILTER:
                return (
                    <FilterCreationDialog
                        open
                        onClose={handleCloseDialog}
                        activeDirectory={activeDirectory}
                        language={languageLocal}
                        filterType={FilterType.EXPERT}
                        isDeveloperMode={isDeveloperMode}
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
            case DialogsId.DIRECTORY_PROPERTIES:
                return <DirectoryPropertiesDialog open onClose={handleCloseDialog} directory={directory} />;
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
