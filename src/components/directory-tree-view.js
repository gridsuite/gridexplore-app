/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useRef } from 'react';

import makeStyles from '@material-ui/core/styles/makeStyles';
import TreeItem from '@material-ui/lab/TreeItem';
import TreeView from '@material-ui/lab/TreeView';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import {
    insertDirectory,
    insertRootDirectory,
    deleteElement,
    updateAccessRights,
    renameElement,
} from '../utils/rest-api';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedDirectory } from '../redux/actions';
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
import { CreateDirectoryDialog } from './dialogs/create-directory-dialog';
import { DeleteDirectoryDialog } from './dialogs/delete-directory-dialog';
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

const DirectoryTreeView = ({ treeViewUID, mapData }) => {
    const classes = useStyles();
    const dispatch = useDispatch();
    const intl = useIntl();

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

    const mapDataRef = useRef({});
    const expandedRef = useRef([]);
    const selectedDirectoryRef = useRef();
    selectedDirectoryRef.current = selectedDirectory;
    expandedRef.current = expanded;
    mapDataRef.current = mapData;

    /* Component initialization */

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
                {Array.isArray(node.children)
                    ? node.children.map((node) =>
                          renderTree(mapDataRef.current[node.elementUuid])
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
            setOpenDeleteDirectoryDialog(false);
            handleSelect(mapData[selectedDirectory].parentUuid, false);
        });
    }

    function changeSelectedDirectoryAccessRights(isPrivate) {
        updateAccessRights(selectedDirectory, isPrivate).then((r) => {
            setOpenAccessRightsDirectoryDialog(false);
        });
    }

    function renameSelectedDirectory(newName) {
        renameElement(selectedDirectory, newName).then((r) => {
            setOpenRenameDirectoryDialog(false);
        });
    }

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
                {renderTree(mapDataRef.current[treeViewUID])}
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
                    mapData[selectedDirectory] !== undefined
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
