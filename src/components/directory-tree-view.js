/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useEffect, useRef } from 'react';

import { makeStyles } from '@material-ui/core/styles';
import TreeItem from '@material-ui/lab/TreeItem';
import TreeView from '@material-ui/lab/TreeView';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import LockIcon from '@material-ui/icons/Lock';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';
import Zoom from '@material-ui/core/Zoom';

import { FormattedMessage } from 'react-intl';

import { useDispatch, useSelector } from 'react-redux';
import { setCurrentPath } from '../redux/actions';

import { makePathFromTip } from '../utils/tree-updates';

const useStyles = makeStyles((theme) => ({
    treeViewRoot: {
        padding: theme.spacing(0.5),
    },
    treeItemRoot: {
        '&:focus > $treeItemContent $treeItemLabel, .focused': {
            borderRadius: theme.spacing(2),
            backgroundColor: theme.row.primary,
        },
        '&:hover > $treeItemContent $treeItemLabel:hover': {
            borderRadius: theme.spacing(2),
            backgroundColor: theme.row.primary,
        },
        '&$treeItemSelected > $treeItemContent $treeItemLabel:hover, &$treeItemSelected > $treeItemContent $treeItemLabel, &$treeItemSelected:focus > $treeItemContent $treeItemLabel':
            {
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

function selectedDirUuidFromCurrentPath(currentPath, mapData) {
    if (!currentPath || currentPath.length === 0) return null;
    let tip = currentPath[currentPath.length - 1];
    let tipUuid = tip.elementUuid;
    if (!mapData[tipUuid]) return null;
    return tipUuid;
}

function isCurrentPathEquiv(mapData, prevCurrPath, currPath) {
    if (!prevCurrPath) return false;
    let dirUuidFromCurr = selectedDirUuidFromCurrentPath(currPath, mapData);
    let dirUuidFromPrev = selectedDirUuidFromCurrentPath(prevCurrPath, mapData);
    return dirUuidFromCurr === dirUuidFromPrev;
}

const DirectoryTreeView = ({
    treeViewUuid,
    mapData,
    onContextMenu,
    onDirectoryUpdate,
}) => {
    const treeViewUuidRef = useRef(treeViewUuid);
    const classes = useStyles();
    const dispatch = useDispatch();

    const [expanded, setExpanded] = React.useState([]);
    const prevPath = useRef(null);
    const currentPath = useSelector(
        (state) => state.currentPath,
        (p, n) => isCurrentPathEquiv(mapData, p, n)
    );

    const ensureInOutExpansion = useCallback(
        (inIds, outIds = []) => {
            let prevAsSet = new Set(expanded);
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
        [expanded]
    );

    /* User interaction */
    function handleContextMenuClick(event, nodeId) {
        onContextMenu(event, nodeId);
    }

    function handleLabelClick(nodeId) {
        dispatch(setCurrentPath(makePathFromTip(nodeId, mapData)));
    }

    function handleIconClick(nodeId) {
        if (expanded.includes(nodeId)) {
            ensureInOutExpansion([], [nodeId]);
        } else {
            onDirectoryUpdate(nodeId, () => {
                ensureInOutExpansion([nodeId], []);
            });
        }
    }

    useEffect(() => {
        if (currentPath.length === 0) return;

        let lastPath = prevPath.current;
        if (lastPath && lastPath.length === currentPath.length) {
            let i = 0;
            for (; i < lastPath.length; i++) {
                if (lastPath[i] !== currentPath[i]) break;
            }
            if (i === lastPath.length) return;
        }
        prevPath.current = currentPath;

        if (currentPath[0].elementUuid !== treeViewUuid) return;
        ensureInOutExpansion(currentPath.map((n) => n.elementUuid));
    }, [currentPath, ensureInOutExpansion, treeViewUuid]);

    /* Handle Rendering */
    const renderTree = (node) => {
        if (!node) {
            return;
        }
        return (
            <TreeItem
                key={node.elementUuid}
                nodeId={node.elementUuid}
                onIconClick={() => {
                    handleIconClick(node.elementUuid);
                }}
                onLabelClick={() => {
                    handleLabelClick(node.elementUuid);
                }}
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
                        {node.accessRights.private ? (
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
                endIcon={
                    node.subdirectoriesCount > 0 ? (
                        <ChevronRightIcon className={classes.icon} />
                    ) : null
                }
                classes={{
                    root: classes.treeItemRoot,
                    content: classes.treeItemContent,
                    selected: classes.treeItemSelected,
                    label: classes.treeItemLabel,
                }}
            >
                {Array.isArray(node.children)
                    ? node.children.map((child) => renderTree(child))
                    : null}
            </TreeItem>
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
                selected={selectedDirUuidFromCurrentPath(currentPath, mapData)}
            >
                {renderTree(mapData[treeViewUuidRef.current])}
            </TreeView>
        </>
    );
};

export default DirectoryTreeView;
