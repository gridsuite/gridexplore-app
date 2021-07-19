/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FormattedMessage, useIntl } from 'react-intl';
import { useSnackbar } from 'notistack';

import Chip from '@material-ui/core/Chip';
import Tooltip from '@material-ui/core/Tooltip';
import makeStyles from '@material-ui/core/styles/makeStyles';
import CircularProgress from '@material-ui/core/CircularProgress';

import LibraryBooksOutlinedIcon from '@material-ui/icons/LibraryBooksOutlined';
import FolderOpenRoundedIcon from '@material-ui/icons/FolderOpenRounded';

import VirtualizedTable from './util/virtualized-table';
import { elementType } from '../utils/elementType';
import {
    connectNotificationsWsUpdateStudies, deleteStudy,
    fetchDirectoryContent,
    fetchStudiesInfos,
    insertNewElement, renameStudy
} from '../utils/rest-api';
import { displayErrorMessageWithSnackbar, useIntlRef } from '../utils/messages';
import { setCurrentChildren, setTempStudies } from '../redux/actions';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import GetAppIcon from '@material-ui/icons/GetApp';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import BuildIcon from '@material-ui/icons/Build';
import ListItemText from '@material-ui/core/ListItemText';
import withStyles from '@material-ui/core/styles/withStyles';
import Menu from '@material-ui/core/Menu';
import { AccessRightsDialog, DeleteDialog, ExportDialog, RenameDialog } from './util/dialogs';
import { DEFAULT_CELL_PADDING } from '@gridsuite/commons-ui';

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

