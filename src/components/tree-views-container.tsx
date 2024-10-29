/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    directoryUpdated,
    setActiveDirectory,
    setCurrentChildren,
    setCurrentPath,
    setSelectedDirectory,
    setTreeData,
    setUploadingElements,
} from '../redux/actions';

import { connectNotificationsWsUpdateDirectories } from '../utils/rest-api';
import DirectoryTreeView from './directory-tree-view';
import {
    ElementAttributes,
    ElementType,
    fetchDirectoryContent,
    fetchRootFolders,
    useSnackMessage,
} from '@gridsuite/commons-ui';
import { notificationType } from '../utils/notificationType';

import * as constants from '../utils/UIconstants';
// Menu
import DirectoryTreeContextualMenu from './menus/directory-tree-contextual-menu';
import { AppState, IDirectory, ITreeData, UploadingElement } from '../redux/reducer';
import { UUID } from 'crypto';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { PopoverReference } from '@mui/material';

const initialMousePosition = {
    mouseX: null,
    mouseY: null,
};

export function buildPathToFromMap(nodeId: UUID | undefined, mapDataRef: Record<string, IDirectory> | undefined) {
    let path = [];
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
    const ret = Array.prototype.concat([n], ...subs.map((sn) => flattenDownNodes(sn, cef)));
    return ret;
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

function mapFromRoots(roots: IDirectory[]): Record<string, IDirectory> {
    return Object.fromEntries(
        Array.prototype
            .concat(roots, ...roots.map((r) => flattenDownNodes(r, (n) => n.children)))
            .map((n) => [n.elementUuid, n])
    );
}

/**
 * Make an updated tree [root_nodes, id_to_node] from previous tree and new {id, children}
 * @param prevRoots previous [root nodes]
 * @param prevMap previous map (js object) uuid to children nodes
 * @param nodeId uuid of the node to update children, may be null or undefined (means root)
 * @param children new value of the node children (shallow nodes)
 */
function updatedTree(
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
            let pn = prevMap[n.elementUuid];
            if (!pn) {
                // new child, then add it
                return { ...n, children: [], parentUuid: nodeId };
            } else if (
                n.elementName === pn.elementName &&
                n.subdirectoriesCount === pn.subdirectoriesCount &&
                nodeId === pn.parentUuid
            ) {
                // existing child, nothing has changed, keep existing one
                return pn;
            } else {
                // existing child, but something has changed, update it
                if (pn.parentUuid !== nodeId) {
                    // if the parent has changed, we will need to update the previous parent later
                    console.debug('reparent ' + pn.parentUuid + ' -> ' + nodeId);
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
            }
        });
    const prevChildren = nodeId ? prevMap[nodeId]?.children : prevRoots;

    if (prevChildren?.length === nextChildren.length && prevChildren.every((e, i) => e === nextChildren[i])) {
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
        ...Object.entries(prevMap).filter(([k, v], i) => !nonCopyUuids.has(k)),
        ...nextChildren.map((n) => [n.elementUuid, n]),
        ...refreshedUpNodes(prevMap, nextNode as IDirectory).map((n: any) => [n.elementUuid, n]),
        ...(oldParentWithUpdatedChildren
            ? refreshedUpNodes(prevMap, oldParentWithUpdatedChildren as IDirectory).map((n: any) => [n.elementUuid, n])
            : []),
    ]);

    const nextRoots: IDirectory[] = (
        nodeId === null ? nextChildren : prevRoots?.map((r) => nextMap[r.elementUuid])
    ) as IDirectory[];

    const ret: [IDirectory[], Record<string, IDirectory>] = [nextRoots, nextMap];

    return ret;
}

