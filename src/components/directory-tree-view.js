/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

import makeStyles from '@material-ui/core/styles/makeStyles';
import TreeItem from '@material-ui/lab/TreeItem';
import TreeView from '@material-ui/lab/TreeView';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import {
    connectNotificationsWsUpdateStudies,
    fetchDirectoryContent,
    insertDirectory,
    insertRootDirectory,
    deleteDirectory,
    renameDirectory,
    changeAccessRights,
} from '../utils/rest-api';
import { useDispatch, useSelector } from 'react-redux';
import {
    setCurrentChildren,
    setSelectedDirectory,
    setCurrentPath,
} from '../redux/actions';
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
import withStyles from '@material-ui/core/styles/withStyles';
import CreateStudyForm from './create-study-form';
import { useIntl } from 'react-intl';
import { elementType } from '../utils/elementType';
import { CreateDirectoryDialog } from './dialogs/create-directory-dialog';
import { DeleteDirectoryDialog } from './dialogs/delete-directory-dialog';
import { displayErrorMessageWithSnackbar, useIntlRef } from '../utils/messages';
import { useSnackbar } from 'notistack';
import RenameDialog from './dialogs/rename-dialog';
import AccessRightsDialog from './dialogs/access-rights-dialog';

const useStyles = makeStyles(() => ({
    treeItemLabel: {
        display: 'flex',
        alignItems: 'center',
    },
}));

const StyledMenu = withStyles({
    paper: {
        border: '1px solid #d3d4d5',
    },
})((props) => (
    <Menu
        elevation={0}
        getContentAnchorEl={null}
        anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
        }}
        {...props}
    />
));

