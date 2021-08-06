/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { withStyles, makeStyles } from '@material-ui/core/styles';
import TreeItem from '@material-ui/lab/TreeItem';
import TreeView from '@material-ui/lab/TreeView';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import LockIcon from '@material-ui/icons/Lock';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import Typography from '@material-ui/core/Typography';

import {
    connectNotificationsWsUpdateStudies,
    fetchDirectoryContent,
    insertDirectory,
    insertRootDirectory,
    deleteElement,
    updateAccessRights,
    renameElement,
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
import CreateStudyForm from './create-study-form';
import { useIntl } from 'react-intl';
import { elementType } from '../utils/elementType';
import { CreateDirectoryDialog } from './dialogs/create-directory-dialog';
import { displayErrorMessageWithSnackbar, useIntlRef } from '../utils/messages';
import { useSnackbar } from 'notistack';
import RenameDialog from './dialogs/rename-dialog';
import AccessRightsDialog from './dialogs/access-rights-dialog';
import { notificationType } from '../utils/notificationType';
import DeleteDialog from './dialogs/delete-dialog';

const useStyles = makeStyles((theme) => ({
    treeViewRoot: {
        padding: theme.spacing(0.5),
    },
    treeItemRoot: {
        '&:focus > $treeItemContent $treeItemLabel': {
            borderRadius: theme.spacing(2),
            backgroundColor: theme.row.primary,
        },
        '&:hover > $treeItemContent $treeItemLabel:hover': {
            borderRadius: theme.spacing(2),
            backgroundColor: theme.row.primary,
        },
        '&$treeItemSelected > $treeItemContent $treeItemLabel:hover, &$treeItemSelected > $treeItemContent $treeItemLabel, &$treeItemSelected:focus > $treeItemContent $treeItemLabel': {
            borderRadius: theme.spacing(2),
            backgroundColor: theme.row.hover,
            fontWeight: 'bold',
        },
    },
    treeItemSelected: {}, // keep this!
    treeItemContent: {
        paddingRight: theme.spacing(1),
        paddingLeft: theme.spacing(1),
    },
    treeItemLabel: {
        overflow: 'hidden',
        paddingRight: theme.spacing(1),
        paddingLeft: theme.spacing(1),
        fontWeight: 'inherit',
        color: 'inherit',
    },
    treeItemLabelRoot: {
        display: 'flex',
        alignItems: 'center',
        padding: theme.spacing(0.5, 0),
    },
    treeItemLabelText: {
        fontWeight: 'inherit',
        flexGrow: 1,
    },
    icon: {
        marginRight: theme.spacing(1),
        width: '18px',
        height: '18px',
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

    const [accessRightsError, setAccessRightsError] = React.useState('');
    const [deleteError, setDeleteError] = React.useState('');
    const [renameError, setRenameError] = React.useState('');

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
                        className={classes.treeItemLabelRoot}
                        onContextMenu={(e) =>
                            onContextMenu(e, node.elementUuid)
                        }
                    >
                        <Typography
                            noWrap
                            className={classes.treeItemLabelText}
                        >
                            {node.elementName}
                        </Typography>
                        {node.accessRights.private ? (
                            <LockIcon className={classes.icon} />
                        ) : null}
                    </div>
                }
                endIcon={<ChevronRightIcon className={classes.icon} />}
                classes={{
                    root: classes.treeItemRoot,
                    content: classes.treeItemContent,
                    selected: classes.treeItemSelected,
                    label: classes.treeItemLabel,
                }}
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
                handleSelect(mapData[selectedDirectory].parentUuid, false);
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

    const updateMapData = useCallback(
        (nodeId, children) => {
            let newSubdirectories = children.filter(
                (child) => child.type === elementType.DIRECTORY
            );
            insertContent(nodeId, newSubdirectories);
            if (
                selectedDirectoryRef.current !== null &&
                mapDataRef.current[selectedDirectoryRef.current] &&
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
                // update directory Content only if it's the one opened
                if (nodeId === selectedDirectoryRef.current) {
                    updateCurrentChildren(childrenToBeInserted);
                }
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
            let eventData = JSON.parse(event.data);

            if (eventData.headers) {
                const notificationTypeHeader =
                    eventData.headers['notificationType'];
                const isRootDirectory = eventData.headers['isRootDirectory'];
                const directoryUuid = eventData.headers['directoryUuid'];
                const error = eventData.headers['error'];

                if (isRootDirectory) {
                    updateRootDirectoriesRef.current();
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
        updateRootDirectoriesRef,
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

    const isAllowed = () => {
        return (
            selectedDirectory &&
            mapData[selectedDirectory] &&
            mapData[selectedDirectory].owner === userId
        );
    };

    return (
        <>
            <TreeView
                className={classes.treeViewRoot}
                defaultCollapseIcon={
                    <ExpandMoreIcon className={classes.icon} />
                }
                defaultExpanded={['root']}
                defaultExpandIcon={
                    <ChevronRightIcon className={classes.icon} />
                }
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
                {isAllowed() && (
                    <div>
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
                        <MenuItem
                            onClick={handleOpenAccessRightsDirectoryDialog}
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
                    mapData[selectedDirectory] !== undefined
                        ? mapData[selectedDirectory].accessRights.private
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

export default DirectoryTreeView;
