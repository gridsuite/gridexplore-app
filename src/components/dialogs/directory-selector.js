import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TreeViewFinder } from '@gridsuite/commons-ui';
import PropTypes from 'prop-types';
import { fetchDirectoryContent, fetchRootFolders } from '../../utils/rest-api';
import makeStyles from '@mui/styles/makeStyles';
import { getFileIcon, elementType } from '@gridsuite/commons-ui';

const useStyles = makeStyles((theme) => ({
    icon: {
        marginRight: theme.spacing(1),
        width: '18px',
        height: '18px',
    },
}));

const DirectorySelector = (props) => {
    const [data, setData] = useState([]);
    const nodeMap = useRef({});
    const classes = useStyles();

    const contentFilter = new Set([elementType.DIRECTORY]);

    const directory2Tree = useCallback(
        (newData) => {
            const newNode = {
                id: newData.elementUuid,
                name: newData.elementName,
                icon: getFileIcon(newData.type, classes.icon),
                children:
                    newData.type === elementType.DIRECTORY ? [] : undefined,
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

    const fetchDirectory = (nodeId) => {
        fetchDirectoryContent(nodeId).then((content) => {
            addToDirectory(
                nodeId,
                content.filter((item) => contentFilter.has(item.type))
            );
            setData([...data]);
        });
    };

    return (
        <TreeViewFinder
            multiselect={false}
            onTreeBrowse={fetchDirectory}
            data={data}
            onlyLeaves={false}
            {...props}
        />
    );
};

DirectorySelector.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
};

export default DirectorySelector;
