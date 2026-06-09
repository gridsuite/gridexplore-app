/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { MouseEvent as ReactMouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import {
    type ElementAttributes,
    ElementType,
    fetchDirectoryContent,
    fetchDirectoryElementPath,
    fetchRootFolders,
    type MuiStyles,
    NotificationsUrlKeys,
    useNotificationsListener,
    useSnackMessage,
} from '@gridsuite/commons-ui';
import type { UUID } from 'node:crypto';
import { Box, type BoxProps, type PopoverOrigin, type PopoverPosition, type PopoverReference } from '@mui/material';
import {
    directoryUpdated,
    setActiveDirectory,
    setCurrentChildren,
    setCurrentPath,
    setSearchedElement,
    setSelectedDirectory,
    setTreeData,
    setUploadingElements,
} from '../redux/actions';
import DirectoryTreeView from './directory-tree-view';
import { isExportCaseNotification, NotificationType } from '../utils/notificationType';
import * as constants from '../utils/UIconstants';
import { LAST_ELEMENT_INDEX } from '../utils/UIconstants';
import DirectoryTreeContextualMenu from './menus/directory-tree-contextual-menu';
import { AppState, ElementAttributesES, IDirectory, ITreeData, UploadingElement } from '../redux/types';
import { buildPathToFromMap, updatedTree } from './treeview-utils';
import { useExportNotification } from '../hooks/use-export-notification';
import { useDirectoryPathLoader } from '../hooks/use-directory-path-loader';

const initialMousePosition = {
    mouseX: null,
    mouseY: null,
};

const anchorOrigin: PopoverOrigin = {
    vertical: 'top',
    horizontal: 'right',
};

const styles = {
    treeBox: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        flexGrow: 1,
    },
} as const satisfies MuiStyles;

function flattenDownNodes(n: IDirectory, cef: (arg: IDirectory) => any[]): IDirectory[] {
    const subs = cef(n);
    if (subs.length === 0) {
        return [n];
    }
    return Array.prototype.concat([n], ...subs.map((sn) => flattenDownNodes(sn, cef)));
}

function mapFromRoots(roots: IDirectory[]): Record<string, IDirectory> {
    return Object.fromEntries(
        Array.prototype
            .concat(roots, ...roots.map((r) => flattenDownNodes(r, (n) => n.children)))
            .map((n) => [n.elementUuid, n])
    );
}

function pathHasChanged(currentPath: ElementAttributes[], newPath: ElementAttributes[]) {
    return (
        currentPath.length !== newPath.length ||
        !currentPath.every((elem, index) => {
            return elem.elementUuid === newPath[index].elementUuid && elem.elementName === newPath[index].elementName;
        })
    );
}

