/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import VirtualizedTable from './util/virtualized-table';
import { FormattedMessage, useIntl } from 'react-intl';
import Chip from '@material-ui/core/Chip';
import makeStyles from '@material-ui/core/styles/makeStyles';
import LibraryBooksOutlinedIcon from '@material-ui/icons/LibraryBooksOutlined';
import FolderOpenRoundedIcon from '@material-ui/icons/FolderOpenRounded';
import CircularProgress from '@material-ui/core/CircularProgress';

import Tooltip from '@material-ui/core/Tooltip';
import { fetchStudiesInfos } from '../utils/rest-api';

const useStyles = makeStyles((theme) => ({
    link: {
        color: theme.link.color,
        textDecoration: 'none',
    },
    tablePaper: {
        flexGrow: 1,
    },
    cell: {
        display: 'flex',
        alignItems: 'center',
        textAlign: 'center',
        boxSizing: 'border-box',
        flex: 1,
        height: '48px',
        cursor: 'initial',
        borderBottom: '1px solid rgba(81, 81, 81, 1)',
    },
}));

const elementType = {
    DIRECTORY: 'DIRECTORY',
    STUDY: 'STUDY',
    FILTER: 'FILTER',
};

const DirectoryContent = () => {
    const currentChildren = useSelector((state) => state.currentChildren);
    const [childrenMetadata, setChildrenMetadata] = useState({});
    const appsAndUrls = useSelector((state) => state.appsAndUrls);

    const intl = useIntl();
    const classes = useStyles();

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

    function getLink(elementUuid, objectType, objectName) {
        if (elementUuid === null || objectName === null) {
            return '...';
        }
        let href = '#';
        if (appsAndUrls !== null) {
            if (objectType === elementType.STUDY) {
                href = appsAndUrls[1].url + '/studies/' + elementUuid;
            }
        }
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={classes.link}
                style={{ display: 'flex', alignItems: 'center' }}
            >
                {objectType === elementType.STUDY && (
                    <LibraryBooksOutlinedIcon style={{ margin: '10px' }} />
                )}
                <div>{objectName}</div>
            </a>
        );
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
        const objectType = cellData.rowData['type'];
        return (
            <div className={classes.cell}>
                {childrenMetadata[elementUuid] ? (
                    getLink(
                        elementUuid,
                        objectType,
                        childrenMetadata[elementUuid].name
                    )
                ) : (
                    <div>
                        <FormattedMessage id="creationInProgress" />{' '}
                        <CircularProgress size={25} />
                    </div>
                )}
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
    }, [currentChildren]);

    return (
        <>
            {currentChildren && currentChildren.length === 0 && (
                <div style={{ textAlign: 'center', marginTop: '100px' }}>
                    <FolderOpenRoundedIcon
                        style={{ width: '100px', height: '100px' }}
                    />
                    <h1>
                        <FormattedMessage id={'emptyDir'} />
                    </h1>
                </div>
            )}
            {currentChildren && currentChildren.length > 0 && (
                <VirtualizedTable
                    rows={currentChildren}
                    columns={[
                        {
                            width: 100,
                            label: intl.formatMessage({ id: 'elementName' }),
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
                            label: intl.formatMessage({ id: 'accessRights' }),
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
