import React, { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useIntl, FormattedMessage } from 'react-intl';

import DeleteIcon from '@material-ui/icons/Delete';
import FolderSpecialIcon from '@material-ui/icons/FolderSpecial';
import CreateNewFolderIcon from '@material-ui/icons/CreateNewFolder';
import BuildIcon from '@material-ui/icons/Build';
import AddIcon from '@material-ui/icons/Add';
import CreateIcon from '@material-ui/icons/Create';

import CreateStudyForm from '../create-study-form';
import CreateContingencyListForm from '../create-contingency-list-form';
import CreateDirectoryDialog from '../dialogs/create-directory-dialog';
import RenameDialog from '../dialogs/rename-dialog';
import AccessRightsDialog from '../dialogs/access-rights-dialog';
import DeleteDialog from '../dialogs/delete-dialog';
import CreateFilterDialog from '../create-filter-form';

import {
    insertDirectory,
    insertRootDirectory,
    deleteElement,
    updateAccessRights,
    renameElement,
} from '../../utils/rest-api';

const DialogsId = {
    ADD_ROOT_DIRECTORY: 'add_root_directory',
    ADD_DIRECTORY: 'add_directory',
    ADD_NEW_STUDY: 'add_new_study',
    ADD_NEW_CONTINGENCY_LIST: 'add_new_contingency_list',
    ADD_NEW_FILTER: 'add_new_filter',
    RENAME: 'rename',
    DELETE: 'delete',
    ACCESS_RIGHTS: 'access_rights',

    NONE: 'none',
};

