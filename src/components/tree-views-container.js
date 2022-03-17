/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    setActiveDirectory,
    setCurrentChildren,
    setCurrentPath,
    setSelectedDirectory,
} from '../redux/actions';

import {
    connectNotificationsWsUpdateStudies,
    fetchDirectoryContent,
    fetchRootFolders,
} from '../utils/rest-api';

import DirectoryTreeView from './directory-tree-view';

import { displayErrorMessageWithSnackbar, useIntlRef } from '../utils/messages';
import { useSnackbar } from 'notistack';
import { ElementType } from '../utils/elementType';
import { notificationType } from '../utils/notificationType';

import * as constants from '../utils/UIconstants';
// Menu
import DirectoryTreeContextualMenu from './menus/directory-tree-contextual-menu';

const initialMousePosition = {
    mouseX: null,
    mouseY: null,
};

Object.fromEntries =
    Object.fromEntries ||
    ((arr) =>
        arr.reduce((acc, [k, v]) => {
            acc[k] = v;
            return acc;
        }, {}));

function buildPathToFromMap(nodeId, mapDataRef) {
    let path = [];
    if (mapDataRef && nodeId) {
        let currentUuid = nodeId;
        while (currentUuid != null && mapDataRef[currentUuid] !== undefined) {
            path.unshift({ ...mapDataRef[currentUuid] });
            currentUuid = mapDataRef[currentUuid].parentUuid;
        }
    }
    return path;
}

function flattenDownNodes(n, cef) {
    const subs = cef(n);
    if (subs.length === 0) return [n];
    const ret = Array.prototype.concat(
        [n],
        ...subs.map((sn) => flattenDownNodes(sn, cef))
    );
    return ret;
}

function refreshedUpNodes(m, nn) {
    if (!nn?.elementUuid) return [];
    if (nn.parentUuid === null) return [nn];
    const parent = m[nn.parentUuid];
    const nextChildren = parent.children.map((c) =>
        c.elementUuid === nn.elementUuid ? nn : c
    );
    const nextParent = { ...parent, children: nextChildren };
    return [nn, ...refreshedUpNodes(m, nextParent)];
}

/**
 * Make an updated tree [root_nodes, id_to_node] from previous tree and new {id, children}
 * @param prevRoots previous [root nodes]
 * @param prevMap previous map (js object) uuid to children nodes
 * @param nodeId uuid of the node to update children, may be null or undefined (means root)
 * @param children new value of the node children (shallow nodes)
 */
function updatedTree(prevRoots, prevMap, nodeId, children) {
    const nextChildren = children
        .sort((a, b) => a.elementName.localeCompare(b.elementName))
        .map((n) => {
            let pn = prevMap[n.elementUuid];
            if (!pn) {
                return { ...n, children: [], parentUuid: nodeId };
            } else if (
                n.elementName === pn.elementName &&
                n.accessRights === pn.accessRights &&
                n.subdirectoriesCount === pn.subdirectoriesCount
            ) {
                return pn;
            } else {
                return {
                    ...pn,
                    elementName: n.elementName,
                    accessRights: n.accessRights,
                    subdirectoriesCount: n.subdirectoriesCount,
                };
            }
        });

    const prevChildren = nodeId ? prevMap[nodeId]?.children : prevRoots;
    if (
        prevChildren?.length === nextChildren.length &&
        !prevChildren.every((e, i) => e === nextChildren[i])
    ) {
        return [prevRoots, prevMap];
    }

    let nextUuids = new Set(children ? children.map((n) => n.elementUuid) : []);
    let prevUuids = prevChildren ? prevChildren.map((n) => n.elementUuid) : [];
    let mayNodeId = nodeId ? [nodeId] : [];

    let nonCopyUuids = new Set([
        ...nextUuids,
        ...mayNodeId,
        ...Array.prototype.concat(
            ...prevUuids
                .filter((u) => !nextUuids.has(u))
                .map((u) =>
                    flattenDownNodes(prevMap[u], (n) => n.children).map(
                        (n) => n.elementUuid
                    )
                )
        ),
    ]);

    const prevNode = nodeId ? prevMap[nodeId] : {};
    const nextNode = {
        elementUuid: nodeId,
        parentUuid: null,
        ...prevNode,
        children: nextChildren,
    };

    const nextMap = Object.fromEntries([
        ...Object.entries(prevMap).filter(([k, v], i) => !nonCopyUuids.has(k)),
        ...nextChildren.map((n) => [n.elementUuid, n]),
        ...refreshedUpNodes(prevMap, nextNode).map((n) => [n.elementUuid, n]),
    ]);

    const nextRoots =
        nodeId === null
            ? nextChildren
            : prevRoots.map((r) => nextMap[r.elementUuid]);

    const ret = [nextRoots, nextMap];

    return ret;
}

