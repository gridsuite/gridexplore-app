/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import VirtualizedTable from './util/virtualized-table';
import { useIntl } from 'react-intl';
import Checkbox from '@material-ui/core/Checkbox';
import Chip from '@material-ui/core/Chip';
import makeStyles from '@material-ui/core/styles/makeStyles';
import MapOutlinedIcon from '@material-ui/icons/MapOutlined';
import LibraryBooksOutlinedIcon from '@material-ui/icons/LibraryBooksOutlined';
import FlashOnOutlinedIcon from '@material-ui/icons/FlashOnOutlined';
import BubbleChartOutlinedIcon from '@material-ui/icons/BubbleChartOutlined';
import FolderOpenRoundedIcon from '@material-ui/icons/FolderOpenRounded';

import Tooltip from '@material-ui/core/Tooltip';

const useStyles = makeStyles(() => ({
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
    succeed: {
        color: 'green',
    },
    fail: {
        color: 'red',
    },
}));

const elementType = {
    DIRECTORY: 'DIRECTORY',
    CASE: 'CASE',
    STUDY: 'STUDY',
    HYPOTHESIS: 'HYPOTHESIS',
    CONTINGENCY: 'CONTINGENCY',
    FILTER: 'FILTER',
};

const DirectoryContent = () => {
    const currentChildren = useSelector((state) => state.currentChildren);
    const intl = useIntl();
    const classes = useStyles();

    useEffect(() => {}, [currentChildren]);

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
                <Checkbox
                    checked={isPrivate}
                    inputProps={{ 'aria-label': 'primary checkbox' }}
                />
            </div>
        );
    }

    function fileCellRender(cellData) {
        const fileType = cellData.rowData[cellData.dataKey];
        return (
            <div className={classes.cell}>
                {fileType === elementType.STUDY && (
                    <LibraryBooksOutlinedIcon style={{ marginLeft: '10px' }} />
                )}
                {fileType === elementType.CASE && (
                    <MapOutlinedIcon style={{ marginLeft: '10px' }} />
                )}
                {fileType === elementType.HYPOTHESIS && (
                    <MapOutlinedIcon style={{ marginLeft: '10px' }} />
                )}
                {fileType === elementType.CONTINGENCY && (
                    <FlashOnOutlinedIcon style={{ marginLeft: '10px' }} />
                )}
                {fileType === elementType.FILTER && (
                    <BubbleChartOutlinedIcon style={{ marginLeft: '10px' }} />
                )}
                <p style={{ marginLeft: '10px' }}>{fileType}</p>
            </div>
        );
    }

    function accessOwnerCellRender(cellData) {
        const owner = cellData.rowData[cellData.dataKey];
        return (
            <div className={classes.cell}>
                <Tooltip title={owner}>
                    <Chip label={abbreviationFromUserName(owner)} />
                </Tooltip>
            </div>
        );
    }

    return (
        <>
            {currentChildren && currentChildren.length === 0 && (
                <div style={{ textAlign: 'center', marginTop: '100px' }}>
                    <FolderOpenRoundedIcon
                        style={{ width: '100px', height: '100px' }}
                    />
                    <h1>empty directory</h1>
                </div>
            )}
            {currentChildren && currentChildren.length > 0 && (
                <VirtualizedTable
                    rows={currentChildren}
                    columns={[
                        {
                            width: 100,
                            label: intl.formatMessage({ id: 'type' }),
                            dataKey: 'type',
                            cellRenderer: fileCellRender,
                        },
                        {
                            width: 100,
                            label: intl.formatMessage({ id: 'elementName' }),
                            dataKey: 'elementName',
                        },
                        {
                            width: 50,
                            label: intl.formatMessage({ id: 'owner' }),
                            dataKey: 'owner',
                            cellRenderer: accessOwnerCellRender,
                        },
                        {
                            width: 50,
                            label: intl.formatMessage({ id: 'private' }),
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
