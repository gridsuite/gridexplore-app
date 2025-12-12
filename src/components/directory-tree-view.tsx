/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { MouseEvent as ReactMouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import { ChevronRight as ChevronRightIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { type PopoverReference } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { SimpleTreeView } from '@mui/x-tree-view';
import { type ElementAttributes } from '@gridsuite/commons-ui';
import type { UUID } from 'node:crypto';
import { setSelectedDirectory } from '../redux/actions';
import { AppState } from '../redux/types';
import { styles } from './treeview-utils';
import CustomTreeItem from './custom-tree-item';

function CustomEndIcon() {
    return <ChevronRightIcon sx={styles.icon} />;
}
function CustomCollapseIcon() {
    return <ExpandMoreIcon sx={styles.icon} />;
}

export interface DirectoryTreeViewProps {
    treeViewUuid: UUID;
    mapData: Record<string, ElementAttributes> | undefined;
    onContextMenu: (
        event: ReactMouseEvent<HTMLDivElement | HTMLButtonElement, MouseEvent>,
        nodeId: UUID,
        anchorReference: PopoverReference
    ) => void;
    onDirectoryUpdate: (nodeId: UUID, isClose: boolean, isDirectoryMoving: boolean) => void;
}

export default function DirectoryTreeView({
    treeViewUuid,
    mapData,
    onContextMenu,
    onDirectoryUpdate,
}: Readonly<DirectoryTreeViewProps>) {
    const dispatch = useDispatch();

    const [expanded, setExpanded] = useState<UUID[]>([]);
    const selectedDirectory = useSelector((state: AppState) => state.selectedDirectory);
    const currentPath = useSelector((state: AppState) => state.currentPath);

    const mapDataRef = useRef<Record<string, ElementAttributes> | undefined>({});
    const expandedRef = useRef<UUID[]>([]);
    const selectedDirectoryRef = useRef<ElementAttributes | null>(null);
    selectedDirectoryRef.current = selectedDirectory;
    expandedRef.current = expanded;
    mapDataRef.current = mapData;

    const ensureInOutExpansion = useCallback(
        (inIds: any[], outIds: any[] = []) => {
            const prevAsSet = new Set(expandedRef.current);
            // if on both side : no-op
            const inIdsSet = new Set(inIds.filter((id) => !outIds.includes(id) && !prevAsSet.has(id)));
            const outIdsSet = new Set(outIds.filter((id) => !inIds.includes(id) && prevAsSet.has(id)));

            if (inIdsSet.size > 0 || outIdsSet.size > 0) {
                const purged = [...prevAsSet].filter((id) => !outIdsSet.has(id));
                const grown = purged.concat(...inIdsSet);
                setExpanded(grown);
            }
        },
        [expandedRef]
    );

    const toggleDirectories = useCallback(
        (ids: UUID[]) => {
            const ins: UUID[] = [];
            const outs: UUID[] = [];
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
    const handleLabelClick = useCallback(
        (nodeId: UUID) => {
            if (selectedDirectory?.elementUuid !== nodeId) {
                dispatch(setSelectedDirectory(mapDataRef.current ? mapDataRef.current[nodeId] : null));
            }
            if (!expandedRef.current.includes(nodeId)) {
                // update fold status of item
                toggleDirectories([nodeId]);
            }
        },
        [dispatch, selectedDirectory?.elementUuid, toggleDirectories]
    );

    const handleIconClick = useCallback(
        (nodeId: UUID) => {
            onDirectoryUpdate(nodeId, expandedRef.current.includes(nodeId), false);
            toggleDirectories([nodeId]);
        },
        [onDirectoryUpdate, toggleDirectories]
    );

    useEffect(() => {
        if (currentPath.length === 0) {
            return;
        }
        if (currentPath[0].elementUuid !== treeViewUuid) {
            return;
        }
        ensureInOutExpansion(currentPath.map((n) => n.elementUuid));
    }, [currentPath, ensureInOutExpansion, treeViewUuid]);

    return (
        <SimpleTreeView
            expandedItems={expanded}
            selectedItems={selectedDirectory ? selectedDirectory.elementUuid : null}
            slots={{ collapseIcon: CustomCollapseIcon, expandIcon: CustomEndIcon }}
        >
            {mapDataRef.current?.[treeViewUuid] && (
                <CustomTreeItem
                    node={mapDataRef.current[treeViewUuid]}
                    onExpand={handleIconClick}
                    onSelect={handleLabelClick}
                    onContextMenu={onContextMenu}
                />
            )}
        </SimpleTreeView>
    );
}