const TreeViewsContainer = () => {
    const intlRef = useIntlRef();
    const dispatch = useDispatch();

    const [rootDirectories, setRootDirectories] = useState([]);
    const [mapData, setMapData] = useState({});

    const user = useSelector((state) => state.user);
    const selectedDirectory = useSelector((state) => state.selectedDirectory);
    const activeDirectory = useSelector((state) => state.activeDirectory);

    const uploadingStudies = useSelector((state) => state.uploadingStudies);
    const currentChildren = useSelector((state) => state.currentChildren);
    const currentChildrenRef = useRef(currentChildren);
    currentChildrenRef.current = currentChildren;

    const mapDataRef = useRef({});
    mapDataRef.current = mapData;

    const rootsRef = useRef([]);
    rootsRef.current = rootDirectories;

    const selectedDirectoryRef = useRef({});
    selectedDirectoryRef.current = selectedDirectory;

    const [DOMFocusedDirectory, setDOMFocusedDirectory] = useState(null);

    const wsRef = useRef();

    const { enqueueSnackbar } = useSnackbar();

    /**
     * Contextual Menus
     */
    const [openDirectoryMenu, setOpenDirectoryMenu] = React.useState(false);

    const handleOpenDirectoryMenu = (event) => {
        setOpenDirectoryMenu(true);
        event.stopPropagation();
    };
    const handleCloseDirectoryMenu = (e, nextSelectedDirectoryId = null) => {
        setOpenDirectoryMenu(false);
        if (
            nextSelectedDirectoryId !== null &&
            mapDataRef.current &&
            mapDataRef.current[nextSelectedDirectoryId]
        ) {
            dispatch(
                setSelectedDirectory(
                    mapDataRef.current[nextSelectedDirectoryId]
                )
            );
        }
        //so it removes the style that we added ourselves
        if (DOMFocusedDirectory !== null) {
            DOMFocusedDirectory.classList.remove('focused');
            setDOMFocusedDirectory(null);
        }
    };

    /* Menu states */
    const [mousePosition, setMousePosition] =
        React.useState(initialMousePosition);

    /* User interactions */
    const onContextMenu = useCallback(
        (event, nodeId) => {
            //to keep the focused style (that is normally lost when opening a contextual menu)
            event.currentTarget.parentNode.classList.add('focused');
            setDOMFocusedDirectory(event.currentTarget.parentNode);

            dispatch(setActiveDirectory(nodeId));

            setMousePosition({
                mouseX: event.clientX + constants.HORIZONTAL_SHIFT,
                mouseY: event.clientY + constants.VERTICAL_SHIFT,
            });
            handleOpenDirectoryMenu(event);
        },
        [dispatch]
    );

    /* RootDirectories management */
    const updateRootDirectories = useCallback(() => {
        fetchRootFolders()
            .then((data) => {
                let [nrs, mdr] = updatedTree(
                    rootsRef.current,
                    mapDataRef.current,
                    null,
                    data
                );
                setRootDirectories(nrs);
                setMapData(mdr);
            })
            .catch((reason) => {
                console.warn('Could not fetch roots ' + reason);
            });
    }, []);

    /* rootDirectories initialization */
    useEffect(() => {
        if (user != null) {
            updateRootDirectories();
        }
    }, [user, updateRootDirectories]);

    /* Manage current path data */
    const updatePath = useCallback(
        (nodeId) => {
            let path = buildPathToFromMap(nodeId, mapData);
            dispatch(setCurrentPath(path));
        },
        [dispatch, mapData]
    );

    useEffect(() => {
        updatePath(selectedDirectoryRef.current?.elementUuid);
    }, [mapData, updatePath, selectedDirectory]);

    const insertContent = useCallback(
        (nodeId, childrenToBeInserted) => {
            let [nrs, mdr] = updatedTree(
                rootsRef.current,
                mapDataRef.current,
                nodeId,
                childrenToBeInserted
            );
            setRootDirectories(nrs);
            setMapData(mdr);
        },
        [mapDataRef]
    );

    const updateMapData = useCallback(
        (nodeId, children) => {
            let newSubdirectories = children.filter(
                (child) => child.type === ElementType.DIRECTORY
            );

            let prevPath = buildPathToFromMap(
                selectedDirectoryRef.current?.elementUuid,
                mapDataRef.current
            );

            let prevSubInPath = prevPath.find((n) => n.parentUuid === nodeId);
            let hasToChangeSelected =
                prevSubInPath !== undefined &&
                children.find(
                    (n) => n.elementUuid === prevSubInPath.elementUuid
                ) === undefined;

            insertContent(nodeId, newSubdirectories);
            if (hasToChangeSelected) {
                // if selected directory (possibly via ancestor)
                // is deleted by another user
                // we should select (closest still existing) parent directory
                dispatch(setSelectedDirectory(mapDataRef.current[nodeId]));
            }
        },
        [insertContent, selectedDirectoryRef, mapDataRef, dispatch]
    );

    const mergeCurrentAndUploading = useCallback(
        (current) => {
            let toMerge = Object.values(uploadingStudies).filter(
                (e) =>
                    e.directory === selectedDirectoryRef.current.elementUuid &&
                    current[e.elementName] === undefined
            );

            if (toMerge != null && toMerge.length > 0) {
                return [...current, ...toMerge].sort(function (a, b) {
                    return a.elementName.localeCompare(b.elementName);
                });
            } else {
                if (current == null) {
                    return null;
                } else {
                    return [...current].sort(function (a, b) {
                        return a.elementName.localeCompare(b.elementName);
                    });
                }
            }
        },
        [uploadingStudies, selectedDirectoryRef]
    );

    /* currentChildren management */
    const updateCurrentChildren = useCallback(
        (children) => {
            dispatch(
                setCurrentChildren(
                    mergeCurrentAndUploading(
                        children.filter(
                            (child) => child.type !== ElementType.DIRECTORY
                        )
                    )
                )
            );
        },
        [dispatch, mergeCurrentAndUploading]
    );

    const updateDirectoryTreeAndContent = useCallback(
        (nodeId) => {
            fetchDirectoryContent(nodeId)
                .then((childrenToBeInserted) => {
                    // update directory Content
                    updateCurrentChildren(childrenToBeInserted);
                    // Update Tree Map data
                    updateMapData(nodeId, childrenToBeInserted);
                })
                .catch((reason) => {
                    console.warn(
                        "Could not update subs (and content) of '" +
                            nodeId +
                            "' :" +
                            reason
                    );
                    updateMapData(nodeId, []);
                });
        },
        [updateCurrentChildren, updateMapData]
    );

    useEffect(() => {
        dispatch(
            setCurrentChildren(
                mergeCurrentAndUploading(currentChildrenRef.current)
            )
        );
    }, [currentChildrenRef, mergeCurrentAndUploading, dispatch]);

    const updateDirectoryTree = useCallback(
        (nodeId) => {
            fetchDirectoryContent(nodeId)
                .then((childrenToBeInserted) => {
                    // Update Tree Map data
                    updateMapData(nodeId, childrenToBeInserted);
                })
                .catch((reason) => {
                    console.warn(
                        "Could not update subs of '" + nodeId + "' :" + reason
                    );
                    updateMapData(nodeId, []);
                });
        },
        [updateMapData]
    );

    /* Manage Studies updating with Web Socket */
    const displayErrorIfExist = useCallback(
        (error, studyName) => {
            if (error) {
                displayErrorMessageWithSnackbar({
                    errorMessage: error,
                    enqueueSnackbar: enqueueSnackbar,
                    headerMessage: {
                        headerMessageId: 'studyCreatingError',
                        headerMessageValues: { studyName: studyName },
                        intlRef: intlRef,
                    },
                });
            }
        },
        [enqueueSnackbar, intlRef]
    );

    useEffect(() => {
        // create ws at mount event
        wsRef.current = connectNotificationsWsUpdateStudies();

        wsRef.current.onclose = function () {
            console.error('Unexpected Notification WebSocket closed');
        };
        wsRef.current.onerror = function (event) {
            console.error('Unexpected Notification WebSocket error', event);
        };
        // We must save wsRef.current in a variable to make sure that when close is called it refers to the same instance.
        // That's because wsRef.current could be modify outside of this scope.
        const wsToClose = wsRef.current;
        // cleanup at unmount event
        return () => {
            wsToClose.close();
        };
    }, []);

    const onUpdateStudies = useCallback(
        (event) => {
            console.debug('Received Update Studies notification', event);
            let eventData = JSON.parse(event.data);
            if (!eventData.headers) {
                return;
            }

            const notificationTypeH = eventData.headers['notificationType'];
            const isRootDirectory = eventData.headers['isRootDirectory'];
            const directoryUuid = eventData.headers['directoryUuid'];
            const error = eventData.headers['error'];
            const elementName = eventData.headers['elementName'];

            displayErrorIfExist(error, elementName);

            if (isRootDirectory) {
                updateRootDirectories();
                if (
                    selectedDirectoryRef.current != null && // nothing to do if nothing already selected
                    notificationTypeH === notificationType.DELETE_DIRECTORY &&
                    selectedDirectoryRef.current.elementUuid === directoryUuid
                ) {
                    dispatch(setSelectedDirectory(null));
                }
                return;
            }
            if (directoryUuid) {
                // Remark : It could be a Uuid of a rootDirectory if we need to update it because its content update
                // if dir is actually selected then call updateDirectoryTreeAndContent of this dir
                // else expanded or not then updateDirectoryTree
                if (selectedDirectoryRef.current != null) {
                    if (
                        directoryUuid ===
                        selectedDirectoryRef.current.elementUuid
                    ) {
                        updateDirectoryTreeAndContent(directoryUuid);
                        return; // break here
                    }
                }
                updateDirectoryTree(directoryUuid);
            }
        },
        [
            dispatch,
            displayErrorIfExist,
            updateDirectoryTree,
            updateDirectoryTreeAndContent,
            updateRootDirectories,
        ]
    );

    useEffect(() => {
        if (!wsRef.current) return;

        // Update onmessage of ws when needed.
        wsRef.current.onmessage = onUpdateStudies;
    }, [onUpdateStudies]);

    /* Handle components synchronization */
    useEffect(() => {
        if (selectedDirectory) {
            console.debug(
                'useEffect over selectedDirectory',
                selectedDirectory.elementUuid
            );
            updateDirectoryTreeAndContent(selectedDirectory.elementUuid);
        }
    }, [selectedDirectory, updateDirectoryTreeAndContent]);

    const getActiveDirectory = () => {
        if (mapDataRef.current && mapDataRef.current[activeDirectory]) {
            return mapDataRef.current[activeDirectory];
        } else {
            return null;
        }
    };

    return (
        <>
            <div
                style={{
                    height: '100%',
                }}
                onMouseDownCapture={(e) => {
                    if (
                        e.button === constants.MOUSE_EVENT_RIGHT_BUTTON &&
                        openDirectoryMenu // This means ctx menu is openned
                    ) {
                        handleCloseDirectoryMenu(e, null);
                    }
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                    }}
                    onContextMenu={(e) => onContextMenu(e, null)}
                >
                    {mapDataRef.current &&
                        rootDirectories.map((rootDirectory) => (
                            <DirectoryTreeView
                                key={rootDirectory.elementUuid}
                                treeViewUuid={rootDirectory.elementUuid}
                                mapData={mapDataRef.current}
                                onContextMenu={onContextMenu}
                                onDirectoryUpdate={updateDirectoryTree}
                            />
                        ))}
                </div>
                <DirectoryTreeContextualMenu
                    directory={getActiveDirectory()}
                    open={openDirectoryMenu}
                    onClose={(e) => handleCloseDirectoryMenu(e, null)}
                    anchorReference="anchorPosition"
                    anchorPosition={
                        mousePosition.mouseY !== null &&
                        mousePosition.mouseX !== null
                            ? {
                                  top: mousePosition.mouseY,
                                  left: mousePosition.mouseX,
                              }
                            : undefined
                    }
                />
            </div>
        </>
    );
};

export { updatedTree };
export default TreeViewsContainer;