const TreeViewsContainer = () => {
    const dispatch = useDispatch();

    const [openDialog, setOpenDialog] = useState(constants.DialogsId.NONE);

    const user = useSelector((state: AppState) => state.user);
    const selectedDirectory = useSelector((state: AppState) => state.selectedDirectory);
    const activeDirectory = useSelector((state: AppState) => state.activeDirectory);

    const uploadingElements = useSelector((state: AppState) => state.uploadingElements);
    const uploadingElementsRef = useRef<Record<string, UploadingElement>>({});
    uploadingElementsRef.current = uploadingElements;
    const currentChildren = useSelector((state: AppState) => state.currentChildren);
    const currentChildrenRef = useRef<ElementAttributes[] | undefined>(currentChildren);

    currentChildrenRef.current = currentChildren;
    const selectedDirectoryRef = useRef<ElementAttributes | null>(null);
    selectedDirectoryRef.current = selectedDirectory;

    const [DOMFocusedDirectory, setDOMFocusedDirectory] = useState<ParentNode | null>(null);

    const wsRef = useRef<ReconnectingWebSocket>();

    const { snackError, snackWarning } = useSnackMessage();

    const directoryUpdatedEvent = useSelector((state: AppState) => state.directoryUpdated);
    /**
     * Contextual Menus
     */
    const [openDirectoryMenu, setOpenDirectoryMenu] = React.useState(false);

    const treeData = useSelector((state: AppState) => state.treeData);

    const treeDataRef = useRef<ITreeData>();
    treeDataRef.current = treeData;

    const handleOpenDirectoryMenu = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        setOpenDirectoryMenu(true);
        event.stopPropagation();
    };
    const handleCloseDirectoryMenu = (e: unknown, nextSelectedDirectoryId: string | null = null) => {
        setOpenDirectoryMenu(false);
        dispatch(setActiveDirectory(undefined));
        if (nextSelectedDirectoryId !== null && treeDataRef.current?.mapData?.[nextSelectedDirectoryId]) {
            dispatch(setSelectedDirectory(treeDataRef.current.mapData[nextSelectedDirectoryId]));
        }
        //so it removes the style that we added ourselves
        if (DOMFocusedDirectory !== null) {
            (DOMFocusedDirectory as HTMLElement).classList.remove('focused');
            setDOMFocusedDirectory(null);
        }
    };

    /* Menu states */
    const [mousePosition, setMousePosition] = React.useState<{
        mouseX: number | null;
        mouseY: number | null;
    }>(initialMousePosition);
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

    const [anchorReference, setAnchorReference] = React.useState<PopoverReference>('anchorPosition');

    /* User interactions */
    const onContextMenu = useCallback(
        (
            event: React.MouseEvent<HTMLDivElement, MouseEvent>,
            nodeId: UUID | undefined,
            anchorReference: PopoverReference
        ) => {
            //to keep the focused style (that is normally lost when opening a contextual menu)
            if (event.currentTarget.parentNode) {
                (event.currentTarget.parentNode as HTMLElement).classList.add('focused');
                setDOMFocusedDirectory(event.currentTarget.parentNode);
            }

            dispatch(setActiveDirectory(nodeId));
            setAnchorReference(anchorReference);
            setAnchorEl(event.currentTarget);
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
        fetchRootFolders([])
            .then((data) => {
                let [nrs, mdr] = updatedTree(
                    treeDataRef.current?.rootDirectories ?? [],
                    treeDataRef.current?.mapData ?? {},
                    null,
                    data as IDirectory[]
                );
                dispatch(
                    setTreeData({
                        rootDirectories: nrs,
                        mapData: mdr,
                        initialized: true,
                    })
                );
            })
            .catch((error) => {
                console.warn(`Could not fetch roots ${error.message}`);
            });
    }, [dispatch]);

    /* rootDirectories initialization */
    useEffect(() => {
        if (user != null) {
            updateRootDirectories();
        }
    }, [user, updateRootDirectories]);

    /* Manage current path data */
    const updatePath = useCallback(
        (nodeId: UUID | undefined) => {
            let path = buildPathToFromMap(nodeId, treeData.mapData);
            dispatch(setCurrentPath(path));
        },
        [dispatch, treeData.mapData]
    );

    useEffect(() => {
        updatePath(selectedDirectoryRef.current?.elementUuid);
    }, [treeData.mapData, updatePath, selectedDirectory?.elementUuid]);

    const insertContent = useCallback(
        (nodeId: string, childrenToBeInserted: ElementAttributes[]) => {
            if (treeDataRef.current) {
                let [nrs, mdr] = updatedTree(
                    treeDataRef.current.rootDirectories,
                    treeDataRef.current.mapData,
                    nodeId,
                    childrenToBeInserted as IDirectory[]
                );
                dispatch(
                    setTreeData({
                        rootDirectories: nrs,
                        mapData: mdr,
                        initialized: true,
                    })
                );
            }
        },
        [dispatch]
    );

    const updateMapData = useCallback(
        (nodeId: string, children: ElementAttributes[], isDirectoryMoving: boolean) => {
            let newSubdirectories = children.filter((child) => child.type === ElementType.DIRECTORY);

            let prevPath = buildPathToFromMap(selectedDirectoryRef.current?.elementUuid, treeDataRef.current?.mapData);

            let prevSubInPath = prevPath.find((n) => n.parentUuid === nodeId);
            let hasToChangeSelected =
                prevSubInPath !== undefined &&
                children.find((n) => n.elementUuid === prevSubInPath?.elementUuid) === undefined;

            insertContent(nodeId, newSubdirectories);
            if (hasToChangeSelected) {
                // if selected directory (possibly via ancestor)
                // is deleted by another user
                // we should select (closest still existing) parent directory
                dispatch(
                    setSelectedDirectory(
                        isDirectoryMoving ? null : (treeDataRef.current?.mapData[nodeId] as IDirectory)
                    )
                );
            }
        },
        [insertContent, dispatch]
    );

    const mergeCurrentAndUploading = useCallback(
        (current: ElementAttributes[]): ElementAttributes[] | undefined => {
            let uploadingElementsInSelectedDirectory = Object.values(uploadingElementsRef.current).filter(
                (e) => e.directory === selectedDirectoryRef.current?.elementUuid
            );
            if (uploadingElementsInSelectedDirectory?.length > 0) {
                // Reduce uploadingElementsInSelectedDirectory to get
                // those to remove from uploadingElements because present in current
                // and those to keep because it's still ghost elements
                const [toRemoveFromUploadingElements, toKeepToUploadingElements] =
                    uploadingElementsInSelectedDirectory.reduce(
                        (
                            [toRemoveFromUploadingElements, toKeepToUploadingElements],
                            uploadingElementInSelectedDirectory
                        ) =>
                            current.some(
                                (e) =>
                                    e.elementName === uploadingElementInSelectedDirectory.elementName &&
                                    e.type === uploadingElementInSelectedDirectory.type &&
                                    e.elementUuid // if it has an elementUuid then it's not a ghost anymore
                            )
                                ? [
                                      [...toRemoveFromUploadingElements, uploadingElementInSelectedDirectory],
                                      toKeepToUploadingElements,
                                  ]
                                : [
                                      toRemoveFromUploadingElements,
                                      [...toKeepToUploadingElements, uploadingElementInSelectedDirectory],
                                  ],
                        [[] as UploadingElement[], [] as UploadingElement[]]
                    );

                // then remove the ghosts if the upload succeeded
                if (toRemoveFromUploadingElements.length > 0) {
                    let newUploadingElements = { ...uploadingElementsRef.current };
                    toRemoveFromUploadingElements.forEach((r) => delete newUploadingElements[r.id]);
                    dispatch(setUploadingElements(newUploadingElements));
                }
                //remove the ghosts if the upload failed
                const newCurrentElement = cleanCreationFailedElementInCurrentElements(
                    current,
                    uploadingElementsInSelectedDirectory
                );
                return [...newCurrentElement, ...toKeepToUploadingElements].sort(function (a, b) {
                    return a.elementName.localeCompare(b.elementName);
                }) as ElementAttributes[];
            } else {
                //remove the ghosts if the upload failed
                const newCurrentElement = cleanCreationFailedElementInCurrentElements(
                    current,
                    uploadingElementsInSelectedDirectory
                );
                return newCurrentElement == null
                    ? undefined
                    : [...newCurrentElement].sort(function (a, b) {
                          return a.elementName.localeCompare(b.elementName);
                      });
            }
        },
        [dispatch]
    );

    function cleanCreationFailedElementInCurrentElements(
        currentElements: ElementAttributes[],
        uploadingElements: UploadingElement[]
    ): ElementAttributes[] {
        return currentElements.filter((currentElement) => {
            // if the element is present in currentElement as uploading (with the field id) and not in uploadingElement
            // it means it's a failed upload that needs to be removed
            return !(
                currentElement.id &&
                uploadingElements.findIndex(
                    (uploadingElement) => uploadingElement.id.toString() === currentElement.id
                ) === -1
            );
        });
    }

    /* currentChildren management */
    const updateCurrentChildren = useCallback(
        (children: ElementAttributes[]) => {
            dispatch(
                setCurrentChildren(
                    mergeCurrentAndUploading(children.filter((child) => child.type !== ElementType.DIRECTORY))
                )
            );
        },
        [dispatch, mergeCurrentAndUploading]
    );

    const updateDirectoryTreeAndContent = useCallback(
        (nodeId: UUID, isDirectoryMoving: boolean) => {
            fetchDirectoryContent(nodeId)
                .then((childrenToBeInserted) => {
                    // update directory Content
                    updateCurrentChildren(childrenToBeInserted);
                    // Update Tree Map data
                    updateMapData(nodeId, childrenToBeInserted, isDirectoryMoving);
                })
                .catch((error) => {
                    console.warn(`Could not update subs (and content) of '${nodeId}' : ${error.message}`);
                    updateMapData(nodeId, [], false);
                });
        },
        [updateCurrentChildren, updateMapData]
    );

    // add ghost studies or ghost cases as soon as possible (uploadingElements) and clean them if necessary
    useEffect(() => {
        if (Object.values(uploadingElements).length > 0 || currentChildrenRef.current?.some((c) => c.uploading)) {
            dispatch(setCurrentChildren(mergeCurrentAndUploading(currentChildrenRef.current ?? [])));
        }
    }, [uploadingElements, currentChildrenRef, mergeCurrentAndUploading, dispatch]);

    const updateDirectoryTree = useCallback(
        (nodeId: UUID, isClose = false, isDirectoryMoving = false) => {
            // quite rare occasion to clean up
            if (isClose) {
                if (treeDataRef.current?.rootDirectories.some((n) => n.elementUuid === nodeId)) {
                    const newMap = mapFromRoots(treeDataRef.current.rootDirectories);
                    if (Object.entries(newMap).length !== Object.entries(treeDataRef.current.mapData).length) {
                        dispatch(
                            setTreeData({
                                rootDirectories: treeDataRef.current.rootDirectories,
                                mapData: newMap,
                                initialized: true,
                            })
                        );
                    }
                }
                return;
            }

            fetchDirectoryContent(nodeId)
                .then((childrenToBeInserted) => {
                    // Update Tree Map data
                    updateMapData(nodeId, childrenToBeInserted, isDirectoryMoving);
                })
                .catch((error) => {
                    console.warn(`Could not update subs of '${nodeId}' : ${error.message}`);
                    updateMapData(nodeId, [], false);
                });
        },
        [dispatch, updateMapData]
    );

    /* Manage Studies updating with Web Socket */
    const displayErrorIfExist = useCallback(
        (error: string, studyName: string) => {
            if (error) {
                snackError({
                    messageTxt: error,
                    headerId: 'studyCreatingError',
                    headerValues: { studyName: studyName },
                });
            }
        },
        [snackError]
    );

    useEffect(() => {
        // create ws at mount event
        wsRef.current = connectNotificationsWsUpdateDirectories();

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

    const handleUserMessage = useCallback(
        (eventData: any) => {
            const messageValues = JSON.parse(eventData.payload);
            snackWarning({
                messageId: eventData.headers['userMessage'],
                messageValues: messageValues,
            });
        },
        [snackWarning]
    );

    const onUpdateDirectories = useCallback(
        (event: MessageEvent) => {
            console.debug('Received Update directories notification', event);

            let eventData = JSON.parse(event.data);
            if (!eventData.headers) {
                return;
            }

            if (eventData.headers.hasOwnProperty('userMessage') && eventData.payload) {
                handleUserMessage(eventData);
                return;
            }

            dispatch(directoryUpdated(eventData));
        },
        [dispatch, handleUserMessage]
    );

    useEffect(() => {
        if (directoryUpdatedEvent.eventData?.headers) {
            const notificationTypeH = directoryUpdatedEvent.eventData.headers['notificationType'];
            const isRootDirectory = directoryUpdatedEvent.eventData.headers['isRootDirectory'];
            const directoryUuid = directoryUpdatedEvent.eventData.headers['directoryUuid'] as UUID;
            const error = directoryUpdatedEvent.eventData.headers['error'] as string;
            const elementName = directoryUpdatedEvent.eventData.headers['elementName'] as string;
            const isDirectoryMoving = directoryUpdatedEvent.eventData.headers['isDirectoryMoving'] as boolean;
            if (error) {
                displayErrorIfExist(error, elementName);
                dispatch(directoryUpdated({}));
            }

            if (isRootDirectory) {
                updateRootDirectories();
                if (
                    selectedDirectoryRef.current != null && // nothing to do if nothing already selected
                    notificationTypeH === notificationType.DELETE_DIRECTORY &&
                    selectedDirectoryRef.current.elementUuid === directoryUuid
                ) {
                    dispatch(setSelectedDirectory(null));
                    return;
                }
                // if it's a new root directory then do not continue because we don't need
                // to fetch an empty content
                if (!treeDataRef.current?.rootDirectories.some((n) => n.elementUuid === directoryUuid)) {
                    return;
                }

                // if it's a deleted root directory then do not continue because we don't need
                // to fetch its content anymore
                if (notificationTypeH === notificationType.DELETE_DIRECTORY) {
                    return;
                }
            }
            if (directoryUuid) {
                // Remark : It could be a Uuid of a rootDirectory if we need to update it because its content update
                // if dir is actually selected then call updateDirectoryTreeAndContent of this dir
                // else expanded or not then updateDirectoryTree
                if (selectedDirectoryRef.current != null) {
                    if (directoryUuid === selectedDirectoryRef.current.elementUuid) {
                        updateDirectoryTreeAndContent(directoryUuid, isDirectoryMoving);
                        return; // break here
                    }
                }
                updateDirectoryTree(directoryUuid, false, isDirectoryMoving);
            }
        }
    }, [
        directoryUpdatedEvent,
        dispatch,
        displayErrorIfExist,
        updateDirectoryTree,
        updateDirectoryTreeAndContent,
        updateRootDirectories,
    ]);

    useEffect(() => {
        if (!wsRef.current) {
            return;
        }

        // Update onmessage of ws when needed.
        wsRef.current.onmessage = onUpdateDirectories;
    }, [onUpdateDirectories]);

    /* Handle components synchronization */
    // To proc only if selectedDirectory?.elementUuid changed, take care of updateDirectoryTreeAndContent dependencies
    useEffect(() => {
        if (selectedDirectory?.elementUuid) {
            updateDirectoryTreeAndContent(selectedDirectory.elementUuid, false);
        }
    }, [selectedDirectory?.elementUuid, updateDirectoryTreeAndContent]);

    const getActiveDirectory = (): ElementAttributes | null => {
        if (treeDataRef.current?.mapData && activeDirectory && treeDataRef.current?.mapData[activeDirectory]) {
            return treeDataRef.current.mapData[activeDirectory];
        } else {
            return null;
        }
    };

    return (
        <>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    width: '100%',
                    flexGrow: 1,
                }}
                onContextMenu={(e) => onContextMenu(e, undefined, 'anchorPosition')}
            >
                {treeData.mapData &&
                    treeData.rootDirectories.map((rootDirectory) => (
                        <DirectoryTreeView
                            key={rootDirectory.elementUuid}
                            treeViewUuid={rootDirectory.elementUuid}
                            mapData={treeDataRef.current?.mapData}
                            onContextMenu={onContextMenu}
                            onDirectoryUpdate={updateDirectoryTree}
                        />
                    ))}
            </div>

            <div
                onMouseDown={(e) => {
                    if (e.button === constants.MOUSE_EVENT_RIGHT_BUTTON && openDialog === constants.DialogsId.NONE) {
                        handleCloseDirectoryMenu(e, null);
                    }
                }}
            >
                <DirectoryTreeContextualMenu
                    directory={getActiveDirectory()}
                    open={openDirectoryMenu}
                    openDialog={openDialog}
                    setOpenDialog={setOpenDialog}
                    onClose={(e: unknown) => handleCloseDirectoryMenu(e, null)}
                    anchorReference={anchorReference}
                    anchorPosition={
                        mousePosition.mouseY !== null && mousePosition.mouseX !== null
                            ? {
                                  top: mousePosition.mouseY,
                                  left: mousePosition.mouseX,
                              }
                            : undefined
                    }
                    anchorEl={anchorEl}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    restrictMenuItems={false}
                />
            </div>
        </>
    );
};

export { updatedTree };
export default TreeViewsContainer;
