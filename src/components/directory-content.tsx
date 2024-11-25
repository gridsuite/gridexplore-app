/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FormattedMessage, useIntl } from 'react-intl';
import { Box, Button, CircularProgress, Grid, SxProps, Theme } from '@mui/material';
import {
    CriteriaBasedFilterEditionDialog,
    DescriptionModificationDialog,
    ElementAttributes,
    ElementType,
    ExpertFilterEditionDialog,
    ExplicitNamingFilterEditionDialog,
    Metadata,
    NO_SELECTION_FOR_COPY,
    SelectionForCopy,
    StudyMetadata,
    useSnackMessage,
} from '@gridsuite/commons-ui';
import { Add as AddIcon } from '@mui/icons-material';
import { AgGridReact } from 'ag-grid-react';
import { CellContextMenuEvent } from 'ag-grid-community';
import { ContingencyListType, FilterType, NetworkModificationType } from '../utils/elementType';
import * as constants from '../utils/UIconstants';
import { setActiveDirectory, setItemSelectionForCopy } from '../redux/actions';
import { elementExists, getFilterById, updateElement } from '../utils/rest-api';
import { AnchorStatesType, defaultAnchorStates } from './menus/common-contextual-menu';
import ContentContextualMenu from './menus/content-contextual-menu';
import ContentToolbar from './toolbars/content-toolbar';
import DirectoryTreeContextualMenu from './menus/directory-tree-contextual-menu';
import CriteriaBasedEditionDialog from './dialogs/contingency-list/edition/criteria-based/criteria-based-edition-dialog';
import ExplicitNamingEditionDialog from './dialogs/contingency-list/edition/explicit-naming/explicit-naming-edition-dialog';
import ScriptEditionDialog from './dialogs/contingency-list/edition/script/script-edition-dialog';
import { useParameterState } from './dialogs/use-parameters-dialog';
import { PARAM_LANGUAGE } from '../utils/config-params';
import { useDirectoryContent } from '../hooks/useDirectoryContent';
import {
    computeCheckedElements,
    formatMetadata,
    getColumnsDefinition,
    isRowUnchecked,
} from './utils/directory-content-utils';
import NoContentDirectory from './no-content-directory';
import { CUSTOM_ROW_CLASS, DirectoryContentTable } from './directory-content-table';
import { useHighlightSearchedElement } from './search/use-highlight-searched-element';
import EmptyDirectory from './empty-directory';
import CompositeModificationDialog from './dialogs/network-modification/composite-modification/composite-modification-dialog';
import { AppState } from '../redux/types';

const circularProgressSize = '70px';

