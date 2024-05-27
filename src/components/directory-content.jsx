/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    setActiveDirectory,
    setSearchedElement,
    setSelectionForCopy,
} from '../redux/actions';
import { FormattedMessage, useIntl } from 'react-intl';

import * as constants from '../utils/UIconstants';
import CircularProgress from '@mui/material/CircularProgress';
import FolderOpenRoundedIcon from '@mui/icons-material/FolderOpenRounded';

import { ContingencyListType, FilterType } from '../utils/elementType';
import {
    ElementType,
    useSnackMessage,
    ExplicitNamingFilterEditionDialog,
    ExpertFilterEditionDialog,
    CriteriaBasedFilterEditionDialog,
    DescriptionModificationDialog,
    CustomAGGrid,
    noSelectionForCopy,
} from '@gridsuite/commons-ui';
import { Box, useTheme } from '@mui/material';

import {
    elementExists,
    fetchAppsAndUrls,
    fetchElementsInfos,
    getFilterById,
    fetchDirectoryContent,
    fetchRootFolders,
    updateElement,
} from '../utils/rest-api';

import ContentContextualMenu from './menus/content-contextual-menu';
import ContentToolbar from './toolbars/content-toolbar';
import DirectoryTreeContextualMenu from './menus/directory-tree-contextual-menu';
import CriteriaBasedEditionDialog from './dialogs/contingency-list/edition/criteria-based/criteria-based-edition-dialog';
import ExplicitNamingEditionDialog from './dialogs/contingency-list/edition/explicit-naming/explicit-naming-edition-dialog';
import ScriptEditionDialog from './dialogs/contingency-list/edition/script/script-edition-dialog';
import NoContentDirectory from './no-content-directory';
import { useParameterState } from './dialogs/parameters-dialog';
import { PARAM_LANGUAGE } from '../utils/config-params';
import Grid from '@mui/material/Grid';
import { useDirectoryContent } from '../hooks/useDirectoryContent';
import {
    getColumnsDefinition,
    defaultColumnDefinition,
    computeCheckedElements,
    formatMetadata,
} from './utils/directory-content-utils.ts';

const circularProgressSize = '70px';
const SEARCH_HIGHTLIGHT_DURATION_MS = 4000;