const DirectoryContent = () => {

    const [childrenMetadata, setChildrenMetadata] = useState({});
    const currentChildren = useSelector((state) => state.currentChildren);
    const appsAndUrls = useSelector((state) => state.appsAndUrls);
    const selectedDirectory = useSelector((state) => state.selectedDirectory);
    const tmpStudies = useSelector((state) => state.tmpStudies);

    const [anchorEl, setAnchorEl] = React.useState(null);
    const [selectedStudy, setSelectedStudy] = React.useState('');
    const [isSelectedStudyPrivate, setSelectedStudyPrivate] = React.useState(true);
    const DonwnloadIframe = 'downloadIframe';

    let rows =
        currentChildren !== null
            ? tmpStudies[selectedDirectory] !== undefined
                ? [...currentChildren, ...tmpStudies[selectedDirectory]]
                : [...currentChildren]
            : tmpStudies[selectedDirectory] !== undefined
            ? [...tmpStudies[selectedDirectory]]
            : [];

    const classes = useStyles();

    const { enqueueSnackbar } = useSnackbar();

    const dispatch = useDispatch();

    const intl = useIntl();
    const intlRef = useIntlRef();

    const websocketExpectedCloseRef = useRef();
    const currentChildrenRef = useRef([]);
    const selectedDirectoryRef = useRef(null);
    const tmpStudiesRef = useRef(null);
    currentChildrenRef.current = rows;
    selectedDirectoryRef.current = selectedDirectory;
    tmpStudiesRef.current = tmpStudies;

    /**
     * Rename dialog: window status value for renaming
     */
    const [openRenameStudyDialog, setOpenRenameStudyDialog] = React.useState(false);
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
                if (response === 'NOT_ALLOWED') {
                    setRenameError(
                        intl.formatMessage({ id: 'renameStudyError' })
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
    const [openDeleteStudyDialog, setOpenDeleteStudyDialog] = React.useState(false);
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
        deleteStudy(selectedStudy.elementUuid).then((response) => {
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
    const [openExportStudyDialog, setOpenExportStudyDialog] = React.useState(false);

    const handleOpenExportStudy = () => {
        setAnchorEl(null);
        setOpenExportStudyDialog(true);
    };

    const handleCloseExportStudy = () => {
        setOpenExportStudyDialog(false);
        setSelectedStudy('');
        setSelectedStudyPrivate(undefined)
    };

    const handleClickExportStudy = (url) => {
        window.open(url, DonwnloadIframe);
        handleCloseExportStudy();
    };

    /**
     * AccessRights dialog: window status value for updating access rights
     */
    const [openStudyAccessRightsDialog, setOpenStudyAccessRightsDialog] = React.useState(
        false
    );

    const handleOpenStudyAccessRights = () => {
        setAnchorEl(null);
        setOpenStudyAccessRightsDialog(true);
    };

    const handleCloseStudyAccessRights = () => {
        setOpenStudyAccessRightsDialog(false);
        setSelectedStudy('');
        setSelectedStudyPrivate(undefined)
    };

    const handleCloseRowMenu = () => {
        setAnchorEl(null);
        setSelectedStudy('');
        setSelectedStudyPrivate(undefined)
    };

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

    const updateDirectoryChildren = useCallback(() => {
        fetchDirectoryContent(selectedDirectoryRef.current).then(
            (childrenToBeInserted) => {
                dispatch(
                    setCurrentChildren(
                        childrenToBeInserted.filter(
                            (child) => child.type !== elementType.DIRECTORY
                        )
                    )
                );
            }
        );
    }, [dispatch, selectedDirectoryRef]);

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
    }, [currentChildren, toggle]);

    const displayErrorIfExist = useCallback(
        (event) => {
            let eventData = JSON.parse(event.data);
            if (eventData.headers) {
                const error = eventData.headers['error'];
                if (error) {
                    const studyName = eventData.headers['studyName'];
                    displayErrorMessageWithSnackbar({
                        errorMessage: error,
                        enqueueSnackbar: enqueueSnackbar,
                        headerMessage: {
                            headerMessageId: 'studyCreatingError',
                            headerMessageValues: { studyName: studyName },
                            intlRef: intlRef,
                        },
                    });
                    return true;
                }
            }
            return false;
        },
        [enqueueSnackbar, intlRef]
    );

    const deleteTmpStudy = useCallback(
        (studyUuid) => {
            let tmpStudiesCopy = { ...tmpStudiesRef.current };
            if (tmpStudiesCopy[selectedDirectoryRef.current] !== undefined) {
                tmpStudiesCopy[
                    selectedDirectoryRef.current
                ] = tmpStudiesRef.current[selectedDirectoryRef.current].filter(
                    (e) => e.elementUuid !== studyUuid
                );
                dispatch(setTempStudies(tmpStudiesCopy));
            }
        },
        [selectedDirectoryRef, dispatch, tmpStudiesRef]
    );

    const connectNotificationsUpdateStudies = useCallback(() => {
        const ws = connectNotificationsWsUpdateStudies();

        ws.onmessage = function (event) {
            const res = displayErrorIfExist(event);
            let eventData = JSON.parse(event.data);
            const rowsUuids = [...currentChildrenRef.current].map(
                (e) => e.elementUuid
            );
            if (eventData.headers) {
                const studyUuid = eventData.headers['studyUuid'];
                if (res === true) {
                    deleteTmpStudy(studyUuid);
                    return;
                }
                let tmpStudiesCopy = { ...tmpStudiesRef.current };
                if (rowsUuids.includes(studyUuid)) {
                    if (
                        tmpStudiesCopy[selectedDirectoryRef.current] !==
                            undefined &&
                        tmpStudiesCopy[selectedDirectoryRef.current].length > 0
                    ) {
                        insertNewElement(
                            selectedDirectoryRef.current,
                            ...tmpStudiesCopy[
                                selectedDirectoryRef.current
                            ].filter((e) => e.elementUuid === studyUuid)
                        )
                            .then(() => {
                                deleteTmpStudy(studyUuid);
                                updateDirectoryChildren();
                            })
                            .catch((err) => console.debug(err));
                        setToggle((prev) => !prev);
                    }
                }
            }
        };
        ws.onclose = function () {
            if (!websocketExpectedCloseRef.current) {
                console.error('Unexpected Notification WebSocket closed');
            }
        };
        ws.onerror = function (event) {
            console.error('Unexpected Notification WebSocket error', event);
        };
        return ws;
    }, [
        currentChildrenRef,
        displayErrorIfExist,
        updateDirectoryChildren,
        tmpStudiesRef,
        selectedDirectoryRef,
        deleteTmpStudy,
    ]);

    useEffect(() => {
        const ws = connectNotificationsUpdateStudies();
        // Note: dispatch doesn't change

        // cleanup at unmount event
        return function () {
            ws.close();
        };
    }, [connectNotificationsUpdateStudies]);

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
                        onRowRightClick={(event) => {
                            console.log(event);
                            if (event.rowData.type === "STUDY") {
                                setSelectedStudy(event.rowData);
                                setSelectedStudyPrivate(event.rowData.accessRights.private);
                            }
                            setAnchorEl(event.event.currentTarget);
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
                    <StyledMenu
                        id="row-menu"
                        anchorEl={anchorEl}
                        keepMounted
                        open={Boolean(anchorEl)}
                        onClose={handleCloseRowMenu}
                    >
                        {selectedStudy !== '' && (
                            <>
                                <MenuItem onClick={handleOpenRenameStudy}>
                                    <ListItemIcon style={{ minWidth: '25px' }}>
                                        <EditIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={<FormattedMessage id="rename" />}
                                    />
                                </MenuItem>
                                <MenuItem onClick={handleOpenDeleteStudy}>
                                    <ListItemIcon style={{ minWidth: '25px' }}>
                                        <DeleteIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={<FormattedMessage id="delete" />}
                                    />
                                </MenuItem>
                                <MenuItem onClick={handleOpenExportStudy}>
                                    <ListItemIcon style={{ minWidth: '25px' }}>
                                        <GetAppIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={<FormattedMessage id="export" />}
                                    />
                                </MenuItem>
                                <MenuItem onClick={handleOpenStudyAccessRights}>
                                    <ListItemIcon style={{ minWidth: '25px' }}>
                                        <BuildIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <FormattedMessage id="accessRights" />
                                        }
                                    />
                                </MenuItem>
                            </>
                        )}
                    </StyledMenu>
                    />
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
                studyUuid={selectedStudy.elementUuid}
                title={useIntl().formatMessage({ id: 'modifyAccessRights' })}
                isPrivate={isSelectedStudyPrivate}
            />
            <iframe
                id={DonwnloadIframe}
                name={DonwnloadIframe}
                title={DonwnloadIframe}
                style={{ display: 'none' }}
            />
        </>
    );
};

export default DirectoryContent;
