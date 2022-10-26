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
import {
    displayWarningMessageWithSnackbar,
    useIntlRef,
} from '../../utils/messages';
import { useSnackbar } from 'notistack';

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

    const openRef = useRef();
    openRef.current = props.open;

    const contentFilter = useCallback(
        () => new Set([elementType.DIRECTORY]),
        []
    );

    const dataRef = useRef([]);
    dataRef.current = data;

    const directoryUpdatedForce = useSelector(
        (state) => state.directoryUpdated
    );

    const { enqueueSnackbar } = useSnackbar();
    const intlRef = useIntlRef();

    const convertChildren = useCallback(
        (children) => {
            return children.map((e) => {
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
        if (props.open) {
            updateRootDirectories();
        }
    }, [props.open, updateRootDirectories]);

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

    const fetchDirectoryWarn = useCallback(
        (directoryUuid, msg) =>
            displayWarningMessageWithSnackbar({
                errorMessage: msg,
                enqueueSnackbar: enqueueSnackbar,
                headerMessage: {
                    headerMessageId: 'directoryUpdateWarning',
                    intlRef: intlRef,
                    headerMessageValues: { directoryUuid },
                },
            }),
        [enqueueSnackbar, intlRef]
    );

    const fetchDirectory = useCallback(
        (directoryUuid) => {
            fetchDirectoryContent(directoryUuid)
                .then((childrenToBeInserted) => {
                    // update directory Content
                    addToDirectory(
                        directoryUuid,
                        childrenToBeInserted.filter((item) =>
                            contentFilter().has(item.type)
                        )
                    );
                })
                .catch((reason) => {
                    fetchDirectoryWarn(directoryUuid, reason);
                });
        },
        [addToDirectory, contentFilter, fetchDirectoryWarn]
    );

    useEffect(() => {
        if (openRef.current && directoryUpdatedForce.eventData.headers) {
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
    }, [directoryUpdatedForce, fetchDirectory, updateRootDirectories]);

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
