/*
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import FileCopyIcon from '@mui/icons-material/FileCopy';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DeleteIcon from '@mui/icons-material/Delete';
import GetAppIcon from '@mui/icons-material/GetApp';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import PhotoLibrary from '@mui/icons-material/PhotoLibrary';

import ExportDialog from '../dialogs/export-dialog';
import RenameDialog from '../dialogs/rename-dialog';
import DeleteDialog from '../dialogs/delete-dialog';
import FormContingencyDialog from '../dialogs/form-contingency-dialog';
import ScriptDialog from '../dialogs/script-dialog';
import ReplaceWithScriptDialog from '../dialogs/replace-with-script-dialog';
import CopyToScriptDialog from '../dialogs/copy-to-script-dialog';
import GenericFilterDialog from '../dialogs/generic-filter-dialog';
import CreateStudyDialog from '../dialogs/create-study-dialog';

import { DialogsId } from '../../utils/UIconstants';

import {
    deleteElement,
    moveElementToDirectory,
    newScriptFromFilter,
    newScriptFromFiltersContingencyList,
    renameElement,
    replaceFiltersWithScript,
    replaceFormContingencyListWithScript,
} from '../../utils/rest-api';

import {
    ContingencyListType,
    ElementType,
    FilterType,
} from '../../utils/elementType';

import CommonContextualMenu from './common-contextual-menu';
import {
    useDeferredFetch,
    useMultipleDeferredFetch,
} from '../../utils/custom-hooks';
import { useSnackbar } from 'notistack';
import MoveDialog from '../dialogs/move-dialog';

const ContentContextualMenu = (props) => {
    const {
        activeElement,
        selectedElements,
        open,
        onClose,
        openDialog,
        setOpenDialog,
        ...others
    } = props;
    const userId = useSelector((state) => state.user.profile.sub);
    const intl = useIntl();
    const { enqueueSnackbar } = useSnackbar();

    const DownloadIframe = 'downloadIframe';

    const selectedDirectory = useSelector((state) => state.selectedDirectory);
    const [hideMenu, setHideMenu] = useState(false);

    const handleLastError = useCallback(
        (message) => {
            enqueueSnackbar(message, {
                variant: 'error',
            });
        },
        [enqueueSnackbar]
    );

    const handleOpenDialog = (dialogId) => {
        setHideMenu(true);
        setOpenDialog(dialogId);
    };

    const handleCloseDialog = useCallback(() => {
        onClose();
        setOpenDialog(DialogsId.NONE);
        setHideMenu(false);
    }, [onClose, setOpenDialog]);

    const handleClickExportStudy = (url) => {
        window.open(url, DownloadIframe);
        handleCloseDialog();
    };
    const [multipleDeleteError, setMultipleDeleteError] = useState('');

    const deleteElementOnError = useCallback(
        (errorMessages, params, paramsOnErrors) => {
            let msg = intl.formatMessage(
                { id: 'deleteElementsFailure' },
                {
                    pbn: errorMessages.length,
                    stn: params.length,
                    problematic: paramsOnErrors
                        .map((p) => p.elementUuid)
                        .join(' '),
                }
            );
            console.debug(msg);
            setMultipleDeleteError(msg);
        },
        [intl]
    );
    const [deleteCB] = useMultipleDeferredFetch(
        deleteElement,
        handleCloseDialog,
        undefined,
        deleteElementOnError,
        false
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

    const [renameCB, renameState] = useDeferredFetch(
        renameElement,
        handleCloseDialog,
        (HTTPStatusCode) => {
            if (HTTPStatusCode === 403) {
                return intl.formatMessage({
                    id: 'renameElementNotAllowedError',
                });
            } else if (HTTPStatusCode === 404) {
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

    // Allowance
    const isUserAllowed = useCallback(() => {
        return selectedElements.every((el) => {
            return el.owner === userId;
        });
    }, [selectedElements, userId]);

    const allowsDelete = useCallback(() => {
        return isUserAllowed();
    }, [isUserAllowed]);

    const allowsRename = useCallback(() => {
        return selectedElements.length === 1 && isUserAllowed();
    }, [isUserAllowed, selectedElements]);

    const allowsExport = useCallback(() => {
        return (
            selectedElements.length === 1 &&
            selectedElements[0].type === ElementType.STUDY
        );
    }, [selectedElements]);

    const allowsMove = useCallback(() => {
        return (
            selectedElements.every(
                (element) => element.type !== ElementType.DIRECTORY
            ) && isUserAllowed()
        );
    }, [isUserAllowed, selectedElements]);

    const allowsCreateNewStudyFromCase = useCallback(() => {
        return (
            selectedElements.length === 1 &&
            selectedElements[0].type === ElementType.CASE
        );
    }, [selectedElements]);

    const allowsCopyContingencyToScript = useCallback(() => {
        return (
            selectedElements.length === 1 &&
            selectedElements[0].type === ElementType.CONTINGENCY_LIST &&
            selectedElements[0].subtype === ContingencyListType.FORM
        );
    }, [selectedElements]);

    const allowsReplaceContingencyWithScript = useCallback(() => {
        return (
            selectedElements.length === 1 &&
            selectedElements[0].type === ElementType.CONTINGENCY_LIST &&
            selectedElements[0].subtype === ContingencyListType.FORM &&
            isUserAllowed()
        );
    }, [isUserAllowed, selectedElements]);

    const allowsCopyFilterToScript = useCallback(() => {
        return (
            selectedElements.length === 1 &&
            selectedElements[0].type === ElementType.FILTER &&
            selectedElements[0].subtype !== FilterType.SCRIPT
        );
    }, [selectedElements]);

    const allowsReplaceFilterWithScript = useCallback(() => {
        return (
            selectedElements.length === 1 &&
            selectedElements[0].type === ElementType.FILTER &&
            selectedElements[0].subtype !== FilterType.SCRIPT &&
            isUserAllowed()
        );
    }, [isUserAllowed, selectedElements]);

    const getActiveContingencyScriptId = () => {
        if (
            activeElement?.type === ElementType.CONTINGENCY_LIST &&
            activeElement?.subtype === ContingencyListType.SCRIPT
        ) {
            return activeElement.elementUuid;
        } else {
            return null;
        }
    };

    const getActiveContingencyFormId = () => {
        if (
            activeElement?.type === ElementType.CONTINGENCY_LIST &&
            activeElement?.subtype === ContingencyListType.FORM
        ) {
            return activeElement.elementUuid;
        } else {
            return null;
        }
    };

    const getActiveFilterScriptId = () => {
        if (
            activeElement?.type === ElementType.FILTER &&
            activeElement?.subtype === FilterType.SCRIPT
        ) {
            return activeElement.elementUuid;
        } else {
            return null;
        }
    };

    const getActiveFilterFormId = () => {
        if (
            activeElement?.type === ElementType.FILTER &&
            activeElement?.subtype === FilterType.FORM
        ) {
            return activeElement.elementUuid;
        } else {
            return null;
        }
    };

    const buildMenu = () => {
        if (selectedElements.length === 0) return;

        // build menuItems here
        let menuItems = [];

        if (allowsRename()) {
            menuItems.push({
                messageDescriptorId: 'rename',
                callback: () => {
                    handleOpenDialog(DialogsId.RENAME);
                },
            });
        }

        if (allowsExport()) {
            menuItems.push({
                messageDescriptorId: 'export',
                callback: () => {
                    handleOpenDialog(DialogsId.EXPORT);
                },
                icon: <GetAppIcon fontSize="small" />,
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
                    handleOpenDialog(
                        DialogsId.COPY_FILTER_TO_SCRIPT_CONTINGENCY
                    );
                },
                icon: <FileCopyIcon fontSize="small" />,
            });
        }

        if (allowsReplaceContingencyWithScript()) {
            menuItems.push({
                messageDescriptorId: 'replaceWithScript',
                callback: () => {
                    handleOpenDialog(
                        DialogsId.REPLACE_FILTER_BY_SCRIPT_CONTINGENCY
                    );
                },
                icon: <InsertDriveFileIcon fontSize="small" />,
            });
        }

        if (allowsCopyFilterToScript()) {
            menuItems.push({ isDivider: true });
            menuItems.push({
                messageDescriptorId: 'copyToScript',
                callback: () => {
                    handleOpenDialog(DialogsId.COPY_FILTER_TO_SCRIPT);
                },
                icon: <FileCopyIcon fontSize="small" />,
            });
        }

        if (allowsReplaceFilterWithScript()) {
            menuItems.push({
                messageDescriptorId: 'replaceWithScript',
                callback: () => {
                    handleOpenDialog(DialogsId.REPLACE_FILTER_BY_SCRIPT);
                },
                icon: <InsertDriveFileIcon fontSize="small" />,
            });
        }
        return menuItems;
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
            {/** Dialogs **/}
            <RenameDialog
                open={openDialog === DialogsId.RENAME}
                onClose={handleCloseDialog}
                onClick={(elementName) =>
                    renameCB(activeElement?.elementUuid, elementName)
                }
                title={useIntl().formatMessage({ id: 'renameElement' })}
                message={useIntl().formatMessage({ id: 'renameElementMsg' })}
                currentName={activeElement ? activeElement.elementName : ''}
                error={renameState.errorMessage}
            />
            <DeleteDialog
                open={openDialog === DialogsId.DELETE}
                onClose={handleCloseDialog}
                onClick={() =>
                    deleteCB(
                        selectedElements.map((e) => {
                            return [e.elementUuid];
                        })
                    )
                }
                items={selectedElements}
                multipleDeleteFormatMessageId={
                    'deleteMultipleItemsDialogMessage'
                }
                simpleDeleteFormatMessageId={'deleteItemDialogMessage'}
                error={multipleDeleteError}
            />
            <MoveDialog
                open={openDialog === DialogsId.MOVE}
                onClose={(selectedDir) => {
                    if (selectedDir.length > 0) {
                        moveCB(
                            selectedElements.map((element) => {
                                return [element.elementUuid, selectedDir[0].id];
                            })
                        );
                    }
                    handleCloseDialog();
                }}
                items={selectedElements}
            />
            <ExportDialog
                open={openDialog === DialogsId.EXPORT}
                onClose={handleCloseDialog}
                onClick={handleClickExportStudy}
                studyUuid={activeElement ? activeElement.elementUuid : ''}
                title={useIntl().formatMessage({ id: 'exportNetwork' })}
            />
            <FormContingencyDialog
                listId={getActiveContingencyFormId()}
                open={openDialog === DialogsId.FILTERS_CONTINGENCY}
                onClose={handleCloseDialog}
                onError={handleLastError}
                title={useIntl().formatMessage({ id: 'editContingencyList' })}
            />
            <ScriptDialog
                id={getActiveContingencyScriptId()}
                open={openDialog === DialogsId.SCRIPT_CONTINGENCY}
                onClose={handleCloseDialog}
                onError={handleLastError}
                title={useIntl().formatMessage({ id: 'editContingencyList' })}
                type={ElementType.CONTINGENCY_LIST}
            />
            <ScriptDialog
                id={getActiveFilterScriptId()}
                open={openDialog === DialogsId.SCRIPT}
                onClose={handleCloseDialog}
                onError={handleLastError}
                title={useIntl().formatMessage({ id: 'editFilterScript' })}
                type={ElementType.FILTER}
            />
            <ReplaceWithScriptDialog
                id={activeElement ? activeElement.elementUuid : ''}
                open={
                    openDialog ===
                    DialogsId.REPLACE_FILTER_BY_SCRIPT_CONTINGENCY
                }
                onClose={handleCloseDialog}
                onClick={(id) =>
                    replaceFormContingencyListWithScriptCB(
                        id,
                        selectedDirectory?.elementUuid
                    )
                }
                onError={handleLastError}
                title={useIntl().formatMessage({ id: 'replaceList' })}
            />
            <CopyToScriptDialog
                id={activeElement ? activeElement.elementUuid : ''}
                open={
                    openDialog === DialogsId.COPY_FILTER_TO_SCRIPT_CONTINGENCY
                }
                onClose={handleCloseDialog}
                onClick={(id, newName) =>
                    newScriptFromFiltersContingencyListCB(
                        id,
                        newName,
                        selectedDirectory?.elementUuid
                    )
                }
                currentName={activeElement ? activeElement.elementName : ''}
                title={useIntl().formatMessage({ id: 'copyToScriptList' })}
            />
            <ReplaceWithScriptDialog
                id={activeElement ? activeElement.elementUuid : ''}
                open={openDialog === DialogsId.REPLACE_FILTER_BY_SCRIPT}
                onClose={handleCloseDialog}
                onClick={(id) =>
                    FiltersReplaceWithScriptCB(
                        id,
                        selectedDirectory?.elementUuid
                    )
                }
                title={useIntl().formatMessage({ id: 'replaceList' })}
            />
            <CopyToScriptDialog
                id={activeElement ? activeElement.elementUuid : ''}
                open={openDialog === DialogsId.COPY_FILTER_TO_SCRIPT}
                onClose={handleCloseDialog}
                onClick={(id, newName) =>
                    newScriptFromFilterCB(
                        id,
                        newName,
                        selectedDirectory?.elementUuid
                    )
                }
                currentName={activeElement ? activeElement.elementName : ''}
                title={useIntl().formatMessage({ id: 'copyToScriptList' })}
            />
            <GenericFilterDialog
                id={getActiveFilterFormId()}
                open={openDialog === DialogsId.GENERIC_FILTER}
                onClose={handleCloseDialog}
                onError={handleLastError}
                title={useIntl().formatMessage({ id: 'editFilter' })}
            />

            <CreateStudyDialog
                open={openDialog === DialogsId.ADD_NEW_STUDY_FROM_CASE}
                onClose={handleCloseDialog}
                providedCase={activeElement}
            />

            <iframe
                id={DownloadIframe}
                name={DownloadIframe}
                title={DownloadIframe}
                style={{ display: 'none' }}
            />
        </>
    );
};

ContentContextualMenu.propTypes = {
    onClose: PropTypes.func,
};

export default ContentContextualMenu;
