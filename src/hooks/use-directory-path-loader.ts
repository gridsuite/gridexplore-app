/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback, useRef } from 'react';
import { ElementType, fetchDirectoryContent } from '@gridsuite/commons-ui';
import { UUID } from 'node:crypto';
import { useDispatch, useSelector } from 'react-redux';
import { AppState, IDirectory, ITreeData } from '../redux/types';
import { setSelectedDirectory, setTreeData } from '../redux/actions';
import { updatedTree } from '../components/treeview-utils';
import { AppDispatch } from '../redux/store';

export const useDirectoryPathLoader = () => {
    const dispatch = useDispatch<AppDispatch>();
    const treeData = useSelector((state: AppState) => state.treeData);
    const treeDataRef = useRef<ITreeData>(null);
    treeDataRef.current = treeData;

    const handleDispatchDirectory = useCallback(
        (elementUuidPath: string | undefined) => {
            if (treeDataRef.current && elementUuidPath !== undefined) {
                dispatch(setSelectedDirectory(treeDataRef.current.mapData[elementUuidPath]));
            }
        },
        [dispatch]
    );

    const updateMapData = useCallback(
        (nodeId: string, children: IDirectory[]) => {
            if (!treeDataRef.current) {
                return;
            }
            const [newRootDirectories, newMapData] = updatedTree(
                treeDataRef.current.rootDirectories,
                treeDataRef.current.mapData,
                nodeId,
                children
            );
            dispatch(
                setTreeData({
                    rootDirectories: newRootDirectories,
                    mapData: newMapData,
                    initialized: true,
                })
            );
        },
        [dispatch, treeDataRef]
    );

    const loadPath = useCallback(
        async (uuidPath: string[]) => {
            if (!treeDataRef.current) return;
            // eslint-disable-next-line no-restricted-syntax
            for (const uuid of uuidPath) {
                // eslint-disable-next-line no-await-in-loop
                const resources = await fetchDirectoryContent(uuid as UUID);
                updateMapData(uuid, resources.filter((res) => res.type === ElementType.DIRECTORY) as IDirectory[]);
            }
        },
        [treeDataRef, updateMapData]
    );
    return { loadPath, handleDispatchDirectory };
};
