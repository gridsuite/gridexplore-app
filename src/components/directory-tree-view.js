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
import { setCurrentChildren, setSelectedDirectory } from '../redux/actions';
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

    const [treeData, setTreeData] = useState(rootDirectory);
    const [expanded, setExpanded] = React.useState([]);
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [openAddNewStudyDialog, setOpenAddNewStudyDialog] = React.useState(
        false
    );

    const { enqueueSnackbar } = useSnackbar();

    const selectedDirectory = useSelector((state) => state.selectedDirectory);

    const selectedDirectoryRef = useRef(null);
    const treeDataRef = useRef(null);
    const expandedRef = useRef([]);
    const websocketExpectedCloseRef = useRef();
    selectedDirectoryRef.current = selectedDirectory;
    treeDataRef.current = treeData;
    expandedRef.current = expanded;

    const dispatch = useDispatch();

    const intl = useIntl();
    const intlRef = useIntlRef();

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

    const merge = (treeDataCopy, childrenToBeInserted) => {
        const childrenUuids = treeDataCopy.children.map(
            (child) => child.elementUuid
        );
        const mergedArray = treeDataCopy.children.concat(
            childrenToBeInserted.filter(
                (item) => childrenUuids.indexOf(item.elementUuid) < 0
            )
        );
        treeDataCopy.children = mergedArray;
    };

    const insertContent = useCallback(
        (selected, treeDataCopy, childrenToBeInserted) => {
            if (treeDataCopy.elementUuid === selected) {
                if (treeDataCopy.children === undefined) {
                    treeDataCopy.children = childrenToBeInserted;
                } else {
                    merge(treeDataCopy, childrenToBeInserted);
                }
            } else {
                if (treeDataCopy.children != null) {
                    treeDataCopy.children.forEach((child) => {
                        insertContent(selected, child, childrenToBeInserted);
                    });
                }
            }
        },
        []
    );

    function onContextMenu(e, nodeIds) {
        e.stopPropagation();
        e.preventDefault();
        handleSelect(nodeIds, false);
        handleOpenMenu(e);
    }

    const renderTree = (node) => {
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
                {Array.isArray(node.children)
                    ? node.children.map((node) => renderTree(node))
                    : null}
            </TreeItem>
        );
    };

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
                let treeDataCopy = { ...treeDataRef.current };
                insertContent(
                    nodeId,
                    treeDataCopy,
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
                setTreeData(treeDataCopy);
            });
        },
        [
            dispatch,
            treeDataRef,
            addElement,
            removeElement,
            expandedRef,
            insertContent,
        ]
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
                {renderTree(treeData)}
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
            </StyledMenu>
            <CreateStudyForm
                open={openAddNewStudyDialog}
                setOpen={setOpenAddNewStudyDialog}
            />
        </>
    );
};

export default DirectoryTreeView;
