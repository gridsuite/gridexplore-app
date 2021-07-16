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
    deleteDirectory,
    fetchDirectoryContent,
    insertDirectory,
    connectNotificationsWsUpdateStudies, insertRootDirectory
} from '../utils/rest-api';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentChildren, setSelectedDirectory } from '../redux/actions';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import FolderSpecialIcon from '@material-ui/icons/FolderSpecial';
import CreateNewFolderIcon from '@material-ui/icons/CreateNewFolder';
import AddIcon from '@material-ui/icons/Add';
import withStyles from '@material-ui/core/styles/withStyles';
import CreateStudyForm from './create-study-form';
import { useIntl } from 'react-intl';
import { elementType } from '../utils/elementType';
import { InsertNewDirectoryDialog } from './dialogs/CreateNewDirectoryDialog';
import { DeleteDirectoryDialog } from './dialogs/DeleteDirectoryDialog';
import { displayErrorMessageWithSnackbar, useIntlRef } from '../utils/messages';
import { useSnackbar } from 'notistack';

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

    const selectedDirectory = useSelector((state) => state.selectedDirectory);
    const userId = useSelector((state) => state.user.profile.sub);

    const selectedDirectoryRef = useRef(null);
    const mapDataRef = useRef({});
    const expandedRef = useRef([]);
    const websocketExpectedCloseRef = useRef();
    selectedDirectoryRef.current = selectedDirectory;
    expandedRef.current = expanded;
    mapDataRef.current = mapData;

    const { enqueueSnackbar } = useSnackbar();

    const dispatch = useDispatch();

    const intl = useIntl();
    const intlRef = useIntlRef();

    useEffect(() => {
        let rootDirectoryCopy = { ...rootDirectory };
        rootDirectoryCopy.parentUuid = null;
        rootDirectoryCopy.children = [];

        let initialMapData = {};
        initialMapData[rootDirectory.elementUuid] = rootDirectoryCopy;
        setMapData(initialMapData);
    }, [rootDirectory]);

    const handleOpenMenu = (event) => {
        setAnchorEl(event.currentTarget);
        event.stopPropagation();
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const handleOpenAddNewStudy = () => {
        setAnchorEl(null);
        setOpenAddNewStudyDialog(true);
    };

    const handleCreateNewFolder = () => {
        setAnchorEl(null);
        setOpenCreateNewDirectoryDialog(true);
    };

    const insertContent = useCallback(
        (selected, childrenToBeInserted) => {
            let preparedChildrenToBeInserted = childrenToBeInserted.map(
                (child) => {
                    child.children = [];
                    child.parentUuid = selected;
                    return child;
                }
            );

            let mapDataCopy = { ...mapDataRef.current };

            mapDataCopy[selected].children = preparedChildrenToBeInserted;

            preparedChildrenToBeInserted.forEach((child) => {
                if (!mapDataCopy[child.elementUuid]) {
                    mapDataCopy[child.elementUuid] = child;
                }
            });

            setMapData(mapDataCopy);
        },
        [mapDataRef]
    );

    function onContextMenu(e, nodeIds) {
        e.stopPropagation();
        e.preventDefault();
        handleSelect(nodeIds, false);
        handleOpenMenu(e);
    }

    function onRootContextMenu(e) {
        e.stopPropagation();
        e.preventDefault();
        handleOpenMenu(e);
        console.log('root context menu');
    }

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

    function insertNewDirectory(directoryName, isPrivate) {
        insertDirectory(
            directoryName,
            selectedDirectory,
            isPrivate,
            userId
        ).then(() => {
            setOpenCreateNewDirectoryDialog(false);
            setAnchorEl(null);
            handleSelect(selectedDirectory, false);
            addElement(selectedDirectory);
        });
    }

    function insertNewRootDirectory(directoryName, isPrivate) {
        insertRootDirectory(
            directoryName,
            isPrivate,
            userId
        ).then(() => {
            setOpenCreateRootDirectoryDialog(false);
            setAnchorEl(null);
            handleSelect(selectedDirectory, false);
            addElement(selectedDirectory);
            updateRootDirectories();
        });
    }

    function deleteSelectedDirectory() {
        deleteDirectory(selectedDirectory).then((r) => {
            setOpenDeleteDirectoryDialog(false);
            setAnchorEl(null);
            console.log(mapData[selectedDirectory].parentUuid);
            handleSelect(mapData[selectedDirectory].parentUuid, false);
        });
    }

    const handleSelect = (nodeId, toggle) => {
        dispatch(setSelectedDirectory(nodeId));
        updateDirectoryChildren(nodeId, toggle);
    };

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

    const displayErrorIfExist = useCallback(
        (event) => {
            let eventData = JSON.parse(event.data);
            if (eventData.headers) {
                const error = eventData.headers['error'];
                if (error) {
                    const studyName = eventData.headers['studyName'];
                    displayErrorMessageWithSnackbar({
                        errorMessage: error,
                        enqueueSnackbar: enqueueSnackbar,
                        headerMessage: {
                            headerMessageId: 'studyCreatingError',
                            headerMessageValues: { studyName: studyName },
                            intlRef: intlRef,
                        },
                    });
                    return true;
                }
            }
            return false;
        },
        [enqueueSnackbar, intlRef]
    );

    const updateDirectoryChildren = useCallback(
        (nodeId, toggle) => {
            fetchDirectoryContent(nodeId).then((childrenToBeInserted) => {
                dispatch(
                    setCurrentChildren(
                        childrenToBeInserted.filter(
                            (child) => child.type !== elementType.DIRECTORY
                        )
                    )
                );
                insertContent(
                    nodeId,
                    childrenToBeInserted.filter(
                        (child) => child.type === elementType.DIRECTORY
                    )
                );
                if (toggle) {
                    if (expandedRef.current.includes(nodeId)) {
                        removeElement(nodeId);
                    } else {
                        addElement(nodeId);
                    }
                }
            });
        },
        [dispatch, addElement, removeElement, expandedRef, insertContent]
    );

    const connectNotificationsUpdateStudies = useCallback(() => {
        const ws = connectNotificationsWsUpdateStudies();

        ws.onmessage = function (event) {
            displayErrorIfExist(event);
            updateDirectoryChildren(selectedDirectoryRef.current, false);
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
    }, [displayErrorIfExist, updateDirectoryChildren]);

    useEffect(() => {
        const ws = connectNotificationsUpdateStudies();
        // Note: dispatch doesn't change

        // cleanup at unmount event
        return function () {
            ws.close();
        };
    }, [connectNotificationsUpdateStudies]);

    return (
        <div onContextMenu={onRootContextMenu}>
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
                <MenuItem onClick={handleOpenAddNewStudy}>
                    <ListItemIcon style={{ minWidth: '25px' }}>
                        <AddIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                        primary={intl.formatMessage({
                            id: 'newStudy',
                        })}
                    />
                </MenuItem>
                <MenuItem onClick={handleCreateNewFolder}>
                    <ListItemIcon style={{ minWidth: '25px' }}>
                        <CreateNewFolderIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                        primary={intl.formatMessage({
                            id: 'createFolder',
                        })}
                    />
                </MenuItem>
                <MenuItem onClick={() => setOpenDeleteDirectoryDialog(true)}>
                    <ListItemIcon style={{ minWidth: '25px' }}>
                        <DeleteOutlineIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                        primary={intl.formatMessage({
                            id: 'deleteFolder',
                        })}
                    />
                </MenuItem>
                <MenuItem onClick={() => setOpenCreateRootDirectoryDialog(true)}>
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
            <InsertNewDirectoryDialog
                message={intl.formatMessage({
                    id: 'insertNewDirectoryDialogMessage',
                })}
                open={openCreateNewDirectoryDialog}
                onClick={insertNewDirectory}
                onClose={() => setOpenCreateNewDirectoryDialog(false)}
                title={intl.formatMessage({
                    id: 'insertNewDirectoryDialogTitle',
                })}
                error={''}
            />
            <InsertNewDirectoryDialog
                message={intl.formatMessage({
                    id: 'insertNewDirectoryDialogMessage',
                })}
                open={openCreateRootDirectoryDialog}
                onClick={insertNewRootDirectory}
                onClose={() => setOpenCreateRootDirectoryDialog(false)}
                title={intl.formatMessage({
                    id: 'insertNewDirectoryDialogTitle',
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
        </div>
    );
};

export default DirectoryTreeView;
