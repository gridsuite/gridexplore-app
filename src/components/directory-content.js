/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { FormattedMessage, useIntl } from 'react-intl';

import * as constants from '../utils/UIconstants';

import Chip from '@material-ui/core/Chip';
import Tooltip from '@material-ui/core/Tooltip';
import makeStyles from '@material-ui/core/styles/makeStyles';
import CircularProgress from '@material-ui/core/CircularProgress';

import LibraryBooksOutlinedIcon from '@material-ui/icons/LibraryBooksOutlined';
import FolderOpenRoundedIcon from '@material-ui/icons/FolderOpenRounded';

import VirtualizedTable from './virtualized-table';
import { elementType } from '../utils/elementType';
import { DEFAULT_CELL_PADDING } from '@gridsuite/commons-ui';
import { Checkbox } from '@material-ui/core';
import { Toolbar } from '@material-ui/core';

import {
    deleteElement,
    fetchStudiesInfos,
    renameElement,
    updateAccessRights,
} from '../utils/rest-api';

import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import withStyles from '@material-ui/core/styles/withStyles';
import Menu from '@material-ui/core/Menu';

import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import IconButton from '@material-ui/core/IconButton';

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
        padding: DEFAULT_CELL_PADDING,
    },
    chip: {
        cursor: 'pointer',
    },
    icon: {
        marginRight: theme.spacing(1),
        width: '18px',
        height: '18px',
    },
    circularRoot: {
        marginRight: theme.spacing(1),
    },
    checkboxes: {
        width: '100%',
        justifyContent: 'center',
    },
}));

const StyledMenu = withStyles({
    paper: {
        border: '1px solid #d3d4d5',
    },
})((props) => <Menu elevation={0} getContentAnchorEl={null} {...props} />);

const initialMousePosition = {
    mouseX: null,
    mouseY: null,
};