export default function TreeViewsContainer({ sourceItemUuid }: { readonly sourceItemUuid?: string }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [openDialog, setOpenDialog] = useState(constants.DialogsId.NONE);

    const user = useSelector((state: AppState) => state.user);
    const selectedDirectory = useSelector((state: AppState) => state.selectedDirectory);
    const activeDirectory = useSelector((state: AppState) => state.activeDirectory);
    const currentPath = useSelector((state: AppState) => state.currentPath);
    const currentPathRef = useRef<ElementAttributes[]>([]);
    currentPathRef.current = currentPath;

    const uploadingElements = useSelector((state: AppState) => state.uploadingElements);
    const uploadingElementsRef = useRef<Record<string, UploadingElement>>({});
    uploadingElementsRef.current = uploadingElements;
    const currentChildren = useSelector((state: AppState) => state.currentChildren);
    const currentChildrenRef = useRef<ElementAttributes[] | undefined>(currentChildren);

    currentChildrenRef.current = currentChildren;
    const selectedDirectoryRef = useRef<ElementAttributes | null>(null);
    selectedDirectoryRef.current = selectedDirectory;
    const previousSelectedDirectoryUuidRef = useRef<UUID | undefined>(undefined);

    const [DOMFocusedDirectory, setDOMFocusedDirectory] = useState<ParentNode | null>(null);

    const { snackError, snackWarning } = useSnackMessage();

    const directoryUpdatedEvent = useSelector((state: AppState) => state.directoryUpdated);
    /** Contextual Menus */
    const [openDirectoryMenu, setOpenDirectoryMenu] = useState(false);

    const treeData = useSelector((state: AppState) => state.treeData);

    const treeDataRef = useRef<ITreeData>(null);
    treeDataRef.current = treeData;

    useExportNotification();

    const handleOpenDirectoryMenu = useCallback(
        (event: ReactMouseEvent<HTMLDivElement | HTMLButtonElement, MouseEvent>) => {
            setOpenDirectoryMenu(true);
            event.stopPropagation();
        },
        []
    );
    const handleCloseDirectoryMenu = useCallback(() => {
        setOpenDirectoryMenu(false);
        dispatch(setActiveDirectory(undefined));
        // so it removes the style that we added ourselves
        if (DOMFocusedDirectory !== null) {
            (DOMFocusedDirectory as HTMLElement).classList.remove('focused');
            setDOMFocusedDirectory(null);
        }
    }, [DOMFocusedDirectory, dispatch]);

    /* Menu states */
    const [mousePosition, setMousePosition] = useState<{
        mouseX: number | null;
        mouseY: number | null;
    }>(initialMousePosition);
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [anchorReference, setAnchorReference] = useState<PopoverReference>('anchorPosition');
    const anchorPosition = useMemo<PopoverPosition | undefined>(
        () =>
            mousePosition.mouseY !== null && mousePosition.mouseX !== null
                ? {
                      top: mousePosition.mouseY,
                      left: mousePosition.mouseX,
                  }
                : undefined,
        [mousePosition.mouseX, mousePosition.mouseY]
    );

    /* User interactions */
    const onContextMenu = useCallback(
        (
            event: ReactMouseEvent<HTMLDivElement | HTMLButtonElement, MouseEvent>,
            nodeId: UUID | undefined,
            anchorReference2: PopoverReference
        ) => {
            // to keep the focused style (that is normally lost when opening a contextual menu)
            event.currentTarget.classList.add('focused');
            setDOMFocusedDirectory(event.currentTarget);

            dispatch(setActiveDirectory(nodeId));
            setAnchorReference(anchorReference2);
            setAnchorEl(event.currentTarget);
            setMousePosition({
                mouseX: event.clientX + constants.HORIZONTAL_SHIFT,
                mouseY: event.clientY + constants.VERTICAL_SHIFT,
            });
            handleOpenDirectoryMenu(event);
        },
        [dispatch, handleOpenDirectoryMenu]
    );
    const handleOnContextMenuBox = useCallback<NonNullable<BoxProps['onContextMenu']>>(
        (e) => onContextMenu(e, undefined, 'anchorPosition'),
        [onContextMenu]
    );

    /* RootDirectories management */
    const updateRootDirectories = useCallback(() => {
        fetchRootFolders([])
            .then((data) => {
                const [nrs, mdr] = updatedTree(
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
            .catch((error) => console.warn(`Could not fetch roots ${error.message}`));
    }, [dispatch]);

    /* rootDirectories initialization */
    useEffect(() => {
        if (user != null) {
            updateRootDirectories();
        }
    }, [user, updateRootDirectories]);

    /* Manage current path data */
    useEffect(() => {
        // Do not change currentPath everytime mapData changed
        // if it's the same path (same uuids same names in order) then do not dispatch
        const newPath = buildPathToFromMap(selectedDirectoryRef.current?.elementUuid, treeData.mapData);
        if (pathHasChanged(currentPathRef.current, newPath)) {
            dispatch(setCurrentPath(newPath));
        }
    }, [dispatch, treeData.mapData, selectedDirectory?.elementUuid]);

    const insertContent = useCallback(
        (nodeId: string, childrenToBeInserted: ElementAttributes[]) => {
            if (treeDataRef.current) {
                const [nrs, mdr] = updatedTree(
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

    // Returns the uuid of the directory we navigated to when the selected directory was removed and we
    // had to fall back to its closest still-existing parent, or `undefined` otherwise (no navigation,
    // or navigation back to root on a move). Callers use it to feed that directory's already-fetched
    // content and skip a duplicate fetch (see updateDirectoryTree / previousSelectedDirectoryUuidRef).
    const updateMapData = useCallback(
        (nodeId: string, children: ElementAttributes[], isDirectoryMoving: boolean): UUID | undefined => {
            const newSubdirectories = children.filter((child) => child.type === ElementType.DIRECTORY);

            const prevPath = buildPathToFromMap(
                selectedDirectoryRef.current?.elementUuid,
                treeDataRef.current?.mapData
            );

            const prevSubInPath = prevPath.find((n) => n.parentUuid === nodeId);
            const hasToChangeSelected =
                prevSubInPath !== undefined &&
                children.find((n) => n.elementUuid === prevSubInPath?.elementUuid) === undefined;

            insertContent(nodeId, newSubdirectories);
            if (hasToChangeSelected) {
                // if selected directory (possibly via ancestor) is deleted by another user, we should select (closest still existing) parent directory
                // This is an involuntary navigation triggered by a notification, so we replace the history entry instead of keeping a deleted element URL.
                // The selected directory itself is updated by the URL-driven effect (see below).
                navigate(isDirectoryMoving ? '/' : `/elements/${nodeId}`, { replace: true });
                return isDirectoryMoving ? undefined : (nodeId as UUID);
            }
            return undefined;
        },
        [insertContent, navigate]
    );

    const cleanCreationFailedElementInCurrentElements = useCallback(
        (currentElements: ElementAttributes[], uploadingElements2: UploadingElement[]): ElementAttributes[] =>
            currentElements.filter(
                (currentElement) =>
                    // if the element is present in currentElement as uploading (with the field id) and not in uploadingElement
                    // it means it's a failed upload that needs to be removed
                    !(
                        currentElement.id &&
                        uploadingElements2.findIndex(
                            (uploadingElement) => uploadingElement.id.toString() === currentElement.id
                        ) === -1
                    )
            ),
        []
    );

    const mergeCurrentAndUploading = useCallback(
        (current: ElementAttributes[]): ElementAttributes[] | undefined => {
            const uploadingElementsInSelectedDirectory = Object.values(uploadingElementsRef.current).filter(
                (e) => e.directory === selectedDirectoryRef.current?.elementUuid
            );
            if (uploadingElementsInSelectedDirectory?.length > 0) {
                // Reduce uploadingElementsInSelectedDirectory to get
                // those to remove from uploadingElements because present in current
                // and those to keep because it's still ghost elements
                const [toRemoveFromUploadingElements, toKeepToUploadingElements] =
                    uploadingElementsInSelectedDirectory.reduce(
                        (
                            [toRemoveFromUploadingElements2, toKeepToUploadingElements2],
                            uploadingElementInSelectedDirectory
                        ) =>
                            current.some(
                                (e) =>
                                    e.elementName === uploadingElementInSelectedDirectory.elementName &&
                                    e.type === uploadingElementInSelectedDirectory.type &&
                                    e.elementUuid // if it has an elementUuid then it's not a ghost anymore
                            )
                                ? [
                                      [...toRemoveFromUploadingElements2, uploadingElementInSelectedDirectory],
                                      toKeepToUploadingElements2,
                                  ]
                                : [
                                      toRemoveFromUploadingElements2,
                                      [...toKeepToUploadingElements2, uploadingElementInSelectedDirectory],
                                  ],
                        [[] as UploadingElement[], [] as UploadingElement[]]
                    );

                // then remove the ghosts if the upload succeeded
                if (toRemoveFromUploadingElements.length > 0) {
                    const newUploadingElements = { ...uploadingElementsRef.current };
                    toRemoveFromUploadingElements.forEach((r) => delete newUploadingElements[r.id]);
                    dispatch(setUploadingElements(newUploadingElements));
                }
                // remove the ghosts if the upload failed
                const newCurrentElement = cleanCreationFailedElementInCurrentElements(
                    current,
                    uploadingElementsInSelectedDirectory
                );
                return [...newCurrentElement, ...toKeepToUploadingElements].sort((a, b) =>
                    a.elementName.localeCompare(b.elementName)
                ) as ElementAttributes[];
            }
            // remove the ghosts if the upload failed
            const newCurrentElement = cleanCreationFailedElementInCurrentElements(
                current,
                uploadingElementsInSelectedDirectory
            );
            return newCurrentElement == null
                ? undefined
                : [...newCurrentElement].sort((a, b) => a.elementName.localeCompare(b.elementName));
        },
        [cleanCreationFailedElementInCurrentElements, dispatch]
    );

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
                    const navigatedTo = updateMapData(nodeId, childrenToBeInserted, isDirectoryMoving); // Update Tree Map data
                    if (navigatedTo) {
                        // The selected directory was deleted and we navigated to this one: its full content
                        // (including files) was just fetched, so feed it directly and let the selection effect
                        // skip its own fetch (see previousSelectedDirectoryUuidRef) to avoid a duplicate request.
                        updateCurrentChildren(childrenToBeInserted);
                        previousSelectedDirectoryUuidRef.current = navigatedTo;
                    }
                })
                .catch((error) => {
                    console.warn(`Could not update subs of '${nodeId}' : ${error.message}`);
                    updateMapData(nodeId, [], false);
                });
        },
        [dispatch, updateCurrentChildren, updateMapData]
    );

    /* Manage Studies updating with Web Socket */
    const displayErrorIfExist = useCallback(
        (error: string, studyName: string) => {
            if (error) {
                snackError({
                    messageTxt: error,
                    headerId: 'studyCreatingError',
                    headerValues: { studyName },
                });
            }
        },
        [snackError]
    );

    const handleUserMessage = useCallback(
        (eventData: any) =>
            snackWarning({
                messageId: eventData.headers.userMessage,
                messageValues: JSON.parse(eventData.payload),
            }),
        [snackWarning]
    );

    const onUpdateDirectories = useCallback(
        (event: MessageEvent) => {
            console.debug('Received Update directories notification', event);

            const eventData = JSON.parse(event.data);
            if (!eventData.headers) {
                return;
            }
            if (isExportCaseNotification(eventData)) {
                return;
            }
            if (Object.prototype.hasOwnProperty.call(eventData.headers, 'userMessage') && eventData.payload) {
                handleUserMessage(eventData);
                return;
            }
            dispatch(directoryUpdated(eventData));
        },
        [dispatch, handleUserMessage]
    );

    useNotificationsListener(NotificationsUrlKeys.DIRECTORY, {
        listenerCallbackMessage: onUpdateDirectories,
    });

    // Each notification toggles `directoryUpdatedEvent.force`, so it is a new object per real event.
    // We process it exactly once: other deps of the effect below (notably `navigate`, whose identity
    // changes on every navigation with react-router's `<Routes>`) would otherwise re-run it with the
    // same stale event and re-fetch / re-navigate (e.g. keep fetching a deleted element's parent on
    // each subsequent click).
    const processedDirectoryEventRef = useRef(directoryUpdatedEvent);

    useEffect(() => {
        if (processedDirectoryEventRef.current === directoryUpdatedEvent) {
            return;
        }
        processedDirectoryEventRef.current = directoryUpdatedEvent;
        if (directoryUpdatedEvent.eventData?.headers) {
            const { notificationType, isRootDirectory } = directoryUpdatedEvent.eventData.headers;
            const directoryUuid = directoryUpdatedEvent.eventData.headers.directoryUuid as UUID;
            const error = directoryUpdatedEvent.eventData.headers.error as string;
            const elementName = directoryUpdatedEvent.eventData.headers.elementName as string;
            const isDirectoryMoving = directoryUpdatedEvent.eventData.headers.isDirectoryMoving as boolean;
            if (error) {
                displayErrorIfExist(error, elementName);
                dispatch(directoryUpdated({}));
            }

            if (isRootDirectory) {
                updateRootDirectories();
                if (
                    selectedDirectoryRef.current != null && // nothing to do if nothing already selected
                    notificationType === NotificationType.DELETE_DIRECTORY &&
                    selectedDirectoryRef.current.elementUuid === directoryUuid
                ) {
                    // The selected root directory was deleted: go back to root. The selected directory
                    // itself is cleared by the URL-driven effect (see below).
                    navigate(`/`, { replace: true });
                    return;
                }
                // if it's a new root directory then do not continue because we don't need
                // to fetch an empty content
                if (!treeDataRef.current?.rootDirectories.some((n) => n.elementUuid === directoryUuid)) {
                    return;
                }

                // if it's a deleted root directory then do not continue because we don't need
                // to fetch its content anymore
                if (notificationType === NotificationType.DELETE_DIRECTORY) {
                    return;
                }
            }
            if (directoryUuid) {
                // Remark : It could be an Uuid of a rootDirectory if we need to update it because its content update
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
        navigate,
    ]);

    /* Handle components synchronization */
    // Fetch the content of the selected directory. selectedDirectory is only ever set from the
    // URL-driven effect below, so this effect fires once per directory change (keyed on the uuid).
    useEffect(() => {
        const selectedDirectoryUuid = selectedDirectory?.elementUuid;
        // Skip when the content of this directory was just fetched and fed by the notification handler
        // (deletion of the selected directory navigates to its parent), to avoid a duplicate fetch.
        if (previousSelectedDirectoryUuidRef.current === selectedDirectoryUuid) {
            return;
        }
        // The selected directory may have just been deleted: it lingers as selected until the URL catches
        // up to its parent, but is already gone from the tree, so fetching it would 404. Skip it WITHOUT
        // recording it, so the dedup ref keeps pointing at the real navigation target (the parent).
        if (selectedDirectoryUuid && !treeDataRef.current?.mapData[selectedDirectoryUuid]) {
            return;
        }
        previousSelectedDirectoryUuidRef.current = selectedDirectoryUuid;
        if (selectedDirectoryUuid) {
            updateDirectoryTreeAndContent(selectedDirectoryUuid, false);
        }
    }, [selectedDirectory?.elementUuid, updateDirectoryTreeAndContent]);

    // TODO is useMemo work with complex object like this one?
    const getActiveDirectory = useCallback((): ElementAttributes | null => {
        if (treeDataRef.current?.mapData && activeDirectory && treeDataRef.current?.mapData[activeDirectory]) {
            return treeDataRef.current.mapData[activeDirectory];
        }
        return null;
    }, [activeDirectory]);

    const handleOnMouseDown = useCallback<NonNullable<BoxProps['onMouseDown']>>(
        (e) => {
            if (e.button === constants.MOUSE_EVENT_RIGHT_BUTTON && openDialog === constants.DialogsId.NONE) {
                handleCloseDirectoryMenu();
            }
        },
        [handleCloseDirectoryMenu, openDialog]
    );

    // TODO TypeScript say that treeData.mapData is never falsy?...
    const directoryViews = useMemo(
        () =>
            treeData.mapData &&
            treeData.rootDirectories.map((rootDirectory) => (
                <DirectoryTreeView
                    key={rootDirectory.elementUuid}
                    treeViewUuid={rootDirectory.elementUuid}
                    mapData={treeDataRef.current?.mapData}
                    onContextMenu={onContextMenu}
                    onDirectoryUpdate={updateDirectoryTree}
                />
            )),
        [onContextMenu, treeData.mapData, treeData.rootDirectories, updateDirectoryTree]
    );

    const { loadPath } = useDirectoryPathLoader();

    /* The URL (sourceItemUuid) is the single source of truth for the selected directory.
       This effect is the ONLY place that turns the URL into the `selectedDirectory` Redux state,
       which keeps the data flow unidirectional: every user action (tree, breadcrumbs, search, ...)
       only navigates, and the selection/content follows from the URL. */
    useEffect(() => {
        // Wait for the root directories to be loaded before resolving anything from the URL.
        if (!treeData.initialized) {
            return;
        }

        // Root route ('/'): nothing selected.
        if (!sourceItemUuid) {
            if (selectedDirectoryRef.current !== null) {
                dispatch(setSelectedDirectory(null));
            }
            return;
        }

        // Fast path: the directory is already known (click in the tree, breadcrumbs, expanded node).
        // We already have its path/data, so there is no need to fetch it again.
        const knownDirectory = treeDataRef.current?.mapData[sourceItemUuid];
        if (knownDirectory) {
            if (selectedDirectoryRef.current?.elementUuid !== sourceItemUuid) {
                dispatch(setSelectedDirectory(knownDirectory));
            }
            return;
        }

        // Slow path: deep-link, search result or any element not loaded yet → resolve the full path,
        // expand the tree, select the containing directory and highlight the element if it isn't one.
        (async () => {
            try {
                const path = await fetchDirectoryElementPath(sourceItemUuid as UUID);
                if (!path?.length) return;
                const directories = path.filter((el) => el.type === ElementType.DIRECTORY);
                // Load only the ancestors. The selected directory's full content (subdirectories AND
                // files) is fetched by the selectedDirectory effect via updateDirectoryTreeAndContent,
                // so fetching it here too would duplicate that request.
                await loadPath(directories.slice(0, LAST_ELEMENT_INDEX).map((dir) => dir.elementUuid));

                const lastDirectory = directories.at(LAST_ELEMENT_INDEX);
                if (lastDirectory) {
                    const directoryInMap = treeDataRef.current?.mapData[lastDirectory.elementUuid];
                    if (directoryInMap) {
                        dispatch(setSelectedDirectory(directoryInMap));
                        // Even if the directoryHtmlElement below exists, there are still new renders that will break the scroll on nested directories.
                        // Using a delay with timeout is not clean but is the only short and working solution we found.
                        setTimeout(() => {
                            const directoryHtmlElement = document.getElementById(lastDirectory.elementUuid);
                            if (directoryHtmlElement) {
                                directoryHtmlElement.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'center',
                                    inline: 'nearest',
                                });
                            }
                        }, 500);
                    }
                }

                const lastElement = path.at(LAST_ELEMENT_INDEX);
                if (lastElement && lastElement?.type !== ElementType.DIRECTORY) {
                    const elementToHighlight: ElementAttributesES = {
                        id: lastElement.elementUuid,
                        name: lastElement.elementName,
                        parentId: lastElement.parentUuid as UUID,
                        type: lastElement.type,
                        owner: lastElement.owner,
                        subdirectoriesCount: lastElement.subdirectoriesCount,
                        lastModificationDate: lastElement.lastModificationDate,
                        pathName: path.map((p) => p.elementName),
                        pathUuid: path.map((p) => p.elementUuid),
                    };
                    dispatch(setSearchedElement(elementToHighlight));
                }
            } catch (error: any) {
                snackError({
                    messageTxt: error.message,
                    headerId: 'pathRetrievingError',
                });
            }
        })();
    }, [sourceItemUuid, treeData.initialized, loadPath, dispatch, snackError]);

    return (
        <>
            <Box style={styles.treeBox} onContextMenu={handleOnContextMenuBox}>
                {directoryViews}
            </Box>
            <Box onMouseDown={handleOnMouseDown}>
                <DirectoryTreeContextualMenu
                    directory={getActiveDirectory()}
                    open={openDirectoryMenu}
                    openDialog={openDialog}
                    setOpenDialog={setOpenDialog}
                    // TODO why doing a lambda loosing the 2nd parameter here?
                    onClose={handleCloseDirectoryMenu}
                    anchorReference={anchorReference}
                    anchorPosition={anchorPosition}
                    anchorEl={anchorEl}
                    anchorOrigin={anchorOrigin}
                    restrictMenuItems={false}
                />
            </Box>
        </>
    );
}
