/*
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
    ContentCopyRounded as ContentCopyRoundedIcon,
    Delete as DeleteIcon,
    DoNotDisturbAlt as DoNotDisturbAltIcon,
    DownloadForOffline,
    DriveFileMove as DriveFileMoveIcon,
    FileCopy as FileCopyIcon,
    FileCopyTwoTone as FileCopyTwoToneIcon,
    FileDownload,
    InsertDriveFile as InsertDriveFileIcon,
    PhotoLibrary,
} from '@mui/icons-material';
import {
    ElementAttributes,
    ElementType,
    FilterCreationDialog,
    TreeViewFinderNodeProps,
    useSnackMessage,
} from '@gridsuite/commons-ui';
import { AppState } from 'redux/reducer';
import { PopoverPosition, PopoverReference } from '@mui/material';
import RenameDialog from '../dialogs/rename-dialog';
import DeleteDialog from '../dialogs/delete-dialog';
import ReplaceWithScriptDialog from '../dialogs/replace-with-script-dialog';
import CopyToScriptDialog from '../dialogs/copy-to-script-dialog';
import CreateStudyDialog from '../dialogs/create-study-dialog/create-study-dialog';
import { DialogsId } from '../../utils/UIconstants';
import {
    deleteElements,
    duplicateElement,
    duplicateSpreadsheetConfig,
    elementExists,
    moveElementsToDirectory,
    newScriptFromFilter,
    newScriptFromFiltersContingencyList,
    renameElement,
    replaceFiltersWithScript,
    replaceFormContingencyListWithScript,
} from '../../utils/rest-api';
import { ContingencyListType, FilterType } from '../../utils/elementType';
import CommonContextualMenu from './common-contextual-menu';
import { useDeferredFetch, useMultipleDeferredFetch } from '../../utils/custom-hooks';
import MoveDialog from '../dialogs/move-dialog';
import { useDownloadUtils } from '../utils/downloadUtils';
import ExportCaseDialog from '../dialogs/export-case-dialog';
import { setSelectionForCopy } from '../../redux/actions';
import { useParameterState } from '../dialogs/use-parameters-dialog';
import { PARAM_LANGUAGE } from '../../utils/config-params';
import { handleMaxElementsExceededError } from '../utils/rest-errors';

interface ContentContextualMenuProps {
    activeElement: ElementAttributes;
    selectedElements: ElementAttributes[];
    onUpdateSelectedElements: (elements: ElementAttributes[]) => void;
    open: boolean;
    onClose: () => void;
    openDialog: string;
    setOpenDialog: (dialogId: string) => void;
    broadcastChannel: BroadcastChannel;
    anchorReference?: PopoverReference;
    anchorPosition?: PopoverPosition;
}

export default function ContentContextualMenu(props: ContentContextualMenuProps) {
    const {
        activeElement,
        selectedElements,
        onUpdateSelectedElements,
        open,
        onClose,
        openDialog,
        setOpenDialog,
        broadcastChannel,
        ...others
    } = props;
    const userId = useSelector((state: AppState) => state.user?.profile.sub);
    const intl = useIntl();
    const dispatch = useDispatch();
    const selectionForCopy = useSelector((state: AppState) => state.selectionForCopy);
    const activeDirectory = useSelector((state: AppState) => state.activeDirectory);

    const { snackError } = useSnackMessage();

    const selectedDirectory = useSelector((state: AppState) => state.selectedDirectory);
    const [hideMenu, setHideMenu] = useState(false);
    const { downloadElements, handleConvertCases, stopCasesExports } = useDownloadUtils();

    const [languageLocal] = useParameterState(PARAM_LANGUAGE);

    const handleLastError = useCallback(
        (message: string) => {
            snackError({
                messageTxt: message,
            });
        },
        [snackError]
    );

    const handleOpenDialog = (dialogId: string) => {
        setHideMenu(true);
        setOpenDialog(dialogId);
    };
    const dispatchSelectionForCopy = useCallback(
        (
            typeItem: string,
            nameItem: string,
            descriptionItem: string,
            sourceItemUuid: string,
            parentDirectoryUuid?: string,
            specificTypeItem?: string
        ) => {
            dispatch(
                setSelectionForCopy({
                    sourceItemUuid,
                    typeItem,
                    nameItem,
                    descriptionItem,
                    parentDirectoryUuid: parentDirectoryUuid ?? null,
                    specificTypeItem: specificTypeItem ?? null,
                })
            );
        },
        [dispatch]
    );

    function copyElement(
        typeItem: string,
        nameItem: string,
        descriptionItem: string,
        sourceItemUuid: string,
        parentDirectoryUuid?: string,
        specificTypeItem?: string
    ) {
        dispatchSelectionForCopy(
            typeItem,
            nameItem,
            descriptionItem,
            sourceItemUuid,
            parentDirectoryUuid,
            specificTypeItem
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
    }

    const handleDuplicateError = (error: string) => {
        return handleLastError(
            intl.formatMessage(
                { id: 'duplicateElementFailure' },
                {
                    itemName: activeElement.elementName,
                    errorMessage: error,
                }
            )
        );
    };

    const copyItem = () => {
        if (activeElement) {
            switch (activeElement.type) {
                case ElementType.CASE:
                case ElementType.STUDY:
                case ElementType.FILTER:
                case ElementType.MODIFICATION:
                case ElementType.VOLTAGE_INIT_PARAMETERS:
                case ElementType.SECURITY_ANALYSIS_PARAMETERS:
                case ElementType.SENSITIVITY_PARAMETERS:
                case ElementType.LOADFLOW_PARAMETERS:
                case ElementType.SHORT_CIRCUIT_PARAMETERS:
                case ElementType.SPREADSHEET_CONFIG:
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
                        // @ts-expect-error TODO: seems to be an object but we await a string???
                        activeElement.specificMetadata.type
                    );
                    break;

                default:
                    handleLastError(intl.formatMessage({ id: 'unsupportedItem' }));
            }
        }
    };
    const duplicateItem = () => {
        if (activeElement) {
            switch (activeElement.type) {
                case ElementType.CASE:
                case ElementType.STUDY:
                case ElementType.FILTER:
                case ElementType.MODIFICATION:
                    duplicateElement(activeElement.elementUuid, undefined, activeElement.type).catch((error) => {
                        if (handleMaxElementsExceededError(error, snackError)) {
                            return;
                        }
                        handleDuplicateError(error.message);
                    });
                    break;
                case ElementType.CONTINGENCY_LIST:
                    duplicateElement(
                        activeElement.elementUuid,
                        undefined,
                        activeElement.type,
                        // @ts-expect-error TODO: seems to be an object but we await a string???
                        activeElement.specificMetadata.type
                    ).catch((error) => {
                        handleDuplicateError(error.message);
                    });
                    break;
                case ElementType.VOLTAGE_INIT_PARAMETERS:
                case ElementType.SENSITIVITY_PARAMETERS:
                case ElementType.SECURITY_ANALYSIS_PARAMETERS:
                case ElementType.LOADFLOW_PARAMETERS:
                case ElementType.SHORT_CIRCUIT_PARAMETERS:
                    duplicateElement(
                        activeElement.elementUuid,
                        undefined,
                        ElementType.PARAMETERS,
                        activeElement.type
                    ).catch((error) => {
                        handleDuplicateError(error.message);
                    });
                    break;
                case ElementType.SPREADSHEET_CONFIG:
                    duplicateSpreadsheetConfig(activeElement.elementUuid).catch((error) => {
                        handleDuplicateError(error.message);
                    });
                    break;
                default: {
                    handleLastError(
                        intl.formatMessage({
                            id: 'unsupportedItem',
                        })
                    );
                }
            }
            handleCloseDialog();
        }
    };

    const handleCloseDialog = useCallback(() => {
        onClose();
        setOpenDialog(DialogsId.NONE);
        setHideMenu(false);
        setDeleteError('');
    }, [onClose, setOpenDialog]);

    const handleCloseExportDialog = useCallback(() => {
        stopCasesExports();
        handleCloseDialog();
    }, [handleCloseDialog, stopCasesExports]);

    const [deleteError, setDeleteError] = useState('');
    const handleDeleteElements = useCallback(
        (elementsUuids: string[]) => {
            setDeleteError('');
            // @ts-expect-error TODO: manage null case
            deleteElements(elementsUuids, selectedDirectory?.elementUuid)
                .then(() => handleCloseDialog())
                // show the error message and don't close the dialog
                .catch((error) => {
                    setDeleteError(error.message);
                    handleLastError(error.message);
                });
        },
        [selectedDirectory, handleCloseDialog, handleLastError]
    );

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

    const [renameCB, renameState] = useDeferredFetch(
        renameElement,
        (elementUuid: string, renamedElement: any[]) => {
            // if copied element is renamed
            if (selectionForCopy.sourceItemUuid === renamedElement[0]) {
                dispatch(
                    setSelectionForCopy({
                        ...selectionForCopy,
                        nameItem: renamedElement[1],
                    })
                );
                broadcastChannel.postMessage({
                    ...selectionForCopy,
                    nameItem: renamedElement[1],
                });
            }
            // update selected elements if element is renamed
            const updatedSelectedElements = selectedElements.map((element) => {
                if (element.elementUuid === renamedElement[0]) {
                    return { ...element, elementName: renamedElement[1] };
                }
                return element;
            });
            onUpdateSelectedElements(updatedSelectedElements);

            handleCloseDialog();
        },
        (HTTPStatusCode: number) => {
            if (HTTPStatusCode === 403) {
                return intl.formatMessage({
                    id: 'renameElementNotAllowedError',
                });
            }
            if (HTTPStatusCode === 404) {
                // == NOT FOUND
                return intl.formatMessage({ id: 'renameElementNotFoundError' });
            }
        },
        undefined,
        false
    );

    const [FiltersReplaceWithScriptCB] = useDeferredFetch(
        replaceFiltersWithScript,
        handleCloseDialog,
        undefined,
        handleLastError,
        false
    );

    const [newScriptFromFiltersContingencyListCB] = useDeferredFetch(
        newScriptFromFiltersContingencyList,
        handleCloseDialog,
        undefined,
        handleLastError,
        false
    );

    const [replaceFormContingencyListWithScriptCB] = useDeferredFetch(
        replaceFormContingencyListWithScript,
        handleCloseDialog,
        undefined,
        handleLastError,
        false
    );

    const [newScriptFromFilterCB] = useDeferredFetch(
        newScriptFromFilter,
        handleCloseDialog,
        undefined,
        handleLastError,
        false
    );

    const noCreationInProgress = useCallback(() => {
        return selectedElements.every((el) => el.hasMetadata);
    }, [selectedElements]);

    // Allowance
    const isUserAllowed = useCallback(() => {
        return selectedElements.every((el) => {
            return el.owner === userId;
        });
    }, [selectedElements, userId]);

    const allowsDelete = useCallback(() => {
        return isUserAllowed() && selectedElements.every((el) => el.elementUuid != null);
    }, [isUserAllowed, selectedElements]);

    const allowsRename = useCallback(() => {
        return selectedElements.length === 1 && isUserAllowed() && selectedElements[0].hasMetadata;
    }, [isUserAllowed, selectedElements]);

    const allowsMove = useCallback(() => {
        return (
            selectedElements.every((element) => element.type !== ElementType.DIRECTORY && element.hasMetadata) &&
            isUserAllowed()
        );
    }, [isUserAllowed, selectedElements]);

    const allowsDuplicateAndCopy = useCallback(() => {
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
            ElementType.SPREADSHEET_CONFIG,
        ];

        const hasMetadata = selectedElements[0]?.hasMetadata;
        const isSingleElement = selectedElements.length === 1;
        const isAllowedType = allowedTypes.includes(selectedElements[0]?.type);

        return hasMetadata && isSingleElement && isAllowedType;
    }, [selectedElements]);

    const allowsCreateNewStudyFromCase = useCallback(() => {
        return (
            selectedElements.length === 1 &&
            selectedElements[0].type === ElementType.CASE &&
            selectedElements[0].hasMetadata
        );
    }, [selectedElements]);

    const allowsCopyContingencyToScript = useCallback(() => {
        return (
            selectedElements.length === 1 &&
            selectedElements[0].type === ElementType.CONTINGENCY_LIST &&
            selectedElements[0].subtype === ContingencyListType.CRITERIA_BASED.id
        );
    }, [selectedElements]);

    const allowsReplaceContingencyWithScript = useCallback(() => {
        return (
            selectedElements.length === 1 &&
            selectedElements[0].type === ElementType.CONTINGENCY_LIST &&
            selectedElements[0].subtype === ContingencyListType.CRITERIA_BASED.id &&
            isUserAllowed()
        );
    }, [isUserAllowed, selectedElements]);

    const allowsConvertFilterIntoExplicitNaming = useCallback(() => {
        return (
            selectedElements.length === 1 &&
            selectedElements[0].type === ElementType.FILTER &&
            selectedElements[0].subtype !== FilterType.EXPLICIT_NAMING.id &&
            isUserAllowed()
        );
    }, [isUserAllowed, selectedElements]);

    const allowsDownload = useCallback(() => {
        const allowedTypes = [ElementType.CASE, ElementType.SPREADSHEET_CONFIG];
        // if selectedElements contains at least one of the allowed types
        return selectedElements.some((element) => allowedTypes.includes(element.type)) && noCreationInProgress();
    }, [selectedElements, noCreationInProgress]);

    const allowsExportCase = useCallback(() => {
        // if selectedElements contains at least one case
        return selectedElements.some((element) => element.type === ElementType.CASE) && noCreationInProgress();
    }, [selectedElements, noCreationInProgress]);

    const buildMenu = () => {
        if (selectedElements.length === 0) {
            return;
        }

        // build menuItems here
        const menuItems = [];

        if (allowsRename()) {
            menuItems.push({
                messageDescriptorId: 'rename',
                callback: () => {
                    handleOpenDialog(DialogsId.RENAME);
                },
            });
        }

        if (allowsMove()) {
            menuItems.push({
                messageDescriptorId: 'move',
                callback: () => {
                    handleOpenDialog(DialogsId.MOVE);
                },
                icon: <DriveFileMoveIcon fontSize="small" />,
                withDivider: true,
            });
        }

        if (allowsCreateNewStudyFromCase()) {
            menuItems.push({
                messageDescriptorId: 'createNewStudyFromImportedCase',
                callback: () => {
                    handleOpenDialog(DialogsId.ADD_NEW_STUDY_FROM_CASE);
                },
                icon: <PhotoLibrary fontSize="small" />,
            });
        }

        if (allowsDuplicateAndCopy()) {
            menuItems.push({
                messageDescriptorId: 'duplicate',
                callback: () => {
                    duplicateItem();
                },
                icon: <FileCopyTwoToneIcon fontSize="small" />,
            });
            menuItems.push({
                messageDescriptorId: 'copy',
                callback: () => {
                    copyItem();
                },
                icon: <ContentCopyRoundedIcon fontSize="small" />,
            });
        }

        if (allowsDelete()) {
            menuItems.push({
                messageDescriptorId: 'delete',
                callback: () => {
                    handleOpenDialog(DialogsId.DELETE);
                },
                icon: <DeleteIcon fontSize="small" />,
                withDivider: true,
            });
        }

        if (allowsCopyContingencyToScript()) {
            menuItems.push({ isDivider: true });
            menuItems.push({
                messageDescriptorId: 'copyToScript',
                callback: () => {
                    handleOpenDialog(DialogsId.COPY_FILTER_TO_SCRIPT_CONTINGENCY);
                },
                icon: <FileCopyIcon fontSize="small" />,
            });
        }

        if (allowsDownload()) {
            menuItems.push({
                messageDescriptorId: 'download.button',
                callback: async () => {
                    await downloadElements(selectedElements);
                    handleCloseDialog();
                },
                icon: <FileDownload fontSize="small" />,
            });
        }

        if (allowsExportCase()) {
            menuItems.push({
                messageDescriptorId: 'download.export.button',
                callback: () => handleOpenDialog(DialogsId.EXPORT),
                icon: <DownloadForOffline fontSize="small" />,
            });
        }

        if (allowsReplaceContingencyWithScript()) {
            menuItems.push({
                messageDescriptorId: 'replaceWithScript',
                callback: () => {
                    handleOpenDialog(DialogsId.REPLACE_FILTER_BY_SCRIPT_CONTINGENCY);
                },
                icon: <InsertDriveFileIcon fontSize="small" />,
            });
        }

        if (allowsConvertFilterIntoExplicitNaming()) {
            menuItems.push({
                messageDescriptorId: 'convertFilterIntoExplicitNaming',
                callback: () => {
                    handleOpenDialog(DialogsId.CONVERT_TO_EXPLICIT_NAMING_FILTER);
                },
                icon: <InsertDriveFileIcon fontSize="small" />,
            });
        }

        if (menuItems.length === 0) {
            menuItems.push({
                messageDescriptorId: noCreationInProgress() ? 'notElementCreator' : 'elementCreationInProgress',
                icon: <DoNotDisturbAltIcon fontSize="small" />,
                disabled: true,
            });
        }

        return menuItems;
    };

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
                        error={renameState.errorMessage}
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
            case DialogsId.REPLACE_FILTER_BY_SCRIPT_CONTINGENCY:
                return (
                    <ReplaceWithScriptDialog
                        id={activeElement ? activeElement.elementUuid : ''}
                        open
                        onClose={handleCloseDialog}
                        onClick={(id) => replaceFormContingencyListWithScriptCB(id, selectedDirectory?.elementUuid)}
                        title={intl.formatMessage({ id: 'replaceList' })}
                    />
                );
            case DialogsId.COPY_FILTER_TO_SCRIPT_CONTINGENCY:
                return (
                    <CopyToScriptDialog
                        id={activeElement ? activeElement.elementUuid : ''}
                        open
                        onClose={handleCloseDialog}
                        onValidate={(id, newName) =>
                            newScriptFromFiltersContingencyListCB(id, newName, selectedDirectory?.elementUuid)
                        }
                        currentName={activeElement ? activeElement.elementName : ''}
                        title="copyToScriptList"
                        // @ts-expect-error TODO: manage undefined case
                        directoryUuid={selectedDirectory?.elementUuid}
                        elementType={activeElement?.type}
                        handleError={handleLastError}
                    />
                );
            case DialogsId.REPLACE_FILTER_BY_SCRIPT:
                return (
                    <ReplaceWithScriptDialog
                        id={activeElement ? activeElement.elementUuid : ''}
                        open
                        onClose={handleCloseDialog}
                        onClick={(id) => FiltersReplaceWithScriptCB(id, selectedDirectory?.elementUuid)}
                        title={intl.formatMessage({ id: 'replaceList' })}
                    />
                );
            case DialogsId.COPY_FILTER_TO_SCRIPT:
                return (
                    <CopyToScriptDialog
                        id={activeElement ? activeElement.elementUuid : ''}
                        open
                        onClose={handleCloseDialog}
                        onValidate={(id, newName) => newScriptFromFilterCB(id, newName, selectedDirectory?.elementUuid)}
                        currentName={activeElement ? activeElement.elementName : ''}
                        title="copyToScriptList"
                        // @ts-expect-error TODO: manage undefined case
                        directoryUuid={selectedDirectory?.elementUuid}
                        elementType={activeElement?.type}
                        handleError={handleLastError}
                    />
                );
            case DialogsId.CONVERT_TO_EXPLICIT_NAMING_FILTER:
                return (
                    <FilterCreationDialog
                        open
                        onClose={handleCloseDialog}
                        sourceFilterForExplicitNamingConversion={{
                            id: activeElement.elementUuid,
                            // @ts-expect-error TODO: seems to be an object but we await a string???
                            equipmentType: activeElement.specificMetadata.equipmentType,
                        }}
                        activeDirectory={activeDirectory}
                        elementExists={elementExists}
                        language={languageLocal}
                    />
                );
            case DialogsId.ADD_NEW_STUDY_FROM_CASE:
                return <CreateStudyDialog open onClose={handleCloseDialog} providedExistingCase={activeElement} />;
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
}

ContentContextualMenu.propTypes = {
    onUpdateSelectedElements: PropTypes.func,
    onClose: PropTypes.func,
};
