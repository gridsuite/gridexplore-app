/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useState } from 'react';

import TreeItem from '@material-ui/lab/TreeItem';
import TreeView from '@material-ui/lab/TreeView';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import { fetchDirectoryContent } from '../utils/rest-api';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentChildren, setSelectedDirectory } from '../redux/actions';

const DirectoryTreeView = ({ rootDirectory }) => {
    const [treeData, setTreeData] = useState(rootDirectory);
    const [expanded, setExpanded] = React.useState([]);
    const dispatch = useDispatch();

    const selectedDirectory = useSelector((state) => state.selectedDirectory);

    const insertContent = (selected, treeDataCopy, childrenToBeInserted) => {
        if (treeDataCopy.elementUuid === selected) {
            if (treeDataCopy.children === undefined) {
                treeDataCopy.children = childrenToBeInserted;
            }
        } else {
            if (treeDataCopy.children != null) {
                treeDataCopy.children.forEach((child) => {
                    insertContent(selected, child, childrenToBeInserted);
                });
            }
        }
    };

    const renderTree = (node) => (
        <TreeItem
            key={node.elementUuid}
            nodeId={node.elementUuid}
            label={node.elementName}
        >
            {Array.isArray(node.children)
                ? node.children.map((node) => renderTree(node))
                : null}
        </TreeItem>
    );

    const handleSelect = (event, nodeId) => {
        dispatch(setSelectedDirectory(nodeId));
        fetchDirectoryContent(nodeId).then((childrenToBeInserted) => {
            dispatch(
                setCurrentChildren(
                    childrenToBeInserted.filter(
                        (child) => child.type !== 'DIRECTORY'
                    )
                )
            );
            let treeDataCopy = { ...treeData };
            insertContent(
                nodeId,
                treeDataCopy,
                childrenToBeInserted.filter(
                    (child) => child.type === 'DIRECTORY'
                )
            );
            if (expanded.includes(nodeId)) {
                removeElement(nodeId);
            } else {
                addElement(nodeId);
            }
            setTreeData(treeDataCopy);
        });
    };

    const removeElement = (nodeId) => {
        let expandedCopy = [...expanded];
        for (let i = 0; i < expandedCopy.length; i++) {
            if (expandedCopy[i] === nodeId) {
                expandedCopy.splice(i, 1);
            }
        }
        setExpanded(expandedCopy);
    };

    const addElement = (nodeId) => {
        setExpanded([...expanded, nodeId]);
    };
    return (
        <>
            <TreeView
                defaultCollapseIcon={<ExpandMoreIcon />}
                defaultExpanded={['root']}
                defaultExpandIcon={<ChevronRightIcon />}
                onNodeSelect={handleSelect}
                expanded={expanded}
                selected={selectedDirectory}
            >
                {renderTree(treeData)}
            </TreeView>
        </>
    );
};

export default DirectoryTreeView;
