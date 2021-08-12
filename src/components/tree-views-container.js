/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import {
    setCurrentChildren,
    setSelectedDirectory,
    setCurrentPath,
} from '../redux/actions';

import {
    fetchDirectoryContent,
    fetchRootFolders,
    connectNotificationsWsUpdateStudies,
    insertDirectory,
    insertRootDirectory,
    deleteElement,
    updateAccessRights,
    renameElement,
} from '../utils/rest-api';

import DirectoryTreeView from './directory-tree-view';

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
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import FolderSpecialIcon from '@material-ui/icons/FolderSpecial';
import CreateNewFolderIcon from '@material-ui/icons/CreateNewFolder';
import BuildIcon from '@material-ui/icons/Build';
import AddIcon from '@material-ui/icons/Add';
import CreateIcon from '@material-ui/icons/Create';

// Dialogs
import CreateStudyForm from './create-study-form';
import { CreateDirectoryDialog } from './dialogs/create-directory-dialog';
import RenameDialog from './dialogs/rename-dialog';
import AccessRightsDialog from './dialogs/access-rights-dialog';
import DeleteDialog from './dialogs/delete-dialog';

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

    const [rootDirectories, setRootDirectories] = useState([]);
    const [mapData, setMapData] = useState();

    const user = useSelector((state) => state.user);
    const selectedDirectory = useSelector((state) => state.selectedDirectory);
    const userId = useSelector((state) => state.user.profile.sub);

    const mapDataRef = useRef({});
    mapDataRef.current = mapData;

    const selectedDirectoryRef = useRef({});
    selectedDirectoryRef.current = selectedDirectory;

    const websocketExpectedCloseRef = useRef();

    const { enqueueSnackbar } = useSnackbar();

    /* Dialogs states */
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [openAddNewStudyDialog, setOpenAddNewStudyDialog] = React.useState(
        false
    );
    const [
        openCreateNewDirectoryDialog,
        setOpenCreateNewDirectoryDialog,
    ] = React.useState(false);
    const [
        openDeleteDirectoryDialog,
        setOpenDeleteDirectoryDialog,
    ] = React.useState(false);
    const [
        openCreateRootDirectoryDialog,
        setOpenCreateRootDirectoryDialog,
    ] = React.useState(false);
    const [
        openRenameDirectoryDialog,
        setOpenRenameDirectoryDialog,
    ] = React.useState(false);
    const [
        openAccessRightsDirectoryDialog,
        setOpenAccessRightsDirectoryDialog,
    ] = React.useState(false);

    const [accessRightsError, setAccessRightsError] = React.useState('');
    const [deleteError, setDeleteError] = React.useState('');
    const [renameError, setRenameError] = React.useState('');

    /* Menu states */
    const [mousePosition, setMousePosition] = React.useState(
        initialMousePosition
    );

    const [showMenuFromEmptyZone, setShowMenuFromEmptyZone] = React.useState(
        true
    );

    /* User interactions */
    const onContextMenu = useCallback((e, nodeId) => {
        setMousePosition({
            mouseX: e.clientX + constants.HORIZONTAL_SHIFT,
            mouseY: e.clientY + constants.VERTICAL_SHIFT,
        });
        /* open Contextual Menu in empty zone */
        if (!nodeId) {
            setShowMenuFromEmptyZone(true);
        } /* open Contextual Menu in a TreeViewItem */ else {
            setShowMenuFromEmptyZone(false);
        }

        handleOpenMenu(e);
    }, []);

    const handleOpenMenu = (event) => {
        setAnchorEl(event.currentTarget);
        event.stopPropagation();
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const handleOpenAddNewStudyDialog = () => {
        setAnchorEl(null);
        setOpenAddNewStudyDialog(true);
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

    /* Handle Dialogs actions */
    function insertNewDirectory(directoryName, isPrivate) {
        insertDirectory(
            directoryName,
            selectedDirectory,
            isPrivate,
            userId
        ).then(() => {
            setOpenCreateNewDirectoryDialog(false);
        });
    }

    function insertNewRootDirectory(directoryName, isPrivate) {
        insertRootDirectory(directoryName, isPrivate, userId).then(() => {
            setOpenCreateRootDirectoryDialog(false);
        });
    }

    function deleteSelectedDirectory() {
        deleteElement(selectedDirectory).then((r) => {
            if (r.ok) {
                handleCloseDeleteDirectoryDialog();
                dispatch(
                    setSelectedDirectory(mapData[selectedDirectory].parentUuid)
                );
            }
            if (r.status === 403) {
                setDeleteError(
                    intl.formatMessage({ id: 'deleteDirectoryError' })
                );
            }
        });
    }

    function changeSelectedDirectoryAccessRights(isPrivate) {
        updateAccessRights(selectedDirectory, isPrivate).then((r) => {
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
        renameElement(selectedDirectory, newName).then((r) => {
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

    /* RootDirectories managment */
    const updateRootDirectories = useCallback(() => {
        fetchRootFolders().then((data) => {
            let sortedData = [...data];
            sortedData.sort(function (a, b) {
                return a.elementName.localeCompare(b.elementName);
            });
            setRootDirectories(sortedData);
        });
    }, []);

    useEffect(() => {
        if (user != null) {
            updateRootDirectories();
        }
    }, [user, updateRootDirectories]);

    /* Manage current path data */
    const buildPath = useCallback(
        (nodeId, path) => {
            let currentUuid = nodeId;
            while (
                currentUuid != null &&
                mapDataRef.current[currentUuid] !== undefined
            ) {
                path.unshift({
                    elementUuid: mapDataRef.current[currentUuid].elementUuid,
                    elementName: mapDataRef.current[currentUuid].elementName,
                });
                currentUuid = mapDataRef.current[currentUuid].parentUuid;
            }
        },
        [mapDataRef]
    );

    const updatePath = useCallback(
        (nodeId) => {
            let path = [];
            buildPath(nodeId, path);
            if (path != null) dispatch(setCurrentPath(path));
        },
        [buildPath, dispatch]
    );

    /* Mapdata management*/
    useEffect(() => {
        if (rootDirectories) {
            if (rootDirectories.length > 0) {
                let initialMapData = {};
                rootDirectories.forEach((rootDirectory) => {
                    let rootDirectoryCopy = { ...rootDirectory };
                    rootDirectoryCopy.parentUuid = null;
                    rootDirectoryCopy.children = [];
                    initialMapData[
                        rootDirectory.elementUuid
                    ] = rootDirectoryCopy;
                });
                setMapData(initialMapData);
            }
        }
    }, [rootDirectories]);

    const insertContent = useCallback(
        (selected, childrenToBeInserted) => {
            let mapDataCopy = { ...mapDataRef.current };
            let preparedChildrenToBeInserted = childrenToBeInserted.map(
                (child) => {
                    child.children = [];
                    child.parentUuid = selected;
                    if (!mapDataCopy[child.elementUuid]) {
                        mapDataCopy[child.elementUuid] = child;
                    } else {
                        //update element name
                        mapDataCopy[child.elementUuid].elementName =
                            child.elementName;
                    }
                    return child;
                }
            );
            mapDataCopy[selected].children = preparedChildrenToBeInserted.sort(
                function (a, b) {
                    return a.elementName.localeCompare(b.elementName);
                }
            );
            setMapData(mapDataCopy);
        },
        [mapDataRef]
    );

    const updateMapData = useCallback(
        (nodeId, children) => {
            let newSubdirectories = children.filter(
                (child) => child.type === elementType.DIRECTORY
            );
            insertContent(nodeId, newSubdirectories);
            if (
                selectedDirectoryRef.current !== null &&
                mapDataRef.current[selectedDirectoryRef.current].parentUuid ===
                    nodeId &&
                newSubdirectories.filter(
                    (e) => e.elementUuid === selectedDirectoryRef.current
                ).length === 0
            ) {
                // if selected directory is deleted by another user we should select parent directory
                setSelectedDirectory(nodeId);
                updatePath(nodeId);
            } else {
                updatePath(selectedDirectoryRef.current);
            }
        },
        [insertContent, selectedDirectoryRef, updatePath, mapDataRef]
    );

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

    const updateDirectoryChildren = useCallback(
        (nodeId) => {
            fetchDirectoryContent(nodeId).then((childrenToBeInserted) => {
                // update directory Content
                updateCurrentChildren(childrenToBeInserted);
                // Update Tree Map data
                updateMapData(nodeId, childrenToBeInserted);
            });
        },
        [updateCurrentChildren, updateMapData]
    );

    const updateTree = useCallback(
        (nodeId) => {
            // fetch content
            updateDirectoryChildren(nodeId);
            // update current directory path
            updatePath(nodeId);
        },
        [updateDirectoryChildren, updatePath]
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

    const connectNotificationsUpdateStudies = useCallback(() => {
        const ws = connectNotificationsWsUpdateStudies();

        ws.onmessage = function (event) {
            console.debug('Received Update Studies notification', event);
            let eventData = JSON.parse(event.data);

            if (eventData.headers) {
                const notificationTypeHeader =
                    eventData.headers['notificationType'];
                const isRootDirectory = eventData.headers['isRootDirectory'];
                const directoryUuid = eventData.headers['directoryUuid'];
                const error = eventData.headers['error'];

                if (isRootDirectory) {
                    updateRootDirectories();
                    if (
                        notificationTypeHeader ===
                        notificationType.DELETE_DIRECTORY
                    ) {
                        dispatch(setCurrentChildren(null));
                        updatePath(null);
                    }
                    return;
                }

                if (directoryUuid) {
                    if (mapDataRef.current[directoryUuid] !== undefined) {
                        displayErrorIfExist(error);
                        updateDirectoryChildren(directoryUuid, false);
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
        updateDirectoryChildren,
        updateRootDirectories,
        mapDataRef,
        dispatch,
        updatePath,
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
        console.debug('useEffect over selectedDirectory', selectedDirectory);
        if (selectedDirectory) updateTree(selectedDirectory);
    }, [selectedDirectory, updateTree]);

    const isAllowed = () => {
        return (
            selectedDirectory &&
            mapData[selectedDirectory] &&
            mapData[selectedDirectory].owner === userId
        );
    };

    return (
        <>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                }}
                onContextMenu={(e) => onContextMenu(e, null)}
            >
                {mapDataRef.current &&
                    rootDirectories.map((rootDirectory) => (
                        <DirectoryTreeView
                            key={rootDirectory.elementUuid}
                            treeViewUID={rootDirectory.elementUuid}
                            mapData={mapDataRef.current}
                            onContextMenu={onContextMenu}
                        />
                    ))}
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
                {!showMenuFromEmptyZone && (
                    <div>
                        <MenuItem onClick={handleOpenAddNewStudyDialog}>
                            <ListItemIcon style={{ minWidth: '25px' }}>
                                <AddIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                                primary={intl.formatMessage({
                                    id: 'newStudy',
                                })}
                            />
                        </MenuItem>
                        <hr />
                        {isAllowed() && (
                            <div>
                                <MenuItem
                                    onClick={handleOpenRenameDirectoryDialog}
                                >
                                    <ListItemIcon style={{ minWidth: '25px' }}>
                                        <CreateIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={intl.formatMessage({
                                            id: 'renameFolder',
                                        })}
                                    />
                                </MenuItem>
                                <MenuItem
                                    onClick={
                                        handleOpenAccessRightsDirectoryDialog
                                    }
                                >
                                    <ListItemIcon style={{ minWidth: '25px' }}>
                                        <BuildIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={intl.formatMessage({
                                            id: 'accessRights',
                                        })}
                                    />
                                </MenuItem>
                                <MenuItem
                                    onClick={handleOpenDeleteDirectoryDialog}
                                >
                                    <ListItemIcon style={{ minWidth: '25px' }}>
                                        <DeleteOutlineIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={intl.formatMessage({
                                            id: 'deleteFolder',
                                        })}
                                    />
                                </MenuItem>
                                <hr />
                            </div>
                        )}
                        <MenuItem onClick={handleOpenCreateNewDirectoryDialog}>
                            <ListItemIcon style={{ minWidth: '25px' }}>
                                <CreateNewFolderIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                                primary={intl.formatMessage({
                                    id: 'createFolder',
                                })}
                            />
                        </MenuItem>
                    </div>
                )}
                <MenuItem onClick={handleOpenCreateRootDirectoryDialog}>
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

            {/** Dialogs **/}
            <CreateStudyForm
                open={openAddNewStudyDialog}
                setOpen={setOpenAddNewStudyDialog}
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
                currentName={
                    mapDataRef.current && mapDataRef.current[selectedDirectory]
                        ? mapDataRef.current[selectedDirectory].elementName
                        : ''
                }
                open={openRenameDirectoryDialog}
                onClick={renameSelectedDirectory}
                onClose={handleCloseRenameDirectoryDialog}
                title={intl.formatMessage({
                    id: 'renameDirectoryDialogTitle',
                })}
                error={renameError}
            />
            <DeleteDialog
                message={intl.formatMessage({
                    id: 'deleteDirectoryDialogMessage',
                })}
                open={openDeleteDirectoryDialog}
                onClick={deleteSelectedDirectory}
                onClose={handleCloseDeleteDirectoryDialog}
                title={intl.formatMessage({
                    id: 'deleteDirectoryDialogTitle',
                })}
                error={deleteError}
            />
            <AccessRightsDialog
                message={''}
                isPrivate={
                    mapDataRef.current &&
                    mapDataRef.current[selectedDirectory] !== undefined
                        ? mapDataRef.current[selectedDirectory].accessRights
                              .private
                        : false
                }
                open={openAccessRightsDirectoryDialog}
                onClick={changeSelectedDirectoryAccessRights}
                onClose={handleCloseAccessRightsDirectoryDialog}
                title={intl.formatMessage({
                    id: 'accessRights',
                })}
                error={accessRightsError}
            />
        </>
    );
};

export default TreeViewsContainer;
