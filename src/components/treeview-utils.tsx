/*
 * Copyright © 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { UUID } from 'crypto';
import { IDirectory } from '../redux/types';

export function buildPathToFromMap(nodeId: UUID | undefined, mapDataRef: Record<string, IDirectory> | undefined) {
    const path = [];
    if (mapDataRef && nodeId) {
        let currentUuid: UUID | null = nodeId ?? null;
        while (currentUuid != null && mapDataRef[currentUuid] !== undefined) {
            path.unshift({ ...mapDataRef[currentUuid] });
            currentUuid = mapDataRef[currentUuid].parentUuid;
        }
    }
    return path;
}

function flattenDownNodes(n: IDirectory, cef: (arg: IDirectory) => any[]): IDirectory[] {
    const subs = cef(n);
    if (subs.length === 0) {
        return [n];
    }
    return Array.prototype.concat([n], ...subs.map((sn) => flattenDownNodes(sn, cef)));
}

function refreshedUpNodes(m: Record<string, IDirectory> | undefined, nn: IDirectory | undefined): IDirectory[] {
    if (!nn?.elementUuid) {
        return [];
    }
    if (nn.parentUuid === null) {
        return [nn];
    }
    const parent: IDirectory | undefined = m?.[nn.parentUuid];
    const nextChildren: any[] = parent?.children.map((c) => (c.elementUuid === nn.elementUuid ? nn : c)) ?? [];
    const nextParent: any = { ...parent, children: nextChildren };
    return [nn, ...refreshedUpNodes(m, nextParent)];
}

/**
 * Make an updated tree [root_nodes, id_to_node] from previous tree and new {id, children}
 * @param prevRoots previous [root nodes]
 * @param prevMap previous map (js object) uuid to children nodes
 * @param nodeId uuid of the node to update children, may be null or undefined (means root)
 * @param children new value of the node children (shallow nodes)
 */
export function updatedTree(
    prevRoots: IDirectory[],
    prevMap: Record<string, IDirectory>,
    nodeId: string | null,
    children: IDirectory[]
): [IDirectory[], Record<string, IDirectory>] {
    // In case of node change parent, we store the old parent uuid
    let oldParentUuidOfReparentedChildren: UUID | null = null;

    const nextChildren = children
        .sort((a, b) => a.elementName.localeCompare(b.elementName))
        .map((n) => {
            const pn = prevMap[n.elementUuid];
            if (!pn) {
                // new child, then add it
                return { ...n, children: [], parentUuid: nodeId };
            }
            if (
                n.elementName === pn.elementName &&
                n.subdirectoriesCount === pn.subdirectoriesCount &&
                nodeId === pn.parentUuid
            ) {
                // existing child, nothing has changed, keep existing one
                return pn;
            }
            // existing child, but something has changed, update it
            if (pn.parentUuid !== nodeId) {
                // if the parent has changed, we will need to update the previous parent later
                console.debug(`reparent ${pn.parentUuid} -> ${nodeId}`);
                // There can be only one parent because one action move multiple elements from
                // one directory to another not multiple directories at once
                oldParentUuidOfReparentedChildren = pn.parentUuid;
            }
            return {
                ...pn,
                elementName: n.elementName,
                subdirectoriesCount: n.subdirectoriesCount,
                parentUuid: nodeId,
            };
        });
    const prevChildren = nodeId ? prevMap[nodeId]?.children : prevRoots;

    if (prevChildren?.length === nextChildren.length && prevChildren.every((e, i) => e === nextChildren[i])) {
        return [prevRoots, prevMap];
    }

    const nextUuids = new Set(children ? children.map((n) => n.elementUuid) : []);
    const prevUuids = prevChildren ? prevChildren.map((n) => n.elementUuid) : [];
    const mayNodeId = nodeId ? [nodeId] : [];

    const nonCopyUuids = new Set([
        ...nextUuids,
        ...mayNodeId,
        ...Array.prototype.concat(
            ...prevUuids
                .filter((u) => !nextUuids.has(u))
                .map((u) => flattenDownNodes(prevMap[u], (n: IDirectory) => n.children).map((n) => n.elementUuid))
        ),
    ]);

    const prevNode = nodeId && prevMap ? prevMap[nodeId] : {};
    const nextNode = {
        elementUuid: nodeId,
        parentUuid: null,
        ...prevNode,
        children: nextChildren,
        subdirectoriesCount: nextChildren.length,
    };

    let oldParentWithUpdatedChildren = null;

    if (oldParentUuidOfReparentedChildren && prevMap) {
        // if we have oldParentUuidOfReparentedChildren (at least one child has changed their parent), we get the old parent from the previous map
        const oldParentOfReparentedChildren: IDirectory = prevMap[oldParentUuidOfReparentedChildren];

        // We remove from the children list of the old parent, the children that have been reparented to the current node (nodeId)
        const nextOldParentChildren = oldParentOfReparentedChildren?.children?.filter(
            (previousChild) => !nextUuids.has(previousChild.elementUuid)
        );

        // we create the updated old parent of the reparented children
        oldParentWithUpdatedChildren = {
            ...oldParentOfReparentedChildren,
            children: nextOldParentChildren, // override children
            subdirectoriesCount: nextOldParentChildren.length, // recompute
        };
    }

    const nextMap: Record<string, IDirectory> = Object.fromEntries([
        ...Object.entries(prevMap).filter(([k]) => !nonCopyUuids.has(k)),
        ...nextChildren.map((n) => [n.elementUuid, n]),
        ...refreshedUpNodes(prevMap, nextNode as IDirectory).map((n: any) => [n.elementUuid, n]),
        ...(oldParentWithUpdatedChildren
            ? refreshedUpNodes(prevMap, oldParentWithUpdatedChildren as IDirectory).map((n: any) => [n.elementUuid, n])
            : []),
    ]);

    const nextRoots: IDirectory[] = (
        nodeId === null ? nextChildren : prevRoots?.map((r) => nextMap[r.elementUuid])
    ) as IDirectory[];

    return [nextRoots, nextMap];
}
