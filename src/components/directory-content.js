/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { FormattedMessage, useIntl } from 'react-intl';

import * as constants from '../utils/UIconstants';

import Chip from '@material-ui/core/Chip';
import Tooltip from '@material-ui/core/Tooltip';
import makeStyles from '@material-ui/core/styles/makeStyles';
import CircularProgress from '@material-ui/core/CircularProgress';

import LibraryBooksOutlinedIcon from '@material-ui/icons/LibraryBooksOutlined';
import FolderOpenRoundedIcon from '@material-ui/icons/FolderOpenRounded';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import InsertDriveFileIcon from '@material-ui/icons/InsertDriveFile';

import VirtualizedTable from './virtualized-table';
import {
    ContingencyListType,
    ElementType,
    FilterType,
} from '../utils/elementType';
import { DEFAULT_CELL_PADDING } from '@gridsuite/commons-ui';
import { Checkbox } from '@material-ui/core';
import { Toolbar } from '@material-ui/core';

import {
    deleteElement,
    fetchElementsInfos,
    newScriptFromFilter,
    newScriptFromFiltersContingencyList,
    renameElement,
    replaceFiltersWithScript,
    replaceFormContingencyListWithScript,
    updateAccessRights,
} from '../utils/rest-api';

import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import FilterListIcon from '@material-ui/icons/FilterList';
import FilterIcon from '@material-ui/icons/Filter';
import withStyles from '@material-ui/core/styles/withStyles';
import Menu from '@material-ui/core/Menu';

import BuildIcon from '@material-ui/icons/Build';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import GetAppIcon from '@material-ui/icons/GetApp';
import IconButton from '@material-ui/core/IconButton';
import DescriptionIcon from '@material-ui/icons/Description';
import PanToolIcon from '@material-ui/icons/PanTool';

