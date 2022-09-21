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
import { updatedTree } from '../tree-views-container';

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
    const [rootDirectories, setRootDirectories] = useState([]);
    const [data, setData] = useState([]);
    const nodeMap = useRef({});
    const classes = useStyles();

    const rootsRef = useRef([]);
    rootsRef.current = rootDirectories;

    const contentFilter = useCallback(
        () => new Set([elementType.DIRECTORY]),
        []
    );

    const dataRef = useRef([]);
    dataRef.current = data;

    const directoryUpdatedForce = useSelector(
        (state) => state.directoryUpdated
    );

    // TODO keep only one of both convert recursive function
    const convertChildren = useCallback(
        (children) => {
            let formattedChildren = children.map((e) => {
                return {
                    id: e.elementUuid,
                    name: e.elementName,
                    icon: getFileIcon(e.type, classes.icon),
                    children:
                        e.type === elementType.DIRECTORY
                            ? convertChildren(e.children)
                            : undefined,
                    childrenCount:
                        e.type === elementType.DIRECTORY
                            ? e.subdirectoriesCount
                            : undefined,
                };
            });

            return formattedChildren;
        },
        [classes.icon]
    );

    const convertRoots = useCallback(
        (newRoots) => {
            return newRoots.map((e) => {
                return {
                    id: e.elementUuid,
                    name: e.elementName,
                    icon: getFileIcon(e.type, classes.icon),
                    children:
                        e.type === elementType.DIRECTORY
                            ? convertChildren(
                                  nodeMap.current[e.elementUuid].children
                              )
                            : undefined,
                    childrenCount:
                        e.type === elementType.DIRECTORY
                            ? e.subdirectoriesCount
                            : undefined,
                };
            });
        },
        [classes.icon, convertChildren]
    );

    const updateRootDirectories = useCallback(() => {
        fetchRootFolders().then((data) => {
            let [nrs, mdr] = updatedTree(
                rootsRef.current,
                nodeMap.current,
                null,
                data
            );
            setRootDirectories(nrs);
            nodeMap.current = mdr;
            setData(convertRoots(nrs));
        });
    }, [convertRoots]);

    useEffect(() => {
        if (props.open && data.length === 0) {
            updateRootDirectories();
        }
    }, [props.open, data, updateRootDirectories]);

    const addToDirectory = useCallback(
        (nodeId, content) => {
            let [nrs, mdr] = updatedTree(
                rootsRef.current,
                nodeMap.current,
                nodeId,
                content
            );
            setRootDirectories(nrs);
            nodeMap.current = mdr;
            setData(convertRoots(nrs));
        },
        [convertRoots]
    );

    const fetchDirectory = useCallback(
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
        if (props.open && directoryUpdatedForce.eventData.headers) {
            if (
                Object.values(notificationType).includes(
                    directoryUpdatedForce.eventData.headers['notificationType']
                )
            ) {
                if (
                    !directoryUpdatedForce.eventData.headers['isRootDirectory']
                ) {
                    fetchDirectory(
                        directoryUpdatedForce.eventData.headers['directoryUuid']
                    );
                } else {
                    updateRootDirectories();
                }
            }
        }
        // TODO this effect should not been proc if props.open, maybe use openRef here ? beurk
    }, [
        directoryUpdatedForce,
        fetchDirectory,
        props.open,
        updateRootDirectories,
    ]);

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
