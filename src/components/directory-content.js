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

import FolderOpenRoundedIcon from '@mui/icons-material/FolderOpenRounded';

import VirtualizedTable from './virtualized-table';
import {
    ContingencyListType,
    ElementType,
    FilterType,
} from '../utils/elementType';
import {
    DEFAULT_CELL_PADDING,
    OverflowableText,
    useSnackMessage,
} from '@gridsuite/commons-ui';
import { Checkbox } from '@mui/material';

import { fetchElementsInfos } from '../utils/rest-api';

import ScriptDialog from './dialogs/script-dialog';
import CriteriaBasedFilterDialog from './dialogs/criteria-based-filter-dialog';
import ExplicitNamingFilterCreationDialog from './dialogs/explicit-naming-filter-creation-dialog';

import ContentContextualMenu from './menus/content-contextual-menu';
import ContentToolbar from './toolbars/content-toolbar';
import DirectoryTreeContextualMenu from './menus/directory-tree-contextual-menu';
import PhotoIcon from '@mui/icons-material/Photo';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import ArticleIcon from '@mui/icons-material/Article';
import OfflineBoltIcon from '@mui/icons-material/OfflineBolt';
import ExplicitNamingContingencyListEditDialog from './dialogs/explicit-naming-contingency-list-edit-dialog';

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
        overflow: 'hidden',
        textOverflow: 'ellipsis',
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
    tooltip: {
        maxWidth: '1000px',
    },
}));

const initialMousePosition = {
    mouseX: null,
    mouseY: null,
};

