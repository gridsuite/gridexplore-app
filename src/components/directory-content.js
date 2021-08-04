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
import { DEFAULT_CELL_PADDING } from '@gridsuite/commons-ui';

import {
    deleteElement,
    fetchStudiesInfos,
    renameStudy,
    updateAccessRights,
} from '../utils/rest-api';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import GetAppIcon from '@material-ui/icons/GetApp';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import BuildIcon from '@material-ui/icons/Build';
import ListItemText from '@material-ui/core/ListItemText';
import withStyles from '@material-ui/core/styles/withStyles';
import Menu from '@material-ui/core/Menu';
import ExportDialog from './export-dialog';
import RenameDialog from './dialogs/rename-dialog';
import DeleteDialog from './dialogs/delete-dialog';
import AccessRightsDialog from './dialogs/access-rights-dialog';

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
}));

const StyledMenu = withStyles({
    paper: {
        border: '1px solid #d3d4d5',
    },
})((props) => (
    <Menu
        elevation={0}
        getContentAnchorEl={null}
        anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
        }}
        transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
        }}
        {...props}
    />
));

const DirectoryContent = () => {
    const [childrenMetadata, setChildrenMetadata] = useState({});

    const currentChildren = useSelector((state) => state.currentChildren);
    const appsAndUrls = useSelector((state) => state.appsAndUrls);
    const selectedDirectory = useSelector((state) => state.selectedDirectory);

    const [anchorEl, setAnchorEl] = React.useState(null);
    const [selectedStudy, setSelectedStudy] = React.useState('');
    const [isSelectedStudyPrivate, setSelectedStudyPrivate] = React.useState(
        true
    );
    const DownloadIframe = 'downloadIframe';

    const classes = useStyles();
    const intl = useIntl();

    /**
     * Rename dialog: window status value for renaming
     */
    const [openRenameStudyDialog, setOpenRenameStudyDialog] = React.useState(
        false
    );
    const [renameError, setRenameError] = React.useState('');

    const handleOpenRenameStudy = () => {
        setAnchorEl(null);
        setOpenRenameStudyDialog(true);
    };

    const handleCloseRenameStudy = () => {
        setOpenRenameStudyDialog(false);
        setRenameError('');
        setSelectedStudy('');
        setSelectedStudyPrivate(undefined);
    };

    const handleClickRenameStudy = (newStudyNameValue) => {
        renameStudy(selectedStudy.elementUuid, newStudyNameValue)
            .then((response) => {
                if (response.status === 403) {
                    // == FORBIDDEN
                    setRenameError(
                        intl.formatMessage({ id: 'renameStudyNotAllowedError' })
                    );
                } else if (response.status === 404) {
                    // == NOT FOUND
                    setRenameError(
                        intl.formatMessage({ id: 'renameStudyNotFoundError' })
                    );
                } else {
                    handleCloseRenameStudy();
                }
            })
            .catch((e) => {
                setRenameError(e.message || e);
            });
    };

    /**
     * Delete dialog: window status value for deletion
     */
    const [openDeleteStudyDialog, setOpenDeleteStudyDialog] = React.useState(
        false
    );
    const [deleteError, setDeleteError] = React.useState('');

    const handleOpenDeleteStudy = () => {
        setAnchorEl(null);
        setOpenDeleteStudyDialog(true);
    };

    const handleCloseDeleteStudy = () => {
        setOpenDeleteStudyDialog(false);
        setDeleteError('');
        setSelectedStudy('');
        setSelectedStudyPrivate(undefined);
    };

    const handleClickDeleteStudy = () => {
        deleteElement(selectedStudy.elementUuid).then((response) => {
            if (!response.ok) {
                setDeleteError(intl.formatMessage({ id: 'deleteStudyError' }));
            } else {
                handleCloseDeleteStudy();
            }
        });
    };

    /**
     * Export dialog: window status value for exporting a network
     */
    const [openExportStudyDialog, setOpenExportStudyDialog] = React.useState(
        false
    );

    const handleOpenExportStudy = () => {
        setAnchorEl(null);
        setOpenExportStudyDialog(true);
    };

    const handleCloseExportStudy = () => {
        setOpenExportStudyDialog(false);
        setSelectedStudy('');
        setSelectedStudyPrivate(undefined);
    };

    const handleClickExportStudy = (url) => {
        window.open(url, DownloadIframe);
        handleCloseExportStudy();
    };

    /**
     * AccessRights dialog: window status value for updating access rights
     */
    const [
        openStudyAccessRightsDialog,
        setOpenStudyAccessRightsDialog,
    ] = React.useState(false);

    const [accessRightsError, setAccessRightsError] = React.useState('');

    const handleOpenStudyAccessRights = () => {
        setAnchorEl(null);
        setOpenStudyAccessRightsDialog(true);
    };

    const handleCloseStudyAccessRights = () => {
        setOpenStudyAccessRightsDialog(false);
        setSelectedStudy('');
        setSelectedStudyPrivate(undefined);
        setAccessRightsError('');
    };

    const handleCloseRowMenu = () => {
        setAnchorEl(null);
        setSelectedStudy('');
        setSelectedStudyPrivate(undefined);
    };

    const handleClickStudyAccessRights = (selected) => {
        updateAccessRights(selectedStudy.elementUuid, selected).then(
            (response) => {
                if (response.status === 403) {
                    setAccessRightsError(
                        intl.formatMessage({
                            id: 'modifyAccessRightsNotAllowedError',
                        })
                    );
                } else if (response.status === 404) {
                    setAccessRightsError(
                        intl.formatMessage({
                            id: 'modifyAccessRightsNotFoundError',
                        })
                    );
                } else {
                    handleCloseStudyAccessRights();
                }
            }
        );
    };

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
                    <>
                        <VirtualizedTable
                            onRowRightClick={(event) => {
                                if (event.rowData.type === 'STUDY') {
                                    setSelectedStudy(event.rowData);
                                    setSelectedStudyPrivate(
                                        event.rowData.accessRights.private
                                    );
                                }
                                setAnchorEl(event.event.currentTarget);
                            }}
                            onRowClick={(event) => {
                                if (
                                    childrenMetadata[
                                        event.rowData.elementUuid
                                    ] !== undefined
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
                        <StyledMenu
                            id="row-menu"
                            anchorEl={anchorEl}
                            keepMounted
                            open={Boolean(anchorEl)}
                            onClose={handleCloseRowMenu}
                        >
                            {selectedStudy !== '' && (
                                <div>
                                    <MenuItem onClick={handleOpenRenameStudy}>
                                        <ListItemIcon
                                            style={{ minWidth: '25px' }}
                                        >
                                            <EditIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <FormattedMessage id="rename" />
                                            }
                                        />
                                    </MenuItem>
                                    <MenuItem
                                        onClick={handleOpenStudyAccessRights}
                                    >
                                        <ListItemIcon
                                            style={{ minWidth: '25px' }}
                                        >
                                            <BuildIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <FormattedMessage id="accessRights" />
                                            }
                                        />
                                    </MenuItem>
                                    <MenuItem onClick={handleOpenExportStudy}>
                                        <ListItemIcon
                                            style={{ minWidth: '25px' }}
                                        >
                                            <GetAppIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <FormattedMessage id="export" />
                                            }
                                        />
                                    </MenuItem>
                                    <MenuItem onClick={handleOpenDeleteStudy}>
                                        <ListItemIcon
                                            style={{ minWidth: '25px' }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <FormattedMessage id="delete" />
                                            }
                                        />
                                    </MenuItem>
                                </div>
                            )}
                        </StyledMenu>
                    </>
                )}
            <RenameDialog
                open={openRenameStudyDialog}
                onClose={handleCloseRenameStudy}
                onClick={handleClickRenameStudy}
                title={useIntl().formatMessage({ id: 'renameStudy' })}
                message={useIntl().formatMessage({ id: 'renameStudyMsg' })}
                currentName={selectedStudy.elementName}
                error={renameError}
            />
            <DeleteDialog
                open={openDeleteStudyDialog}
                onClose={handleCloseDeleteStudy}
                onClick={handleClickDeleteStudy}
                title={useIntl().formatMessage({ id: 'deleteStudy' })}
                message={useIntl().formatMessage({ id: 'deleteStudyMsg' })}
                error={deleteError}
            />
            <ExportDialog
                open={openExportStudyDialog}
                onClose={handleCloseExportStudy}
                onClick={handleClickExportStudy}
                studyUuid={selectedStudy.elementUuid}
                title={useIntl().formatMessage({ id: 'exportNetwork' })}
            />
            <AccessRightsDialog
                open={openStudyAccessRightsDialog}
                onClose={handleCloseStudyAccessRights}
                onClick={handleClickStudyAccessRights}
                title={useIntl().formatMessage({ id: 'modifyAccessRights' })}
                isPrivate={isSelectedStudyPrivate}
                error={accessRightsError}
            />
            <iframe
                id={DownloadIframe}
                name={DownloadIframe}
                title={DownloadIframe}
                style={{ display: 'none' }}
            />
        </>
    );
};

export default DirectoryContent;
