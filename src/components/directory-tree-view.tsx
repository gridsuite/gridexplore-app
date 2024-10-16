/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useEffect, useRef } from 'react';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Zoom from '@mui/material/Zoom';

import { useDispatch, useSelector } from 'react-redux';
import { setSelectedDirectory } from '../redux/actions';
import CustomTreeItem from './custom-tree-item';
import { Box, PopoverReference, Theme } from '@mui/material';
import { TreeView } from '@mui/x-tree-view';
import { AppState, IDirectory } from '../redux/reducer';
import { ElementAttributes } from '@gridsuite/commons-ui';
import { UUID } from 'crypto';

const styles = {
    treeViewRoot: (theme: Theme) => ({
        padding: theme.spacing(0.5),
    }),
    treeItemRoot: (theme: Theme) => ({
        userSelect: 'none',
        '&:focus > .MuiTreeItem-content .MuiTreeItem-label, .focused': {
            borderRadius: theme.spacing(2),
            backgroundColor: theme.row.primary,
        },
        '&:hover': {
            borderRadius: theme.spacing(2),
            backgroundColor: theme.row.primary,
        },
    }),
    treeItemSelected: (theme: Theme) => ({
        borderRadius: theme.spacing(2),
        backgroundColor: theme.row.hover,
        fontWeight: 'bold',
    }),
    treeItemContent: (theme: Theme) => ({
        paddingRight: theme.spacing(1),
        paddingLeft: theme.spacing(1),
    }),
    treeItemIconContainer: {
        width: '18px',
        display: 'flex',
        justifyContent: 'center',
    },
    treeItemLabel: (theme: Theme) => ({
        flexGrow: 1,
        overflow: 'hidden',
        paddingRight: theme.spacing(1),
        paddingLeft: theme.spacing(1),
        fontWeight: 'inherit',
        color: 'inherit',
    }),
    treeItemHovered: (theme: Theme) => ({
        backgroundColor: theme.aggrid.highlightColor + '!important',
        borderRadius: 16,
    }),
    treeItemLabelRoot: (theme: Theme) => ({
        display: 'flex',
        alignItems: 'center',
        padding: theme.spacing(0.5, 0),
    }),
    treeItemLabelText: {
        fontWeight: 'inherit',
        flexGrow: 1,
    },
    icon: (theme: Theme) => ({
        marginRight: theme.spacing(1),
        width: '18px',
        height: '18px',
    }),
};

interface DirectoryTreeViewProps {
    treeViewUuid: UUID;
    mapData: Record<string, IDirectory> | undefined;
    onContextMenu: (
        event: React.MouseEvent<HTMLDivElement, MouseEvent>,
        nodeId: UUID | undefined,
        anchorReference: PopoverReference
    ) => void;
    onDirectoryUpdate: (nodeId: UUID, isClose: boolean) => void;
}

