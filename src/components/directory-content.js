/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveDirectory, setSelectionForCopy } from '../redux/actions';
import { FormattedMessage, useIntl } from 'react-intl';

import * as constants from '../utils/UIconstants';

import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import SettingsIcon from '@mui/icons-material/Settings';
import FolderOpenRoundedIcon from '@mui/icons-material/FolderOpenRounded';
import StickyNote2OutlinedIcon from '@mui/icons-material/StickyNote2Outlined';

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
import { Box, Checkbox } from '@mui/material';

import { fetchElementsInfos } from '../utils/rest-api';
import CriteriaBasedFilterEditionDialog from './dialogs/filter/criteria-based/criteria-based-filter-edition-dialog';

import ContentContextualMenu from './menus/content-contextual-menu';
import ContentToolbar from './toolbars/content-toolbar';
import DirectoryTreeContextualMenu from './menus/directory-tree-contextual-menu';
import PhotoIcon from '@mui/icons-material/Photo';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import ArticleIcon from '@mui/icons-material/Article';
import OfflineBoltIcon from '@mui/icons-material/OfflineBolt';
import CreateIcon from '@mui/icons-material/Create';
import ExplicitNamingFilterEditionDialog from './dialogs/filter/explicit-naming/explicit-naming-filter-edition-dialog';
import CriteriaBasedEditionDialog from './dialogs/contingency-list/edition/criteria-based/criteria-based-edition-dialog';
import ExplicitNamingEditionDialog from './dialogs/contingency-list/edition/explicit-naming/explicit-naming-edition-dialog';
import ScriptEditionDialog from './dialogs/contingency-list/edition/script/script-edition-dialog';
import ExpertFilterEditionDialog from './dialogs/filter/expert/expert-filter-edition-dialog';
import { noSelectionForCopy } from 'utils/constants';
import DescriptionModificationDialogue from './dialogs/description-modification/description-modification-dialogue';

const circularProgressSize = '70px';