const DirectoryTreeView = ({ rootDirectory, updateRootDirectories }) => {
    const classes = useStyles();

    const [mapData, setMapData] = useState({});
    const [expanded, setExpanded] = React.useState([]);
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

    const selectedDirectory = useSelector((state) => state.selectedDirectory);
    const userId = useSelector((state) => state.user.profile.sub);

    const selectedDirectoryRef = useRef(null);
    const mapDataRef = useRef({});
    const expandedRef = useRef([]);
    const updateRootDirectoriesRef = useRef([]);
    const websocketExpectedCloseRef = useRef();
    selectedDirectoryRef.current = selectedDirectory;
    expandedRef.current = expanded;
    mapDataRef.current = mapData;
    updateRootDirectoriesRef.current = updateRootDirectories;

    const { enqueueSnackbar } = useSnackbar();

    const dispatch = useDispatch();

    const intl = useIntl();
    const intlRef = useIntlRef();

    /* Component initialization */
    useEffect(() => {
        let preparedRootDirectory = { ...rootDirectory };
        preparedRootDirectory.parentUuid = null;
        preparedRootDirectory.children = mapDataRef.current[
            rootDirectory.elementUuid
        ]
            ? mapDataRef.current[rootDirectory.elementUuid].children
            : [];

        let initialMapData = { ...mapDataRef.current };
        initialMapData[rootDirectory.elementUuid] = preparedRootDirectory;
        setMapData(initialMapData);
    }, [rootDirectory, mapDataRef]);

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

    /* Manage data */
    const updateCurrentChildren = useCallback(
        (children) => {
            dispatch(
                setCurrentChildren(
                    children.filter(
                        (child) => child.type !== elementType.DIRECTORY
                    )
                )
            );
        },
        [dispatch]
    );

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
            mapDataCopy[selected].children = preparedChildrenToBeInserted;
            setMapData(mapDataCopy);
        },
        [mapDataRef]
    );

    function onContextMenu(e, nodeIds) {
        e.preventDefault();
        handleSelect(nodeIds, false);
        handleOpenMenu(e);
    }

    /* Handle Rendering */
    const renderTree = (node) => {
        if (!node) {
            return;
        }

        return (
            <TreeItem
                key={node.elementUuid}
                nodeId={node.elementUuid}
                label={
                    <div
                        className={classes.treeItemLabel}
                        onContextMenu={(e) =>
                            onContextMenu(e, node.elementUuid)
                        }
                    >
                        {node.elementName}
                    </div>
                }
                endIcon={<ChevronRightIcon />}
            >
                {Array.isArray(mapData[node.elementUuid].children)
                    ? mapData[node.elementUuid].children.map((node) =>
                          renderTree(node)
                      )
                    : null}
            </TreeItem>
        );
    };

    /* Handle Dialogs actions */
    function insertNewDirectory(directoryName, isPrivate) {
        insertDirectory(
            directoryName,
            selectedDirectory,
            isPrivate,
            userId
        ).then(() => {
            // TODO should be done using notification system
            setOpenCreateNewDirectoryDialog(false);
            //updateTree(selectedDirectory);
            //addElement(selectedDirectory);
        });
    }

    function insertNewRootDirectory(directoryName, isPrivate) {
        insertRootDirectory(directoryName, isPrivate, userId).then(() => {
            setOpenCreateRootDirectoryDialog(false);
            // TODO should be done using notification system
            //handleSelect(null, false);
            //updateRootDirectories();
        });
    }

    function deleteSelectedDirectory() {
        deleteDirectory(selectedDirectory).then((r) => {
            setOpenDeleteDirectoryDialog(false);
            // TODO should be done using notification system
            // TODO delete from mapData ?
            /*if (mapData[selectedDirectory].parentUuid !== null) {
                handleSelect(mapData[selectedDirectory].parentUuid, false);
            } else {
                updateRootDirectories();
            }*/
        });
    }

    function changeSelectedDirectoryAccessRights(isPrivate) {
        changeAccessRights(selectedDirectory, isPrivate).then((r) => {
            setOpenAccessRightsDirectoryDialog(false);
        });
    }

    function renameSelectedDirectory(newName) {
        renameDirectory(selectedDirectory, newName).then((r) => {
            setOpenRenameDirectoryDialog(false);
        });
    }

    const updateMapData = useCallback(
        (nodeId, children) => {
            insertContent(
                nodeId,
                children.filter((child) => child.type === elementType.DIRECTORY)
            );
        },
        [insertContent]
    );

    /* Manage treeItem folding */
    const removeElement = useCallback(
        (nodeId) => {
            let expandedCopy = [...expandedRef.current];
            for (let i = 0; i < expandedCopy.length; i++) {
                if (expandedCopy[i] === nodeId) {
                    expandedCopy.splice(i, 1);
                }
            }
            setExpanded(expandedCopy);
        },
        [expandedRef]
    );

    const addElement = useCallback(
        (nodeId) => {
            setExpanded([...expandedRef.current, nodeId]);
        },
        [expandedRef]
    );

    const toggleDirectory = useCallback(
        (nodeId) => {
            if (expandedRef.current.includes(nodeId)) {
                removeElement(nodeId);
            } else {
                addElement(nodeId);
            }
        },
        [addElement, removeElement, expandedRef]
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

    const isConcerned = useCallback(() => {
        return (
            selectedDirectoryRef.current !== null &&
            mapDataRef.current[selectedDirectoryRef.current] !== undefined
        );
    }, [selectedDirectoryRef, mapDataRef]);

    const connectNotificationsUpdateStudies = useCallback(() => {
        const ws = connectNotificationsWsUpdateStudies();

        ws.onmessage = function (event) {
            console.log('GOT A NOTIFICATION: ', event);
            if (isConcerned()) {
                let eventData = JSON.parse(event.data);
                if (eventData.headers) {
                    const directoryUuid = eventData.headers['directoryUuid'];
                    const isRootDirectory =
                        eventData.headers['isRootDirectory'];
                    const error = eventData.headers['error'];

                    displayErrorIfExist(error);

                    if (isRootDirectory) {
                        console.log('update root directories');
                        updateRootDirectoriesRef.current();
                        return;
                    }

                    if (directoryUuid) {
                        console.log(
                            'should update directoryUuid:',
                            directoryUuid
                        );
                        if (directoryUuid === selectedDirectoryRef.current) {
                            console.log('Current Folder concerned!');
                            updateDirectoryChildren(
                                selectedDirectoryRef.current,
                                false
                            );
                            // open folder in case of INSERT notification
                            addElement(directoryUuid);
                        } else if (
                            mapDataRef.current[selectedDirectoryRef.current]
                                .parentUuid !== null &&
                            (directoryUuid ===
                                mapDataRef.current[selectedDirectoryRef.current]
                                    .parentUuid) !==
                                null
                        ) {
                            // update parent in case of DELETE notification
                            console.log('Parent Folder concerned!');
                            updateDirectoryChildren(
                                mapDataRef.current[selectedDirectoryRef.current]
                                    .parentUuid,
                                false
                            );
                        }
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
        isConcerned,
        updateRootDirectoriesRef,
        addElement,
        mapDataRef,
    ]);

    useEffect(() => {
        const ws = connectNotificationsUpdateStudies();
        // Note: dispatch doesn't change
        // cleanup at unmount event
        return function () {
            ws.close();
        };
    }, [connectNotificationsUpdateStudies]);

    /* Handle User interactions*/
    const handleSelect = useCallback(
        (nodeId, toggle) => {
            dispatch(setSelectedDirectory(nodeId));
            // updateTree will be called by useEffect;
            if (toggle) {
                // update fold status of item
                toggleDirectory(nodeId);
            }
        },
        [dispatch, toggleDirectory]
    );

    /* Handle components synchronization */
    useEffect(() => {
        // test if we handle this change in the good treeview by checking if selectedDirectory is in this treeview
        if (isConcerned()) {
            // fetch content
            updateTree(selectedDirectory);
        }
    }, [selectedDirectory, updateTree, isConcerned]);

    return (
        <>
            <TreeView
                className={classes.root}
                defaultCollapseIcon={<ExpandMoreIcon />}
                defaultExpanded={['root']}
                defaultExpandIcon={<ChevronRightIcon />}
                onNodeSelect={(event, nodeId) => handleSelect(nodeId, true)}
                expanded={expanded}
                selected={selectedDirectory}
            >
                {renderTree(mapData[rootDirectory.elementUuid])}
            </TreeView>

            <StyledMenu
                id="case-menu"
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
            >
                {/* Directories Menu */}
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

                <MenuItem onClick={handleOpenRenameDirectoryDialog}>
                    <ListItemIcon style={{ minWidth: '25px' }}>
                        <CreateIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                        primary={intl.formatMessage({
                            id: 'renameFolder',
                        })}
                    />
                </MenuItem>
                <MenuItem onClick={handleOpenDeleteDirectoryDialog}>
                    <ListItemIcon style={{ minWidth: '25px' }}>
                        <DeleteOutlineIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                        primary={intl.formatMessage({
                            id: 'deleteFolder',
                        })}
                    />
                </MenuItem>
                <MenuItem onClick={handleOpenAccessRightsDirectoryDialog}>
                    <ListItemIcon style={{ minWidth: '25px' }}>
                        <BuildIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                        primary={intl.formatMessage({
                            id: 'accessRights',
                        })}
                    />
                </MenuItem>
                <hr />
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
                    mapData[selectedDirectory]
                        ? mapData[selectedDirectory].elementName
                        : ''
                }
                open={openRenameDirectoryDialog}
                onClick={renameSelectedDirectory}
                onClose={() => setOpenRenameDirectoryDialog(false)}
                title={intl.formatMessage({
                    id: 'renameDirectoryDialogTitle',
                })}
                error={''}
            />
            <DeleteDirectoryDialog
                message={intl.formatMessage({
                    id: 'deleteDirectoryDialogMessage',
                })}
                open={openDeleteDirectoryDialog}
                onClick={deleteSelectedDirectory}
                onClose={() => setOpenDeleteDirectoryDialog(false)}
                title={intl.formatMessage({
                    id: 'deleteDirectoryDialogTitle',
                })}
                error={''}
            />
            <AccessRightsDialog
                message={''}
                isPrivate={
                    mapData[selectedDirectory]
                        ? mapData[selectedDirectory].accessRights.private
                        : false
                }
                open={openAccessRightsDirectoryDialog}
                onClick={changeSelectedDirectoryAccessRights}
                onClose={() => setOpenAccessRightsDirectoryDialog(false)}
                title={intl.formatMessage({
                    id: 'accessRights',
                })}
                error={''}
            />
        </>
    );
};

export default DirectoryTreeView;
