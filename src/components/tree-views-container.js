/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useIntl, FormattedMessage } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import {
    setActiveDirectory,
    setCurrentChildren,
    setCurrentPath,
} from '../redux/actions';

import {
    connectNotificationsWsUpdateStudies,
    deleteElement,
    fetchDirectoryContent,
    fetchRootFolders,
    insertDirectory,
    insertRootDirectory,
    renameElement,
    updateAccessRights,
    createFilter,
} from '../utils/rest-api';

import DirectoryTreeView from './directory-tree-view';
import { updatedNodeStore, makePathFromTip } from '../utils/tree-updates';

import { displayErrorMessageWithSnackbar, useIntlRef } from '../utils/messages';
import { useSnackbar } from 'notistack';
import { elementType } from '../utils/elementType';
import { notificationType } from '../utils/notificationType';

import { withStyles } from '@material-ui/core/styles';

import * as constants from '../utils/UIconstants';
// Menu
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import DeleteIcon from '@material-ui/icons/Delete';
import FolderSpecialIcon from '@material-ui/icons/FolderSpecial';
import CreateNewFolderIcon from '@material-ui/icons/CreateNewFolder';
import BuildIcon from '@material-ui/icons/Build';
import AddIcon from '@material-ui/icons/Add';
import CreateIcon from '@material-ui/icons/Create';

// Dialogs
import CreateStudyForm from './create-study-form';
import CreateContingencyListForm from './create-contingency-list-form';
import { CreateDirectoryDialog } from './dialogs/create-directory-dialog';
import RenameDialog from './dialogs/rename-dialog';
import AccessRightsDialog from './dialogs/access-rights-dialog';
import DeleteDialog from './dialogs/delete-dialog';
import { CreateFilterDialog } from './create-filter-form';
import { ScriptTypes } from '../utils/script-types';

const StyledMenu = withStyles({
    paper: {
        border: '1px solid #d3d4d5',
    },
})((props) => <Menu elevation={0} getContentAnchorEl={null} {...props} />);

const initialMousePosition = {
    mouseX: null,
    mouseY: null,
};

