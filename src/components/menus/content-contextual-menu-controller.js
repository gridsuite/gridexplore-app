import React, { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import FileCopyIcon from '@material-ui/icons/FileCopy';
import InsertDriveFileIcon from '@material-ui/icons/InsertDriveFile';
import BuildIcon from '@material-ui/icons/Build';
import DeleteIcon from '@material-ui/icons/Delete';
import GetAppIcon from '@material-ui/icons/GetApp';

import ExportDialog from '../dialogs/export-dialog';
import RenameDialog from '../dialogs/rename-dialog';
import DeleteDialog from '../dialogs/delete-dialog';
import AccessRightsDialog from '../dialogs/access-rights-dialog';
import FormContingencyDialog from '../dialogs/form-contingency-dialog';
import ScriptDialog from '../dialogs/script-dialog';
import ReplaceWithScriptDialog from '../dialogs/replace-with-script-dialog';
import CopyToScriptDialog from '../dialogs/copy-to-script-dialog';
import GenericFilterDialog from '../dialogs/generic-filter-dialog';

import {
    deleteElement,
    newScriptFromFilter,
    newScriptFromFiltersContingencyList,
    renameElement,
    replaceFiltersWithScript,
    replaceFormContingencyListWithScript,
    updateAccessRights,
} from '../../utils/rest-api';

import {
    ContingencyListType,
    ElementType,
    FilterType,
} from '../../utils/elementType';

import { useSnackbar } from 'notistack';

const DialogsId = {
    RENAME: 'rename',
    DELETE: 'delete',
    ACCESS_RIGHTS: 'access_rights',
    EXPORT: 'export',
    FILTERS_CONTINGENCY: 'filters_contingency',
    SCRIPT_CONTINGENCY: 'script_contingency',
    SCRIPT: 'script',
    REPLACE_FILTER_BY_SCRIPT_CONTINGENCY:
        'replace_filter_by_script_contingency',
    COPY_FILTER_TO_SCRIPT_CONTINGENCY: 'copy_filter_to_script_contingency',
    REPLACE_FILTER_BY_SCRIPT: 'replace_filter_by_script',
    COPY_FILTER_TO_SCRIPT: 'copy_filter_to_script',
    GENERIC_FILTER: 'generic_filter',
    NONE: 'none',
};

const ContentContextualMenuController = (props) => {
    const {
        directory,
        activeElement,
        selectedElements,
        open,
        onClose,
        children,
    } = props;
    const userId = useSelector((state) => state.user.profile.sub);
    const intl = useIntl();
    const { enqueueSnackbar } = useSnackbar();

    const DownloadIframe = 'downloadIframe';

    const [openDialog, setOpenDialog] = useState(null);
    const [lastError, setLastError] = React.useState('');
    const [hideMenu, setHideMenu] = useState(false);

    const handleLastError = useCallback(
        (message) => {
            enqueueSnackbar(message, {
                variant: 'error',
            });
        },
        [enqueueSnackbar]
    );

    const handleOpenDialog = (DialogId) => {
        setOpenDialog(DialogId);
    };

    const handleCloseDialog = () => {
        onClose();
        setOpenDialog(DialogsId.NONE);
        setLastError('');
        setHideMenu(false);
    };

    const handleClickRenameElement = (newElementNameValue) => {
        renameElement(activeElement.elementUuid, newElementNameValue)
            .then((response) => {
                if (response.status === 403) {
                    // == FORBIDDEN
                    setLastError(
                        intl.formatMessage({
                            id: 'renameElementNotAllowedError',
                        })
                    );
                } else if (response.status === 404) {
                    // == NOT FOUND
                    setLastError(
                        intl.formatMessage({ id: 'renameElementNotFoundError' })
                    );
                } else {
                    handleCloseDialog();
                }
            })
            .catch((e) => {
                setLastError(e.message || e);
            });
    };

    const handleClickDeleteElement = () => {
        let notDeleted = [];
        let doneChildren = [];
        for (let child of selectedElements) {
            deleteElement(child.elementUuid).then((response) => {
                doneChildren.push(child);
                if (!response.ok) {
                    notDeleted.push(child.elementName);
                }

                if (doneChildren.length === selectedElements.length) {
                    if (notDeleted.length === 0) {
                        handleCloseDialog();
                    } else {
                        let msg = intl.formatMessage(
                            { id: 'deleteElementsFailure' },
                            {
                                pbn: notDeleted.length,
                                stn: selectedElements.length,
                                problematic: notDeleted.join(' '),
                            }
                        );
                        console.warn(msg);
                        setLastError(msg);
                    }
                }
            });
        }
    };

    const handleClickExportStudy = (url) => {
        window.open(url, DownloadIframe);
        handleCloseDialog();
    };

    const handleClickElementAccessRights = (selected) => {
        updateAccessRights(activeElement.elementUuid, selected).then(
            (response) => {
                if (response.status === 403) {
                    setLastError(
                        intl.formatMessage({
                            id: 'modifyAccessRightsNotAllowedError',
                        })
                    );
                } else if (response.status === 404) {
                    setLastError(
                        intl.formatMessage({
                            id: 'modifyAccessRightsNotFoundError',
                        })
                    );
                } else {
                    handleCloseDialog();
                }
            }
        );
    };

    const handleClickFiltersReplaceWithScript = (a_id) => {
        replaceFiltersWithScript(a_id, directory.elementUuid)
            .then()
            .catch((error) => handleLastError(error.message));
        handleCloseDialog();
    };
    const handleClickContingencyCopyToScript = (a_id, newNameValue) => {
        newScriptFromFiltersContingencyList(
            a_id,
            newNameValue,
            directory.elementUuid
        )
            .then()
            .catch((error) => handleLastError(error.message));
        handleCloseDialog();
    };

    const handleClickFiltersContingencyReplaceWithScript = (a_id) => {
        replaceFormContingencyListWithScript(a_id, directory.elementUuid)
            .then()
            .catch((error) => handleLastError(error.message));
        handleCloseDialog();
    };

    const handleClickFilterCopyToScript = (a_id, newNameValue) => {
        newScriptFromFilter(a_id, newNameValue, directory.elementUuid)
            .then()
            .catch((error) => handleLastError(error.message));
        handleCloseDialog();
    };

    // utils
    const areSelectedElementsAllPrivate = () => {
        if (!selectedElements || selectedElements.length === 0)
            return undefined;
        let priv = selectedElements.filter(
            (child) => child.accessRights.private
        );
        if (!priv || priv.length === 0) return false;
        if (priv.length === selectedElements.length) return true;

        return undefined;
    };

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

    const allowsPublishability = useCallback(() => {
        return isUserAllowed();
    }, [isUserAllowed]);

    const allowsExport = useCallback(() => {
        return (
            selectedElements.length === 1 &&
            selectedElements[0].type === ElementType.STUDY
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
            return '';
        }
    };

    const getActiveContingencyFormId = () => {
        if (
            activeElement?.type === ElementType.CONTINGENCY_LIST &&
            activeElement?.subtype === ContingencyListType.FORM
        ) {
            return activeElement.elementUuid;
        } else {
            return '';
        }
    };

    const getActiveFilterScriptId = () => {
        if (
            activeElement?.type === ElementType.FILTER &&
            activeElement?.subtype === FilterType.SCRIPT
        ) {
            return activeElement.elementUuid;
        } else {
            return '';
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

    const renderMenu = () => {
        if (selectedElements.length === 0) return;

        // build menuItems here
        let menuItems = [];

        if (allowsRename()) {
            menuItems.push({
                messageDescriptorId: 'rename',
                callback: () => {
                    setHideMenu(true);
                    handleOpenDialog(DialogsId.RENAME);
                },
            });
        }

        if (allowsPublishability()) {
            menuItems.push({
                messageDescriptorId: 'accessRights',
                callback: () => {
                    setHideMenu(true);
                    handleOpenDialog(DialogsId.ACCESS_RIGHTS);
                },
                icon: <BuildIcon fontSize="small" />,
            });
        }

        if (allowsExport()) {
            menuItems.push({
                messageDescriptorId: 'export',
                callback: () => {
                    setHideMenu(true);
                    handleOpenDialog(DialogsId.EXPORT);
                },
                icon: <GetAppIcon fontSize="small" />,
            });
        }

        if (allowsDelete()) {
            menuItems.push({
                messageDescriptorId: 'delete',
                callback: () => {
                    setHideMenu(true);
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
                    setHideMenu(true);
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
                    setHideMenu(true);
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
                    setHideMenu(true);
                    handleOpenDialog(DialogsId.COPY_FILTER_TO_SCRIPT);
                },
                icon: <FileCopyIcon fontSize="small" />,
            });
        }

        if (allowsReplaceFilterWithScript()) {
            menuItems.push({
                messageDescriptorId: 'replaceWithScript',
                callback: () => {
                    setHideMenu(true);
                    handleOpenDialog(DialogsId.REPLACE_FILTER_BY_SCRIPT);
                },
                icon: <InsertDriveFileIcon fontSize="small" />,
            });
        }

        if (menuItems.length !== 0) {
            return React.Children.map(children, (child) => {
                return React.cloneElement(child, {
                    menuItems: menuItems,
                    open: open && !hideMenu,
                    onClose: onClose,
                });
            });
        } else {
            return;
        }
    };

    return (
        <>
            {open && renderMenu()}
            <RenameDialog
                open={openDialog === DialogsId.RENAME}
                onClose={handleCloseDialog}
                onClick={handleClickRenameElement}
                title={useIntl().formatMessage({ id: 'renameElement' })}
                message={useIntl().formatMessage({ id: 'renameElementMsg' })}
                currentName={activeElement ? activeElement.elementName : ''}
                error={lastError}
            />
            <DeleteDialog
                open={openDialog === DialogsId.DELETE}
                onClose={handleCloseDialog}
                onClick={handleClickDeleteElement}
                items={selectedElements}
                multipleDeleteFormatMessageId={
                    'deleteMultipleItemsDialogMessage'
                }
                simpleDeleteFormatMessageId={'deleteItemDialogMessage'}
                error={lastError}
            />
            <ExportDialog
                open={openDialog === DialogsId.EXPORT}
                onClose={handleCloseDialog}
                onClick={handleClickExportStudy}
                studyUuid={activeElement ? activeElement.elementUuid : ''}
                title={useIntl().formatMessage({ id: 'exportNetwork' })}
            />
            <AccessRightsDialog
                open={openDialog === DialogsId.ACCESS_RIGHTS}
                onClose={handleCloseDialog}
                onClick={handleClickElementAccessRights}
                title={useIntl().formatMessage({ id: 'modifyAccessRights' })}
                isPrivate={areSelectedElementsAllPrivate()}
                error={lastError}
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
                onClick={handleClickFiltersContingencyReplaceWithScript}
                onError={handleLastError}
                title={useIntl().formatMessage({ id: 'replaceList' })}
            />
            <CopyToScriptDialog
                id={activeElement ? activeElement.elementUuid : ''}
                open={
                    openDialog === DialogsId.COPY_FILTER_TO_SCRIPT_CONTINGENCY
                }
                onClose={handleCloseDialog}
                onClick={handleClickContingencyCopyToScript}
                currentName={activeElement ? activeElement.elementName : ''}
                title={useIntl().formatMessage({ id: 'copyToScriptList' })}
            />
            <ReplaceWithScriptDialog
                id={activeElement ? activeElement.elementUuid : ''}
                open={openDialog === DialogsId.REPLACE_FILTER_BY_SCRIPT}
                onClose={handleCloseDialog}
                onClick={handleClickFiltersReplaceWithScript}
                title={useIntl().formatMessage({ id: 'replaceList' })}
            />
            <CopyToScriptDialog
                id={activeElement ? activeElement.elementUuid : ''}
                open={openDialog === DialogsId.COPY_FILTER_TO_SCRIPT}
                onClose={handleCloseDialog}
                onClick={handleClickFilterCopyToScript}
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
            <iframe
                id={DownloadIframe}
                name={DownloadIframe}
                title={DownloadIframe}
                style={{ display: 'none' }}
            />
        </>
    );
};

ContentContextualMenuController.propTypes = {
    onClose: PropTypes.func,
};

export default ContentContextualMenuController;
