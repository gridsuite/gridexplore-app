/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useState } from 'react';

import makeStyles from '@material-ui/core/styles/makeStyles';
import TreeItem from '@material-ui/lab/TreeItem';
import TreeView from '@material-ui/lab/TreeView';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import { fetchDirectoryContent } from '../utils/rest-api';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentChildren, setSelectedDirectory } from '../redux/actions';

const useStyles = makeStyles((theme) => ({
    paper: {
        height: 140,
        width: 100,
    },
    control: {
        padding: theme.spacing(2),
    },
}));

const CustomTreeView = ({ rootDirectory }) => {
    const [treeData, setTreeData] = useState(rootDirectory);
    const [expanded, setExpanded] = React.useState([]);
    const dispatch = useDispatch();
    const classes = useStyles();

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

    const renderTree = (nodes) => (
        <TreeItem
            key={nodes.elementUuid}
            nodeId={nodes.elementUuid}
            label={nodes.elementName}
        >
            {Array.isArray(nodes.children)
                ? nodes.children.map((node) => renderTree(node))
                : null}
        </TreeItem>
    );

    const handleSelect = (event, nodeIds) => {
        dispatch(setSelectedDirectory(nodeIds));
        fetchDirectoryContent(nodeIds).then((childrenToBeInserted) => {
            dispatch(
                setCurrentChildren(
                    childrenToBeInserted.filter(
                        (child) => child.type !== 'DIRECTORY'
                    )
                )
            );
            let treeDataCopy = { ...treeData };
            insertContent(
                nodeIds,
                treeDataCopy,
                childrenToBeInserted.filter(
                    (child) => child.type === 'DIRECTORY'
                )
            );
            if (expanded.includes(nodeIds)) {
                removeElement(nodeIds);
            } else {
                addElement(nodeIds);
            }
            setTreeData(treeDataCopy);
        });
    };

    const removeElement = (nodeIds) => {
        let expandedCopy = [...expanded];
        for (let i = 0; i < expandedCopy.length; i++) {
            if (expandedCopy[i] === nodeIds) {
                expandedCopy.splice(i, 1);
            }
        }
        setExpanded(expandedCopy);
    };

    const addElement = (nodeIds) => {
        setExpanded([...expanded, nodeIds]);
    };
    return (
        <>
            <TreeView
                className={classes.root}
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

export default CustomTreeView;
