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
import AddIcon from '@material-ui/icons/Add';
import withStyles from '@material-ui/core/styles/withStyles';
import CreateStudyForm from './create-study-form';
import { useIntl } from 'react-intl';
import { elementType } from '../utils/elementType';
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

const DirectoryTreeView = ({ rootDirectory }) => {
    const classes = useStyles();

    const [mapData, setMapData] = useState({});
    const [expanded, setExpanded] = React.useState([]);
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [openAddNewStudyDialog, setOpenAddNewStudyDialog] = React.useState(
        false
    );

    const selectedDirectory = useSelector((state) => state.selectedDirectory);

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

    /* Component initialization */
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

    const handleOpenAddNewStudyDialog = () => {
        setAnchorEl(null);
        setOpenAddNewStudyDialog(true);
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
            if (isConcerned()) {
                displayErrorIfExist(event);
                updateDirectoryChildren(selectedDirectoryRef.current, false);
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
    }, [displayErrorIfExist, updateDirectoryChildren, isConcerned]);

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
            </StyledMenu>
            <CreateStudyForm
                open={openAddNewStudyDialog}
                setOpen={setOpenAddNewStudyDialog}
            />
        </>
    );
};

export default DirectoryTreeView;
