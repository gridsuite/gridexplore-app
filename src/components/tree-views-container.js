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
} from '../redux/actions';

import {
    fetchDirectoryContent,
    fetchRootFolders,
    connectNotificationsWsUpdateStudies,
} from '../utils/rest-api';

import DirectoryTreeView from './directory-tree-view';

import { displayErrorMessageWithSnackbar, useIntlRef } from '../utils/messages';
import { useSnackbar } from 'notistack';
import { elementType } from '../utils/elementType';
import { notificationType } from '../utils/notificationType';

const TreeViewsContainer = () => {
    const intlRef = useIntlRef();
    const dispatch = useDispatch();

    const [rootDirectories, setRootDirectories] = useState([]);
    const [mapData, setMapData] = useState({});

    const user = useSelector((state) => state.user);
    const selectedDirectory = useSelector((state) => state.selectedDirectory);

    const mapDataRef = useRef({});
    mapDataRef.current = mapData;

    const selectedDirectoryRef = useRef({});
    selectedDirectoryRef.current = selectedDirectory;

    const websocketExpectedCloseRef = useRef();

    const { enqueueSnackbar } = useSnackbar();

    /* RootDirectories initialization */
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

    useEffect(() => {
        if (user != null) {
            updateRootDirectories();
        }
    }, [user, updateRootDirectories]);

    /* Manage current path data */
    const buildPath = useCallback(
        (nodeId, path) => {
            let currentUuid = nodeId;
            while (
                currentUuid != null &&
                mapDataRef.current[currentUuid] !== undefined
            ) {
                path.unshift({
                    elementUuid: mapDataRef.current[currentUuid].elementUuid,
                    elementName: mapDataRef.current[currentUuid].elementName,
                });
                currentUuid = mapDataRef.current[currentUuid].parentUuid;
            }
        },
        [mapDataRef]
    );

    const updatePath = useCallback(
        (nodeId) => {
            let path = [];
            buildPath(nodeId, path);
            if (path != null) dispatch(setCurrentPath(path));
        },
        [buildPath, dispatch]
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
        updatePath(selectedDirectoryRef.current);
    }, [mapData, updatePath]);

    const insertContent = useCallback(
        (selected, childrenToBeInserted) => {
            let mapDataCopy = { ...mapDataRef.current };
            let preparedChildrenToBeInserted = childrenToBeInserted.map(
                (child) => {
                    child.children = [];
                    child.parentUuid = selected;
                    if (!mapDataCopy[child.elementUuid]) {
                        mapDataCopy[child.elementUuid] = child;
                    } else {
                        //update element name
                        mapDataCopy[child.elementUuid].elementName =
                            child.elementName;
                    }
                    return child;
                }
            );
            mapDataCopy[selected].children = preparedChildrenToBeInserted.sort(
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
                (child) => child.type === elementType.DIRECTORY
            );
            insertContent(nodeId, newSubdirectories);
            if (
                selectedDirectoryRef.current !== null &&
                mapDataRef.current[selectedDirectoryRef.current].parentUuid ===
                    nodeId &&
                newSubdirectories.filter(
                    (e) => e.elementUuid === selectedDirectoryRef.current
                ).length === 0
            ) {
                // if selected directory is deleted by another user we should select parent directory
                setSelectedDirectory(nodeId);
                updatePath(nodeId);
            } else {
                updatePath(selectedDirectoryRef.current);
            }
        },
        [insertContent, selectedDirectoryRef, updatePath, mapDataRef]
    );

    /* currentChildren management */
    const updateCurrentChildren = useCallback(
        (children) => {
            dispatch(
                setCurrentChildren(
                    children
                        .filter((child) => child.type !== elementType.DIRECTORY)
                        .sort(function (a, b) {
                            return a.elementName.localeCompare(b.elementName);
                        })
                )
            );
        },
        [dispatch]
    );

    const updateDirectoryChildren = useCallback(
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

    const updateTree = useCallback(
        (nodeId) => {
            // fetch content
            updateDirectoryChildren(nodeId);
            // update current directory path
            updatePath(nodeId);
        },
        [updateDirectoryChildren, updatePath]
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

    const connectNotificationsUpdateStudies = useCallback(() => {
        const ws = connectNotificationsWsUpdateStudies();

        ws.onmessage = function (event) {
            console.debug('Received Update Studies notification', event);
            let eventData = JSON.parse(event.data);

            if (eventData.headers) {
                const notificationTypeHeader =
                    eventData.headers['notificationType'];
                const isRootDirectory = eventData.headers['isRootDirectory'];
                const directoryUuid = eventData.headers['directoryUuid'];
                const error = eventData.headers['error'];

                if (isRootDirectory) {
                    updateRootDirectories();
                    if (
                        notificationTypeHeader ===
                            notificationType.DELETE_DIRECTORY &&
                        selectedDirectoryRef.current === directoryUuid
                    ) {
                        dispatch(setCurrentChildren(null));
                        updatePath(null);
                    }
                    return;
                }

                if (directoryUuid) {
                    if (mapDataRef.current[directoryUuid] !== undefined) {
                        displayErrorIfExist(error);
                        updateDirectoryChildren(directoryUuid, false);
                    }
                }
            }
        };

        ws.onclose = function () {
            if (!websocketExpectedCloseRef.current) {
                console.error('Unexpected Notification WebSocket closed');
            }
        };

        ws.onerror = function (event) {
            console.error('Unexpected Notification WebSocket error', event);
        };
        return ws;
    }, [
        displayErrorIfExist,
        updateDirectoryChildren,
        updateRootDirectories,
        mapDataRef,
        dispatch,
        updatePath,
    ]);

    useEffect(() => {
        const ws = connectNotificationsUpdateStudies();
        // Note: dispatch doesn't change
        // cleanup at unmount event
        return function () {
            ws.close();
        };
    }, [connectNotificationsUpdateStudies]);

    /* Handle components synchronization */
    useEffect(() => {
        console.debug('useEffect over selectedDirectory', selectedDirectory);
        if (selectedDirectory) updateTree(selectedDirectory);
    }, [selectedDirectory, updateTree]);

    return (
        <>
            {mapDataRef.current &&
                rootDirectories.map((rootDirectory) => (
                    <DirectoryTreeView
                        key={rootDirectory.elementUuid}
                        treeViewUID={rootDirectory.elementUuid}
                        mapData={mapDataRef.current}
                    />
                ))}
        </>
    );
};

export default TreeViewsContainer;