const styles = {
    link: (theme) => ({
        color: theme.link.color,
        textDecoration: 'none',
    }),
    grid: { height: 500, width: '100%' },
    overflow: {
        whiteSpace: 'pre',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
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
};

const initialMousePosition = {
    mouseX: null,
    mouseY: null,
};

const DirectoryContent = () => {
    const treeData = useSelector((state) => state.treeData);
    const { snackError } = useSnackMessage();
    const dispatch = useDispatch();
    const theme = useTheme();

    const selectionForCopy = useSelector((state) => state.selectionForCopy);
    const activeDirectory = useSelector((state) => state.activeDirectory);
    const searchedElement = useSelector((state) => state.searchedElement);

    const [languageLocal] = useParameterState(PARAM_LANGUAGE);

    const dispatchSelectionForCopy = useCallback(
        (
            typeItem,
            nameItem,
            descriptionItem,
            sourceItemUuid,
            parentDirectoryUuid,
            specificTypeItem
        ) => {
            dispatch(
                setSelectionForCopy({
                    sourceItemUuid: sourceItemUuid,
                    typeItem: typeItem,
                    nameItem: nameItem,
                    descriptionItem: descriptionItem,
                    parentDirectoryUuid: parentDirectoryUuid,
                    specificTypeItem: specificTypeItem,
                })
            );
        },
        [dispatch]
    );
    const [broadcastChannel] = useState(() => {
        const broadcast = new BroadcastChannel('itemCopyChannel');
        broadcast.onmessage = (event) => {
            console.info('message received from broadcast channel');
            if (
                JSON.stringify(noSelectionForCopy) ===
                JSON.stringify(event.data)
            ) {
                dispatch(setSelectionForCopy(noSelectionForCopy));
            } else {
                dispatchSelectionForCopy(
                    event.data.typeItem,
                    event.data.nameItem,
                    event.data.descriptionItem,
                    event.data.sourceItemUuid,
                    event.data.parentDirectoryUuid,
                    event.data.specificTypeItem
                );
            }
        };
        return broadcast;
    });

    const appsAndUrls = useSelector((state) => state.appsAndUrls);
    const selectedDirectory = useSelector((state) => state.selectedDirectory);

    const [activeElement, setActiveElement] = useState(null);
    const [isMissingDataAfterDirChange, setIsMissingDataAfterDirChange] =
        useState(true);

    const intl = useIntl();
    const gridRef = useRef();
    const [data, childrenMetadata] = useDirectoryContent(
        setIsMissingDataAfterDirChange
    );

    /* Menu states */
    const [mousePosition, setMousePosition] = useState(initialMousePosition);

    const [openDialog, setOpenDialog] = useState(constants.DialogsId.NONE);
    const [elementName, setElementName] = useState('');

    /**
     * Filters contingency list dialog: window status value for editing a filters contingency list
     */
    const [
        currentFiltersContingencyListId,
        setCurrentFiltersContingencyListId,
    ] = useState(null);
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
    ] = useState(null);
    const handleCloseExplicitNamingContingency = () => {
        setOpenDialog(constants.DialogsId.NONE);
        setActiveElement(null);
        setCurrentExplicitNamingContingencyListId(null);
        setElementName('');
    };

    /**
     * Filters dialog: window status value to edit CriteriaBased filters
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
     * Filters dialog: window status value to edit Expert filters
     */
    const [currentExpertFilterId, setCurrentExpertFilterId] = useState(null);
    const handleCloseExpertFilterDialog = () => {
        setOpenDialog(constants.DialogsId.NONE);
        setCurrentExpertFilterId(null);
        setActiveElement(null);
        setElementName('');
    };

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

    const isRowHovered = () => {
        return !!gridRef.current?.api
            ?.getRenderedNodes()
            .find((node) => node.hovered);
    };

    const onCellContextMenu = useCallback(
        (event) => {
            if (event.data && event.data.uploading !== null) {
                if (event.data.type !== 'DIRECTORY') {
                    setActiveElement({
                        hasMetadata:
                            childrenMetadata[event.data.elementUuid] !==
                            undefined,
                        specificMetadata:
                            childrenMetadata[event.data.elementUuid]
                                ?.specificMetadata,
                        ...event.data,
                    });
                }
                setMousePosition({
                    mouseX: event.event.clientX + constants.HORIZONTAL_SHIFT,
                    mouseY: event.event.clientY + constants.VERTICAL_SHIFT,
                });
                handleOpenContentMenu(event.event);
            }
        },
        [childrenMetadata]
    );

    const onContextMenu = useCallback(
        (event) => {
            if (!isRowHovered()) {
                if (selectedDirectory) {
                    dispatch(setActiveDirectory(selectedDirectory.elementUuid));
                }
                setMousePosition({
                    mouseX: event.clientX + constants.HORIZONTAL_SHIFT,
                    mouseY: event.clientY + constants.VERTICAL_SHIFT,
                });
                handleOpenDirectoryMenu(event);
            }
        },
        [dispatch, selectedDirectory]
    );

    const handleError = useCallback(
        (message) => {
            snackError({
                messageTxt: message,
            });
        },
        [snackError]
    );

    const getLink = useCallback(
        (elementUuid, objectType) => {
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
        },
        [appsAndUrls]
    );

    const handleDescriptionIconClick = (e) => {
        setActiveElement(e.data);
        setOpenDescModificationDialog(true);
    };

    const handleCellClick = useCallback(
        (event) => {
            if (event.colDef.field === 'description') {
                handleDescriptionIconClick(event);
            } else {
                if (childrenMetadata[event.data.elementUuid] !== undefined) {
                    setElementName(
                        childrenMetadata[event.data.elementUuid]?.elementName
                    );
                    const subtype =
                        childrenMetadata[event.data.elementUuid]
                            .specificMetadata.type;
                    /** set active directory on the store because it will be used while editing the contingency name */
                    dispatch(
                        setActiveDirectory(selectedDirectory?.elementUuid)
                    );
                    switch (event.data.type) {
                        case ElementType.STUDY:
                            let url = getLink(
                                event.data.elementUuid,
                                event.data.type
                            );
                            url
                                ? window.open(url, '_blank')
                                : handleError(
                                      intl.formatMessage(
                                          { id: 'getAppLinkError' },
                                          { type: event.data.type }
                                      )
                                  );
                            break;
                        case ElementType.CONTINGENCY_LIST:
                            if (
                                subtype ===
                                ContingencyListType.CRITERIA_BASED.id
                            ) {
                                setCurrentFiltersContingencyListId(
                                    event.data.elementUuid
                                );
                                setOpenDialog(subtype);
                            } else if (
                                subtype === ContingencyListType.SCRIPT.id
                            ) {
                                setCurrentScriptContingencyListId(
                                    event.data.elementUuid
                                );
                                setOpenDialog(subtype);
                            } else if (
                                subtype ===
                                ContingencyListType.EXPLICIT_NAMING.id
                            ) {
                                setCurrentExplicitNamingContingencyListId(
                                    event.data.elementUuid
                                );
                                setOpenDialog(subtype);
                            }
                            break;
                        case ElementType.FILTER:
                            if (subtype === FilterType.EXPLICIT_NAMING.id) {
                                setCurrentExplicitNamingFilterId(
                                    event.data.elementUuid
                                );
                                setOpenDialog(subtype);
                            } else if (
                                subtype === FilterType.CRITERIA_BASED.id
                            ) {
                                setCurrentCriteriaBasedFilterId(
                                    event.data.elementUuid
                                );
                                setOpenDialog(subtype);
                            } else if (subtype === FilterType.EXPERT.id) {
                                setCurrentExpertFilterId(
                                    event.data.elementUuid
                                );
                                setOpenDialog(subtype);
                            }
                            break;
                        default:
                            break;
                    }
                }
            }
        },
        [
            childrenMetadata,
            dispatch,
            getLink,
            handleError,
            intl,
            selectedDirectory,
        ]
    );

    const [openDescModificationDialog, setOpenDescModificationDialog] =
        useState(false);

    useEffect(() => {
        if (!selectedDirectory) {
            return;
        }
        setIsMissingDataAfterDirChange(true);
    }, [selectedDirectory, setIsMissingDataAfterDirChange]);

    const [checkedElement, setCheckedElement] = useState([]);

    const isActiveElementUnchecked = useMemo(
        () =>
            activeElement &&
            !checkedElement.find(
                (children) => children.elementUuid === activeElement.elementUuid
            ),
        [activeElement, checkedElement]
    );

    const handleRowSelected = useCallback(() => {
        setCheckedElement(computeCheckedElements(gridRef, childrenMetadata));
    }, [childrenMetadata]);

    //It includes checked rows and the row with its context menu open
    const fullSelection = useMemo(() => {
        const selection = [...checkedElement];
        if (isActiveElementUnchecked) {
            selection.push(formatMetadata(activeElement, childrenMetadata));
        }
        return selection;
    }, [
        activeElement,
        checkedElement,
        childrenMetadata,
        isActiveElementUnchecked,
    ]);

    const rows = useMemo(
        () =>
            currentChildren?.map((child) => ({
                ...child,
                type:
                    childrenMetadata[child.elementUuid] &&
                    getElementTypeTranslation(
                        child.type,
                        childrenMetadata[child.elementUuid].subtype,
                        childrenMetadata[child.elementUuid].format
                    ),
                notClickable: child.type === ElementType.CASE,
            })),
        [childrenMetadata, currentChildren, getElementTypeTranslation]
    );
    const handleOpenDialog = useCallback(() => {
        setOpenDialog(constants.DialogsId.ADD_ROOT_DIRECTORY);
    }, []);

    const renderLoadingContent = () => {
        return (
            <Box sx={styles.circularProgressContainer}>
                <CircularProgress
                    size={circularProgressSize}
                    color="inherit"
                    sx={styles.centeredCircularProgress}
                />
            </Box>
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

    const onGridReady = useCallback(
        ({ api }) => {
            api?.sizeColumnsToFit();

            // if there is a searched element, we scroll to it, style it for SEARCH_HIGHTLIGHT_DURATION, then remove it from searchedElement to go back to previous style
            if (!searchedElement) {
                return;
            }
            const searchedElementRow = api.getRowNode(searchedElement.id);
            if (searchedElementRow) {
                api.ensureIndexVisible(searchedElementRow.rowIndex, 'top');
                setTimeout(() => {
                    dispatch(setSearchedElement(null));
                }, SEARCH_HIGHTLIGHT_DURATION_MS);
            }
        },
        [searchedElement, dispatch]
    );

    const getRowId = useCallback((params) => params.data.elementUuid, []);
    const getRowStyle = useCallback(
        (cellData) => {
            const style = { fontSize: '1rem' };

            if (
                ![ElementType.CASE, ElementType.PARAMETERS].includes(
                    cellData.data?.type
                )
            ) {
                style.cursor = 'pointer';
            }
            if (cellData.data.elementUuid === searchedElement?.id) {
                style.backgroundColor = theme.row.hover;
            }
            return style;
        },
        [searchedElement?.id, theme.row.hover]
    );

    const renderTableContent = () => {
        return (
            <>
                <ContentToolbar selectedElements={checkedElement} />
                <CustomAGGrid
                    ref={gridRef}
                    rowData={data}
                    getRowId={getRowId}
                    defaultColDef={defaultColumnDefinition}
                    rowSelection="multiple"
                    suppressRowClickSelection
                    onGridReady={onGridReady}
                    onCellClicked={handleCellClick}
                    onCellContextMenu={onCellContextMenu}
                    onRowSelected={handleRowSelected}
                    animateRows={true}
                    columnDefs={getColumnsDefinition(childrenMetadata, intl)}
                    getRowStyle={getRowStyle}
                    alternateTheme
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
        if (!currentChildren || !selectedDirectory) {
            if (treeData.rootDirectories.length === 0 && treeData.initialized) {
                return (
                    <NoContentDirectory handleOpenDialog={handleOpenDialog} />
                );
            }
            return;
        }

        // If empty dir then render an appropriate content
        if (data.length === 0) {
            return renderEmptyDirContent();
        }

        // Finally if we have elements then render the table
        return renderTableContent();
    };

    const renderDialog = (name) => {
        if (openDescModificationDialog && activeElement) {
            return (
                <DescriptionModificationDialog
                    open={true}
                    description={activeElement.description}
                    elementUuid={activeElement.elementUuid}
                    onClose={() => {
                        setActiveElement(null);
                        setOpenDescModificationDialog(false);
                    }}
                    updateElement={updateElement}
                />
            );
        }
        // TODO openDialog should also be aware of the dialog's type, not only its subtype, because
        // if/when two different dialogs have the same subtype, this function will display the wrong dialog.
        switch (openDialog) {
            case ContingencyListType.CRITERIA_BASED.id:
                return (
                    <CriteriaBasedEditionDialog
                        open={true}
                        titleId={'editContingencyList'}
                        contingencyListId={currentFiltersContingencyListId}
                        contingencyListType={
                            ContingencyListType.CRITERIA_BASED.id
                        }
                        onClose={handleCloseFiltersContingency}
                        name={name}
                        broadcastChannel={broadcastChannel}
                    />
                );
            case ContingencyListType.SCRIPT.id:
                return (
                    <ScriptEditionDialog
                        open={true}
                        titleId={'editContingencyList'}
                        contingencyListId={currentScriptContingencyListId}
                        contingencyListType={ContingencyListType.SCRIPT.id}
                        onClose={handleCloseScriptContingency}
                        name={name}
                        broadcastChannel={broadcastChannel}
                    />
                );
            case ContingencyListType.EXPLICIT_NAMING.id:
                return (
                    <ExplicitNamingEditionDialog
                        open={true}
                        titleId={'editContingencyList'}
                        contingencyListId={
                            currentExplicitNamingContingencyListId
                        }
                        contingencyListType={
                            ContingencyListType.EXPLICIT_NAMING.id
                        }
                        onClose={handleCloseExplicitNamingContingency}
                        name={name}
                        broadcastChannel={broadcastChannel}
                    />
                );
            case FilterType.EXPLICIT_NAMING.id:
                return (
                    <ExplicitNamingFilterEditionDialog
                        id={currentExplicitNamingFilterId}
                        open={true}
                        onClose={handleCloseExplicitNamingFilterDialog}
                        titleId={'editFilter'}
                        name={name}
                        broadcastChannel={broadcastChannel}
                        fetchAppsAndUrls={fetchAppsAndUrls}
                        getFilterById={getFilterById}
                        activeDirectory={activeDirectory}
                        elementExists={elementExists}
                        language={languageLocal}
                    />
                );
            case FilterType.CRITERIA_BASED.id:
                return (
                    <CriteriaBasedFilterEditionDialog
                        id={currentCriteriaBasedFilterId}
                        open={true}
                        onClose={handleCloseCriteriaBasedFilterDialog}
                        titleId={'editFilter'}
                        name={name}
                        broadcastChannel={broadcastChannel}
                        fetchAppsAndUrls={fetchAppsAndUrls}
                        getFilterById={getFilterById}
                        selectionForCopy={selectionForCopy}
                        activeDirectory={activeDirectory}
                        elementExists={elementExists}
                        language={languageLocal}
                    />
                );
            case FilterType.EXPERT.id:
                return (
                    <ExpertFilterEditionDialog
                        id={currentExpertFilterId}
                        open={true}
                        onClose={handleCloseExpertFilterDialog}
                        titleId={'editFilter'}
                        name={name}
                        broadcastChannel={broadcastChannel}
                        fetchAppsAndUrls={fetchAppsAndUrls}
                        selectionForCopy={selectionForCopy}
                        getFilterById={getFilterById}
                        activeDirectory={activeDirectory}
                        elementExists={elementExists}
                        language={languageLocal}
                        fetchDirectoryContent={fetchDirectoryContent}
                        fetchRootFolders={fetchRootFolders}
                        fetchElementsInfos={fetchElementsInfos}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <>
            <Grid item xs={12} sx={styles.grid} onContextMenu={onContextMenu}>
                {renderContent()}
            </Grid>
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
                    selectedElements={fullSelection}
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
                    broadcastChannel={broadcastChannel}
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
