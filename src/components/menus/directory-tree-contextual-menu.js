/**
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import DeleteIcon from '@mui/icons-material/Delete';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import BuildIcon from '@mui/icons-material/Build';
import AddIcon from '@mui/icons-material/Add';
import CreateIcon from '@mui/icons-material/Create';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import CreateStudyForm from '../dialogs/create-study-dialog/create-study-dialog';
import CreateDirectoryDialog from '../dialogs/create-directory-dialog';
import RenameDialog from '../dialogs/rename-dialog';
import AccessRightsDialog from '../dialogs/access-rights-dialog';
import DeleteDialog from '../dialogs/delete-dialog';
import FilterCreationDialog from '../dialogs/filter/filter-creation-dialog';

import { DialogsId } from '../../utils/UIconstants';

import {
    duplicateCase,
    duplicateContingencyList,
    duplicateFilter,
    duplicateModification,
    duplicateParameter,
    duplicateStudy,
    fetchElementsInfos,
    getNameCandidate,
    getStashedElements,
    insertDirectory,
    insertRootDirectory,
    renameElement,
    stashElements,
    updateAccessRights,
} from '../../utils/rest-api';

import CommonContextualMenu from './common-contextual-menu';
import { useDeferredFetch } from '../../utils/custom-hooks';
import { ElementType } from '../../utils/elementType';
import ContingencyListCreationDialog from '../dialogs/contingency-list/creation/contingency-list-creation-dialog';
import CreateCaseDialog from '../dialogs/create-case-dialog/create-case-dialog';
import { useSnackMessage } from '@gridsuite/commons-ui';
import StashedElementsDialog from '../dialogs/stashed-elements/stashed-elements-dialog';
import { RestoreFromTrash } from '@mui/icons-material';
import { notificationType } from '../../utils/notificationType';

const DirectoryTreeContextualMenu = (props) => {
    const { directory, open, onClose, openDialog, setOpenDialog, ...others } =
        props;
    const userId = useSelector((state) => state.user.profile.sub);

    const intl = useIntl();

    const [hideMenu, setHideMenu] = useState(false);
    const { snackError } = useSnackMessage();
    const directoryUpdatedEvent = useSelector(
        (state) => state.directoryUpdated
    );

    const handleOpenDialog = (dialogId) => {
        setHideMenu(true);
        setOpenDialog(dialogId);
    };

    const handleCloseDialog = useCallback(
        (e, nextSelectedDirectoryId = null) => {
            onClose(e, nextSelectedDirectoryId);
            setOpenDialog(DialogsId.NONE);
            setHideMenu(false);
        },
        [onClose, setOpenDialog]
    );

    const [renameCB, renameState] = useDeferredFetch(
        renameElement,
        () => handleCloseDialog(null, null),
        (HTTPStatusCode) => {
            if (HTTPStatusCode === 403) {
                return intl.formatMessage({ id: 'renameDirectoryError' });
            }
        },
        undefined,
        false
    );

    const [insertDirectoryCB, insertDirectoryState] = useDeferredFetch(
        insertDirectory,
        (response) => handleCloseDialog(null, response?.elementUuid)
    );

    const [insertRootDirectoryCB, insertRootDirectoryState] = useDeferredFetch(
        insertRootDirectory,
        (response) => handleCloseDialog(null, response?.elementUuid)
    );

    const [updateAccessRightsCB, updateAccessRightsState] = useDeferredFetch(
        updateAccessRights,
        () => handleCloseDialog(null, null),
        (HTTPStatusCode) => {
            if (HTTPStatusCode === 403) {
                return intl.formatMessage({
                    id: 'modifyDirectoryAccessRightsError',
                });
            }
        },
        undefined,
        false
    );
    const selectionForCopy = useSelector((state) => state.selectionForCopy);

    const handleError = useCallback(
        (message) => {
            snackError({
                messageTxt: message,
            });
        },
        [snackError]
    );

    const handlePasteError = (error) => {
        let msg;
        if (error.status === 404) {
            msg = intl.formatMessage({
                id: 'elementPasteFailed404',
            });
        } else {
            msg =
                intl.formatMessage({ id: 'elementPasteFailed' }) +
                error?.message;
        }
        return handleError(msg);
    };

    function pasteElement(directoryUuid, selectionForCopy) {
        if (!selectionForCopy.sourceItemUuid) {
            handleError(intl.formatMessage({ id: 'elementPasteFailed404' }));
            handleCloseDialog(null);
        } else {
            console.info(
                'Pasting element %s into directory %s',
                selectionForCopy.nameItem,
                directoryUuid
            );
            // existence check and infos for source element
            fetchElementsInfos([selectionForCopy.sourceItemUuid])
                .then((elementInfos) => {
                    // available new name
                    getNameCandidate(
                        directoryUuid,
                        selectionForCopy.nameItem,
                        selectionForCopy.typeItem
                    )
                        .then((newItemName) => {
                            // duplicate source element with new name
                            switch (selectionForCopy.typeItem) {
                                case ElementType.CASE:
                                    duplicateCase(
                                        newItemName,
                                        selectionForCopy.descriptionItem,
                                        selectionForCopy.sourceItemUuid,
                                        directoryUuid
                                    ).catch((error) => {
                                        handlePasteError(error);
                                    });
                                    break;
                                case ElementType.STUDY:
                                    duplicateStudy(
                                        newItemName,
                                        selectionForCopy.descriptionItem,
                                        selectionForCopy.sourceItemUuid,
                                        directoryUuid
                                    ).catch((error) => {
                                        handlePasteError(error);
                                    });
                                    break;
                                case ElementType.FILTER:
                                    duplicateFilter(
                                        newItemName,
                                        selectionForCopy.descriptionItem,
                                        selectionForCopy.sourceItemUuid,
                                        directoryUuid
                                    ).catch((error) => {
                                        handlePasteError(error);
                                    });
                                    break;
                                case ElementType.MODIFICATION:
                                    duplicateModification(
                                        newItemName,
                                        selectionForCopy.descriptionItem,
                                        selectionForCopy.sourceItemUuid,
                                        directoryUuid
                                    ).catch((error) => {
                                        handlePasteError(error);
                                    });
                                    break;
                                case ElementType.VOLTAGE_INIT_PARAMETERS:
                                case ElementType.SECURITY_ANALYSIS_PARAMETERS:
                                case ElementType.SENSITIVITY_PARAMETERS:
                                case ElementType.LOADFLOW_PARAMETERS:
                                    duplicateParameter(
                                        newItemName,
                                        selectionForCopy.typeItem,
                                        selectionForCopy.sourceItemUuid,
                                        directoryUuid
                                    ).catch((error) => {
                                        handlePasteError(error);
                                    });
                                    break;
                                case ElementType.CONTINGENCY_LIST:
                                    duplicateContingencyList(
                                        elementInfos[0].specificMetadata.type,
                                        newItemName,
                                        selectionForCopy.descriptionItem,
                                        selectionForCopy.sourceItemUuid,
                                        directoryUuid
                                    ).catch((error) => {
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
                        })
                        .catch((error) => {
                            handlePasteError(error);
                        });
                })
                .catch((error) => {
                    handlePasteError(error);
                })
                .finally(() => handleCloseDialog(null));
        }
    }

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

    const [deleteError, setDeleteError] = useState('');
    const handleStashElements = useCallback(
        (elementsUuid) => {
            stashElements(elementsUuid)
                .then(handleGetStashedElement)
                .catch((error) => {
                    setDeleteError(error.message);
                    handleError(error.message);
                })
                .finally(() => handleCloseDialog(null, directory?.parentUuid));
        },
        [
            handleCloseDialog,
            directory?.parentUuid,
            handleError,
            handleGetStashedElement,
        ]
    );

    useEffect(() => {
        if (open) {
            handleGetStashedElement();
        }
    }, [handleGetStashedElement, open]);

    useEffect(() => {
        if (
            directoryUpdatedEvent.eventData?.headers &&
            (directoryUpdatedEvent.eventData.headers['notificationType'] ===
                notificationType.UPDATE_DIRECTORY ||
                directoryUpdatedEvent.eventData.headers['notificationType'] ===
                    notificationType.DELETE_DIRECTORY)
        ) {
            handleGetStashedElement();
        }
    }, [directoryUpdatedEvent, handleGetStashedElement]);

    // Allowance
    const showMenuFromEmptyZone = useCallback(() => {
        return !directory;
    }, [directory]);

    const isAllowed = useCallback(() => {
        return directory && directory.owner === userId;
    }, [directory, userId]);

    const buildMenu = () => {
        // build menuItems here
        let menuItems = [];

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

            if (isAllowed()) {
                menuItems.push(
                    {
                        messageDescriptorId: 'renameFolder',
                        callback: () => {
                            handleOpenDialog(DialogsId.RENAME_DIRECTORY);
                        },
                        icon: <CreateIcon fontSize="small" />,
                    },
                    {
                        messageDescriptorId: 'accessRights',
                        callback: () => {
                            handleOpenDialog(DialogsId.ACCESS_RIGHTS);
                        },
                        icon: <BuildIcon fontSize="small" />,
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
                        pasteElement(directory?.elementUuid, selectionForCopy);
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

        if (!showMenuFromEmptyZone()) {
            menuItems.push({
                messageDescriptorId: 'StashedElements',
                callback: () => {
                    handleOpenDialog(DialogsId.STASHED_ELEMENTS);
                },
                icon: <RestoreFromTrash fontSize="small" />,
                disabled: stashedElements.length === 0,
            });
        }

        return menuItems;
    };

    const renderDialog = () => {
        switch (openDialog) {
            case DialogsId.ADD_NEW_STUDY:
                return (
                    <CreateStudyForm open={true} onClose={handleCloseDialog} />
                );
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
                        onClick={(elementName, isPrivate) =>
                            insertDirectoryCB(
                                elementName,
                                directory?.elementUuid,
                                isPrivate,
                                userId
                            )
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
                        onClick={(elementName, isPrivate) =>
                            insertRootDirectoryCB(
                                elementName,
                                isPrivate,
                                userId
                            )
                        }
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
                        currentName={directory?.elementName}
                        open={true}
                        onClick={(newName) =>
                            renameCB(directory?.elementUuid, newName)
                        }
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
                        multipleDeleteFormatMessageId={
                            'deleteMultipleDirectoriesDialogMessage'
                        }
                        simpleDeleteFormatMessageId={
                            'deleteDirectoryDialogMessage'
                        }
                        open={true}
                        onClick={() =>
                            handleStashElements(directory?.elementUuid)
                        }
                        onClose={handleCloseDialog}
                        error={deleteError}
                    />
                );
            case DialogsId.ACCESS_RIGHTS:
                return (
                    <AccessRightsDialog
                        isPrivate={directory?.accessRights?.isPrivate}
                        open={true}
                        onClick={(isPrivate) =>
                            updateAccessRightsCB(
                                directory?.elementUuid,
                                isPrivate
                            )
                        }
                        onClose={handleCloseDialog}
                        title={intl.formatMessage({
                            id: 'accessRights',
                        })}
                        error={updateAccessRightsState.errorMessage}
                    />
                );
            case DialogsId.ADD_NEW_FILTER:
                return (
                    <FilterCreationDialog
                        open={true}
                        onClose={handleCloseDialog}
                    />
                );
            case DialogsId.ADD_NEW_CASE:
                return (
                    <CreateCaseDialog open={true} onClose={handleCloseDialog} />
                );
            case DialogsId.STASHED_ELEMENTS:
                return (
                    <StashedElementsDialog
                        open
                        onClose={handleCloseDialog}
                        stashedElements={stashedElements}
                        onStashedElementChange={handleGetStashedElement}
                        activeDirectory={directory}
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
                    {...others}
                    menuItems={buildMenu()}
                    open={open && !hideMenu}
                    onClose={onClose}
                />
            )}
            {renderDialog()}
        </>
    );
};

DirectoryTreeContextualMenu.propTypes = {
    onClose: PropTypes.func,
};

export default DirectoryTreeContextualMenu;
