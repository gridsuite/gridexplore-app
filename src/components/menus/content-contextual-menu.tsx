/*
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { type UUID } from 'crypto';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
    ContentCopyRounded as ContentCopyRoundedIcon,
    Delete as DeleteIcon,
    DoNotDisturbAlt as DoNotDisturbAltIcon,
    DownloadForOffline,
    DriveFileMove as DriveFileMoveIcon,
    FileCopyTwoTone as FileCopyTwoToneIcon,
    FileDownload,
    InsertDriveFile as InsertDriveFileIcon,
    PhotoLibrary,
    TableView as TableViewIcon,
} from '@mui/icons-material';
import {
    ElementAttributes,
    ElementType,
    FilterCreationDialog,
    TreeViewFinderNodeProps,
    useSnackMessage,
    PARAM_LANGUAGE,
    PARAM_DEVELOPER_MODE,
} from '@gridsuite/commons-ui';
import RenameDialog from '../dialogs/rename-dialog';
import DeleteDialog from '../dialogs/delete-dialog';
import CreateStudyDialog from '../dialogs/create-study-dialog/create-study-dialog';
import { DialogsId } from '../../utils/UIconstants';
import {
    deleteElements,
    duplicateElement,
    duplicateSpreadsheetConfig,
    duplicateSpreadsheetConfigCollection,
    moveElementsToDirectory,
    PermissionType,
    renameElement,
} from '../../utils/rest-api';
import { FilterType } from '../../utils/elementType';
import CommonContextualMenu, { CommonContextualMenuProps } from './common-contextual-menu';
import { useDeferredFetch, useMultipleDeferredFetch } from '../../utils/custom-hooks';
import MoveDialog from '../dialogs/move-dialog';
import { useDownloadUtils } from '../utils/downloadUtils';
import ExportCaseDialog from '../dialogs/export-case-dialog';
import { setItemSelectionForCopy } from '../../redux/actions';
import { useParameterState } from '../dialogs/use-parameters-dialog';
import {
    generateRenameErrorMessages,
    handleDeleteError,
    handleDuplicateError,
    handleGenericTxtError,
    handleMaxElementsExceededError,
    handleMoveError,
} from '../utils/rest-errors';
import { AppState } from '../../redux/types';
import CreateSpreadsheetCollectionDialog from '../dialogs/spreadsheet-collection-creation-dialog';
import { checkPermissionOnDirectory } from './menus-utils';

interface ContentContextualMenuProps extends CommonContextualMenuProps {
    activeElement: ElementAttributes;
    selectedElements: ElementAttributes[];
    onClose: () => void;
    openDialog: string;
    setOpenDialog: (dialogId: string) => void;
    broadcastChannel: BroadcastChannel;
}

export default function ContentContextualMenu(props: Readonly<ContentContextualMenuProps>) {
    const { activeElement, selectedElements, open, onClose, openDialog, setOpenDialog, broadcastChannel, ...others } =
        props;
    const intl = useIntl();
    const dispatch = useDispatch();
    const itemSelectionForCopy = useSelector((state: AppState) => state.itemSelectionForCopy);
    const activeDirectory = useSelector((state: AppState) => state.activeDirectory);
    const [deleteError, setDeleteError] = useState('');
    const [directoryWritable, setDirectoryWritable] = useState(false);
    const [directoryReadable, setDirectoryReadable] = useState(false);
    const [permissionsLoaded, setPermissionsLoaded] = useState(false);
    const [enableDeveloperMode] = useParameterState(PARAM_DEVELOPER_MODE);

    const { snackError } = useSnackMessage();

    const selectedDirectory = useSelector((state: AppState) => state.selectedDirectory);
    const [hideMenu, setHideMenu] = useState(false);
    const { downloadElements, handleConvertCases, stopCasesExports } = useDownloadUtils();

    const [languageLocal] = useParameterState(PARAM_LANGUAGE);

    const handleOpenDialog = useCallback(
        (dialogId: string) => {
            setHideMenu(true);
            setOpenDialog(dialogId);
        },
        [setOpenDialog]
    );

    const handleCloseDialog = useCallback(() => {
        onClose();
        setOpenDialog(DialogsId.NONE);
        setHideMenu(false);
        setDeleteError('');
    }, [onClose, setOpenDialog]);

    const copyElement = useCallback(
        (
            typeItem: string,
            nameItem: string,
            descriptionItem: string,
            sourceItemUuid: UUID,
            parentDirectoryUuid?: UUID,
            specificTypeItem?: string
        ) => {
            dispatch(
                setItemSelectionForCopy({
                    sourceItemUuid,
                    typeItem,
                    nameItem,
                    descriptionItem,
                    parentDirectoryUuid: parentDirectoryUuid ?? null,
                    specificTypeItem: specificTypeItem ?? null,
                })
            );
            broadcastChannel.postMessage({
                typeItem,
                nameItem,
                descriptionItem,
                sourceItemUuid,
                parentDirectoryUuid,
                specificTypeItem,
            });

            handleCloseDialog();
        },
        [broadcastChannel, dispatch, handleCloseDialog]
    );

    const copyItem = useCallback(() => {
        if (activeElement) {
            switch (activeElement.type) {
                case ElementType.CASE:
                case ElementType.STUDY:
                case ElementType.FILTER:
                case ElementType.MODIFICATION:
                case ElementType.DIAGRAM_CONFIG:
                case ElementType.VOLTAGE_INIT_PARAMETERS:
                case ElementType.SECURITY_ANALYSIS_PARAMETERS:
                case ElementType.SENSITIVITY_PARAMETERS:
                case ElementType.LOADFLOW_PARAMETERS:
                case ElementType.SHORT_CIRCUIT_PARAMETERS:
                case ElementType.NETWORK_VISUALIZATIONS_PARAMETERS:
                case ElementType.SPREADSHEET_CONFIG:
                case ElementType.SPREADSHEET_CONFIG_COLLECTION:
                    console.info(
                        `${activeElement.type} with uuid ${activeElement.elementUuid} from directory ${selectedDirectory?.elementUuid} selected for copy`
                    );
                    copyElement(
                        activeElement.type,
                        activeElement.elementName,
                        activeElement.description,
                        activeElement.elementUuid,
                        selectedDirectory?.elementUuid
                    );
                    break;
                case ElementType.CONTINGENCY_LIST:
                    console.info(
                        `${activeElement.type} with uuid ${activeElement.elementUuid} from directory ${selectedDirectory?.elementUuid} selected for copy`
                    );
                    copyElement(
                        activeElement.type,
                        activeElement.elementName,
                        activeElement.description,
                        activeElement.elementUuid,
                        selectedDirectory?.elementUuid,
                        activeElement.specificMetadata.type
                    );
                    break;

                default:
                    handleGenericTxtError(intl.formatMessage({ id: 'unsupportedItem' }), snackError);
            }
        }
    }, [activeElement, copyElement, intl, selectedDirectory?.elementUuid, snackError]);

    const duplicateItem = useCallback(() => {
        if (activeElement) {
            switch (activeElement.type) {
                case ElementType.CASE:
                case ElementType.STUDY:
                case ElementType.FILTER:
                case ElementType.MODIFICATION:
                case ElementType.DIAGRAM_CONFIG:
                    duplicateElement(activeElement.elementUuid, undefined, activeElement.type).catch((error) => {
                        if (handleMaxElementsExceededError(error, snackError)) {
                            return;
                        }
                        handleDuplicateError(error, activeElement, intl, snackError);
                    });
                    break;
                case ElementType.CONTINGENCY_LIST:
                    duplicateElement(
                        activeElement.elementUuid,
                        undefined,
                        activeElement.type,
                        activeElement.specificMetadata.type
                    ).catch((error) => handleDuplicateError(error, activeElement, intl, snackError));
                    break;
                case ElementType.VOLTAGE_INIT_PARAMETERS:
                case ElementType.SENSITIVITY_PARAMETERS:
                case ElementType.SECURITY_ANALYSIS_PARAMETERS:
                case ElementType.LOADFLOW_PARAMETERS:
                case ElementType.SHORT_CIRCUIT_PARAMETERS:
                case ElementType.NETWORK_VISUALIZATIONS_PARAMETERS:
                    duplicateElement(
                        activeElement.elementUuid,
                        undefined,
                        activeElement.type,
                        activeElement.type
                    ).catch((error) => handleDuplicateError(error, activeElement, intl, snackError));
                    break;
                case ElementType.SPREADSHEET_CONFIG:
                    duplicateSpreadsheetConfig(activeElement.elementUuid).catch((error) => {
                        handleDuplicateError(error, activeElement, intl, snackError);
                    });
                    break;
                case ElementType.SPREADSHEET_CONFIG_COLLECTION:
                    duplicateSpreadsheetConfigCollection(activeElement.elementUuid).catch((error) => {
                        handleDuplicateError(error, activeElement, intl, snackError);
                    });
                    break;
                default: {
                    handleGenericTxtError(intl.formatMessage({ id: 'unsupportedItem' }), snackError);
                }
            }
            handleCloseDialog();
        }
    }, [activeElement, handleCloseDialog, intl, snackError]);

    const handleCloseExportDialog = useCallback(() => {
        stopCasesExports();
        handleCloseDialog();
    }, [handleCloseDialog, stopCasesExports]);

    const handleDeleteElements = useCallback(
        (elementsUuids: string[]) => {
            setDeleteError('');
            // @ts-expect-error TODO: manage null case
            deleteElements(elementsUuids, selectedDirectory?.elementUuid)
                .then(() => handleCloseDialog())
                // show the error message and don't close the dialog
                .catch((error) => {
                    handleDeleteError(setDeleteError, error, intl, snackError);
                });
        },
        [selectedDirectory?.elementUuid, handleCloseDialog, intl, snackError]
    );

    const [moveCB] = useMultipleDeferredFetch(moveElementsToDirectory, undefined, handleMoveError);

    const [renameCB, renameErrorMessage] = useDeferredFetch(
        renameElement,
        (renamedElement: any[]) => {
            // if copied element is renamed
            if (itemSelectionForCopy.sourceItemUuid === renamedElement[0]) {
                dispatch(
                    setItemSelectionForCopy({
                        ...itemSelectionForCopy,
                        nameItem: renamedElement[1],
                    })
                );
                broadcastChannel.postMessage({
                    ...itemSelectionForCopy,
                    nameItem: renamedElement[1],
                });
            }

            handleCloseDialog();
        },
        generateRenameErrorMessages(intl)
    );

    const noCreationInProgress = useCallback(() => selectedElements.every((el) => el.hasMetadata), [selectedElements]);
    const isSingleElement = selectedElements.length === 1;

    const allowsDuplicate = useCallback(() => {
        const allowedTypes = [
            ElementType.CASE,
            ElementType.STUDY,
            ElementType.CONTINGENCY_LIST,
            ElementType.FILTER,
            ElementType.MODIFICATION,
            ElementType.VOLTAGE_INIT_PARAMETERS,
            ElementType.SECURITY_ANALYSIS_PARAMETERS,
            ElementType.SENSITIVITY_PARAMETERS,
            ElementType.SHORT_CIRCUIT_PARAMETERS,
            ElementType.LOADFLOW_PARAMETERS,
            ElementType.NETWORK_VISUALIZATIONS_PARAMETERS,
            ElementType.SPREADSHEET_CONFIG,
            ElementType.SPREADSHEET_CONFIG_COLLECTION,
            ElementType.DIAGRAM_CONFIG,
        ];

        const hasMetadata = selectedElements[0]?.hasMetadata;
        const isAllowedType = allowedTypes.includes(selectedElements[0]?.type);

        return hasMetadata && isSingleElement && isAllowedType && directoryWritable;
    }, [selectedElements, isSingleElement, directoryWritable]);

    const allowsCreateNewStudyFromCase = useCallback(
        () =>
            selectedElements.length === 1 &&
            selectedElements[0].type === ElementType.CASE &&
            selectedElements[0].hasMetadata,
        [selectedElements]
    );

    const allowsConvertFilterIntoExplicitNaming = useCallback(
        () =>
            selectedElements.length === 1 &&
            selectedElements[0].type === ElementType.FILTER &&
            selectedElements[0].subtype !== FilterType.EXPLICIT_NAMING.id &&
            directoryWritable,
        [selectedElements, directoryWritable]
    );

    const allowsDownload = useCallback(() => {
        const allowedTypes = [
            ElementType.CASE,
            ElementType.SPREADSHEET_CONFIG,
            ElementType.SPREADSHEET_CONFIG_COLLECTION,
        ];
        // if selectedElements contains at least one of the allowed types
        return selectedElements.some((element) => allowedTypes.includes(element.type)) && noCreationInProgress();
    }, [selectedElements, noCreationInProgress]);

    const allowsExportCase = useCallback(() => {
        // if selectedElements contains at least one case
        return selectedElements.some((element) => element.type === ElementType.CASE) && noCreationInProgress();
    }, [selectedElements, noCreationInProgress]);

    const allowsSpreadsheetCollection = useMemo(() => {
        return selectedElements.every((element) => ElementType.SPREADSHEET_CONFIG === element.type);
    }, [selectedElements]);

    useEffect(() => {
        if (selectedDirectory !== null) {
            Promise.all([
                checkPermissionOnDirectory(selectedDirectory, PermissionType.READ).then(setDirectoryReadable),
                checkPermissionOnDirectory(selectedDirectory, PermissionType.WRITE).then(setDirectoryWritable),
            ]).finally(() => setPermissionsLoaded(true));
        }
    }, [selectedDirectory]);

    const buildMenu = useMemo(() => {
        if (selectedElements.length === 0) {
            return undefined;
        }

        // build menuItems here
        const menuItems = [];

        if (selectedElements.length === 1 && directoryWritable) {
            menuItems.push({
                messageDescriptorId: 'rename',
                callback: () => {
                    handleOpenDialog(DialogsId.RENAME);
                },
            });

            menuItems.push({
                messageDescriptorId: 'move',
                callback: () => {
                    handleOpenDialog(DialogsId.MOVE);
                },
                icon: <DriveFileMoveIcon fontSize="small" data-testid="MoveIcon" />,
                withDivider: true,
            });
        }

        if (allowsCreateNewStudyFromCase()) {
            menuItems.push({
                messageDescriptorId: 'createNewStudyFromImportedCase',
                callback: () => {
                    handleOpenDialog(DialogsId.ADD_NEW_STUDY_FROM_CASE);
                },
                icon: <PhotoLibrary fontSize="small" data-testid="CreateNewStudyFromImportedCaseIcon" />,
            });
        }

        if (allowsDuplicate()) {
            menuItems.push({
                messageDescriptorId: 'duplicate',
                callback: duplicateItem,
                icon: <FileCopyTwoToneIcon fontSize="small" data-testid="DuplicateIcon" />,
            });
        }

        if (directoryReadable && isSingleElement) {
            menuItems.push({
                messageDescriptorId: 'copy',
                callback: copyItem,
                icon: <ContentCopyRoundedIcon fontSize="small" data-testid="CopyIcon" />,
            });
        }

        if (selectedElements.length === 1 && directoryWritable) {
            menuItems.push({
                messageDescriptorId: 'delete',
                callback: () => {
                    handleOpenDialog(DialogsId.DELETE);
                },
                icon: <DeleteIcon fontSize="small" data-testid="DeleteIcon" />,
                withDivider: true,
            });
        }

        if (allowsDownload()) {
            menuItems.push({
                messageDescriptorId: 'download.button',
                callback: async () => {
                    await downloadElements(selectedElements);
                    handleCloseDialog();
                },
                icon: <FileDownload fontSize="small" data-testid="DownloadIcon" />,
            });
        }

        if (enableDeveloperMode && allowsExportCase()) {
            menuItems.push({
                messageDescriptorId: 'download.export.button',
                callback: () => handleOpenDialog(DialogsId.EXPORT),
                icon: <DownloadForOffline fontSize="small" data-testid="ExportIcon" />,
            });
        }

        if (allowsSpreadsheetCollection) {
            menuItems.push({
                messageDescriptorId: 'createSpreadsheetCollection',
                callback: () => {
                    handleOpenDialog(DialogsId.CREATE_SPREADSHEET_COLLECTION);
                },
                icon: <TableViewIcon fontSize="small" data-testid="CreateSpreadsheetCollectionIcon" />,
            });
        }

        if (allowsConvertFilterIntoExplicitNaming()) {
            menuItems.push({
                messageDescriptorId: 'convertFilterIntoExplicitNaming',
                callback: () => {
                    handleOpenDialog(DialogsId.CONVERT_TO_EXPLICIT_NAMING_FILTER);
                },
                icon: <InsertDriveFileIcon fontSize="small" data-testid="ConvertFilterIcon" />,
            });
        }

        if (menuItems.length === 0) {
            menuItems.push({
                messageDescriptorId: noCreationInProgress() ? 'noActionAvailable' : 'elementCreationInProgress',
                icon: <DoNotDisturbAltIcon fontSize="small" />,
                disabled: true,
            });
        }

        return menuItems;
    }, [
        selectedElements,
        directoryWritable,
        allowsCreateNewStudyFromCase,
        allowsDuplicate,
        directoryReadable,
        isSingleElement,
        allowsDownload,
        enableDeveloperMode,
        allowsExportCase,
        allowsSpreadsheetCollection,
        allowsConvertFilterIntoExplicitNaming,
        handleOpenDialog,
        duplicateItem,
        copyItem,
        downloadElements,
        handleCloseDialog,
        noCreationInProgress,
    ]);

    const renderDialog = () => {
        switch (openDialog) {
            case DialogsId.RENAME:
                return (
                    <RenameDialog
                        open
                        onClose={handleCloseDialog}
                        onClick={(elementName) => renameCB(activeElement?.elementUuid, elementName)}
                        title={intl.formatMessage({ id: 'renameElement' })}
                        message="renameElementMsg"
                        currentName={activeElement ? activeElement.elementName : ''}
                        type={activeElement ? activeElement.type : ('' as ElementType)}
                        error={renameErrorMessage}
                    />
                );
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
                        onClose={(selectedDir: TreeViewFinderNodeProps[]) => {
                            if (selectedDir.length > 0) {
                                moveCB([[selectedElements.map((element) => element.elementUuid), selectedDir[0].id]]);
                            }
                            handleCloseDialog();
                        }}
                        validationButtonText={intl.formatMessage(
                            { id: 'moveItemValidate' },
                            { nbElements: selectedElements.length }
                        )}
                        title={intl.formatMessage({ id: 'moveItemTitle' })}
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

            case DialogsId.CONVERT_TO_EXPLICIT_NAMING_FILTER:
                return (
                    <FilterCreationDialog
                        open
                        onClose={handleCloseDialog}
                        sourceFilterForExplicitNamingConversion={{
                            id: activeElement.elementUuid,
                            equipmentType: activeElement.specificMetadata.equipmentType,
                        }}
                        activeDirectory={activeDirectory}
                        language={languageLocal}
                        filterType={FilterType.EXPLICIT_NAMING}
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
            case DialogsId.ADD_NEW_STUDY_FROM_CASE:
                return <CreateStudyDialog open onClose={handleCloseDialog} providedExistingCase={activeElement} />;
            default:
                return null;
        }
    };
    return (
        <>
            {open && permissionsLoaded && (
                <CommonContextualMenu {...others} menuItems={buildMenu} open={open && !hideMenu} onClose={onClose} />
            )}
            {renderDialog()}
        </>
    );
}

ContentContextualMenu.propTypes = {
    onClose: PropTypes.func,
};