const DirectoryTreeContextualMenuController = (props) => {
    const { directory, open, onClose, children } = props;
    const userId = useSelector((state) => state.user.profile.sub);

    const intl = useIntl();

    const [openDialog, setOpenDialog] = useState(null);
    const [lastError, setLastError] = React.useState('');
    const [hideMenu, setHideMenu] = useState(false);

    const handleOpenDialog = (DialogId) => {
        setOpenDialog(DialogId);
    };

    const handleCloseDialog = (e, nextSelectedDirectoryId = null) => {
        onClose(e, nextSelectedDirectoryId);
        setOpenDialog(DialogsId.NONE);
        setLastError('');
        setHideMenu(false);
    };

    /* Handle Dialogs actions */
    function insertNewDirectory(directoryName, isPrivate) {
        insertDirectory(
            directoryName,
            directory?.elementUuid,
            isPrivate,
            userId
        ).then((newDir) => {
            handleCloseDialog(null, newDir.elementUuid);
        });
    }

    function insertNewRootDirectory(directoryName, isPrivate) {
        insertRootDirectory(directoryName, isPrivate, userId).then((newDir) => {
            handleCloseDialog(null, newDir.elementUuid);
        });
    }

    function deleteSelectedDirectory() {
        deleteElement(directory?.elementUuid).then((r) => {
            if (r.ok) {
                handleCloseDialog(null, directory.parentUuid);
            }
            if (r.status === 403) {
                setLastError(
                    intl.formatMessage({ id: 'deleteDirectoryError' })
                );
            }
        });
    }

    function changeSelectedDirectoryAccessRights(isPrivate) {
        updateAccessRights(directory?.elementUuid, isPrivate).then((r) => {
            if (r.status === 403) {
                setLastError(
                    intl.formatMessage({
                        id: 'modifyDirectoryAccessRightsError',
                    })
                );
            }
            if (r.ok) {
                handleCloseDialog(null, null);
            }
        });
    }

    function renameSelectedDirectory(newName) {
        renameElement(directory?.elementUuid, newName).then((r) => {
            if (r.status === 403) {
                setLastError(
                    intl.formatMessage({
                        id: 'renameDirectoryError',
                    })
                );
            }
            if (r.ok) {
                handleCloseDialog(null, null);
            }
        });
    }

    // utils

    // Allowance
    const showMenuFromEmptyZone = useCallback(() => {
        return !directory;
    }, [directory]);

    const isAllowed = useCallback(() => {
        return directory && directory.owner === userId;
    }, [directory, userId]);

    const renderMenu = () => {
        // build menuItems here
        let menuItems = [];

        if (!showMenuFromEmptyZone()) {
            menuItems.push({
                messageDescriptorId: 'createNewStudy',
                callback: () => {
                    setHideMenu(true);
                    handleOpenDialog(DialogsId.ADD_NEW_STUDY);
                },
                icon: <AddIcon fontSize="small" />,
            });

            menuItems.push({
                messageDescriptorId: 'createNewContingencyList',
                callback: () => {
                    setHideMenu(true);
                    handleOpenDialog(DialogsId.ADD_NEW_CONTINGENCY_LIST);
                },
                icon: <AddIcon fontSize="small" />,
            });

            menuItems.push({
                messageDescriptorId: 'createNewFilter',
                callback: () => {
                    setHideMenu(true);
                    handleOpenDialog(DialogsId.ADD_NEW_FILTER);
                },
                icon: <AddIcon fontSize="small" />,
            });

            menuItems.push({ isDivider: true });

            if (isAllowed()) {
                menuItems.push({
                    messageDescriptorId: 'renameFolder',
                    callback: () => {
                        setHideMenu(true);
                        handleOpenDialog(DialogsId.RENAME);
                    },
                    icon: <CreateIcon fontSize="small" />,
                });

                menuItems.push({
                    messageDescriptorId: 'accessRights',
                    callback: () => {
                        setHideMenu(true);
                        handleOpenDialog(DialogsId.ACCESS_RIGHTS);
                    },
                    icon: <BuildIcon fontSize="small" />,
                });

                menuItems.push({
                    messageDescriptorId: 'deleteFolder',
                    callback: () => {
                        setHideMenu(true);
                        handleOpenDialog(DialogsId.DELETE);
                    },
                    icon: <DeleteIcon fontSize="small" />,
                });
                menuItems.push({ isDivider: true });
            }

            menuItems.push({
                messageDescriptorId: 'createFolder',
                callback: () => {
                    setHideMenu(true);
                    handleOpenDialog(DialogsId.ADD_DIRECTORY);
                },
                icon: <CreateNewFolderIcon fontSize="small" />,
            });
        }

        menuItems.push({
            messageDescriptorId: 'createRootFolder',
            callback: () => {
                setHideMenu(true);
                handleOpenDialog(DialogsId.ADD_ROOT_DIRECTORY);
            },
            icon: <FolderSpecialIcon fontSize="small" />,
        });

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
            {/** Dialogs **/}
            <CreateStudyForm
                open={openDialog === DialogsId.ADD_NEW_STUDY}
                onClose={handleCloseDialog}
            />
            <CreateContingencyListForm
                open={openDialog === DialogsId.ADD_NEW_CONTINGENCY_LIST}
                onClose={handleCloseDialog}
            />
            <CreateDirectoryDialog
                message={''}
                open={openDialog === DialogsId.ADD_DIRECTORY}
                onClick={insertNewDirectory}
                onClose={handleCloseDialog}
                title={intl.formatMessage({
                    id: 'insertNewDirectoryDialogTitle',
                })}
                error={''}
            />
            <CreateDirectoryDialog
                message={''}
                open={openDialog === DialogsId.ADD_ROOT_DIRECTORY}
                onClick={insertNewRootDirectory}
                onClose={handleCloseDialog}
                title={intl.formatMessage({
                    id: 'insertNewRootDirectoryDialogTitle',
                })}
                error={''}
            />
            <RenameDialog
                message={''}
                currentName={directory?.elementName}
                open={openDialog === DialogsId.RENAME}
                onClick={renameSelectedDirectory}
                onClose={handleCloseDialog}
                title={intl.formatMessage({
                    id: 'renameDirectoryDialogTitle',
                })}
                error={lastError}
            />
            <DeleteDialog
                items={directory ? [directory] : []}
                multipleDeleteFormatMessageId={
                    'deleteMultipleDirectoriesDialogMessage'
                }
                simpleDeleteFormatMessageId={'deleteDirectoryDialogMessage'}
                open={openDialog === DialogsId.DELETE}
                onClick={deleteSelectedDirectory}
                onClose={handleCloseDialog}
                error={lastError}
            />
            <AccessRightsDialog
                message={''}
                isPrivate={directory?.accessRights.private}
                open={openDialog === DialogsId.ACCESS_RIGHTS}
                onClick={changeSelectedDirectoryAccessRights}
                onClose={handleCloseDialog}
                title={intl.formatMessage({
                    id: 'accessRights',
                })}
                error={lastError}
            />
            <CreateFilterDialog
                open={openDialog === DialogsId.ADD_NEW_FILTER}
                onClose={handleCloseDialog}
                title={<FormattedMessage id="createNewFilter" />}
                inputLabelText={<FormattedMessage id="FilterName" />}
                customTextValidationBtn={<FormattedMessage id="create" />}
                customTextCancelBtn={<FormattedMessage id="cancel" />}
            />
        </>
    );
};

DirectoryTreeContextualMenuController.propTypes = {
    onClose: PropTypes.func,
};

export default DirectoryTreeContextualMenuController;
