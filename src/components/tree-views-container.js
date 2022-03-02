/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    setCurrentChildren,
    setSelectedDirectory,
    setCurrentPath,
    setActiveDirectory,
} from '../redux/actions';

import {
    fetchDirectoryContent,
    fetchRootFolders,
    connectNotificationsWsUpdateStudies,
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
        fetchRootFolders().then((data) => {
            let sortedData = [...data];
            sortedData.sort(function (a, b) {
                return a.elementName.localeCompare(b.elementName);
            });
            setRootDirectories(
                sortedData.map((rootDir) => {
                    return {
                        children: [],
                        parentUuid: null,
                        ...rootDir,
                    };
                })
            );
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
            let path = [];
            let currentUuid = nodeId;
            while (
                currentUuid != null &&
                mapDataRef.current[currentUuid] !== undefined
            ) {
                path.unshift({ ...mapDataRef.current[currentUuid] });
                currentUuid = mapDataRef.current[currentUuid].parentUuid;
            }
            dispatch(setCurrentPath(path));
        },
        [dispatch]
    );

    /* MapData management*/
    useEffect(() => {
        if (rootDirectories && rootDirectories.length > 0) {
            let mapDataCopy = { ...mapDataRef.current };
            rootDirectories.forEach((rootDirectory) => {
                let rootDirectoryCopy = { ...rootDirectory };
                rootDirectoryCopy.children = mapDataRef.current[
                    rootDirectoryCopy.elementUuid
                ]
                    ? mapDataRef.current[rootDirectoryCopy.elementUuid].children
                    : [];
                mapDataCopy[rootDirectory.elementUuid] = rootDirectoryCopy;
            });
            setMapData(mapDataCopy);
        }
    }, [rootDirectories]);

    useEffect(() => {
        updatePath(selectedDirectoryRef.current?.elementUuid);
    }, [mapData, updatePath]);

    const insertContent = useCallback(
        (nodeId, childrenToBeInserted) => {
            let mapDataCopy = { ...mapDataRef.current };
            let preparedChildrenToBeInserted = childrenToBeInserted.map(
                (child) => {
                    child.children = [];
                    child.parentUuid = nodeId;
                    if (!mapDataCopy[child.elementUuid]) {
                        mapDataCopy[child.elementUuid] = { ...child };
                    } else {
                        //update element name
                        mapDataCopy[child.elementUuid].elementName =
                            child.elementName;

                        //update element access rights
                        mapDataCopy[child.elementUuid].accessRights =
                            child.accessRights;
                    }
                    return child;
                }
            );
            mapDataCopy[nodeId].children = preparedChildrenToBeInserted.sort(
                function (a, b) {
                    return a.elementName.localeCompare(b.elementName);
                }
            );
            setMapData(mapDataCopy);
        },
        [mapDataRef]
    );

    const updateMapData = useCallback(
        (nodeId, children) => {
            let newSubdirectories = children.filter(
                (child) => child.type === ElementType.DIRECTORY
            );
            insertContent(nodeId, newSubdirectories);
            if (
                selectedDirectoryRef.current !== null &&
                mapDataRef.current[selectedDirectoryRef.current.elementUuid]
                    .parentUuid === nodeId &&
                newSubdirectories.filter(
                    (e) =>
                        e.elementUuid ===
                        selectedDirectoryRef.current.elementUuid
                ).length === 0
            ) {
                // if selected directory is deleted by another user we should select parent directory
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
            fetchDirectoryContent(nodeId).then((childrenToBeInserted) => {
                // update directory Content
                updateCurrentChildren(childrenToBeInserted);
                // Update Tree Map data
                updateMapData(nodeId, childrenToBeInserted);
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
            fetchDirectoryContent(nodeId).then((childrenToBeInserted) => {
                // Update Tree Map data
                updateMapData(nodeId, childrenToBeInserted);
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
            if (eventData.headers) {
                const notificationTypeHeader =
                    eventData.headers['notificationType'];
                const isRootDirectory = eventData.headers['isRootDirectory'];
                const directoryUuid = eventData.headers['directoryUuid'];
                const error = eventData.headers['error'];
                const elementName = eventData.headers['elementName'];

                displayErrorIfExist(error, elementName);

                if (isRootDirectory) {
                    updateRootDirectories();
                    if (
                        selectedDirectoryRef.current != null && // nothing to do if nothing already selected
                        notificationTypeHeader ===
                            notificationType.DELETE_DIRECTORY &&
                        selectedDirectoryRef.current.elementUuid ===
                            directoryUuid
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

export default TreeViewsContainer;