const DirectoryContent = () => {
    const { snackError } = useSnackMessage();
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
    const todayStart = new Date().setHours(0, 0, 0, 0);

    /* Menu states */
    const [mousePosition, setMousePosition] =
        React.useState(initialMousePosition);

    const [openDialog, setOpenDialog] = useState(constants.DialogsId.NONE);
    const [elementName, setElementName] = useState('');
    const handleRowClick = (event) => {
        if (childrenMetadata[event.rowData.elementUuid] !== undefined) {
            setElementName(childrenMetadata[event.rowData.elementUuid]?.name);
            const subtype = childrenMetadata[event.rowData.elementUuid].subtype;
            /** set active directory on the store because it will be used while editing the contingency name */
            dispatch(setActiveDirectory(selectedDirectory?.elementUuid));
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
                    setOpenDialog(subtype);
                } else if (subtype === ContingencyListType.SCRIPT) {
                    setCurrentScriptContingencyListId(
                        event.rowData.elementUuid
                    );
                    setOpenDialog(subtype);
                } else if (subtype === ContingencyListType.EXPLICIT_NAMING) {
                    setCurrentExplicitNamingContingencyListId(
                        event.rowData.elementUuid
                    );
                    setOpenDialog(subtype);
                }
            } else if (event.rowData.type === ElementType.FILTER) {
                if (subtype === FilterType.EXPLICIT_NAMING) {
                    setCurrentExplicitNamingFilterId(event.rowData.elementUuid);
                    setOpenDialog(subtype);
                } else if (subtype === FilterType.CRITERIA) {
                    setCurrentCriteriaBasedFilterId(event.rowData.elementUuid);
                    setOpenDialog(subtype);
                }
            }
        }
    };

    /**
     * Filters contingency list dialog: window status value for editing a filters contingency list
     */
    const [
        currentFiltersContingencyListId,
        setCurrentFiltersContingencyListId,
    ] = React.useState(null);
    const handleCloseFiltersContingency = () => {
        setOpenDialog(constants.DialogsId.NONE);
        setActiveElement(null);
        setCurrentFiltersContingencyListId(null);
        setElementName('');
    };

    /**
     * Explicit Naming contingency list dialog: window status value for editing an explicit naming contingency list
     */
    const [
        currentExplicitNamingContingencyListId,
        setCurrentExplicitNamingContingencyListId,
    ] = React.useState(null);
    const handleCloseExplicitNamingContingency = () => {
        setOpenDialog(constants.DialogsId.NONE);
        setActiveElement(null);
        setCurrentExplicitNamingContingencyListId(null);
        setElementName('');
    };

    /**
     * Filters dialog: window status value to edit CriteriaBaseds filters
     */
    const [currentCriteriaBasedFilterId, setCurrentCriteriaBasedFilterId] =
        useState(null);
    const handleCloseCriteriaBasedFilterDialog = () => {
        setOpenDialog(constants.DialogsId.NONE);
        setCurrentCriteriaBasedFilterId(null);
        setActiveElement(null);
        setElementName('');
    };

    /**
     * Filters dialog: window status value to edit ExplicitNaming filters
     */
    const handleCloseExplicitNamingFilterDialog = () => {
        setOpenDialog(constants.DialogsId.NONE);
        setCurrentExplicitNamingFilterId(null);
        setActiveElement(null);
        setElementName('');
    };
    const [currentExplicitNamingFilterId, setCurrentExplicitNamingFilterId] =
        useState(null);

    /**
     * Script contingency list dialog: window status value for editing a script contingency list
     */
    const [currentScriptContingencyListId, setCurrentScriptContingencyListId] =
        useState(null);
    const handleCloseScriptContingency = () => {
        setOpenDialog(constants.DialogsId.NONE);
        setActiveElement(null);
        setCurrentScriptContingencyListId(null);
        setElementName('');
    };

    /**
     * Contextual Menus
     */
    const [openDirectoryMenu, setOpenDirectoryMenu] = useState(false);
    const [openContentMenu, setOpenContentMenu] = useState(false);

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

        if (event.rowData && event.rowData.uploading !== null) {
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
            snackError({
                messageTxt: message,
            });
        },
        [snackError]
    );

    function getLink(elementUuid, objectType) {
        let href;
        if (appsAndUrls !== null) {
            appsAndUrls.find((app) => {
                if (!app.resources) {
                    return false;
                }
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

    function getElementTypeTranslation(type, subtype, formatCase) {
        const format = formatCase
            ? ' (' + intl.formatMessage({ id: formatCase }) + ')'
            : '';
        const elemType =
            type === ElementType.FILTER || type === ElementType.CONTINGENCY_LIST
                ? intl.formatMessage({ id: subtype + '_' + type })
                : intl.formatMessage({ id: type });
        const elementTypeLabel = `${elemType}${format}`;
        return (
            <OverflowableText
                text={elementTypeLabel}
                tooltipStyle={classes.tooltip}
            />
        );
    }

    function typeCellRender(cellData) {
        const elementUuid = cellData.rowData['elementUuid'];
        const objectType = cellData.rowData[cellData.dataKey];
        return (
            <div className={classes.cell}>
                {childrenMetadata[elementUuid] &&
                    getElementTypeTranslation(
                        objectType,
                        childrenMetadata[elementUuid].subtype,
                        childrenMetadata[elementUuid].format
                    )}
            </div>
        );
    }

    function userCellRender(cellData) {
        const user = cellData.rowData[cellData.dataKey];
        return (
            <div className={classes.cell}>
                <Tooltip title={user} placement="right">
                    <Chip
                        className={classes.chip}
                        label={abbreviationFromUserName(user)}
                    />
                </Tooltip>
            </div>
        );
    }

    function dateCellRender(cellData) {
        const data = new Date(cellData.rowData[cellData.dataKey]);
        if (data instanceof Date && !isNaN(data)) {
            const cellMidnight = new Date(data).setHours(0, 0, 0, 0);

            const time = new Intl.DateTimeFormat(intl.locale, {
                timeStyle: 'medium',
                hour12: false,
            }).format(data);
            const displayedDate =
                intl.locale === 'en'
                    ? data.toISOString().substring(0, 10)
                    : data.toLocaleDateString(intl.locale);
            const cellText = todayStart === cellMidnight ? time : displayedDate;
            const fullDate = new Intl.DateTimeFormat(intl.locale, {
                dateStyle: 'long',
                timeStyle: 'long',
                hour12: false,
            }).format(data);

            return (
                <div className={classes.cell}>
                    <Tooltip title={fullDate} placement="right">
                        <span>{cellText}</span>
                    </Tooltip>
                </div>
            );
        }
    }

    function getElementIcon(objectType) {
        if (objectType === ElementType.STUDY) {
            return <PhotoLibraryIcon className={classes.icon} />;
        } else if (objectType === ElementType.CONTINGENCY_LIST) {
            return <OfflineBoltIcon className={classes.icon} />;
        } else if (objectType === ElementType.FILTER) {
            return <ArticleIcon className={classes.icon} />;
        } else if (objectType === ElementType.CASE) {
            return <PhotoIcon className={classes.icon} />;
        }
    }

    const getDisplayedElementName = (cellData) => {
        const { elementName, uploading, elementUuid } = cellData.rowData;
        const formatMessage = intl.formatMessage;
        if (uploading) {
            return elementName + '\n' + formatMessage({ id: 'uploading' });
        }
        if (!childrenMetadata[elementUuid]) {
            return (
                elementName + '\n' + formatMessage({ id: 'creationInProgress' })
            );
        }
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
                <OverflowableText
                    text={getDisplayedElementName(cellData)}
                    tooltipStyle={classes.tooltip}
                />
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
        if (!selectedDirectory) {
            return;
        }
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
                            format: e.specificMetadata?.format ?? null,
                        };
                    });
                })
                .catch((error) => {
                    if (Object.keys(currentChildrenRef.current).length === 0) {
                        handleError(error.message);
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

    const getCurrentChildrenWithNotClickableRows = () => {
        return currentChildren.map((child) => {
            return {
                ...child,
                notClickable: child.type === ElementType.CASE,
            };
        });
    };

    const renderLoadingContent = () => {
        return (
            <div className={classes.circularProgressContainer}>
                <CircularProgress
                    size={circularProgressSize}
                    color="inherit"
                    className={classes.centeredCircularProgress}
                />
            </div>
        );
    };

    const renderEmptyDirContent = () => {
        return (
            <div style={{ textAlign: 'center', marginTop: '100px' }}>
                <FolderOpenRoundedIcon
                    style={{ width: '100px', height: '100px' }}
                />
                <h1>
                    <FormattedMessage id={'emptyDir'} />
                </h1>
            </div>
        );
    };

    const renderTableContent = () => {
        return (
            <>
                <ContentToolbar
                    selectedElements={
                        // Check selectedUuids.size here to show toolbar options only
                        // when multi selection checkboxes are used.
                        selectedUuids.size > 0 ? getSelectedChildren() : []
                    }
                />

                <VirtualizedTable
                    style={{ flexGrow: 1 }}
                    onRowRightClick={(e) => onContextMenu(e)}
                    onRowClick={handleRowClick}
                    rows={getCurrentChildrenWithNotClickableRows()}
                    columns={[
                        {
                            cellRenderer: selectionRenderer,
                            dataKey: 'selected',
                            label: '',
                            headerRenderer: selectionHeaderRenderer,
                            minWidth: '3%',
                        },
                        {
                            label: intl.formatMessage({
                                id: 'elementName',
                            }),
                            dataKey: 'elementName',
                            cellRenderer: nameCellRender,
                            minWidth: '44%',
                        },
                        {
                            minWidth: '25%',
                            label: intl.formatMessage({
                                id: 'type',
                            }),
                            dataKey: 'type',
                            cellRenderer: typeCellRender,
                        },
                        {
                            minWidth: '5%',
                            label: intl.formatMessage({
                                id: 'creator',
                            }),
                            dataKey: 'owner',
                            cellRenderer: userCellRender,
                        },
                        {
                            minWidth: '10%',
                            label: intl.formatMessage({
                                id: 'created',
                            }),
                            dataKey: 'creationDate',
                            cellRenderer: dateCellRender,
                        },
                        {
                            minWidth: '5%',
                            label: intl.formatMessage({
                                id: 'modifiedBy',
                            }),
                            dataKey: 'lastModifiedBy',
                            cellRenderer: userCellRender,
                        },
                        {
                            minWidth: '8%',
                            label: intl.formatMessage({
                                id: 'modified',
                            }),
                            dataKey: 'lastModificationDate',
                            cellRenderer: dateCellRender,
                        },
                    ]}
                    sortable={true}
                />
            </>
        );
    };

    const renderContent = () => {
        // Here we wait for Metadata for the folder content
        if (isMissingDataAfterDirChange) {
            return renderLoadingContent();
        }

        // If no selection or currentChildren = null (first time) render nothing
        // TODO : Make a beautiful page here
        if (!currentChildren || !selectedDirectory) {
            return;
        }

        // If empty dir then render an appropriate content
        if (currentChildren.length === 0) {
            return renderEmptyDirContent();
        }

        // Finally if we have elements then render the table
        return renderTableContent();
    };

    const renderDialog = (name) => {
        // TODO openDialog should also be aware of the dialog's type, not only its subtype, because
        // if/when two different dialogs have the same subtype, this function will display the wrong dialog.
        switch (openDialog) {
            case ContingencyListType.FORM:
                return (
                    <CriteriaBasedFilterDialog
                        id={currentFiltersContingencyListId}
                        open={true}
                        onClose={handleCloseFiltersContingency}
                        onError={handleError}
                        title={intl.formatMessage({
                            id: 'editContingencyList',
                        })}
                        contentType={ElementType.CONTINGENCY_LIST}
                        name={name}
                    />
                );
            case ContingencyListType.SCRIPT:
                return (
                    <ScriptDialog
                        id={currentScriptContingencyListId}
                        open={true}
                        onClose={handleCloseScriptContingency}
                        onError={handleError}
                        title={intl.formatMessage({
                            id: 'editContingencyList',
                        })}
                        type={ElementType.CONTINGENCY_LIST}
                        name={name}
                    />
                );
            case ContingencyListType.EXPLICIT_NAMING:
                return (
                    <ExplicitNamingContingencyListEditDialog
                        id={currentExplicitNamingContingencyListId}
                        open={true}
                        onClose={handleCloseExplicitNamingContingency}
                        title={intl.formatMessage({
                            id: 'editContingencyList',
                        })}
                        isCreation={false}
                        name={name}
                    />
                );
            case FilterType.EXPLICIT_NAMING:
                return (
                    <ExplicitNamingFilterCreationDialog
                        id={currentExplicitNamingFilterId}
                        open={true}
                        onClose={handleCloseExplicitNamingFilterDialog}
                        title={intl.formatMessage({ id: 'editFilter' })}
                        isFilterCreation={false}
                        name={name}
                    />
                );
            case FilterType.CRITERIA:
                return (
                    <CriteriaBasedFilterDialog
                        id={currentCriteriaBasedFilterId}
                        open={true}
                        onClose={handleCloseCriteriaBasedFilterDialog}
                        onError={handleError}
                        title={intl.formatMessage({ id: 'editFilter' })}
                        contentType={ElementType.FILTER}
                        name={name}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flexGrow: 1,
                }}
                onContextMenu={(e) => onContextMenu(e)}
            >
                {renderContent()}
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
            {renderDialog(elementName)}
        </>
    );
};

export default DirectoryContent;