const DirectoryContent = () => {
    const [childrenMetadata, setChildrenMetadata] = useState({});
    const [selectedUuids, setSelectedUuids] = useState(new Set());

    const currentChildren = useSelector((state) => state.currentChildren);
    const appsAndUrls = useSelector((state) => state.appsAndUrls);
    const selectedDirectory = useSelector((state) => state.selectedDirectory);
    const userId = useSelector((state) => state.user.profile.sub);

    const [anchorEl, setAnchorEl] = React.useState(null);
    const [contextualStudy, setContextualStudy] = React.useState(null);

    const DownloadIframe = 'downloadIframe';

    const classes = useStyles();
    const intl = useIntl();

    /* Menu states */
    const [mousePosition, setMousePosition] = React.useState(
        initialMousePosition
    );

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
    };

    const handleClickRenameStudy = (newStudyNameValue) => {
        renameElement(contextualStudy.elementUuid, newStudyNameValue)
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
        setContextualStudy('');
    };

    const handleClickDeleteStudy = () => {
        let selectedChildren = getSelectedChildren(false);
        let notDeleted = [];
        let doneChildren = [];
        for (let child of selectedChildren) {
            deleteElement(child.elementUuid).then((response) => {
                doneChildren.push(child);
                if (!response.ok) {
                    notDeleted.push(child.elementName);
                }

                if (doneChildren.length === selectedChildren.length) {
                    if (notDeleted.length === 0) handleCloseDeleteStudy();
                    else {
                        let msg = intl.formatMessage(
                            { id: 'deleteStudiesFailure' },
                            { problematic: notDeleted.join(' ') }
                        );
                        console.warn(msg);
                        setDeleteError(msg);
                    }
                }
            });
        }
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
        setAccessRightsError('');
    };

    const handleCloseRowMenu = () => {
        setAnchorEl(null);
        setContextualStudy('');
    };

    const handleClickStudyAccessRights = (selected) => {
        updateAccessRights(contextualStudy.elementUuid, selected).then(
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
                    <Chip
                        className={classes.chip}
                        label={abbreviationFromUserName(owner)}
                    />
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
                    <CircularProgress
                        size={18}
                        className={classes.circularRoot}
                    />
                )}
                {childrenMetadata[elementUuid] &&
                    objectType === elementType.STUDY && (
                        <LibraryBooksOutlinedIcon className={classes.icon} />
                    )}

                {childrenMetadata[elementUuid] ? (
                    <div>{childrenMetadata[elementUuid].name}</div>
                ) : (
                    <>
                        {elementName + ' '}
                        <FormattedMessage id="creationInProgress" />
                    </>
                )}
            </div>
        );
    }

    function toggleSelection(elementUuid) {
        let newSelection = new Set(selectedUuids);
        if (!newSelection.delete(elementUuid)) {
            newSelection.add(elementUuid);
        }
        setSelectedUuids(newSelection);
    }

    function toggleSelectAll() {
        if (selectedUuids.size === 0) {
            setSelectedUuids(
                new Set(currentChildren.map((c) => c.elementUuid))
            );
        } else {
            setSelectedUuids(new Set());
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
                    // set the color of checkbox (and check if not indeterminate)
                    checked={selectedUuids.size > 0}
                    indeterminate={
                        selectedUuids.size !== 0 &&
                        selectedUuids.size !== currentChildren.length
                    }
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
                    checked={selectedUuids.has(elementUuid)}
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
        setSelectedUuids(new Set());
    }, [currentChildren]);

    const contextualMixPolicies = {
        BIG: 'GoogleMicrosoft', // if !selectedUuids.has(selected.Uuid) deselects selectedUuids
        ZIMBRA: 'Zimbra', // if !selectedUuids.has(selected.Uuid) just use contextualStudy
        ALL: 'All', // union of contextualStudy.Uuid and selectedUuids (actually implemented)
    };
    let contextualMixPolicy = contextualMixPolicies.ALL;

    const getSelectedChildren = (mayChange = false) => {
        let acc = [];
        let ctxtUuid = contextualStudy ? contextualStudy.elementUuid : null;
        if (contextualStudy) {
            // ctxtUuid = contextualStudy.elementUuid;
            acc.push(contextualStudy);
        }

        if (selectedUuids && currentChildren) {
            if (
                contextualMixPolicy === contextualMixPolicies.ALL ||
                ctxtUuid === null ||
                selectedUuids.has(ctxtUuid)
            ) {
                acc = acc.concat(
                    currentChildren.filter((child) =>
                        selectedUuids.has(child.elementUuid)
                    )
                );
            } else if (
                mayChange &&
                contextualMixPolicy === contextualMixPolicies.BIG
            ) {
                setSelectedUuids(null);
            }
        }
        return [...new Set(acc)];
    };

    const hasSelectedAndAllAreOwned = (mayChange = false) => {
        let selectedChildren = getSelectedChildren(mayChange);
        return (
            selectedChildren &&
            selectedChildren.length > 0 &&
            undefined === selectedChildren.find((c) => c.owner !== userId)
        );
    };

    const isAllowed = () => {
        if (contextualStudy) return contextualStudy.owner === userId;
        if (!selectedUuids) return false;
        let children = getSelectedChildren();
        let soFar = true;
        for (let i = children.size - 1; i >= 0; i--) {
            soFar = children[i].owner === userId;
        }
        return soFar;
    };

    const allowsDelete = (mayChange = false) => {
        return hasSelectedAndAllAreOwned(mayChange);
    };

    const allowsRename = (mayChange = false) => {
        let children = getSelectedChildren(mayChange);
        return children.length === 1 && children[0].owner === userId;
    };

    const allowsPublishability = () => {
        return isAllowed();
    };

    function makeMenuItem(utMsg, cb) {
        return (
            <>
                <MenuItem onClick={cb}>
                    <ListItemIcon
                        style={{
                            minWidth: '25px',
                        }}
                    >
                        <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={<FormattedMessage id={utMsg} />} />
                </MenuItem>
            </>
        );
    }

    return (
        <>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                }}
            >
                {selectedDirectory !== null &&
                    currentChildren !== null &&
                    currentChildren.length === 0 && (
                        <div
                            style={{ textAlign: 'center', marginTop: '100px' }}
                        >
                            <FolderOpenRoundedIcon
                                style={{ width: '100px', height: '100px' }}
                            />
                            <h1>
                                <FormattedMessage id={'emptyDir'} />
                            </h1>
                        </div>
                    )}
                <Toolbar>
                    {allowsDelete(false) && selectedUuids.size > 0 && (
                        <IconButton
                            className={classes.icon}
                            onClick={() => handleClickDeleteStudy()}
                        >
                            <DeleteIcon />
                        </IconButton>
                    )}
                </Toolbar>
                {selectedDirectory !== null &&
                    currentChildren !== null &&
                    currentChildren.length > 0 && (
                        <>
                            <VirtualizedTable
                                style={{ flexGrow: 1 }}
                                onRowRightClick={(event) => {
                                    if (event.rowData.type === 'STUDY') {
                                        setContextualStudy(event.rowData);
                                    }
                                    setMousePosition({
                                        mouseX:
                                            event.event.clientX +
                                            constants.HORIZONTAL_SHIFT,
                                        mouseY:
                                            event.event.clientY +
                                            constants.VERTICAL_SHIFT,
                                    });
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
                                        cellRenderer: selectionRenderer,
                                        dataKey: 'selected',
                                        label: '',
                                        headerRenderer: selectionHeaderRenderer,
                                        maxWidth: 60,
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
                                        label: intl.formatMessage({
                                            id: 'type',
                                        }),
                                        dataKey: 'type',
                                        cellRenderer: typeCellRender,
                                    },
                                    {
                                        width: 50,
                                        label: intl.formatMessage({
                                            id: 'owner',
                                        }),
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
                                sortable={true}
                            />
                        </>
                    )}
                <StyledMenu
                    id="row-menu"
                    anchorEl={anchorEl}
                    keepMounted
                    open={Boolean(anchorEl)}
                    onClose={handleCloseRowMenu}
                    anchorReference="anchorPosition"
                    anchorPosition={
                        mousePosition.mouseY !== null &&
                        mousePosition.mouseX !== null
                            ? {
                                  top: mousePosition.mouseY,
                                  left: mousePosition.mouseX,
                              }
                            : undefined
                    }
                >
                    {contextualStudy && (
                        <div>
                            {allowsRename() && (
                                <>
                                    {makeMenuItem(
                                        'rename',
                                        handleOpenRenameStudy
                                    )}
                                </>
                            )}
                            {allowsPublishability() && (
                                <>
                                    {makeMenuItem(
                                        'accessRights',
                                        handleOpenStudyAccessRights
                                    )}
                                </>
                            )}
                            {makeMenuItem('export', handleOpenExportStudy)}
                            {allowsDelete(true) && (
                                <>
                                    {makeMenuItem(
                                        'delete',
                                        handleOpenDeleteStudy
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </StyledMenu>
            </div>
            <RenameDialog
                open={openRenameStudyDialog}
                onClose={handleCloseRenameStudy}
                onClick={handleClickRenameStudy}
                title={useIntl().formatMessage({ id: 'renameStudy' })}
                message={useIntl().formatMessage({ id: 'renameStudyMsg' })}
                currentName={contextualStudy ? contextualStudy.elementName : ''}
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
                studyUuid={contextualStudy ? contextualStudy.elementUuid : ''}
                title={useIntl().formatMessage({ id: 'exportNetwork' })}
            />
            <AccessRightsDialog
                open={openStudyAccessRightsDialog}
                onClose={handleCloseStudyAccessRights}
                onClick={handleClickStudyAccessRights}
                title={useIntl().formatMessage({ id: 'modifyAccessRights' })}
                //isPrivate={isSelectedStudyPrivate}
                isPrivate={() => true}
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
