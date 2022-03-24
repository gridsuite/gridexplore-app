/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useEffect, useRef } from 'react';

import makeStyles from '@mui/styles/makeStyles';
import TreeView from '@mui/lab/TreeView';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LockIcon from '@mui/icons-material/Lock';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Zoom from '@mui/material/Zoom';

import { FormattedMessage } from 'react-intl';

import { useDispatch, useSelector } from 'react-redux';
import { setSelectedDirectory } from '../redux/actions';
import CustomTreeItem from './custom-tree-item';

const useStyles = makeStyles((theme) => ({
    treeViewRoot: {
        padding: theme.spacing(0.5),
    },
    treeItemRoot: {
        '&:focus > $treeItemContent $treeItemLabel, .focused': {
            borderRadius: theme.spacing(2),
            backgroundColor: theme.row.primary,
        },
        '&:hover': {
            borderRadius: theme.spacing(2),
            backgroundColor: theme.row.primary,
        },
    },
    treeItemSelected: {
        borderRadius: theme.spacing(2),
        backgroundColor: theme.row.hover,
        fontWeight: 'bold',
    },
    treeItemContent: {
        paddingRight: theme.spacing(1),
        paddingLeft: theme.spacing(1),
    },
    treeItemIconContainer: {
        width: '18px',
        display: 'flex',
        justifyContent: 'center',
    },
    treeItemLabel: {
        flexGrow: 1,
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

const DirectoryTreeView = ({
    treeViewUuid,
    mapData,
    onContextMenu,
    onDirectoryUpdate,
}) => {
    const classes = useStyles();
    const dispatch = useDispatch();

    const [expanded, setExpanded] = React.useState([]);
    const selectedDirectory = useSelector((state) => state.selectedDirectory);
    const currentPath = useSelector((state) => state.currentPath);

    const mapDataRef = useRef({});
    const expandedRef = useRef([]);
    const selectedDirectoryRef = useRef(null);
    selectedDirectoryRef.current = selectedDirectory;
    expandedRef.current = expanded;
    mapDataRef.current = mapData;

    const ensureInOutExpansion = useCallback(
        (inIds, outIds = []) => {
            let prevAsSet = new Set(expandedRef.current);
            // if on both side : no-op
            let inIdsSet = new Set(
                inIds.filter((id) => !outIds.includes(id) && !prevAsSet.has(id))
            );
            let outIdsSet = new Set(
                outIds.filter((id) => !inIds.includes(id) && prevAsSet.has(id))
            );

            if (inIdsSet.size > 0 || outIdsSet.size > 0) {
                let purged = [...prevAsSet].filter((id) => !outIdsSet.has(id));
                let grown = purged.concat(...inIdsSet);
                setExpanded(grown);
            }
        },
        [expandedRef]
    );

    const toggleDirectories = useCallback(
        (ids) => {
            let ins = [];
            let outs = [];
            ids.forEach((id) => {
                if (!expandedRef.current.includes(id)) ins.push(id);
                else outs.push(id);
            });
            ensureInOutExpansion(ins, outs);
        },
        [expandedRef, ensureInOutExpansion]
    );

    /* User interaction */
    function handleContextMenuClick(event, nodeId) {
        onContextMenu(event, nodeId);
    }

    function handleLabelClick(nodeId) {
        if (selectedDirectory?.elementUuid !== nodeId) {
            dispatch(setSelectedDirectory(mapDataRef.current[nodeId]));
        }
        if (!expandedRef.current.includes(nodeId)) {
            // update fold status of item
            toggleDirectories([nodeId]);
        }
    }

    function handleIconClick(nodeId) {
        onDirectoryUpdate(nodeId, expandedRef.current.includes(nodeId));
        toggleDirectories([nodeId]);
    }

    useEffect(() => {
        if (currentPath.length === 0) return;
        if (currentPath[0].elementUuid !== treeViewUuid) return;
        ensureInOutExpansion(currentPath.map((n) => n.elementUuid));
    }, [currentPath, ensureInOutExpansion, treeViewUuid]);

    /* Handle Rendering */
    const renderTree = (node) => {
        if (!node) {
            return;
        }
        return (
            <CustomTreeItem
                key={node.elementUuid}
                nodeId={node.elementUuid}
                label={
                    <div
                        className={classes.treeItemLabelRoot}
                        onContextMenu={(e) =>
                            handleContextMenuClick(e, node.elementUuid)
                        }
                    >
                        <Tooltip
                            TransitionComponent={Zoom}
                            disableFocusListener
                            disableTouchListener
                            enterDelay={1000}
                            enterNextDelay={1000}
                            title={node.elementName}
                            placement="bottom-end"
                        >
                            <Typography
                                noWrap
                                className={classes.treeItemLabelText}
                            >
                                {node.elementName}
                            </Typography>
                        </Tooltip>
                        {node.accessRights?.isPrivate ? (
                            <Tooltip
                                TransitionComponent={Zoom}
                                disableFocusListener
                                disableTouchListener
                                enterDelay={1000}
                                enterNextDelay={1000}
                                title={<FormattedMessage id="private" />}
                                placement="right"
                                arrow
                            >
                                <LockIcon className={classes.icon} />
                            </Tooltip>
                        ) : null}
                    </div>
                }
                ContentProps={{
                    onExpand: handleIconClick,
                    onSelect: handleLabelClick,
                    classes: {
                        root: classes.treeItemRoot,
                        selected: classes.treeItemSelected,
                        focused: classes.treeItemFocused,
                        label: classes.treeItemLabel,
                        iconContainer: classes.treeItemIconContainer,
                    },
                }}
                endIcon={
                    node.subdirectoriesCount > 0 ? (
                        <ChevronRightIcon className={classes.icon} />
                    ) : null
                }
                classes={{
                    content: classes.treeItemContent,
                }}
            >
                {Array.isArray(node.children)
                    ? node.children.map((child) =>
                          renderTree(mapDataRef.current[child.elementUuid])
                      )
                    : null}
            </CustomTreeItem>
        );
    };

    return (
        <>
            <TreeView
                className={classes.treeViewRoot}
                defaultCollapseIcon={
                    <ExpandMoreIcon className={classes.icon} />
                }
                defaultExpandIcon={
                    <ChevronRightIcon className={classes.icon} />
                }
                expanded={expanded}
                selected={
                    selectedDirectory ? selectedDirectory.elementUuid : null
                }
            >
                {renderTree(mapDataRef.current[treeViewUuid])}
            </TreeView>
        </>
    );
};

export default DirectoryTreeView;
