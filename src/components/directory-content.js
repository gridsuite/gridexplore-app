/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import VirtualizedTable from './util/virtualized-table';
import { FormattedMessage, useIntl } from 'react-intl';
import Chip from '@material-ui/core/Chip';
import makeStyles from '@material-ui/core/styles/makeStyles';
import LibraryBooksOutlinedIcon from '@material-ui/icons/LibraryBooksOutlined';
import FolderOpenRoundedIcon from '@material-ui/icons/FolderOpenRounded';
import { elementType } from '../utils/elementType';

import Tooltip from '@material-ui/core/Tooltip';
import {
    connectNotificationsWsUpdateStudies,
    fetchDirectoryContent,
    fetchStudiesInfos,
    insertNewElement,
} from '../utils/rest-api';
import CircularProgress from '@material-ui/core/CircularProgress';
import { useSnackbar } from 'notistack';
import { displayErrorMessageWithSnackbar, useIntlRef } from '../utils/messages';
import { setCurrentChildren, setTempStudies } from '../redux/actions';

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

const DirectoryContent = () => {
    const classes = useStyles();

    const [toggle, setToggle] = useState(false);
    const [childrenMetadata, setChildrenMetadata] = useState({});

    const currentChildren = useSelector((state) => state.currentChildren);
    const appsAndUrls = useSelector((state) => state.appsAndUrls);
    const selectedDirectory = useSelector((state) => state.selectedDirectory);
    const tmpStudies = useSelector((state) => state.tmpStudies);

    let rows =
        currentChildren !== null
            ? tmpStudies[selectedDirectory] !== undefined
                ? [...currentChildren, ...tmpStudies[selectedDirectory]]
                : [...currentChildren]
            : tmpStudies[selectedDirectory] !== undefined
            ? [...tmpStudies[selectedDirectory]]
            : [];

    const { enqueueSnackbar } = useSnackbar();
    const intlRef = useIntlRef();
    const intl = useIntl();
    const websocketExpectedCloseRef = useRef();
    const dispatch = useDispatch();
    const currentChildrenRef = useRef([]);
    const selectedDirectoryRef = useRef(null);
    const tmpStudiesRef = useRef(null);
    currentChildrenRef.current = rows;
    selectedDirectoryRef.current = selectedDirectory;
    tmpStudiesRef.current = tmpStudies;

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
        const objectType = cellData.rowData['type'];
        return (
            <div className={classes.cell}>
                {objectType === elementType.STUDY && (
                    <LibraryBooksOutlinedIcon style={{ margin: '10px' }} />
                )}
                {childrenMetadata[elementUuid] ? (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div>{childrenMetadata[elementUuid].name}</div>
                    </div>
                ) : (
                    <div>
                        <FormattedMessage id="creationInProgress" />{' '}
                        <CircularProgress size={25} />
                    </div>
                )}
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
            {rows.length === 0 && (
                <div style={{ textAlign: 'center', marginTop: '100px' }}>
                    <FolderOpenRoundedIcon
                        style={{ width: '100px', height: '100px' }}
                    />
                    <h1>
                        <FormattedMessage id={'emptyDir'} />
                    </h1>
                </div>
            )}
            {rows.length > 0 && (
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
                    rows={rows}
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
