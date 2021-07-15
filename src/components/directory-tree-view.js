/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useEffect, useState } from 'react';

import makeStyles from '@material-ui/core/styles/makeStyles';
import TreeItem from '@material-ui/lab/TreeItem';
import TreeView from '@material-ui/lab/TreeView';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import {
    deleteDirectory,
    fetchDirectoryContent,
    fetchFolderInfos,
    insertDirectory,
} from '../utils/rest-api';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentChildren, setSelectedDirectory } from '../redux/actions';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import AddIcon from '@material-ui/icons/Add';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import withStyles from '@material-ui/core/styles/withStyles';
import CreateStudyForm from './create-study-form';
import { useIntl } from 'react-intl';
import { elementType } from '../utils/elementType';
import { InsertNewDirectoryDialog } from './dialogs/CreateNewDirectoryDialog';
import { DeleteDirectoryDialog } from './dialogs/DeleteDirectoryDialog';

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
    const [
        openCreateNewDirectoryDialog,
        setOpenCreateNewDirectoryDialog,
    ] = React.useState(false);
    const [
        openDeleteDirectoryDialog,
        setOpenDeleteDirectoryDialog,
    ] = React.useState(false);

    const selectedDirectory = useSelector((state) => state.selectedDirectory);
    const userId = useSelector((state) => state.user.profile.sub);

    const dispatch = useDispatch();
    const intl = useIntl();

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

    const merge = (treeDataCopy, childrenToBeInserted) => {
        const childrenUuids = treeDataCopy.children.map(
            (child) => child.elementUuid
        );

        const childrenToBeInsertedUuids = childrenToBeInserted.map(
            (child) => child.elementUuid
        );

        const mergedArray = treeDataCopy.children.concat(
            childrenToBeInserted.filter(
                (item) => childrenUuids.indexOf(item.elementUuid) < 0
            )
        );
        treeDataCopy.children = mergedArray.filter((element) =>
            childrenToBeInsertedUuids.includes(element.elementUuid)
        );
    };

    const insertContent = (selected, treeDataCopy, childrenToBeInserted) => {
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
    };

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

    const removeElement = useCallback(
        (nodeId) => {
            let expandedCopy = [...expanded];
            for (let i = 0; i < expandedCopy.length; i++) {
                if (expandedCopy[i] === nodeId) {
                    expandedCopy.splice(i, 1);
                }
            }
            setExpanded(expandedCopy);
        },
        [expanded]
    );

    const addElement = useCallback(
        (nodeId) => {
            setExpanded([...expanded, nodeId]);
        },
        [expanded]
    );

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

    function deleteSelectedDirectory() {
        fetchFolderInfos(selectedDirectory).then((response) => {
            deleteDirectory(selectedDirectory).then((r) => {
                setOpenDeleteDirectoryDialog(false);
                setAnchorEl(null);
                handleSelect(response.parentId, false);
            });
        });
    }

    const handleSelect = useCallback(
        (nodeUuid, toggle) => {
            let nodeId = nodeUuid;
            if (nodeUuid === null) {
                console.log('treeData', treeData);
                nodeId = treeData.elementUuid;
            }
            dispatch(setSelectedDirectory(nodeId));
            if (nodeId !== null) {
                fetchDirectoryContent(nodeId).then((childrenToBeInserted) => {
                    dispatch(
                        setCurrentChildren(
                            childrenToBeInserted.filter(
                                (child) => child.type !== elementType.DIRECTORY
                            )
                        )
                    );
                    let treeDataCopy = { ...treeData };
                    insertContent(
                        nodeId,
                        treeDataCopy,
                        childrenToBeInserted.filter(
                            (child) => child.type === elementType.DIRECTORY
                        )
                    );
                    if (toggle) {
                        if (expanded.includes(nodeId)) {
                            removeElement(nodeId);
                        } else {
                            addElement(nodeId);
                        }
                    }
                    setTreeData(treeDataCopy);
                });
            }
        },
        [removeElement, addElement, dispatch, expanded]
    );

    useEffect(() => {
        handleSelect(selectedDirectory, false);
    }, [selectedDirectory, handleSelect]);

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
                <MenuItem onClick={handleCreateNewFolder}>
                    <ListItemIcon style={{ minWidth: '25px' }}>
                        <FolderOpenIcon fontSize="small" />
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
                <MenuItem onClick={() => setOpenDeleteDirectoryDialog(true)}>
                    <ListItemIcon style={{ minWidth: '25px' }}>
                        <DeleteOutlineIcon fontSize="small" />
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
