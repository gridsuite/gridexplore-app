/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveDirectory } from '../redux/actions';
import { FormattedMessage, useIntl } from 'react-intl';

import * as constants from '../utils/UIconstants';

import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import makeStyles from '@mui/styles/makeStyles';
import CircularProgress from '@mui/material/CircularProgress';

import LibraryBooksOutlinedIcon from '@mui/icons-material/LibraryBooksOutlined';
import FolderOpenRoundedIcon from '@mui/icons-material/FolderOpenRounded';

import VirtualizedTable from './virtualized-table';
import {
    ContingencyListType,
    ElementType,
    FilterType,
} from '../utils/elementType';
import { DEFAULT_CELL_PADDING } from '@gridsuite/commons-ui';
import { Checkbox } from '@mui/material';

import { fetchElementsInfos } from '../utils/rest-api';

import FilterListIcon from '@mui/icons-material/FilterList';
import FilterIcon from '@mui/icons-material/Filter';
import DescriptionIcon from '@mui/icons-material/Description';
import PanToolIcon from '@mui/icons-material/PanTool';

import FormContingencyDialog from './dialogs/form-contingency-dialog';
import ScriptDialog from './dialogs/script-dialog';
import { useSnackbar } from 'notistack';
import GenericFilterDialog from './dialogs/generic-filter-dialog';

import ContentContextualMenu from './menus/content-contextual-menu';
import ContentToolbar from './toolbars/content-toolbar';
import DirectoryTreeContextualMenu from './menus/directory-tree-contextual-menu';
import PhotoIcon from '@mui/icons-material/Photo';

const circularProgressSize = '70px';

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
    circularProgressContainer: {
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'row',
        flexGrow: '1',
        justifyContent: 'center',
    },
    centeredCircularProgress: {
        alignSelf: 'center',
    },
}));

const initialMousePosition = {
    mouseX: null,
    mouseY: null,
};