const styles = {
    link: (theme) => ({
        color: theme.link.color,
        textDecoration: 'none',
    }),
    cell: {
        display: 'flex',
        alignItems: 'center',
        textAlign: 'center',
        boxSizing: 'border-box',
        flex: 1,
        height: '48px',
        padding: `${DEFAULT_CELL_PADDING}px`,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    chip: {
        cursor: 'pointer',
    },
    icon: (theme) => ({
        marginRight: theme.spacing(1),
        width: '18px',
        height: '18px',
    }),
    circularRoot: (theme) => ({
        marginRight: theme.spacing(1),
    }),
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
    descriptionTooltip: {
        display: 'inline-block',
        whiteSpace: 'pre',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        maxWidth: '250px',
        maxHeight: '50px',
    },
};

const initialMousePosition = {
    mouseX: null,
    mouseY: null,
};

const DirectoryContent = () => {
    const { snackError } = useSnackMessage();
    const dispatch = useDispatch();

    const dispatchSelectionForCopy = useCallback(
        (
            typeItem,
            nameItem,
            descriptionItem,
            sourceItemUuid,
            parentDirectoryUuid
        ) => {
            dispatch(
                setSelectionForCopy({
                    sourceItemUuid: sourceItemUuid,
                    typeItem: typeItem,
                    nameItem: nameItem,
                    descriptionItem: descriptionItem,
                    parentDirectoryUuid: parentDirectoryUuid,
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
                    event.data.parentDirectoryUuid
                );
            }
        };
        return broadcast;
    });
    const [childrenMetadata, setChildrenMetadata] = useState({});

    const [selectedUuids, setSelectedUuids] = useState(new Set());

    const currentChildren = useSelector((state) => state.currentChildren);
    const currentChildrenRef = useRef();
    currentChildrenRef.current = currentChildren;

    const appsAndUrls = useSelector((state) => state.appsAndUrls);
    const selectedDirectory = useSelector((state) => state.selectedDirectory);

    const [activeElement, setActiveElement] = useState(null);
    const [isMissingDataAfterDirChange, setIsMissingDataAfterDirChange] =
        useState(true);

    const intl = useIntl();
    const todayStart = new Date().setHours(0, 0, 0, 0);

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

    /* User interactions */
    const onContextMenu = useCallback(
        (event) => {
            const element = currentChildren.find(
                (e) => e.elementUuid === event.rowData?.elementUuid
            );

            if (selectedDirectory) {
                dispatch(setActiveDirectory(selectedDirectory.elementUuid));
            }

            if (element && element.uploading !== null) {
                if (element.type !== 'DIRECTORY') {
                    setActiveElement(element);
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
        },
        [currentChildren, dispatch, selectedDirectory]
    );

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

    const handleRowClick = useCallback(
        (event) => {
            const element = currentChildren.find(
                (e) => e.elementUuid === event.rowData.elementUuid
            );
            if (childrenMetadata[element.elementUuid] !== undefined) {
                setElementName(childrenMetadata[element.elementUuid]?.name);
                const subtype = childrenMetadata[element.elementUuid].subtype;
                /** set active directory on the store because it will be used while editing the contingency name */
                dispatch(setActiveDirectory(selectedDirectory?.elementUuid));
                switch (element.type) {
                    case ElementType.STUDY:
                        let url = getLink(element.elementUuid, element.type);
                        url
                            ? window.open(url, '_blank')
                            : handleError(
                                  intl.formatMessage(
                                      { id: 'getAppLinkError' },
                                      { type: element.type }
                                  )
                              );
                        break;
                    case ElementType.CONTINGENCY_LIST:
                        if (subtype === ContingencyListType.CRITERIA_BASED.id) {
                            setCurrentFiltersContingencyListId(
                                element.elementUuid
                            );
                            setOpenDialog(subtype);
                        } else if (subtype === ContingencyListType.SCRIPT.id) {
                            setCurrentScriptContingencyListId(
                                element.elementUuid
                            );
                            setOpenDialog(subtype);
                        } else if (
                            subtype === ContingencyListType.EXPLICIT_NAMING.id
                        ) {
                            setCurrentExplicitNamingContingencyListId(
                                element.elementUuid
                            );
                            setOpenDialog(subtype);
                        }
                        break;
                    case ElementType.FILTER:
                        if (subtype === FilterType.EXPLICIT_NAMING.id) {
                            setCurrentExplicitNamingFilterId(
                                element.elementUuid
                            );
                            setOpenDialog(subtype);
                        } else if (subtype === FilterType.CRITERIA_BASED.id) {
                            setCurrentCriteriaBasedFilterId(
                                element.elementUuid
                            );
                            setOpenDialog(subtype);
                        } else if (subtype === FilterType.EXPERT.id) {
                            setCurrentExpertFilterId(element.elementUuid);
                            setOpenDialog(subtype);
                        }
                        break;
                    default:
                        break;
                }
            }
        },
        [
            childrenMetadata,
            currentChildren,
            dispatch,
            getLink,
            handleError,
            intl,
            selectedDirectory?.elementUuid,
        ]
    );

    const getElementTypeTranslation = useCallback(
        (type, subtype, formatCase) => {
            const format = formatCase
                ? ' (' + intl.formatMessage({ id: formatCase }) + ')'
                : '';
            const elemType =
                type === ElementType.FILTER ||
                type === ElementType.CONTINGENCY_LIST
                    ? intl.formatMessage({ id: subtype + '_' + type })
                    : intl.formatMessage({ id: type });
            return `${elemType}${format}`;
        },
        [intl]
    );

    const typeCellRender = useCallback((cellData) => {
        const { rowData = {} } = cellData || {};
        return (
            <Box sx={styles.cell}>
                <OverflowableText
                    text={rowData.type}
                    tooltipSx={styles.tooltip}
                />
            </Box>
        );
    }, []);

    function userCellRender(cellData) {
        const user = cellData.rowData[cellData.dataKey];
        return (
            <Box sx={styles.cell}>
                <Tooltip title={user} placement="right">
                    <Chip
                        sx={styles.chip}
                        label={abbreviationFromUserName(user)}
                    />
                </Tooltip>
            </Box>
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
                <Box sx={styles.cell}>
                    <Tooltip title={fullDate} placement="right">
                        <span>{cellText}</span>
                    </Tooltip>
                </Box>
            );
        }
    }

    const [openDescModificationDialog, setOpenDescModificationDialog] =
        useState(false);

    function descriptionCellRender(cellData) {
        const description = cellData.rowData['description'];

        const descriptionLines = description?.split('\n');
        if (descriptionLines?.length > 3) {
            descriptionLines[2] = '...';
        }
        const tooltip = descriptionLines?.join('\n');

        const handleDescriptionIconClick = (e) => {
            setActiveElement(cellData.rowData);
            setOpenDescModificationDialog(true);
            e.stopPropagation();
        };

        const icon = description ? (
            <Tooltip
                title={
                    <Box children={tooltip} sx={styles.descriptionTooltip} />
                }
                placement="right"
            >
                <StickyNote2OutlinedIcon onClick={handleDescriptionIconClick} />
            </Tooltip>
        ) : (
            <CreateIcon onClick={handleDescriptionIconClick} />
        );
        return (
            <>
                {isElementCaseOrStudy(cellData.rowData['type']) && (
                    <Box sx={styles.cell}>{icon}</Box>
                )}
            </>
        );
    }

    function getElementIcon(objectType) {
        if (objectType === ElementType.STUDY) {
            return <PhotoLibraryIcon sx={styles.icon} />;
        } else if (objectType === ElementType.CONTINGENCY_LIST) {
            return <OfflineBoltIcon sx={styles.icon} />;
        } else if (objectType === ElementType.FILTER) {
            return <ArticleIcon sx={styles.icon} />;
        } else if (objectType === ElementType.CASE) {
            return <PhotoIcon sx={styles.icon} />;
        } else if (objectType === ElementType.VOLTAGE_INIT_PARAMETERS) {
            return <SettingsIcon sx={styles.icon} />;
        }
    }

    const getDisplayedElementName = useCallback(
        (cellData) => {
            const { elementName, uploading, elementUuid } = cellData.rowData;
            const formatMessage = intl.formatMessage;
            if (uploading) {
                return elementName + '\n' + formatMessage({ id: 'uploading' });
            }
            if (!childrenMetadata[elementUuid]) {
                return (
                    elementName +
                    '\n' +
                    formatMessage({ id: 'creationInProgress' })
                );
            }
            return childrenMetadata[elementUuid].name;
        },
        [childrenMetadata, intl.formatMessage]
    );

    const isElementCaseOrStudy = (objectType) => {
        return (
            objectType === ElementType.STUDY || objectType === ElementType.CASE
        );
    };

    const nameCellRender = useCallback(
        (cellData) => {
            const element = currentChildren.find(
                (e) => e.elementUuid === cellData.rowData.elementUuid
            );
            return (
                <Box sx={styles.cell}>
                    {/*  Icon */}
                    {!childrenMetadata[element.elementUuid] &&
                        isElementCaseOrStudy(element.type) && (
                            <CircularProgress
                                size={18}
                                sx={styles.circularRoot}
                            />
                        )}
                    {childrenMetadata[element.elementUuid] &&
                        getElementIcon(
                            element.type,
                            childrenMetadata[element.elementUuid].subtype
                        )}
                    {/* Name */}
                    <OverflowableText
                        text={getDisplayedElementName(cellData)}
                        tooltipSx={styles.tooltip}
                    />
                </Box>
            );
        },
        [childrenMetadata, currentChildren, getDisplayedElementName]
    );

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
            <Box
                onClick={(e) => {
                    toggleSelectAll();
                    e.stopPropagation();
                }}
                sx={styles.checkboxes}
            >
                <Checkbox
                    checked={selectedUuids.size > 0}
                    indeterminate={
                        selectedUuids.size !== 0 &&
                        selectedUuids.size !== currentChildren.length
                    }
                />
            </Box>
        );
    }

    function selectionRenderer(cellData) {
        const elementUuid = cellData.rowData['elementUuid'];
        return (
            <Box
                onClick={(e) => {
                    toggleSelection(elementUuid);
                    e.stopPropagation();
                }}
                sx={styles.checkboxes}
            >
                <Checkbox checked={selectedUuids.has(elementUuid)} />
            </Box>
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
                    rows={rows}
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
                            minWidth: '31%',
                        },
                        {
                            label: intl.formatMessage({
                                id: 'description',
                            }),
                            dataKey: 'description',
                            minWidth: '10%',
                            cellRenderer: descriptionCellRender,
                        },
                        {
                            minWidth: '15%',
                            label: intl.formatMessage({
                                id: 'type',
                            }),
                            dataKey: 'type',
                            cellRenderer: typeCellRender,
                        },
                        {
                            minWidth: '10%',
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
                            minWidth: '11%',
                            label: intl.formatMessage({
                                id: 'modifiedBy',
                            }),
                            dataKey: 'lastModifiedBy',
                            cellRenderer: userCellRender,
                        },
                        {
                            minWidth: '10%',
                            label: intl.formatMessage({
                                id: 'modified',
                            }),
                            dataKey: 'lastModificationDate',
                            cellRenderer: dateCellRender,
                        },
                    ]}
                    sortable
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
        if (openDescModificationDialog && activeElement) {
            return (
                <DescriptionModificationDialogue
                    open={true}
                    description={activeElement.description}
                    elementUuid={activeElement.elementUuid}
                    onClose={() => {
                        setActiveElement(null);
                        setOpenDescModificationDialog(false);
                    }}
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
                    broadcastChannel={broadcastChannel}
                />
            </div>
            {renderDialog(elementName)}
        </>
    );
};

export default DirectoryContent;