const styles = {
    link: (theme: Theme) => ({
        color: theme.link.color,
        textDecoration: 'none',
    }),
    circularProgressContainer: {
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'row',
        flexGrow: '1',
        justifyContent: 'center',
        textAlign: 'center',
        marginTop: '100px',
    },
    centeredCircularProgress: {
        alignSelf: 'center',
    },
    highlightedElementAnimation: (theme: Theme) => ({
        '@keyframes highlighted-element': {
            'from, 24%': {
                backgroundColor: 'inherit',
            },
            '12%, 36%, to': {
                backgroundColor: theme.row.hover,
            },
        },
    }),
    button: (theme: Theme) => ({
        marginRight: theme.spacing(9),
        borderRadius: '20px',
    }),
    toolBarContainer: {
        display: 'flex',
        flexDirection: 'row' as const,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
};

const isStudyMetadata = (metadata: Metadata): metadata is StudyMetadata => metadata.name === 'Study';

export default function DirectoryContent() {
    const treeData = useSelector((state: AppState) => state.treeData);
    const { snackError } = useSnackMessage();
    const dispatch = useDispatch();

    const selectionForCopy = useSelector((state: AppState) => state.itemSelectionForCopy);
    const activeDirectory = useSelector((state: AppState) => state.activeDirectory);

    const gridRef = useRef<AgGridReact | null>(null);

    const [onGridReady, getRowStyle] = useHighlightSearchedElement(gridRef?.current?.api ?? null);

    const [languageLocal] = useParameterState(PARAM_LANGUAGE);

    const [broadcastChannel] = useState(() => {
        const broadcast = new BroadcastChannel('itemCopyChannel');
        broadcast.onmessage = (event: MessageEvent<SelectionForCopy>) => {
            console.info('message received from broadcast channel');
            if (JSON.stringify(NO_SELECTION_FOR_COPY) === JSON.stringify(event.data)) {
                dispatch(setItemSelectionForCopy(NO_SELECTION_FOR_COPY));
            } else {
                dispatch(setItemSelectionForCopy(event.data));
            }
        };
        return broadcast;
    });

    const appsAndUrls = useSelector((state: AppState) => state.appsAndUrls);
    const selectedDirectory = useSelector((state: AppState) => state.selectedDirectory);

    const [activeElement, setActiveElement] = useState<ElementAttributes | null>(null);
    const [isMissingDataAfterDirChange, setIsMissingDataAfterDirChange] = useState(true);

    const intl = useIntl();
    const [rows, childrenMetadata] = useDirectoryContent();
    const [checkedRows, setCheckedRows] = useState<ElementAttributes[]>([]);

    /* Menu states */
    const [directoryMenuAnchorStates, setDirectoryMenuAnchorStates] = useState<AnchorStatesType>(defaultAnchorStates);

    const [openDialog, setOpenDialog] = useState(constants.DialogsId.NONE);
    const [elementName, setElementName] = useState('');

    /** Filters contingency list dialog: window status value for editing a filters contingency list */
    const [currentFiltersContingencyListId, setCurrentFiltersContingencyListId] = useState(null);
    const handleCloseFiltersContingency = () => {
        setOpenDialog(constants.DialogsId.NONE);
        setActiveElement(null);
        setCurrentFiltersContingencyListId(null);
        setElementName('');
    };

    /** Explicit Naming contingency list dialog: window status value for editing an explicit naming contingency list */
    const [currentExplicitNamingContingencyListId, setCurrentExplicitNamingContingencyListId] = useState(null);
    const handleCloseExplicitNamingContingency = () => {
        setOpenDialog(constants.DialogsId.NONE);
        setActiveElement(null);
        setCurrentExplicitNamingContingencyListId(null);
        setElementName('');
    };

    /** Filters dialog: window status value to edit CriteriaBased filters */
    const [currentCriteriaBasedFilterId, setCurrentCriteriaBasedFilterId] = useState(null);
    const handleCloseCriteriaBasedFilterDialog = () => {
        setOpenDialog(constants.DialogsId.NONE);
        setCurrentCriteriaBasedFilterId(null);
        setActiveElement(null);
        setElementName('');
    };

    const [currentExplicitNamingFilterId, setCurrentExplicitNamingFilterId] = useState(null);
    /** Filters dialog: window status value to edit ExplicitNaming filters */
    const handleCloseExplicitNamingFilterDialog = () => {
        setOpenDialog(constants.DialogsId.NONE);
        setCurrentExplicitNamingFilterId(null);
        setActiveElement(null);
        setElementName('');
    };

    const [currentNetworkModificationId, setCurrentNetworkModificationId] = useState(null);
    const handleCloseCompositeModificationDialog = () => {
        setOpenDialog(constants.DialogsId.NONE);
        setCurrentNetworkModificationId(null);
        setActiveElement(null);
        setElementName('');
    };

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

    /** Script contingency list dialog: window status value for editing a script contingency list */
    const [currentScriptContingencyListId, setCurrentScriptContingencyListId] = useState(null);
    const handleCloseScriptContingency = () => {
        setOpenDialog(constants.DialogsId.NONE);
        setActiveElement(null);
        setCurrentScriptContingencyListId(null);
        setElementName('');
    };

    /** Contextual Menus */
    const [openDirectoryMenu, setOpenDirectoryMenu] = useState(false);
    const [openContentMenu, setOpenContentMenu] = useState(false);

    const handleOpenContentMenu = (event: MouseEvent<HTMLDivElement>) => {
        setOpenContentMenu(true);
        event?.stopPropagation();
    };

    const handleCloseContentMenu = useCallback(() => {
        setOpenContentMenu(false);
        setActiveElement(null);
    }, []);

    const handleCloseDirectoryMenu = () => {
        setOpenDirectoryMenu(false);
        dispatch(setActiveDirectory(undefined));
    };

    const handleOpenDirectoryMenu = (event: MouseEvent<HTMLDivElement>) => {
        setOpenDirectoryMenu(true);
        event.stopPropagation();
    };

    const onContextMenu = useCallback(
        (event: any, anchorStates: AnchorStatesType = defaultAnchorStates) => {
            if (anchorStates.anchorReference === 'anchorPosition') {
                // example : right click on empty space or on an element line
                // then open popover on mouse position with a little shift
                setDirectoryMenuAnchorStates({
                    ...anchorStates,
                    anchorPosition: {
                        top: event.clientY + constants.VERTICAL_SHIFT,
                        left: event.clientX + constants.HORIZONTAL_SHIFT,
                    },
                });
            } else {
                // else anchorEl
                // example : left click on a 'create element' button
                // then open popover attached to the component clicked
                setDirectoryMenuAnchorStates(anchorStates);
            }
            // We check if the context menu was triggered from a row to prevent displaying both the directory and the content context menus
            const isRow = !!event.target.closest(`.${CUSTOM_ROW_CLASS}`);
            if (!isRow) {
                dispatch(setActiveDirectory(selectedDirectory?.elementUuid));
                handleOpenDirectoryMenu(event);
            } else {
                handleOpenContentMenu(event);
            }
        },
        [dispatch, selectedDirectory?.elementUuid]
    );

    /* User interactions */
    const contextualMixPolicies = useMemo(
        () => ({
            BIG: 'GoogleMicrosoft', // if !selectedUuids.has(selected.Uuid) deselects selectedUuids
            ALL: 'All', // union of activeElement.Uuid and selectedUuids (currently implemented)
        }),
        []
    );
    const contextualMixPolicy = contextualMixPolicies.ALL;

    const onCellContextMenu = useCallback(
        (cellEvent: CellContextMenuEvent) => {
            if (cellEvent.data && cellEvent.data.uploading !== null) {
                if (cellEvent.data.type !== 'DIRECTORY') {
                    dispatch(setActiveDirectory(selectedDirectory?.elementUuid));
                    setActiveElement({
                        hasMetadata: childrenMetadata[cellEvent.data.elementUuid] !== undefined,
                        specificMetadata: childrenMetadata[cellEvent.data.elementUuid]?.specificMetadata,
                        ...cellEvent.data,
                    });
                    if (contextualMixPolicy === contextualMixPolicies.BIG) {
                        // If some elements were already selected and the active element is not in them, we deselect the already selected elements.
                        if (isRowUnchecked(cellEvent.data, checkedRows)) {
                            gridRef.current?.api.deselectAll();
                        }
                    } else if (isRowUnchecked(cellEvent.data, checkedRows)) {
                        // If some elements were already selected, we add the active element to the selected list if not already in it.
                        gridRef.current?.api.getRowNode(cellEvent.data.elementUuid)?.setSelected(true);
                    }
                }
                onContextMenu(cellEvent.event);
            }
        },
        [
            checkedRows,
            childrenMetadata,
            contextualMixPolicies.BIG,
            contextualMixPolicy,
            dispatch,
            selectedDirectory?.elementUuid,
            onContextMenu,
        ]
    );

    const handleError = useCallback(
        (message: string) => {
            snackError({
                messageTxt: message,
            });
        },
        [snackError]
    );

    const getStudyUrl = useCallback(
        (elementUuid: string): string | null => {
            const appStudy = appsAndUrls.find(isStudyMetadata);
            if (appStudy) {
                const studyResource = appStudy.resources?.find((resource) =>
                    resource.types.includes(ElementType.STUDY)
                );
                if (studyResource) {
                    return appStudy.url + studyResource.path.replace('{elementUuid}', elementUuid);
                }
            }
            return null;
        },
        [appsAndUrls]
    );

    const [openDescModificationDialog, setOpenDescModificationDialog] = useState(false);

    const handleDescriptionIconClick = (e: any) => {
        setActiveElement(e.data);
        setOpenDescModificationDialog(true);
    };

    const handleCellClick = useCallback(
        (event: any) => {
            if (event.colDef.field === 'description') {
                handleDescriptionIconClick(event);
            } else if (childrenMetadata[event.data.elementUuid] !== undefined) {
                setElementName(childrenMetadata[event.data.elementUuid]?.elementName);
                const subtype: string = childrenMetadata[event.data.elementUuid].specificMetadata
                    .type as unknown as string;
                /** set active directory on the store because it will be used while editing the contingency name */
                dispatch(setActiveDirectory(selectedDirectory?.elementUuid));
                switch (event.data.type) {
                    case ElementType.STUDY: {
                        const url = getStudyUrl(event.data.elementUuid);
                        if (url) {
                            window.open(url, '_blank');
                        } else {
                            handleError(intl.formatMessage({ id: 'getAppLinkError' }, { type: event.data.type }));
                        }
                        break;
                    }
                    case ElementType.CONTINGENCY_LIST:
                        if (subtype === ContingencyListType.CRITERIA_BASED.id) {
                            setCurrentFiltersContingencyListId(event.data.elementUuid);
                            setOpenDialog(subtype);
                        } else if (subtype === ContingencyListType.SCRIPT.id) {
                            setCurrentScriptContingencyListId(event.data.elementUuid);
                            setOpenDialog(subtype);
                        } else if (subtype === ContingencyListType.EXPLICIT_NAMING.id) {
                            setCurrentExplicitNamingContingencyListId(event.data.elementUuid);
                            setOpenDialog(subtype);
                        }
                        break;
                    case ElementType.FILTER:
                        if (subtype === FilterType.EXPLICIT_NAMING.id) {
                            setCurrentExplicitNamingFilterId(event.data.elementUuid);
                            setOpenDialog(subtype);
                        } else if (subtype === FilterType.CRITERIA_BASED.id) {
                            setCurrentCriteriaBasedFilterId(event.data.elementUuid);
                            setOpenDialog(subtype);
                        } else if (subtype === FilterType.EXPERT.id) {
                            setCurrentExpertFilterId(event.data.elementUuid);
                            setOpenDialog(subtype);
                        }
                        break;
                    case ElementType.MODIFICATION:
                        if (subtype === NetworkModificationType.COMPOSITE.id) {
                            setCurrentNetworkModificationId(event.data.elementUuid);
                            setOpenDialog(subtype);
                        }
                        break;
                    default:
                        break;
                }
            }
        },
        [childrenMetadata, dispatch, getStudyUrl, handleError, intl, selectedDirectory?.elementUuid]
    );

    const isActiveElementUnchecked = useMemo(
        () => activeElement && !checkedRows.find((children) => children.elementUuid === activeElement.elementUuid),
        [activeElement, checkedRows]
    );

    const updateCheckedRows = useCallback(() => {
        setCheckedRows(computeCheckedElements(gridRef, childrenMetadata));
    }, [childrenMetadata]);

    // It includes checked rows and the row with its context menu open
    const fullSelection: ElementAttributes[] = useMemo(() => {
        const selection = [...checkedRows];
        if (isActiveElementUnchecked && activeElement) {
            selection.push(formatMetadata(activeElement, childrenMetadata));
        }
        return selection;
    }, [activeElement, checkedRows, childrenMetadata, isActiveElementUnchecked]);

    const handleOpenDialog = useCallback(() => {
        setOpenDialog(constants.DialogsId.ADD_ROOT_DIRECTORY);
    }, []);

    const renderLoadingContent = () => (
        <Box sx={styles.circularProgressContainer}>
            <CircularProgress size={circularProgressSize} color="inherit" sx={styles.centeredCircularProgress} />
        </Box>
    );

    const renderEmptyDirContent = () => (
        <EmptyDirectory
            onCreateElementButtonClick={(mouseEvent) =>
                onContextMenu(mouseEvent, {
                    anchorReference: 'anchorEl',
                    anchorEl: mouseEvent.currentTarget,
                    anchorOrigin: { vertical: 'center', horizontal: 'right' },
                    transformOrigin: {
                        vertical: 'center',
                        horizontal: 'left',
                    },
                })
            }
        />
    );

    const renderContent = () => {
        // Here we wait for Metadata for the folder content
        if (isMissingDataAfterDirChange) {
            return renderLoadingContent();
        }

        // If no selection or currentChildren = null (first time) render nothing
        if (!rows || !selectedDirectory) {
            if (treeData.rootDirectories.length === 0 && treeData.initialized) {
                return <NoContentDirectory handleOpenDialog={handleOpenDialog} />;
            }
            return undefined;
        }

        // If empty dir then render an appropriate content
        if (rows.length === 0) {
            return renderEmptyDirContent();
        }

        // Finally if we have elements then render the table
        return (
            <DirectoryContentTable
                gridRef={gridRef}
                rows={rows}
                handleCellContextualMenu={onCellContextMenu}
                handleRowSelected={updateCheckedRows}
                handleCellClick={handleCellClick}
                colDef={getColumnsDefinition(childrenMetadata, intl)}
                getRowStyle={getRowStyle}
                onGridReady={onGridReady}
            />
        );
    };

    const renderDialog = (name: string) => {
        if (openDescModificationDialog && activeElement) {
            return (
                <DescriptionModificationDialog
                    open
                    description={activeElement.description}
                    elementUuid={activeElement.elementUuid}
                    onClose={() => {
                        setActiveElement(null);
                        setOpenDescModificationDialog(false);
                    }}
                    // @ts-expect-error TODO: set UUID as parameter type in commons-ui
                    updateElement={updateElement}
                />
            );
        }
        // TODO openDialog should also be aware of the dialog's type, not only its subtype, because
        // if/when two different dialogs have the same subtype, this function will display the wrong dialog.
        switch (openDialog) {
            case NetworkModificationType.COMPOSITE.id:
                return (
                    <CompositeModificationDialog
                        open
                        titleId="MODIFICATION"
                        compositeModificationId={currentNetworkModificationId ?? ''}
                        onClose={handleCloseCompositeModificationDialog}
                        name={name}
                        broadcastChannel={broadcastChannel}
                    />
                );
            case ContingencyListType.CRITERIA_BASED.id:
                return (
                    <CriteriaBasedEditionDialog
                        open
                        titleId="editContingencyList"
                        // @ts-expect-error TODO: manage null case(s) here
                        contingencyListId={currentFiltersContingencyListId}
                        contingencyListType={ContingencyListType.CRITERIA_BASED.id}
                        onClose={handleCloseFiltersContingency}
                        name={name}
                        broadcastChannel={broadcastChannel}
                    />
                );
            case ContingencyListType.SCRIPT.id:
                return (
                    <ScriptEditionDialog
                        open
                        titleId="editContingencyList"
                        // @ts-expect-error TODO: manage null case(s) here
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
                        open
                        titleId="editContingencyList"
                        // @ts-expect-error TODO: manage null case(s) here
                        contingencyListId={currentExplicitNamingContingencyListId}
                        contingencyListType={ContingencyListType.EXPLICIT_NAMING.id}
                        onClose={handleCloseExplicitNamingContingency}
                        name={name}
                        broadcastChannel={broadcastChannel}
                    />
                );
            case FilterType.EXPLICIT_NAMING.id:
                return (
                    <ExplicitNamingFilterEditionDialog
                        // @ts-expect-error TODO: manage null case(s) here
                        id={currentExplicitNamingFilterId}
                        open
                        onClose={handleCloseExplicitNamingFilterDialog}
                        titleId="editFilter"
                        name={name}
                        broadcastChannel={broadcastChannel}
                        selectionForCopy={selectionForCopy}
                        setSelectionForCopy={setItemSelectionForCopy}
                        getFilterById={getFilterById}
                        activeDirectory={activeDirectory}
                        elementExists={elementExists}
                        language={languageLocal}
                    />
                );
            case FilterType.CRITERIA_BASED.id:
                return (
                    <CriteriaBasedFilterEditionDialog
                        // @ts-expect-error TODO: manage null case(s) here
                        id={currentCriteriaBasedFilterId}
                        open
                        onClose={handleCloseCriteriaBasedFilterDialog}
                        titleId="editFilter"
                        name={name}
                        broadcastChannel={broadcastChannel}
                        getFilterById={getFilterById}
                        selectionForCopy={selectionForCopy}
                        setSelectionForCopy={setItemSelectionForCopy}
                        activeDirectory={activeDirectory}
                        elementExists={elementExists}
                        language={languageLocal}
                    />
                );
            case FilterType.EXPERT.id:
                return (
                    <ExpertFilterEditionDialog
                        // @ts-expect-error TODO: manage null case(s) here
                        id={currentExpertFilterId}
                        open
                        onClose={handleCloseExpertFilterDialog}
                        titleId="editFilter"
                        name={name}
                        broadcastChannel={broadcastChannel}
                        selectionForCopy={selectionForCopy}
                        setSelectionForCopy={setItemSelectionForCopy}
                        getFilterById={getFilterById}
                        activeDirectory={activeDirectory}
                        elementExists={elementExists}
                        language={languageLocal}
                    />
                );
            default:
                return null;
        }
    };

    useEffect(() => {
        if (!selectedDirectory?.elementUuid) {
            return;
        }
        setIsMissingDataAfterDirChange(true);
        setCheckedRows([]);
    }, [selectedDirectory?.elementUuid]);

    useEffect(() => {
        setIsMissingDataAfterDirChange(false);
        // update checkecRows ElementAttributes objects if metadata changed
        // ex: when the user renames a selected element
        updateCheckedRows();
    }, [childrenMetadata, updateCheckedRows]); // this will change after switching selectedDirectory

    return (
        <>
            {
                // ContentToolbar needs to be outside the DirectoryContentTable container otherwise it
                // creates a visual offset rendering the last elements of a full table inaccessible
                rows && rows.length > 0 && (
                    <div style={{ ...styles.toolBarContainer }}>
                        <ContentToolbar selectedElements={checkedRows} />
                        <Button
                            variant="contained"
                            endIcon={<AddIcon />}
                            sx={styles.button}
                            onClick={(mouseEvent) =>
                                onContextMenu(mouseEvent, {
                                    anchorReference: 'anchorEl',
                                    anchorEl: mouseEvent.currentTarget,
                                    anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
                                    transformOrigin: { vertical: 'top', horizontal: 'left' },
                                })
                            }
                        >
                            <FormattedMessage id="createElement" />
                        </Button>
                    </div>
                )
            }
            <Grid item sx={styles.highlightedElementAnimation as SxProps} xs={12} onContextMenu={onContextMenu}>
                {renderContent()}
            </Grid>
            <Box
                onMouseDown={(e) => {
                    if (e.button === constants.MOUSE_EVENT_RIGHT_BUTTON && openDialog === constants.DialogsId.NONE) {
                        handleCloseContentMenu();
                        handleCloseDirectoryMenu();
                    }
                }}
            >
                {activeElement && (
                    <ContentContextualMenu
                        activeElement={activeElement}
                        selectedElements={fullSelection}
                        open={openContentMenu}
                        openDialog={openDialog}
                        setOpenDialog={setOpenDialog}
                        onClose={handleCloseContentMenu}
                        {...directoryMenuAnchorStates}
                        broadcastChannel={broadcastChannel}
                    />
                )}
                <DirectoryTreeContextualMenu
                    directory={selectedDirectory}
                    open={openDirectoryMenu}
                    openDialog={openDialog}
                    setOpenDialog={setOpenDialog}
                    onClose={handleCloseDirectoryMenu}
                    {...directoryMenuAnchorStates}
                    restrictMenuItems
                />
            </Box>
            {renderDialog(elementName)}
        </>
    );
}