import ExportDialog from './export-dialog';
import RenameDialog from './dialogs/rename-dialog';
import DeleteDialog from './dialogs/delete-dialog';
import AccessRightsDialog from './dialogs/access-rights-dialog';
import FormContingencyDialog from './dialogs/form-contingency-dialog';
import ScriptDialog from './dialogs/script-dialog';
import ReplaceWithScriptDialog from './dialogs/replace-with-script-dialog';
import CopyToScriptDialog from './dialogs/copy-to-script-dialog';
import { useSnackbar } from 'notistack';
import GenericFilterDialog from './generic-filter';

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
    const { enqueueSnackbar } = useSnackbar();

    const [childrenMetadata, setChildrenMetadata] = useState({});
    const [isAllDataPresent, setIsAllDataPresent] = useState(false);

    const [selectedUuids, setSelectedUuids] = useState(new Set());

    const currentChildren = useSelector((state) => state.currentChildren);
    const currentChildrenRef = useRef();
    currentChildrenRef.current = currentChildren;

    const appsAndUrls = useSelector((state) => state.appsAndUrls);
    const selectedDirectory = useSelector((state) => state.selectedDirectory);
    const userId = useSelector((state) => state.user.profile.sub);

    const [anchorEl, setAnchorEl] = React.useState(null);
    const [activeElement, setActiveElement] = React.useState(null);

    const DownloadIframe = 'downloadIframe';

    const classes = useStyles();
    const intl = useIntl();

    /* Menu states */
    const [mousePosition, setMousePosition] =
        React.useState(initialMousePosition);

    /**
     * Rename dialog: window status value for renaming
     */
    const [openRenameElementDialog, setOpenRenameElementDialog] =
        React.useState(false);
    const [renameError, setRenameError] = React.useState('');

    const handleOpenRenameElement = () => {
        setAnchorEl(null);
        setOpenRenameElementDialog(true);
    };

    const handleCloseRenameElement = () => {
        setOpenRenameElementDialog(false);
        setRenameError('');
    };

    const handleClickRenameElement = (newElementNameValue) => {
        renameElement(activeElement.elementUuid, newElementNameValue)
            .then((response) => {
                if (response.status === 403) {
                    // == FORBIDDEN
                    setRenameError(
                        intl.formatMessage({
                            id: 'renameElementNotAllowedError',
                        })
                    );
                } else if (response.status === 404) {
                    // == NOT FOUND
                    setRenameError(
                        intl.formatMessage({ id: 'renameElementNotFoundError' })
                    );
                } else {
                    handleCloseRenameElement();
                }
            })
            .catch((e) => {
                setRenameError(e.message || e);
            });
    };

    /**
     * Delete dialog: window status value for deletion
     */
    const [openDeleteElementDialog, setOpenDeleteElementDialog] =
        React.useState(false);
    const [deleteError, setDeleteError] = React.useState('');

    const handleOpenDeleteElement = () => {
        setAnchorEl(null);
        setOpenDeleteElementDialog(true);
    };

    const handleCloseDeleteElement = () => {
        setOpenDeleteElementDialog(false);
        setDeleteError('');
    };

    const handleClickDeleteElement = () => {
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
                    if (notDeleted.length === 0) {
                        handleCloseDeleteElement();
                        setActiveElement(null);
                    } else {
                        let msg = intl.formatMessage(
                            { id: 'deleteElementsFailure' },
                            {
                                pbn: notDeleted.length,
                                stn: selectedChildren.length,
                                problematic: notDeleted.join(' '),
                            }
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
    const [openExportStudyDialog, setOpenExportStudyDialog] =
        React.useState(false);

    const handleOpenExportStudy = () => {
        setAnchorEl(null);
        setOpenExportStudyDialog(true);
    };

    const handleCloseExportStudy = () => {
        setOpenExportStudyDialog(false);
        setActiveElement(null);
    };

    const handleClickExportStudy = (url) => {
        window.open(url, DownloadIframe);
        handleCloseExportStudy();
    };

    /**
     * AccessRights dialog: window status value for updating access rights
     */
    const [openElementAccessRightsDialog, setOpenElementAccessRightsDialog] =
        React.useState(false);

    const [accessRightsError, setAccessRightsError] = React.useState('');

    const handleOpenElementAccessRights = () => {
        setAnchorEl(null);
        setOpenElementAccessRightsDialog(true);
    };

    const handleCloseElementAccessRights = () => {
        setOpenElementAccessRightsDialog(false);
        setAccessRightsError('');
        setActiveElement(null);
    };

    const handleCloseRowMenu = () => {
        setAnchorEl(null);
        setActiveElement(null);
    };

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

    const handleClickElementAccessRights = (selected) => {
        updateAccessRights(activeElement.elementUuid, selected).then(
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
                    handleCloseElementAccessRights();
                }
            }
        );
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

    const [
        openFiltersContingencyReplaceWithScriptDialog,
        setOpenFiltersContingencyReplaceWithScriptDialog,
    ] = React.useState(false);
    const handleCloseFiltersContingencyReplaceWithScript = () => {
        setOpenFiltersContingencyReplaceWithScriptDialog(false);
        setActiveElement(null);
    };

    const [
        openFiltersContingencyCopyToScriptDialog,
        setOpenFiltersContingencyCopyToScriptDialog,
    ] = React.useState(false);
    const handleCloseFiltersContingencyCopyToScript = () => {
        setOpenFiltersContingencyCopyToScriptDialog(false);
        setActiveElement(null);
    };

    /**
     * Filters dialog: window status value to edit filters
     */
    const [openGenericFilterDialog, setOpenGenericFilterDialog] =
        React.useState(false);
    const handleCloseGenericFilterDialog = () => {
        setOpenGenericFilterDialog(false);
        setCurrentFilterId(null);
        setActiveElement('');
    };

    const [currentFilterId, setCurrentFilterId] = React.useState(null);

    /**
     * Filters script dialog: window status value to edit filters script
     */
    const [openFiltersCopyToScriptDialog, setOpenFiltersCopyToScriptDialog] =
        React.useState(false);
    const handleCloseFiltersCopyToScript = () => {
        setOpenFiltersCopyToScriptDialog(false);
        setActiveElement('');
    };

    const [
        openFiltersReplaceWithScriptDialog,
        setOpenFiltersReplaceWithScriptDialog,
    ] = React.useState(false);
    const handleCloseFiltersReplaceWithScript = () => {
        setOpenFiltersReplaceWithScriptDialog(false);
        setActiveElement('');
    };

    const handleClickFiltersReplaceWithScript = (id) => {
        replaceFiltersWithScript(id, selectedDirectory)
            .then()
            .catch((error) => handleError(error.message));
        handleCloseFiltersReplaceWithScript();
    };

    const handleContingencyCopyToScript = () => {
        setAnchorEl(null);
        setOpenFiltersContingencyCopyToScriptDialog(true);
    };

    const handleClickContingencyCopyToScript = (id, newNameValue) => {
        newScriptFromFiltersContingencyList(id, newNameValue, selectedDirectory)
            .then()
            .catch((error) => handleError(error.message));
        handleCloseFiltersContingencyCopyToScript();
    };

    const handleContingencyReplaceWithScript = () => {
        setAnchorEl(null);
        setOpenFiltersContingencyReplaceWithScriptDialog(true);
    };

    const handleClickFiltersContingencyReplaceWithScript = (id) => {
        replaceFormContingencyListWithScript(id, selectedDirectory)
            .then()
            .catch((error) => handleError(error.message));
        handleCloseFiltersContingencyReplaceWithScript();
    };

    const handleFilterCopyToScript = () => {
        setAnchorEl(null);
        setOpenFiltersCopyToScriptDialog(true);
    };

    const handleClickFilterCopyToScript = (id, newNameValue) => {
        newScriptFromFilter(id, newNameValue, selectedDirectory)
            .then()
            .catch((error) => handleError(error.message));
        handleCloseFiltersCopyToScript();
    };

    const handleFilterReplaceWithScript = () => {
        setAnchorEl(null);
        setOpenFiltersReplaceWithScriptDialog(true);
    };

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
        setActiveElement('');
        setCurrentScriptId(null);
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
                {isAllDataPresent && childrenMetadata[elementUuid] ? (
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
        }
    }

    const getDisplayedElementName = (cellData) => {
        const { elementName, uploading, elementUuid } = cellData.rowData;
        const formatMessage = intl.formatMessage;
        if (uploading)
            return elementName + ' ' + formatMessage({ id: 'uploading' });
        if (!isAllDataPresent) return elementName;
        if (childrenMetadata[elementUuid] == null)
            return (
                elementName + ' ' + formatMessage({ id: 'creationInProgress' })
            );
        return childrenMetadata[elementUuid].name;
    };

    const nameCellRender = (cellData) => {
        const elementUuid = cellData.rowData['elementUuid'];
        const objectType = cellData.rowData['type'];
        return (
            <div className={classes.cell}>
                {/*  Icon */}
                {!childrenMetadata[elementUuid] &&
                    objectType === ElementType.STUDY && (
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
                    setActiveElement(null);
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
                    if (selectedUuids.has(elementUuid)) {
                        setActiveElement(null);
                    } else {
                        setActiveElement(cellData.rowData);
                    }
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

    /* directory changed, current data are not up to date, display loader */
    useEffect(() => {
        setIsAllDataPresent(false);
    }, [selectedDirectory, setIsAllDataPresent]);

    useEffect(() => {
        if (currentChildren?.length > 0) {
            setIsAllDataPresent(false);
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
                    .catch(handleError)
                    .finally(() => {
                        // discarding request for older directory
                        if (currentChildrenRef.current === currentChildren) {
                            setChildrenMetadata(metadata);
                            setIsAllDataPresent(true);
                        }
                    });
            }
        } else {
            setIsAllDataPresent(true);
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
            acc.push(activeElement);
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
        if (activeElement) return activeElement.owner === userId;
        if (!selectedUuids) return false;
        return (
            getSelectedChildren().find((child) => child.owner !== userId) ===
            null
        );
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

    const allowsExport = () => {
        let children = getSelectedChildren();
        return children.length === 1 && children[0].type === ElementType.STUDY;
    };

    const allowsCopyContingencyToScript = () => {
        let children = getSelectedChildren();
        return (
            children.length === 1 &&
            children[0].type === ElementType.CONTINGENCY_LIST &&
            childrenMetadata[children[0].elementUuid] &&
            childrenMetadata[children[0].elementUuid].subtype ===
                ContingencyListType.FORM
        );
    };

    const allowsReplaceContingencyWithScript = () => {
        let children = getSelectedChildren();
        return (
            children.length === 1 &&
            children[0].type === ElementType.CONTINGENCY_LIST &&
            childrenMetadata[children[0].elementUuid] &&
            childrenMetadata[children[0].elementUuid].subtype ===
                ContingencyListType.FORM &&
            children[0].owner === userId
        );
    };

    const allowsCopyFilterToScript = () => {
        let children = getSelectedChildren();
        return (
            children.length === 1 &&
            children[0].type === ElementType.FILTER &&
            !(
                childrenMetadata[children[0].elementUuid] &&
                childrenMetadata[children[0].elementUuid].subtype ===
                    FilterType.SCRIPT
            )
        );
    };

    const allowsReplaceFilterWithScript = () => {
        let children = getSelectedChildren();
        return (
            children.length === 1 &&
            children[0].type === ElementType.FILTER &&
            !(
                childrenMetadata[children[0].elementUuid] &&
                childrenMetadata[children[0].elementUuid].subtype ===
                    FilterType.SCRIPT
            ) &&
            children[0].owner === userId
        );
    };

    function makeMenuItem(utMsg, cb, ico = <EditIcon fontSize="small" />) {
        return (
            <>
                <MenuItem onClick={cb}>
                    <ListItemIcon
                        style={{
                            minWidth: '25px',
                        }}
                    >
                        {ico}
                    </ListItemIcon>
                    <ListItemText primary={<FormattedMessage id={utMsg} />} />
                </MenuItem>
            </>
        );
    }

    const emptyMenu = () => {
        return !(
            allowsRename() ||
            allowsPublishability() ||
            allowsExport() ||
            allowsDelete() ||
            allowsCopyContingencyToScript() ||
            allowsReplaceContingencyWithScript() ||
            allowsCopyFilterToScript() ||
            allowsReplaceFilterWithScript()
        );
    };

    const areSelectedElementsAllPrivate = () => {
        let sel = getSelectedChildren();
        if (!sel || sel.length === 0) return undefined;
        let priv = sel.filter((child) => child.accessRights.private);
        if (!priv || priv.length === 0) return false;
        if (priv.length === sel.length) return true;

        return undefined;
    };

    return (
        <>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                }}
                onMouseDownCapture={(e) => {
                    if (e.button === constants.MOUSE_EVENT_RIGHT_BUTTON)
                        handleCloseRowMenu();
                }}
            >
                {!isAllDataPresent && selectedDirectory && (
                    <div className={classes.circularProgressContainer}>
                        <CircularProgress
                            size={circularProgressSize}
                            color="inherit"
                            className={classes.centeredCircularProgress}
                        />
                    </div>
                )}
                {isAllDataPresent && currentChildren?.length === 0 && (
                    <div style={{ textAlign: 'center', marginTop: '100px' }}>
                        <FolderOpenRoundedIcon
                            style={{ width: '100px', height: '100px' }}
                        />
                        <h1>
                            <FormattedMessage id={'emptyDir'} />
                        </h1>
                    </div>
                )}
                {isAllDataPresent && currentChildren?.length > 0 && (
                    <>
                        <Toolbar>
                            {allowsDelete(false) && selectedUuids.size > 0 && (
                                <IconButton
                                    className={classes.icon}
                                    onClick={() => handleOpenDeleteElement()}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            )}
                        </Toolbar>
                        <VirtualizedTable
                            style={{ flexGrow: 1 }}
                            onRowRightClick={(event) => {
                                if (
                                    event.rowData.uploading !== null &&
                                    !event.rowData.uploading
                                ) {
                                    if (event.rowData.type !== 'DIRECTORY') {
                                        setActiveElement(event.rowData);
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
                                }
                            }}
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
                    open={!emptyMenu() && Boolean(anchorEl)}
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
                    {activeElement && (
                        <div>
                            {allowsRename() && (
                                <>
                                    {makeMenuItem(
                                        'rename',
                                        handleOpenRenameElement
                                    )}
                                </>
                            )}
                            {allowsPublishability() && (
                                <>
                                    {makeMenuItem(
                                        'accessRights',
                                        handleOpenElementAccessRights,
                                        <BuildIcon fontSize="small" />
                                    )}
                                </>
                            )}
                            {allowsExport() && (
                                <>
                                    {makeMenuItem(
                                        'export',
                                        handleOpenExportStudy,
                                        <GetAppIcon fontSize="small" />
                                    )}
                                </>
                            )}
                            {allowsDelete(true) && (
                                <>
                                    {makeMenuItem(
                                        'delete',
                                        handleOpenDeleteElement,
                                        <DeleteIcon fontSize="small" />
                                    )}
                                </>
                            )}
                            {allowsCopyContingencyToScript() && (
                                <>
                                    {makeMenuItem(
                                        'copyToScript',
                                        handleContingencyCopyToScript,
                                        <FileCopyIcon fontSize="small" />
                                    )}
                                </>
                            )}
                            {allowsReplaceContingencyWithScript() && (
                                <>
                                    {makeMenuItem(
                                        'replaceWithScript',
                                        handleContingencyReplaceWithScript,
                                        <InsertDriveFileIcon fontSize="small" />
                                    )}
                                </>
                            )}
                            {allowsCopyFilterToScript() && (
                                <>
                                    {makeMenuItem(
                                        'copyToScript',
                                        handleFilterCopyToScript,
                                        <FileCopyIcon fontSize="small" />
                                    )}
                                </>
                            )}
                            {allowsReplaceFilterWithScript() && (
                                <>
                                    {makeMenuItem(
                                        'replaceWithScript',
                                        handleFilterReplaceWithScript,
                                        <InsertDriveFileIcon fontSize="small" />
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </StyledMenu>
            </div>
            <RenameDialog
                open={openRenameElementDialog}
                onClose={handleCloseRenameElement}
                onClick={handleClickRenameElement}
                title={useIntl().formatMessage({ id: 'renameElement' })}
                message={useIntl().formatMessage({ id: 'renameElementMsg' })}
                currentName={activeElement ? activeElement.elementName : ''}
                error={renameError}
            />
            <DeleteDialog
                open={openDeleteElementDialog}
                onClose={handleCloseDeleteElement}
                onClick={handleClickDeleteElement}
                items={getSelectedChildren()}
                multipleDeleteFormatMessageId={
                    'deleteMultipleItemsDialogMessage'
                }
                simpleDeleteFormatMessageId={'deleteItemDialogMessage'}
                error={deleteError}
            />
            <ExportDialog
                open={openExportStudyDialog}
                onClose={handleCloseExportStudy}
                onClick={handleClickExportStudy}
                studyUuid={activeElement ? activeElement.elementUuid : ''}
                title={useIntl().formatMessage({ id: 'exportNetwork' })}
            />
            <AccessRightsDialog
                open={openElementAccessRightsDialog}
                onClose={handleCloseElementAccessRights}
                onClick={handleClickElementAccessRights}
                title={useIntl().formatMessage({ id: 'modifyAccessRights' })}
                isPrivate={areSelectedElementsAllPrivate()}
                error={accessRightsError}
            />
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
            <ReplaceWithScriptDialog
                id={activeElement ? activeElement.elementUuid : ''}
                open={openFiltersContingencyReplaceWithScriptDialog}
                onClose={handleCloseFiltersContingencyReplaceWithScript}
                onClick={handleClickFiltersContingencyReplaceWithScript}
                onError={handleError}
                title={useIntl().formatMessage({ id: 'replaceList' })}
            />
            <CopyToScriptDialog
                id={activeElement ? activeElement.elementUuid : ''}
                open={openFiltersContingencyCopyToScriptDialog}
                onClose={handleCloseFiltersContingencyCopyToScript}
                onClick={handleClickContingencyCopyToScript}
                currentName={activeElement ? activeElement.elementName : ''}
                title={useIntl().formatMessage({ id: 'copyToScriptList' })}
            />
            <ReplaceWithScriptDialog
                id={activeElement ? activeElement.elementUuid : ''}
                open={openFiltersReplaceWithScriptDialog}
                onClose={handleCloseFiltersReplaceWithScript}
                onClick={handleClickFiltersReplaceWithScript}
                title={useIntl().formatMessage({ id: 'replaceList' })}
            />
            <CopyToScriptDialog
                id={activeElement ? activeElement.elementUuid : ''}
                open={openFiltersCopyToScriptDialog}
                onClose={handleCloseFiltersCopyToScript}
                onClick={handleClickFilterCopyToScript}
                currentName={activeElement ? activeElement.elementName : ''}
                title={useIntl().formatMessage({ id: 'copyToScriptList' })}
            />
            <GenericFilterDialog
                id={currentFilterId}
                open={openGenericFilterDialog}
                onClose={handleCloseGenericFilterDialog}
                onError={handleError}
                title={useIntl().formatMessage({ id: 'editFilter' })}
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