const DirectoryContent = () => {
    const { enqueueSnackbar } = useSnackbar();
    const dispatch = useDispatch();

    const [childrenMetadata, setChildrenMetadata] = useState({});

    const [selectedUuids, setSelectedUuids] = useState(new Set());

    const currentChildren = useSelector((state) => state.currentChildren);
    const currentChildrenRef = useRef();
    currentChildrenRef.current = currentChildren;

    const appsAndUrls = useSelector((state) => state.appsAndUrls);
    const selectedDirectory = useSelector((state) => state.selectedDirectory);

    const [activeElement, setActiveElement] = React.useState(null);
    const [isMissingDataAfterDirChange, setIsMissingDataAfterDirChange] =
        useState(true);

    const classes = useStyles();
    const intl = useIntl();

    /* Menu states */
    const [mousePosition, setMousePosition] =
        React.useState(initialMousePosition);

    const handleRowClick = (event) => {
        if (childrenMetadata[event.rowData.elementUuid] !== undefined) {
            const subtype = childrenMetadata[event.rowData.elementUuid].subtype;
            if (event.rowData.type === ElementType.STUDY) {
                let url = getLink(
                    event.rowData.elementUuid,
                    event.rowData.type
                );
                url
                    ? window.open(url, '_blank')
                    : handleError(
                          intl.formatMessage(
                              { id: 'getAppLinkError' },
                              { type: event.rowData.type }
                          )
                      );
            } else if (event.rowData.type === ElementType.CONTINGENCY_LIST) {
                if (subtype === ContingencyListType.FORM) {
                    setCurrentFiltersContingencyListId(
                        event.rowData.elementUuid
                    );
                    setOpenFiltersContingencyDialog(true);
                } else if (subtype === ContingencyListType.SCRIPT) {
                    setCurrentScriptContingencyListId(
                        event.rowData.elementUuid
                    );
                    setOpenScriptContingencyDialog(true);
                }
            } else if (event.rowData.type === ElementType.FILTER) {
                if (subtype === FilterType.SCRIPT) {
                    setCurrentScriptId(event.rowData.elementUuid);
                    setOpenScriptDialog(true);
                } else if (subtype === FilterType.FORM) {
                    setCurrentFilterId(event.rowData.elementUuid);
                    setOpenGenericFilterDialog(true);
                }
            }
        }
    };

    /**
     * Filters contingency list dialog: window status value for editing a filters contingency list
     */
    const [openFiltersContingencyDialog, setOpenFiltersContingencyDialog] =
        React.useState(false);
    const [
        currentFiltersContingencyListId,
        setCurrentFiltersContingencyListId,
    ] = React.useState(null);
    const handleCloseFiltersContingency = () => {
        setOpenFiltersContingencyDialog(false);
        setActiveElement(null);
        setCurrentFiltersContingencyListId(null);
    };

    /**
     * Filters dialog: window status value to edit filters
     */
    const [openGenericFilterDialog, setOpenGenericFilterDialog] =
        React.useState(false);
    const handleCloseGenericFilterDialog = () => {
        setOpenGenericFilterDialog(false);
        setCurrentFilterId(null);
        setActiveElement(null);
    };

    const [currentFilterId, setCurrentFilterId] = React.useState(null);

    /**
     * Script contingency list dialog: window status value for editing a script contingency list
     */
    const [openScriptContingencyDialog, setOpenScriptContingencyDialog] =
        React.useState(false);
    const [currentScriptContingencyListId, setCurrentScriptContingencyListId] =
        React.useState(null);
    const handleCloseScriptContingency = () => {
        setOpenScriptContingencyDialog(false);
        setActiveElement(null);
        setCurrentScriptContingencyListId(null);
    };

    /**
     * Filter script dialog: window status value for editing a filter script
     */
    const [openScriptDialog, setOpenScriptDialog] = React.useState(false);
    const [currentScriptId, setCurrentScriptId] = React.useState(null);
    const handleCloseScriptDialog = () => {
        setOpenScriptDialog(false);
        setActiveElement(null);
        setCurrentScriptId(null);
    };

    /**
     * Contextual Menus
     */
    const [openDirectoryMenu, setOpenDirectoryMenu] = React.useState(false);
    const [openContentMenu, setOpenContentMenu] = React.useState(false);
    const [openDialog, setOpenDialog] = useState(constants.DialogsId.NONE);

    const handleOpenContentMenu = (event) => {
        setOpenContentMenu(true);
        event.stopPropagation();
    };

    const handleCloseContentMenu = useCallback(() => {
        setOpenContentMenu(false);
        setActiveElement(null);
    }, []);

    const handleCloseDirectoryMenu = () => {
        setOpenDirectoryMenu(false);
    };

    const handleOpenDirectoryMenu = (event) => {
        setOpenDirectoryMenu(true);
        event.stopPropagation();
    };

    /* User interactions */
    const onContextMenu = (event) => {
        if (selectedDirectory) {
            dispatch(setActiveDirectory(selectedDirectory.elementUuid));
        }
        if (
            event.rowData &&
            event.rowData.uploading !== null &&
            !event.rowData.uploading
        ) {
            if (event.rowData.type !== 'DIRECTORY') {
                setActiveElement(event.rowData);
            }
            setMousePosition({
                mouseX: event.event.clientX + constants.HORIZONTAL_SHIFT,
                mouseY: event.event.clientY + constants.VERTICAL_SHIFT,
            });
            handleOpenContentMenu(event.event);
        } else {
            setMousePosition({
                mouseX: event.clientX + constants.HORIZONTAL_SHIFT,
                mouseY: event.clientY + constants.VERTICAL_SHIFT,
            });
            handleOpenDirectoryMenu(event);
        }
    };

    const abbreviationFromUserName = (name) => {
        const tab = name.split(' ').map((x) => x.charAt(0));
        if (tab.length === 1) {
            return tab[0];
        } else {
            return tab[0] + tab[tab.length - 1];
        }
    };

    const handleError = useCallback(
        (message) => {
            enqueueSnackbar(message, {
                variant: 'error',
            });
        },
        [enqueueSnackbar]
    );

    function getLink(elementUuid, objectType) {
        let href;
        if (appsAndUrls !== null) {
            appsAndUrls.find((app) => {
                if (!app.resources) return false;
                return app.resources.find((res) => {
                    if (res.types.includes(objectType)) {
                        href =
                            app.url +
                            res.path.replace('{elementUuid}', elementUuid);
                    }
                    return href;
                });
            });
        }
        return href;
    }

    function getElementTypeTranslation(type, subtype) {
        return (
            <FormattedMessage
                id={
                    type === ElementType.FILTER ||
                    type === ElementType.CONTINGENCY_LIST
                        ? subtype + '_' + type
                        : type
                }
            />
        );
    }

    function typeCellRender(cellData) {
        const elementUuid = cellData.rowData['elementUuid'];
        const objectType = cellData.rowData[cellData.dataKey];
        return (
            <div className={classes.cell}>
                {childrenMetadata[elementUuid] ? (
                    <div>
                        {getElementTypeTranslation(
                            objectType,
                            childrenMetadata[elementUuid].subtype
                        )}
                    </div>
                ) : null}
            </div>
        );
    }

    function creatorCellRender(cellData) {
        const creator = cellData.rowData[cellData.dataKey];
        return (
            <div className={classes.cell}>
                <Tooltip title={creator} placement="right">
                    <Chip
                        className={classes.chip}
                        label={abbreviationFromUserName(creator)}
                    />
                </Tooltip>
            </div>
        );
    }

    function getElementIcon(objectType, objectSubtype) {
        if (objectType === ElementType.STUDY) {
            return <LibraryBooksOutlinedIcon className={classes.icon} />;
        } else if (objectType === ElementType.CONTINGENCY_LIST) {
            if (objectSubtype === ContingencyListType.SCRIPT) {
                return <DescriptionIcon className={classes.icon} />;
            } else if (objectSubtype === ContingencyListType.FORM) {
                return <PanToolIcon className={classes.icon} />;
            }
        } else if (objectType === ElementType.FILTER) {
            if (objectSubtype === FilterType.SCRIPT) {
                return <FilterIcon className={classes.icon} />;
            } else if (objectSubtype === FilterType.FORM) {
                return <FilterListIcon className={classes.icon} />;
            }
        } else if (objectType === ElementType.CASE) {
            return <PhotoIcon className={classes.icon} />;
        }
    }

    const getDisplayedElementName = (cellData) => {
        const { elementName, uploading, elementUuid } = cellData.rowData;
        const formatMessage = intl.formatMessage;
        if (uploading)
            return elementName + ' ' + formatMessage({ id: 'uploading' });
        if (!childrenMetadata[elementUuid])
            return (
                elementName + ' ' + formatMessage({ id: 'creationInProgress' })
            );
        return childrenMetadata[elementUuid].name;
    };

    const isElementCaseOrStudy = (objectType) => {
        return (
            objectType === ElementType.STUDY || objectType === ElementType.CASE
        );
    };

    const nameCellRender = (cellData) => {
        const elementUuid = cellData.rowData['elementUuid'];
        const objectType = cellData.rowData['type'];
        return (
            <div className={classes.cell}>
                {/*  Icon */}
                {!childrenMetadata[elementUuid] &&
                    isElementCaseOrStudy(objectType) && (
                        <CircularProgress
                            size={18}
                            className={classes.circularRoot}
                        />
                    )}
                {childrenMetadata[elementUuid] &&
                    getElementIcon(
                        objectType,
                        childrenMetadata[elementUuid].subtype
                    )}
                {/* Name */}
                {<div>{getDisplayedElementName(cellData)}</div>}
            </div>
        );
    };

    function toggleSelection(elementUuid) {
        let element = currentChildren?.find(
            (e) => e.elementUuid === elementUuid
        );
        if (element === undefined) {
            return;
        }
        let newSelection = new Set(selectedUuids);
        if (!newSelection.delete(elementUuid)) {
            newSelection.add(elementUuid);
        }
        setSelectedUuids(newSelection);
    }

    function toggleSelectAll() {
        if (selectedUuids.size === 0) {
            setSelectedUuids(
                new Set(
                    currentChildren
                        .filter((e) => !e.uploading)
                        .map((c) => c.elementUuid)
                )
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
                <Checkbox checked={selectedUuids.has(elementUuid)} />
            </div>
        );
    }

    useEffect(() => {
        setIsMissingDataAfterDirChange(true);
    }, [selectedDirectory, setIsMissingDataAfterDirChange]);

    useEffect(() => {
        if (!currentChildren?.length) {
            setChildrenMetadata({});
            setIsMissingDataAfterDirChange(false);
            return;
        }

        let metadata = {};
        let childrenToFetchElementsInfos = Object.values(currentChildren)
            .filter((e) => !e.uploading)
            .map((e) => e.elementUuid);
        if (childrenToFetchElementsInfos.length > 0) {
            fetchElementsInfos(childrenToFetchElementsInfos)
                .then((res) => {
                    res.forEach((e) => {
                        metadata[e.elementUuid] = {
                            name: e.elementName,
                            subtype: e.specificMetadata
                                ? e.specificMetadata.type
                                : null,
                        };
                    });
                })
                .catch((reason) => {
                    if (Object.keys(currentChildrenRef.current).length === 0) {
                        handleError(reason);
                    }
                })
                .finally(() => {
                    // discarding request for older directory
                    if (currentChildrenRef.current === currentChildren) {
                        setChildrenMetadata(metadata);
                        setIsMissingDataAfterDirChange(false);
                    }
                });
        }
        setSelectedUuids(new Set());
    }, [handleError, currentChildren, currentChildrenRef]);

    const contextualMixPolicies = {
        BIG: 'GoogleMicrosoft', // if !selectedUuids.has(selected.Uuid) deselects selectedUuids
        ZIMBRA: 'Zimbra', // if !selectedUuids.has(selected.Uuid) just use activeElement
        ALL: 'All', // union of activeElement.Uuid and selectedUuids (actually implemented)
    };
    let contextualMixPolicy = contextualMixPolicies.ALL;

    const getSelectedChildren = (mayChange = false) => {
        let acc = [];
        let ctxtUuid = activeElement ? activeElement.elementUuid : null;
        if (activeElement) {
            acc.push(
                Object.assign(
                    {
                        subtype:
                            childrenMetadata[activeElement.elementUuid]
                                ?.subtype,
                    },
                    activeElement
                )
            );
        }

        if (selectedUuids && currentChildren) {
            if (
                contextualMixPolicy === contextualMixPolicies.ALL ||
                ctxtUuid === null ||
                selectedUuids.has(ctxtUuid)
            ) {
                acc = acc.concat(
                    currentChildren
                        .filter(
                            (child) =>
                                selectedUuids.has(child.elementUuid) &&
                                childrenMetadata[child.elementUuid] &&
                                child.elementUuid !== activeElement?.elementUuid
                        )
                        .map((child2) => {
                            return Object.assign(
                                {
                                    subtype:
                                        childrenMetadata[child2.elementUuid],
                                },
                                child2
                            );
                        })
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

    return (
        <>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                }}
                onContextMenu={(e) => onContextMenu(e)}
            >
                {isMissingDataAfterDirChange && (
                    <div className={classes.circularProgressContainer}>
                        <CircularProgress
                            size={circularProgressSize}
                            color="inherit"
                            className={classes.centeredCircularProgress}
                        />
                    </div>
                )}
                {currentChildren?.length === 0 && (
                    <div style={{ textAlign: 'center', marginTop: '100px' }}>
                        <FolderOpenRoundedIcon
                            style={{ width: '100px', height: '100px' }}
                        />
                        <h1>
                            <FormattedMessage id={'emptyDir'} />
                        </h1>
                    </div>
                )}

                {currentChildren?.length > 0 && (
                    <>
                        <ContentToolbar
                            selectedElements={
                                // Check selectedUuids.size here to show toolbar options only
                                // when multi selection checkboxes are used.
                                selectedUuids.size > 0
                                    ? getSelectedChildren()
                                    : []
                            }
                        />

                        <VirtualizedTable
                            style={{ flexGrow: 1 }}
                            onRowRightClick={(e) => onContextMenu(e)}
                            onRowClick={handleRowClick}
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
                                        id: 'creator',
                                    }),
                                    dataKey: 'owner',
                                    cellRenderer: creatorCellRender,
                                },
                            ]}
                            sortable={true}
                        />
                    </>
                )}
            </div>

            <div
                onMouseDown={(e) => {
                    if (
                        e.button === constants.MOUSE_EVENT_RIGHT_BUTTON &&
                        openDialog === constants.DialogsId.NONE
                    ) {
                        handleCloseContentMenu();
                        handleCloseDirectoryMenu();
                    }
                }}
            >
                <ContentContextualMenu
                    activeElement={activeElement}
                    selectedElements={getSelectedChildren()}
                    open={openContentMenu}
                    openDialog={openDialog}
                    setOpenDialog={setOpenDialog}
                    onClose={handleCloseContentMenu}
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
                />

                <DirectoryTreeContextualMenu
                    directory={selectedDirectory}
                    open={openDirectoryMenu}
                    openDialog={openDialog}
                    setOpenDialog={setOpenDialog}
                    onClose={handleCloseDirectoryMenu}
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
                />
            </div>

            <FormContingencyDialog
                listId={currentFiltersContingencyListId}
                open={openFiltersContingencyDialog}
                onClose={handleCloseFiltersContingency}
                onError={handleError}
                title={useIntl().formatMessage({ id: 'editContingencyList' })}
            />
            <ScriptDialog
                id={currentScriptContingencyListId}
                open={openScriptContingencyDialog}
                onClose={handleCloseScriptContingency}
                onError={handleError}
                title={useIntl().formatMessage({ id: 'editContingencyList' })}
                type={ElementType.CONTINGENCY_LIST}
            />
            <ScriptDialog
                id={currentScriptId}
                open={openScriptDialog}
                onClose={handleCloseScriptDialog}
                onError={handleError}
                title={useIntl().formatMessage({ id: 'editFilterScript' })}
                type={ElementType.FILTER}
            />
            <GenericFilterDialog
                id={currentFilterId}
                open={openGenericFilterDialog}
                onClose={handleCloseGenericFilterDialog}
                onError={handleError}
                title={useIntl().formatMessage({ id: 'editFilter' })}
            />
        </>
    );
};

export default DirectoryContent;