const TreeViewsContainer = () => {
    const intl = useIntl();
    const intlRef = useIntlRef();
    const dispatch = useDispatch();

    const [nodeStore, setNodeStore] = useState({});

    const user = useSelector((state) => state.user);
    const selectedDirectory = useSelector((state) => {
        return !state.currentPath || state.currentPath.length === 0
            ? null
            : state.currentPath[state.currentPath.length - 1].elementUuid;
    });
    const activeDirectory = useSelector((state) => state.activeDirectory);
    const userId = useSelector((state) => state.user.profile.sub);

    const currentEdit = useRef(null);

    const selectedDirectoryRef = useRef({});
    selectedDirectoryRef.current = selectedDirectory;

    const [DOMFocusedDirectory, setDOMFocusedDirectory] = useState(null);

    const websocketExpectedCloseRef = useRef();

    const { enqueueSnackbar } = useSnackbar();

    /* Dialogs states */
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [openAddNewStudyDialog, setOpenAddNewStudyDialog] =
        React.useState(false);
    const [
        openAddNewContingencyListDialog,
        setOpenAddNewContingencyListDialog,
    ] = React.useState(false);
    const [openCreateNewDirectoryDialog, setOpenCreateNewDirectoryDialog] =
        React.useState(false);
    const [openDeleteDirectoryDialog, setOpenDeleteDirectoryDialog] =
        React.useState(false);
    const [openCreateRootDirectoryDialog, setOpenCreateRootDirectoryDialog] =
        React.useState(false);
    const [openRenameDirectoryDialog, setOpenRenameDirectoryDialog] =
        React.useState(false);
    const [
        openAccessRightsDirectoryDialog,
        setOpenAccessRightsDirectoryDialog,
    ] = React.useState(false);
    const [openPopupNewList, setOpenPopupNewList] = useState(false);

    const [accessRightsError, setAccessRightsError] = React.useState('');
    const [deleteError, setDeleteError] = React.useState('');
    const [renameError, setRenameError] = React.useState('');

    /* Menu states */
    const [mousePosition, setMousePosition] =
        React.useState(initialMousePosition);

    const [showMenuFromEmptyZone, setShowMenuFromEmptyZone] =
        React.useState(false);

    /* User interactions */
    const onContextMenu = useCallback(
        (event, nodeId) => {
            //to keep the focused style (that is normally lost when opening a contextual menu)
            event.currentTarget.parentNode.classList.add('focused');
            setDOMFocusedDirectory(event.currentTarget.parentNode);

            dispatch(setActiveDirectory(nodeId));

            setMousePosition({
                mouseX: event.clientX + constants.HORIZONTAL_SHIFT,
                mouseY: event.clientY + constants.VERTICAL_SHIFT,
            });
            /* open Contextual Menu in empty zone */
            if (!nodeId) {
                setShowMenuFromEmptyZone(true);
            } /* open Contextual Menu in a TreeViewItem */ else {
                setShowMenuFromEmptyZone(false);
            }
            handleOpenMenu(event);
        },
        [dispatch]
    );

    const handleOpenMenu = (event) => {
        setAnchorEl(event.currentTarget);
        event.stopPropagation();
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
        //so it removes the style that we added ourselves
        if (DOMFocusedDirectory !== null) {
            DOMFocusedDirectory.classList.remove('focused');
            setDOMFocusedDirectory(null);
        }
    };

    const handleOpenAddNewStudyDialog = () => {
        setAnchorEl(null);
        setOpenAddNewStudyDialog(true);
    };

    const handleOpenAddNewContingencyListDialog = () => {
        setAnchorEl(null);
        setOpenAddNewContingencyListDialog(true);
    };

    const handleOpenCreateNewDirectoryDialog = () => {
        setAnchorEl(null);
        setOpenCreateNewDirectoryDialog(true);
    };

    const handleOpenRenameDirectoryDialog = () => {
        setAnchorEl(null);
        setOpenRenameDirectoryDialog(true);
    };

    const handleCloseRenameDirectoryDialog = () => {
        setAnchorEl(null);
        setOpenRenameDirectoryDialog(false);
        setRenameError('');
    };

    const handleOpenCreateRootDirectoryDialog = () => {
        setAnchorEl(null);
        setOpenCreateRootDirectoryDialog(true);
    };

    const handleOpenDeleteDirectoryDialog = () => {
        setAnchorEl(null);
        setOpenDeleteDirectoryDialog(true);
    };

    const handleOpenAccessRightsDirectoryDialog = () => {
        setAnchorEl(null);
        setOpenAccessRightsDirectoryDialog(true);
    };

    const handleCloseAccessRightsDirectoryDialog = () => {
        setAnchorEl(null);
        setOpenAccessRightsDirectoryDialog(false);
        setAccessRightsError('');
    };

    const handleCloseDeleteDirectoryDialog = () => {
        setAnchorEl(null);
        setOpenDeleteDirectoryDialog(false);
        setDeleteError('');
    };

    const handleOpenAddNewFilter = () => {
        setAnchorEl(null);
        setOpenPopupNewList(true);
    };

    /* Handle Dialogs actions */

    function createDirectoryUnder(dirName, underDirUuid, isPrivate) {
        function whenDirCreated(newDir) {
            let nextNodeStore = updatedNodeStore(
                nodeStore,
                underDirUuid,
                [newDir],
                false
            );
            if (nextNodeStore) {
                let incredPath = makePathFromTip(
                    newDir.elementUuid,
                    nextNodeStore.allIdToNode
                );
                dispatch(setCurrentPath(incredPath));
                setNodeStore(nextNodeStore);
            }

            if (underDirUuid) setOpenCreateNewDirectoryDialog(false);
            else setOpenCreateRootDirectoryDialog(false);

            setSelectedDirectory(newDir.elementUuid, nextNodeStore.allIdToNode);
        }

        if (underDirUuid)
            insertDirectory(dirName, underDirUuid, isPrivate, userId).then(
                whenDirCreated
            );
        else
            insertRootDirectory(dirName, isPrivate, userId).then(
                whenDirCreated
            );
    }

    function insertNewDirectory(directoryName, isPrivate) {
        createDirectoryUnder(directoryName, activeDirectory, isPrivate, userId);
    }

    function insertNewRootDirectory(directoryName, isPrivate) {
        createDirectoryUnder(directoryName, null, isPrivate, userId);
    }

    function deleteSelectedDirectory() {
        deleteElement(activeDirectory).then((r) => {
            if (r.ok) {
                handleCloseDeleteDirectoryDialog();
                let parent = nodeStore.allIdToNode[activeDirectory].parentUuid;
                setSelectedDirectory(parent);
                dispatch(setActiveDirectory(null));
            }
            if (r.status === 403) {
                setDeleteError(
                    intl.formatMessage({ id: 'deleteDirectoryError' })
                );
            }
        });
    }

    function changeSelectedDirectoryAccessRights(isPrivate) {
        updateAccessRights(activeDirectory, isPrivate).then((r) => {
            if (r.status === 403) {
                setAccessRightsError(
                    intl.formatMessage({
                        id: 'modifyDirectoryAccessRightsError',
                    })
                );
            }
            if (r.ok) {
                setOpenAccessRightsDirectoryDialog(false);
            }
        });
    }

    function renameSelectedDirectory(newName) {
        renameElement(activeDirectory, newName).then((r) => {
            if (r.status === 403) {
                setRenameError(
                    intl.formatMessage({
                        id: 'renameDirectoryError',
                    })
                );
            }
            if (r.ok) {
                handleCloseRenameDirectoryDialog();
            }
        });
    }

    /* RootDirectories management */
    /* rootDirectories initialization */

    const updateRootDirectories = useCallback(() => {
        fetchRootFolders().then((data) => {
            let sortedData = [...data];
            sortedData.sort(function (a, b) {
                return a.elementName.localeCompare(b.elementName);
            });

            let nextNodeStore = updatedNodeStore(nodeStore, null, sortedData);
            if (nextNodeStore) setNodeStore(nextNodeStore);
        });
    }, [nodeStore]);
    useEffect(() => {
        if (user != null) {
            updateRootDirectories();
        }
    }, [user, updateRootDirectories]);

    /* currentChildren management */
    const updateCurrentChildren = useCallback(
        (children) => {
            dispatch(
                setCurrentChildren(
                    children
                        .filter((child) => child.type !== elementType.DIRECTORY)
                        .sort(function (a, b) {
                            return a.elementName.localeCompare(b.elementName);
                        })
                )
            );
        },
        [dispatch]
    );

    const updateDirectoryTreeAndContent = useCallback(
        (nodeId, mayThen) => {
            fetchDirectoryContent(nodeId).then((childrenToBeInserted) => {
                let nextNodeStore = updatedNodeStore(
                    nodeStore,
                    nodeId,
                    childrenToBeInserted
                );
                if (nextNodeStore) setNodeStore(nextNodeStore);

                if (mayThen) mayThen();
                updateCurrentChildren(childrenToBeInserted);
            });
        },
        [updateCurrentChildren, nodeStore]
    );

    const updateDirectoryTree = useCallback(
        (nodeId, mayThen) => {
            fetchDirectoryContent(nodeId).then((childrenToBeInserted) => {
                let nextNodeStore = updatedNodeStore(
                    nodeStore,
                    nodeId,
                    childrenToBeInserted
                );
                if (nextNodeStore) setNodeStore(nextNodeStore);

                if (mayThen) mayThen();
            });
        },
        [nodeStore]
    );

    /* Manage Studies updating with Web Socket */
    const displayErrorIfExist = useCallback(
        (error, studyName) => {
            if (error) {
                displayErrorMessageWithSnackbar({
                    errorMessage: error,
                    enqueueSnackbar: enqueueSnackbar,
                    headerMessage: {
                        headerMessageId: 'studyCreatingError',
                        headerMessageValues: { studyName: studyName },
                        intlRef: intlRef,
                    },
                });
            }
        },
        [enqueueSnackbar, intlRef]
    );

    const setSelectedDirectory = useCallback(
        (nodeId, mayMap) => {
            dispatch(
                setCurrentPath(
                    makePathFromTip(
                        nodeId,
                        mayMap ? mayMap : nodeStore.allIdToNode
                    )
                )
            );
        },
        [nodeStore, dispatch]
    );

    const connectNotificationsUpdateStudies = useCallback(() => {
        const ws = connectNotificationsWsUpdateStudies();
        ws.onmessage = function (event) {
            let eventData = JSON.parse(event.data);
            if (eventData.headers) {
                const notificationTypeHeader =
                    eventData.headers['notificationType'];
                const isRootDirectory = eventData.headers['isRootDirectory'];
                const directoryUuid = eventData.headers['directoryUuid'];
                const error = eventData.headers['error'];

                displayErrorIfExist(error);

                if (isRootDirectory) {
                    updateRootDirectories();
                    if (
                        notificationTypeHeader ===
                            notificationType.DELETE_DIRECTORY &&
                        selectedDirectoryRef.current === directoryUuid
                    ) {
                        setSelectedDirectory(null);
                    }
                    return;
                }

                if (directoryUuid) {
                    if (directoryUuid === selectedDirectoryRef.current) {
                        updateDirectoryTreeAndContent(directoryUuid);
                    } else {
                        updateDirectoryTree(directoryUuid);
                    }
                }
            }
        };
        ws.onclose = function () {
            if (!websocketExpectedCloseRef.current) {
                console.error('Unexpected Notification WebSocket closed');
            }
        };
        ws.onerror = function (event) {
            console.error('Unexpected Notification WebSocket error', event);
        };
        return ws;
    }, [
        displayErrorIfExist,
        updateDirectoryTreeAndContent,
        updateDirectoryTree,
        updateRootDirectories,
        setSelectedDirectory,
    ]);

    useEffect(() => {
        const ws = connectNotificationsUpdateStudies();
        // Note: dispatch doesn't change
        // cleanup at unmount event
        return function () {
            ws.close();
        };
    }, [connectNotificationsUpdateStudies]);

    /* Handle components synchronization */
    useEffect(() => {
        if (selectedDirectory) {
            updateDirectoryTreeAndContent(selectedDirectory);
        }
    }, [selectedDirectory, updateDirectoryTreeAndContent]);

    const isAllowed = () => {
        if (!activeDirectory || !nodeStore) return false;
        let dirNode = nodeStore.allIdToNode[activeDirectory];
        return dirNode && dirNode.owner === userId;
    };

    const newFilter = (name, type, isPrivate) => {
        const filterType = type === ScriptTypes.SCRIPT ? type : 'LINE';
        currentEdit.current = {
            name: name,
            type: filterType,
            transient: true,
        };
        createFilter(
            currentEdit.current,
            name,
            type,
            isPrivate,
            activeDirectory
        ).then();
    };

    const getActiveDirectory = () => {
        return nodeStore &&
            nodeStore.allIdToNode &&
            nodeStore.allIdToNode[activeDirectory]
            ? nodeStore.allIdToNode[activeDirectory].elementName
            : '';
    };

    return (
        <>
            <div
                style={{
                    height: '100%',
                }}
                onMouseDownCapture={(e) => {
                    if (e.button === constants.MOUSE_EVENT_RIGHT_BUTTON) {
                        handleCloseMenu();
                    }
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                    }}
                    onContextMenu={(e) => onContextMenu(e, null)}
                >
                    {nodeStore &&
                        nodeStore.byRootIdToNode &&
                        Object.entries(nodeStore.byRootIdToNode).map(
                            ([k, v]) => (
                                <DirectoryTreeView
                                    key={k}
                                    treeViewUuid={k}
                                    mapData={v}
                                    onContextMenu={onContextMenu}
                                    onDirectoryUpdate={updateDirectoryTree}
                                />
                            )
                        )}
                </div>
                <StyledMenu
                    id="case-menu"
                    anchorEl={anchorEl}
                    keepMounted
                    open={Boolean(anchorEl)}
                    onClose={handleCloseMenu}
                    anchorReference="anchorPosition"
                    anchorPosition={
                        mousePosition.mouseY !== null &&
                        mousePosition.mouseX !== null
                            ? {
                                  top: mousePosition.mouseY,
                                  left: mousePosition.mouseX,
                              }
                            : undefined
                    }
                >
                    {/* Directories Menu */}
                    {/*It is required here to build an array with the JSX items
                    we want to insert depending on isAllowed(). Building an
                    array fixes this material UI warning :
                    `warning: Material-UI: The Menu component doesn't accept a Fragment as
                    a child. Consider providing an array instead.'*/}
                    {!showMenuFromEmptyZone && [
                        <MenuItem
                            onClick={handleOpenAddNewStudyDialog}
                            key={'createNewStudy'}
                        >
                            <ListItemIcon style={{ minWidth: '25px' }}>
                                <AddIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                                primary={intl.formatMessage({
                                    id: 'createNewStudy',
                                })}
                            />
                        </MenuItem>,
                        <MenuItem
                            onClick={handleOpenAddNewContingencyListDialog}
                            key={'createNewContingencyList'}
                        >
                            <ListItemIcon style={{ minWidth: '25px' }}>
                                <AddIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                                primary={intl.formatMessage({
                                    id: 'createNewContingencyList',
                                })}
                            />
                        </MenuItem>,
                        <MenuItem
                            onClick={handleOpenAddNewFilter}
                            key={'createNewFilter'}
                        >
                            <ListItemIcon style={{ minWidth: '25px' }}>
                                <AddIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                                primary={intl.formatMessage({
                                    id: 'createNewFilter',
                                })}
                            />
                        </MenuItem>,
                        <hr key={'hr'} />,
                        /* A sub array is pushed as an element of the MenuItems array initiated above if isAllowed()=>true. The JSX spec allow to give the elements as an array with inner arrays of elements. */
                        isAllowed() && [
                            <MenuItem
                                onClick={handleOpenRenameDirectoryDialog}
                                key={'renameFolder'}
                            >
                                <ListItemIcon style={{ minWidth: '25px' }}>
                                    <CreateIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                    primary={intl.formatMessage({
                                        id: 'renameFolder',
                                    })}
                                />
                            </MenuItem>,

                            <MenuItem
                                onClick={handleOpenAccessRightsDirectoryDialog}
                                key={'accessRights'}
                            >
                                <ListItemIcon style={{ minWidth: '25px' }}>
                                    <BuildIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                    primary={intl.formatMessage({
                                        id: 'accessRights',
                                    })}
                                />
                            </MenuItem>,
                            <MenuItem
                                onClick={handleOpenDeleteDirectoryDialog}
                                key={'deleteFolder'}
                            >
                                <ListItemIcon style={{ minWidth: '25px' }}>
                                    <DeleteIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                    primary={intl.formatMessage({
                                        id: 'deleteFolder',
                                    })}
                                />
                            </MenuItem>,
                            <hr />,
                        ],
                        <MenuItem
                            onClick={handleOpenCreateNewDirectoryDialog}
                            key={'createFolder'}
                        >
                            <ListItemIcon style={{ minWidth: '25px' }}>
                                <CreateNewFolderIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                                primary={intl.formatMessage({
                                    id: 'createFolder',
                                })}
                            />
                        </MenuItem>,
                    ]}
                    <MenuItem
                        onClick={handleOpenCreateRootDirectoryDialog}
                        key={'createRootFolder'}
                    >
                        <ListItemIcon style={{ minWidth: '25px' }}>
                            <FolderSpecialIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                            primary={intl.formatMessage({
                                id: 'createRootFolder',
                            })}
                        />
                    </MenuItem>
                </StyledMenu>
            </div>

            {/** Dialogs **/}
            <CreateStudyForm
                open={openAddNewStudyDialog}
                setOpen={setOpenAddNewStudyDialog}
            />
            <CreateContingencyListForm
                open={openAddNewContingencyListDialog}
                setOpen={setOpenAddNewContingencyListDialog}
            />
            <CreateDirectoryDialog
                message={''}
                open={openCreateNewDirectoryDialog}
                onClick={insertNewDirectory}
                onClose={() => setOpenCreateNewDirectoryDialog(false)}
                title={intl.formatMessage({
                    id: 'insertNewDirectoryDialogTitle',
                })}
                error={''}
            />
            <CreateDirectoryDialog
                message={''}
                open={openCreateRootDirectoryDialog}
                onClick={insertNewRootDirectory}
                onClose={() => setOpenCreateRootDirectoryDialog(false)}
                title={intl.formatMessage({
                    id: 'insertNewRootDirectoryDialogTitle',
                })}
                error={''}
            />
            <RenameDialog
                message={''}
                currentName={getActiveDirectory().elementName}
                open={openRenameDirectoryDialog}
                onClick={renameSelectedDirectory}
                onClose={handleCloseRenameDirectoryDialog}
                title={intl.formatMessage({
                    id: 'renameDirectoryDialogTitle',
                })}
                error={renameError}
            />
            <DeleteDialog
                items={[getActiveDirectory()]}
                multipleDeleteFormatMessageId={
                    'deleteMultipleDirectoriesDialogMessage'
                }
                simpleDeleteFormatMessageId={'deleteDirectoryDialogMessage'}
                open={openDeleteDirectoryDialog}
                onClick={deleteSelectedDirectory}
                onClose={handleCloseDeleteDirectoryDialog}
                error={deleteError}
            />
            <AccessRightsDialog
                message={''}
                isPrivate={
                    nodeStore &&
                    nodeStore.allIdToNode &&
                    nodeStore.allIdToNode[activeDirectory] &&
                    nodeStore.allIdToNode[activeDirectory].accessRights.private
                }
                open={openAccessRightsDirectoryDialog}
                onClick={changeSelectedDirectoryAccessRights}
                onClose={handleCloseAccessRightsDirectoryDialog}
                title={intl.formatMessage({
                    id: 'accessRights',
                })}
                error={accessRightsError}
            />
            <CreateFilterDialog
                open={openPopupNewList}
                onClose={() => setOpenPopupNewList(false)}
                title={<FormattedMessage id="createNewFilter" />}
                inputLabelText={<FormattedMessage id="FilterName" />}
                customTextValidationBtn={<FormattedMessage id="create" />}
                customTextCancelBtn={<FormattedMessage id="cancel" />}
                action={({ name, type, isPrivate }) =>
                    newFilter(name, type, isPrivate)
                }
            />
        </>
    );
};

export default TreeViewsContainer;
