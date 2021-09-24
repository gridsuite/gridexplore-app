/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { elementType } from './elementType';

function makeError(msg, ...rest) {
    if (rest !== undefined) console.error(msg, ...rest);
    else console.error(msg);
    return { errors: [msg + rest] };
}

/**
 * Returns "the first difference" between two objects as path of string to the first found difference.
 * Otherwise (ie they are deeply equal) : null.
 * @param a first object
 * @param b second object
 * @param fos possible collection of filed names that are not take into account for the difference.
 * @returns {string|null}
 */
function firstDiffExcept(a, b, ...fos) {
    let ak = Object.keys(a)
        .filter((it) => fos.indexOf(it) < 0)
        .sort();
    let bk = Object.keys(b)
        .filter((it) => fos.indexOf(it) < 0)
        .sort();
    let mini = ak.length < bk.length ? ak.length : bk.length;
    for (let i = 0; i < mini; i++) {
        if (ak[i] !== bk[i]) return bk[i];

        let ao = a[ak[i]];
        let bo = b[bk[i]];
        if (ao === bo) continue;

        if (typeof ao !== typeof bo) return ak[i];
        if ('object' !== typeof ao) {
            return ak[i];
        } else {
            let subdiff = firstDiffExcept(ao, bo, ...fos);
            if (subdiff) return ak[i] + '.' + subdiff;
        }
    }

    if (ak.length === bk.length) return null;
    else if (ak.length > bk.length) return ak[mini];
    else return bk[mini];
}

function initRoot(sortedChildren) {
    let nextChildren = sortedChildren.map((sc) => {
        return {
            ...sc,
            children: [],
            parentUuid: null,
            rootUuid: sc.elementUuid,
        };
    });

    let silentRoot = {
        elementUuid: null,
        children: nextChildren,
        parentUuid: null,
        rootUuid: null,
    };

    return {
        root: silentRoot,
    };
}

function searchUpdateDown(prevNode, parentId, sortedChildren, deletesAbs) {
    // see if has to update prev children
    for (let childIdx in prevNode.children) {
        let child = prevNode.children[childIdx];
        let locRet = recursUpdate(child, parentId, sortedChildren, deletesAbs);
        let { update, added, deleted, ...rest } = locRet;

        // we assume update can happen only on one path
        if (update || added || deleted) {
            let nextNode = { ...prevNode };
            let nextChildren = [...prevNode.children];
            nextChildren.splice(childIdx, 1, update[0]);
            nextNode.children = nextChildren;
            let nextUpdate = [];
            if (prevNode.elementUuid) nextUpdate.push(nextNode);
            if (update && update.length > 0)
                nextUpdate.splice(nextUpdate.length, 0, ...update);

            let ret = {
                ...rest,
                root: !prevNode.elementUuid ? nextNode : undefined,
                //root: nextNode,
                update: nextUpdate,
                added: added,
                deleted: deleted,
            };
            return ret;
        }
    }

    return { keep: prevNode, root: parentId ? prevNode : undefined };
}

function makeAddedChild(serverChild, parentId, prevNode) {
    return {
        ...serverChild,
        children: [],
        parentUuid: parentId,
        rootUuid: prevNode.elementUuid == null ? parentId : prevNode.rootUuid,
    };
}

function keepOrUpdateChild(prevChild, serverChild, parentId, prevNode) {
    let firstDiff = firstDiffExcept(
        prevChild,
        serverChild,
        'children',
        'parentUuid',
        'rootUuid'
    );

    if (firstDiff == null) {
        return prevChild;
    } else {
        let nextChild = { ...serverChild };
        nextChild.children = prevChild.children;
        nextChild.parentUuid = parentId;
        nextChild.rootUuid =
            prevNode.elementUuid == null ? parentId : prevNode.rootUuid;
        return nextChild;
    }
}

