/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { FormattedMessage, useIntl } from 'react-intl';

import Chip from '@material-ui/core/Chip';
import Tooltip from '@material-ui/core/Tooltip';
import makeStyles from '@material-ui/core/styles/makeStyles';
import CircularProgress from '@material-ui/core/CircularProgress';

import LibraryBooksOutlinedIcon from '@material-ui/icons/LibraryBooksOutlined';
import FolderOpenRoundedIcon from '@material-ui/icons/FolderOpenRounded';

import VirtualizedTable from './util/virtualized-table';
import { elementType } from '../utils/elementType';
import { fetchStudiesInfos } from '../utils/rest-api';
import { DEFAULT_CELL_PADDING } from '@gridsuite/commons-ui';
import { Checkbox } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
    link: {
        color: theme.link.color,
        textDecoration: 'none',
    },
    cell: {
        display: 'flex',
        alignItems: 'center',
        textAlign: 'center',
        boxSizing: 'border-box',
        flex: 1,
        height: '48px',
        cursor: 'initial',
        padding: DEFAULT_CELL_PADDING,
    },
    checkboxes: {
        width: '100%',
        justifyContent: 'center',
    },
}));

const DirectoryContent = () => {
    const [childrenMetadata, setChildrenMetadata] = useState({});
    const [selected, setSelected] = useState(new Set());

    const currentChildren = useSelector((state) => state.currentChildren);
    const appsAndUrls = useSelector((state) => state.appsAndUrls);
    const selectedDirectory = useSelector((state) => state.selectedDirectory);

    const classes = useStyles();

    const intl = useIntl();

    const abbreviationFromUserName = (name) => {
        const tab = name.split(' ').map((x) => x.charAt(0));
        if (tab.length === 1) {
            return tab[0];
        } else {
            return tab[0] + tab[tab.length - 1];
        }
    };

    function accessRightsCellRender(cellData) {
        const isPrivate = cellData.rowData[cellData.dataKey].private;
        return (
            <div className={classes.cell}>
                {isPrivate ? (
                    <FormattedMessage id="private" />
                ) : (
                    <FormattedMessage id="public" />
                )}
            </div>
        );
    }

    function getLink(elementUuid, objectType) {
        let href = '#';
        if (appsAndUrls !== null) {
            if (objectType === elementType.STUDY) {
                href = appsAndUrls[1].url + '/studies/' + elementUuid;
            }
        }
        return href;
    }

    function typeCellRender(cellData) {
        const objectType = cellData.rowData[cellData.dataKey];
        return (
            <div className={classes.cell}>
                <p>{objectType.toLowerCase()}</p>
            </div>
        );
    }

    function accessOwnerCellRender(cellData) {
        const owner = cellData.rowData[cellData.dataKey];
        return (
            <div className={classes.cell}>
                <Tooltip title={owner} placement="right">
                    <Chip label={abbreviationFromUserName(owner)} />
                </Tooltip>
            </div>
        );
    }

    function nameCellRender(cellData) {
        const elementUuid = cellData.rowData['elementUuid'];
        const elementName = cellData.rowData['elementName'];
        const objectType = cellData.rowData['type'];
        return (
            <div className={classes.cell}>
                {!childrenMetadata[elementUuid] && (
                    <CircularProgress size={25} />
                )}
                {childrenMetadata[elementUuid] &&
                    objectType === elementType.STUDY && (
                        <LibraryBooksOutlinedIcon />
                    )}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginLeft: '10px',
                    }}
                >
                    {childrenMetadata[elementUuid] ? (
                        <div>{childrenMetadata[elementUuid].name}</div>
                    ) : (
                        <>
                            {elementName}{' '}
                            <FormattedMessage id="creationInProgress" />
                        </>
                    )}
                </div>
            </div>
        );
    }

    function toggleSelection(elementUuid) {
        let newSelection = new Set(selected);
        if (!newSelection.delete(elementUuid)) {
            newSelection.add(elementUuid);
        }
        setSelected(newSelection);
    }

    function toggleSelectAll() {
        if (selected.size === currentChildren.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(currentChildren.map((c) => c.elementUuid)));
        }
    }

    function selectionHeaderRenderer() {
        return (
            <div
                onClick={(e) => {
                    toggleSelectAll();
                    e.stopPropagation();
                }}
                className={classes.checkboxes}
            >
                <Checkbox
                    color={'primary'}
                    checked={selected.size === currentChildren.length}
                />
            </div>
        );
    }

    function selectionRenderer(cellData) {
        const elementUuid = cellData.rowData['elementUuid'];
        return (
            <div
                onClick={(e) => {
                    toggleSelection(elementUuid);
                    e.stopPropagation();
                }}
                className={classes.checkboxes}
            >
                <Checkbox
                    color={'primary'}
                    checked={selected.has(elementUuid)}
                />
            </div>
        );
    }

    useEffect(() => {
        if (currentChildren !== null) {
            let uuids = [];
            currentChildren
                .filter((e) => e.type === elementType.STUDY)
                .map((e) => uuids.push(e.elementUuid));
            fetchStudiesInfos(uuids).then((res) => {
                let metadata = {};
                res.map((e) => {
                    metadata[e.studyUuid] = {
                        name: e.studyName,
                    };
                    return e;
                });
                setChildrenMetadata(metadata);
            });
        }
        setSelected(new Set());
    }, [currentChildren]);

    return (
        <>
            {selectedDirectory !== null &&
                currentChildren !== null &&
                currentChildren.length === 0 && (
                    <div style={{ textAlign: 'center', marginTop: '100px' }}>
                        <FolderOpenRoundedIcon
                            style={{ width: '100px', height: '100px' }}
                        />
                        <h1>
                            <FormattedMessage id={'emptyDir'} />
                        </h1>
                    </div>
                )}
            {selectedDirectory !== null &&
                currentChildren !== null &&
                currentChildren.length > 0 && (
                    <VirtualizedTable
                        onRowClick={(event) => {
                            if (
                                childrenMetadata[event.rowData.elementUuid] !==
                                undefined
                            ) {
                                let url = getLink(
                                    event.rowData.elementUuid,
                                    event.rowData.type
                                );
                                window.open(url, '_blank');
                            }
                        }}
                        rows={currentChildren}
                        columns={[
                            {
                                cellRenderer: selectionRenderer,
                                dataKey: 'selected',
                                label: '',
                                headerRenderer: selectionHeaderRenderer,
                                maxWidth: '60px',
                            },
                            {
                                width: 100,
                                label: intl.formatMessage({
                                    id: 'elementName',
                                }),
                                dataKey: 'elementName',
                                cellRenderer: nameCellRender,
                            },
                            {
                                width: 100,
                                label: intl.formatMessage({ id: 'type' }),
                                dataKey: 'type',
                                cellRenderer: typeCellRender,
                            },
                            {
                                width: 50,
                                label: intl.formatMessage({ id: 'owner' }),
                                dataKey: 'owner',
                                cellRenderer: accessOwnerCellRender,
                            },
                            {
                                width: 50,
                                label: intl.formatMessage({
                                    id: 'accessRights',
                                }),
                                dataKey: 'accessRights',
                                cellRenderer: accessRightsCellRender,
                            },
                        ]}
                    />
                )}
        </>
    );
};

export default DirectoryContent;
