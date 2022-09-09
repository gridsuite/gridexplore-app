/*
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TreeViewFinder } from '@gridsuite/commons-ui';
import PropTypes from 'prop-types';
import { fetchDirectoryContent, fetchRootFolders } from '../../utils/rest-api';
import makeStyles from '@mui/styles/makeStyles';
import { getFileIcon, elementType } from '@gridsuite/commons-ui';
import { useSelector } from 'react-redux';
import { notificationType } from '../../utils/notificationType';

const useStyles = makeStyles((theme) => ({
    icon: {
        marginRight: theme.spacing(1),
        width: '18px',
        height: '18px',
    },
}));

function sortAlphabetically(a, b) {
    return a.name.localeCompare(b.name);
}

const DirectorySelector = (props) => {
    const [data, setData] = useState([]);
    const nodeMap = useRef({});
    const classes = useStyles();

    const contentFilter = useCallback(
        () => new Set([elementType.DIRECTORY]),
        []
    );

    const dataRef = useRef([]);
    dataRef.current = data;
    const directoryUpdatedForce = useSelector(
        (state) => state.directoryUpdated
    );

    const directory2Tree = useCallback(
        (newData) => {
            const newNode = {
                id: newData.elementUuid,
                name: newData.elementName,
                icon: getFileIcon(newData.type, classes.icon),
                children:
                    newData.type === elementType.DIRECTORY ? [] : undefined,
                subdirectoriesCount:
                    newData.type === elementType.DIRECTORY
                        ? newData.subdirectoriesCount
                        : undefined,
            };
            return (nodeMap.current[newNode.id] = newNode);
        },
        [nodeMap, classes]
    );

    useEffect(() => {
        if (props.open && data.length === 0) {
            fetchRootFolders().then((roots) => {
                setData(roots.map(directory2Tree));
            });
        }
    }, [props.open, data, directory2Tree]);

    const addToDirectory = useCallback(
        (nodeId, content) => {
            const node = nodeMap.current[nodeId];
            node.children = content.map(directory2Tree);
        },
        [directory2Tree]
    );

    const updateDirectoryTreeAndContent = useCallback(
        (nodeId) => {
            fetchDirectoryContent(nodeId)
                .then((childrenToBeInserted) => {
                    // update directory Content
                    addToDirectory(
                        nodeId,
                        childrenToBeInserted.filter((item) =>
                            contentFilter().has(item.type)
                        )
                    );
                    setData([...dataRef.current]);
                })
                .catch((reason) => {
                    console.warn(
                        "Could not update subs (and content) of '" +
                            nodeId +
                            "' :" +
                            reason
                    );
                });
        },
        [addToDirectory, contentFilter]
    );

    useEffect(() => {
        if (directoryUpdatedForce.eventData.headers) {
            if (
                Object.values(notificationType).includes(
                    directoryUpdatedForce.eventData.headers['notificationType']
                )
            ) {
                const filter = contentFilter();

                if (
                    !directoryUpdatedForce.eventData.headers['isRootDirectory']
                ) {
                    console.log('notif from other side', directoryUpdatedForce);
                    updateDirectoryTreeAndContent(
                        directoryUpdatedForce.eventData.headers['directoryUuid']
                    );
                } else {
                    fetchRootFolders().then((roots) => {
                        roots
                            .filter((r) => r.subdirectoriesCount > 0)
                            .forEach((element) => {
                                fetchDirectoryContent(element.elementUuid).then(
                                    (content) => {
                                        addToDirectory(
                                            content.elementUuid,
                                            content.filter((item) =>
                                                filter.has(item.type)
                                            )
                                        );
                                    }
                                );
                                // let arr = [];
                                // Object.values(nodeMap.current).map((el, key) =>
                                //     arr.push(el)
                                // );
                                setData([...dataRef.current]);
                            });
                    });
                }
            }
        }
    }, [
        addToDirectory,
        contentFilter,
        directory2Tree,
        directoryUpdatedForce,
        updateDirectoryTreeAndContent,
    ]);

    const fetchDirectory = (nodeId) => {
        fetchDirectoryContent(nodeId).then((content) => {
            addToDirectory(
                nodeId,
                content.filter((item) => contentFilter().has(item.type))
            );
            setData([...data]);
        });
    };

    return (
        <TreeViewFinder
            onTreeBrowse={fetchDirectory}
            data={data}
            onlyLeaves={false}
            sortMethod={sortAlphabetically}
            {...props}
        />
    );
};

DirectorySelector.propTypes = {
    open: PropTypes.bool.isRequired,
};

export default DirectorySelector;