function updateNodeWithChildren(prevNode, parentId, sortedChildren, deletes) {
    let nextChildren = [];
    let addedChildren = [];
    let updatedChildren = [];
    let deletedChildren = [];

    for (let serverChild of sortedChildren) {
        let mayPrevChild = prevNode.children.filter(
            (cc) => cc.elementUuid === serverChild.elementUuid
        );

        let nextChild;
        if (mayPrevChild.length === 0) {
            nextChild = makeAddedChild(serverChild, parentId, prevNode);
            addedChildren.push(nextChild);
        } else {
            let prevChild = mayPrevChild[0];
            nextChild = keepOrUpdateChild(
                prevChild,
                serverChild,
                parentId,
                prevNode
            );
            if (nextChild !== prevChild) {
                updatedChildren.unshift(nextChild);
            }
        }
        nextChildren.push(nextChild);
    }

    if (deletes)
        for (let prevChild of prevNode.children) {
            let mayNewChild = sortedChildren.filter(
                (sc) => sc.elementUuid === prevChild.elementUuid
            );
            if (mayNewChild.length === 0) deletedChildren.push(mayNewChild[0]);
        }

    if (
        addedChildren.length === 0 &&
        updatedChildren.length === 0 &&
        deletedChildren.length === 0
    ) {
        return {
            keep: prevNode,
            root: parentId === null ? prevNode : undefined,
        };
    } else {
        let nextNode = { ...prevNode, children: nextChildren };
        return {
            root: parentId === null ? nextNode : undefined,
            added: addedChildren.length > 0 ? addedChildren : undefined,
            deleted: deletedChildren.length > 0 ? deletedChildren : undefined,
            update: [nextNode, ...updatedChildren],
        };
    }
}

function downTreeFrom(node, visitFunc) {
    if (!node.children) console.error('node: ', node);
    visitFunc(node);
    for (let child of node.children) {
        downTreeFrom(child, visitFunc);
    }
}

/**
 * prevNode may be null for start, then {parentUuid, rootUuid, children, elementUuid, elementName, acccessRights, ...}
 * parentId may be null (for silent root) or? undefined (free recursing of prev) or string
 * serverChildren is an array of object {elementUuid, elementName, owner, accessRights, ...} sorted by elementName
 * deletes false when odding a child from this client
 * returns {errors?:[], update?:clientNode, deletions?:[], additions?:[], keep:clientNode}
 */
function recursUpdate(prevNode, parentId, serverChildren, deletes) {
    if (!Array.isArray(serverChildren))
        return makeError('not array serverChildren ', serverChildren);

    let children;
    if (prevNode && prevNode.elementUuid !== null) {
        children = serverChildren;
    } else {
        let newSubdirectories = serverChildren.filter(
            (child) => child.type === elementType.DIRECTORY
        );
        newSubdirectories.sort(function (a, b) {
            return a.elementName.localeCompare(b.elementName);
        });
        children = newSubdirectories;
    }

    if (!prevNode && parentId === null) {
        return initRoot(children);
    } else if (!prevNode) {
        return makeError('!prevNode, parId != null ', parentId, serverChildren);
    } else if (parentId === undefined) {
        return makeError('prevNode but parId undef', parentId, serverChildren);
    } else if (prevNode.elementUuid !== parentId) {
        return searchUpdateDown(prevNode, parentId, children, deletes);
    } else {
        return updateNodeWithChildren(prevNode, parentId, children, deletes);
    }
}

export function updatedNodeStore(
    nodeStore,
    parentId,
    serverChildren,
    deletes = true
) {
    let { silentRoot: prevSilentRoot, byRootIdToNode: prevByRootIdToNode } =
        nodeStore;
    let recRet = recursUpdate(
        prevSilentRoot,
        parentId,
        serverChildren,
        deletes
    );
    let { root: silentRoot, errors, update, keep } = recRet;

    if (errors) return undefined;

    if (!silentRoot && !keep) {
        console.error('no new root !', recRet);
        return undefined;
    }

    if (prevSilentRoot !== undefined && !update) {
        return undefined;
    }

    let nextByRootIdToNode = {};
    let nextAllIdToNode = {};
    for (let root of silentRoot.children) {
        let idToNode = {};
        downTreeFrom(root, (n) => {
            idToNode[n.elementUuid] = n;
            nextAllIdToNode[n.elementUuid] = n;
        });
        let canUsePrev = true;
        if (prevByRootIdToNode === undefined) canUsePrev = false;
        else if (update && update[1] === root) canUsePrev = false;
        else if (!prevByRootIdToNode[root.elementUuid]) canUsePrev = false;

        if (!canUsePrev) {
            nextByRootIdToNode[root.elementUuid] = idToNode;
        } else {
            nextByRootIdToNode[root.elementUuid] =
                prevByRootIdToNode[root.elementUuid];
        }
    }
    let ret = {
        silentRoot: silentRoot,
        allIdToNode: nextAllIdToNode,
        byRootIdToNode: nextByRootIdToNode,
    };

    return ret;
}

export function makePathFromTip(nodeId, nodeMap) {
    if (!nodeMap) return undefined;
    let path = [];
    let node = nodeMap[nodeId];
    while (node && node.elementUuid) {
        path.unshift({
            elementUuid: node.elementUuid,
            elementName: node.elementName,
        });
        node = nodeMap[node.parentUuid];
    }
    return path;
}

export default updatedNodeStore;