const DirectoryTreeView = ({ treeViewUuid, mapData, onContextMenu, onDirectoryUpdate }: DirectoryTreeViewProps) => {
    const dispatch = useDispatch();

    const [expanded, setExpanded] = React.useState<UUID[]>([]);
    const selectedDirectory = useSelector((state: AppState) => state.selectedDirectory);
    const currentPath = useSelector((state: AppState) => state.currentPath);

    const mapDataRef = useRef<Record<string, IDirectory> | undefined>({});
    const expandedRef = useRef<UUID[]>([]);
    const selectedDirectoryRef = useRef<ElementAttributes | null>(null);
    selectedDirectoryRef.current = selectedDirectory;
    expandedRef.current = expanded;
    mapDataRef.current = mapData;

    const ensureInOutExpansion = useCallback(
        (inIds: any[], outIds: any[] = []) => {
            let prevAsSet = new Set(expandedRef.current);
            // if on both side : no-op
            let inIdsSet = new Set(inIds.filter((id) => !outIds.includes(id) && !prevAsSet.has(id)));
            let outIdsSet = new Set(outIds.filter((id) => !inIds.includes(id) && prevAsSet.has(id)));

            if (inIdsSet.size > 0 || outIdsSet.size > 0) {
                let purged = [...prevAsSet].filter((id) => !outIdsSet.has(id));
                let grown = purged.concat(...inIdsSet);
                setExpanded(grown);
            }
        },
        [expandedRef]
    );

    const toggleDirectories = useCallback(
        (ids: UUID[]) => {
            let ins: UUID[] = [];
            let outs: UUID[] = [];
            ids.forEach((id) => {
                if (!expandedRef.current.includes(id)) {
                    ins.push(id);
                } else {
                    outs.push(id);
                }
            });
            ensureInOutExpansion(ins, outs);
        },
        [expandedRef, ensureInOutExpansion]
    );

    /* User interaction */
    function handleContextMenuClick(
        event: React.MouseEvent<HTMLDivElement, MouseEvent>,
        nodeId: UUID | undefined,
        anchorReference: PopoverReference
    ) {
        onContextMenu(event, nodeId, anchorReference);
    }

    function handleLabelClick(nodeId: UUID) {
        if (selectedDirectory?.elementUuid !== nodeId) {
            dispatch(setSelectedDirectory(mapDataRef.current ? mapDataRef.current[nodeId] : null));
        }
        if (!expandedRef.current.includes(nodeId)) {
            // update fold status of item
            toggleDirectories([nodeId]);
        }
    }

    function handleIconClick(nodeId: UUID) {
        onDirectoryUpdate(nodeId, expandedRef.current.includes(nodeId));
        toggleDirectories([nodeId]);
    }

    useEffect(() => {
        if (currentPath.length === 0) {
            return;
        }
        if (currentPath[0].elementUuid !== treeViewUuid) {
            return;
        }
        ensureInOutExpansion(currentPath.map((n) => n.elementUuid));
    }, [currentPath, ensureInOutExpansion, treeViewUuid]);

    /* Handle Rendering */
    const renderTree = (node: ElementAttributes | undefined) => {
        if (!node) {
            return;
        }
        return (
            <CustomTreeItem
                key={node.elementUuid}
                nodeId={node.elementUuid}
                label={
                    <Box
                        sx={styles.treeItemLabelRoot}
                        onContextMenu={(e) => handleContextMenuClick(e, node.elementUuid, 'anchorPosition')}
                    >
                        <Tooltip
                            TransitionComponent={Zoom}
                            disableFocusListener
                            disableTouchListener
                            enterDelay={1000}
                            enterNextDelay={1000}
                            title={node.elementName}
                            arrow
                            placement="bottom-start"
                        >
                            <Typography noWrap sx={styles.treeItemLabelText}>
                                {node.elementName}
                            </Typography>
                        </Tooltip>
                    </Box>
                }
                ContentProps={{
                    onExpand: handleIconClick,
                    onSelect: handleLabelClick,
                    onAddIconClick: handleContextMenuClick,
                    styles: {
                        root: styles.treeItemRoot,
                        selected: styles.treeItemSelected,
                        label: styles.treeItemLabel,
                        hovered: styles.treeItemHovered,
                        iconContainer: styles.treeItemIconContainer,
                    },
                }}
                endIcon={node.subdirectoriesCount > 0 ? <ChevronRightIcon sx={styles.icon} /> : null}
                sx={{
                    content: styles.treeItemContent,
                }}
            >
                {Array.isArray(node.children)
                    ? node.children.map((child) => renderTree(mapDataRef.current?.[child.elementUuid]))
                    : null}
            </CustomTreeItem>
        );
    };

    return (
        <TreeView
            sx={styles.treeViewRoot}
            defaultCollapseIcon={<ExpandMoreIcon sx={styles.icon} />}
            defaultExpandIcon={<ChevronRightIcon sx={styles.icon} />}
            expanded={expanded}
            selected={selectedDirectory ? selectedDirectory.elementUuid : null}
        >
            {renderTree(mapDataRef.current?.[treeViewUuid])}
        </TreeView>
    );
};

export default DirectoryTreeView;
