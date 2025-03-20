/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { type MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FormattedMessage, useIntl } from 'react-intl';
import {
    Box,
    type BoxProps,
    Button,
    type ButtonProps,
    CircularProgress,
    Grid,
    type SxProps,
    type Theme,
} from '@mui/material';
import { type ElementAttributes, type ItemSelectionForCopy, NO_ITEM_SELECTION_FOR_COPY } from '@gridsuite/commons-ui';
import { Add as AddIcon } from '@mui/icons-material';
import { AgGridReact } from 'ag-grid-react';
import * as constants from '../utils/UIconstants';
import { setActiveDirectory, setItemSelectionForCopy } from '../redux/actions';
import ContentContextualMenu from './menus/content-contextual-menu';
import ContentToolbar from './toolbars/content-toolbar';
import DirectoryTreeContextualMenu from './menus/directory-tree-contextual-menu';
import { useDirectoryContent } from '../hooks/useDirectoryContent';
import {
    computeCheckedElements,
    formatMetadata,
    getColumnsDefinition,
    isRowUnchecked,
} from './utils/directory-content-utils';
import NoContentDirectory from './no-content-directory';
import { CUSTOM_ROW_CLASS, DirectoryContentTable, type DirectoryContentTableProps } from './directory-content-table';
import { useHighlightSearchedElement } from './search/use-highlight-searched-element';
import EmptyDirectory, { type EmptyDirectoryProps } from './empty-directory';
import { AppState } from '../redux/types';
import DirectoryContentDialog, { type DirectoryContentDialogApi } from './directory-content-dialog';
import { AnchorStatesType, defaultAnchorStates } from './menus/anchor-utils';

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

export default function DirectoryContent() {
    const treeData = useSelector((state: AppState) => state.treeData);
    const dispatch = useDispatch();
    const gridRef = useRef<AgGridReact | null>(null);
    const [onGridReady, getRowStyle] = useHighlightSearchedElement(gridRef?.current?.api ?? null);

    const [broadcastChannel] = useState(() => {
        const broadcast = new BroadcastChannel('itemCopyChannel');
        broadcast.onmessage = (event: MessageEvent<ItemSelectionForCopy>) => {
            console.info('message received from broadcast channel');
            if (JSON.stringify(NO_ITEM_SELECTION_FOR_COPY) === JSON.stringify(event.data)) {
                dispatch(setItemSelectionForCopy(NO_ITEM_SELECTION_FOR_COPY));
            } else {
                dispatch(setItemSelectionForCopy(event.data));
            }
        };
        return broadcast;
    });

    const selectedDirectory = useSelector((state: AppState) => state.selectedDirectory);

    const [activeElement, setActiveElement] = useState<ElementAttributes>();
    const [isMissingDataAfterDirChange, setIsMissingDataAfterDirChange] = useState(true);

    const intl = useIntl();
    const [rows, childrenMetadata] = useDirectoryContent();
    const [checkedRows, setCheckedRows] = useState<ElementAttributes[]>([]);

    /* Menu states */
    const [directoryMenuAnchorStates, setDirectoryMenuAnchorStates] = useState<AnchorStatesType>(defaultAnchorStates);

    const [openDialog, setOpenDialog] = useState(constants.DialogsId.NONE);

    /** Contextual Menus */
    const [openDirectoryMenu, setOpenDirectoryMenu] = useState(false);
    const [openContentMenu, setOpenContentMenu] = useState(false);

    const handleOpenContentMenu = useCallback((event: MouseEvent<HTMLDivElement>) => {
        setOpenContentMenu(true);
        event.stopPropagation();
    }, []);

    const handleCloseContentMenu = useCallback(() => {
        setOpenContentMenu(false);
        setActiveElement(undefined);
    }, []);

    const handleCloseDirectoryMenu = useCallback(() => {
        setOpenDirectoryMenu(false);
        dispatch(setActiveDirectory(undefined));
    }, [dispatch]);

    const handleOpenDirectoryMenu = useCallback((event: MouseEvent<HTMLDivElement>) => {
        setOpenDirectoryMenu(true);
        event.stopPropagation();
    }, []);

    const onContextMenu = useCallback(
        (event: MouseEvent<HTMLDivElement>, anchorStates = defaultAnchorStates) => {
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
                // example : left-click on a 'create element' button
                // then open popover attached to the component clicked
                setDirectoryMenuAnchorStates(anchorStates);
            }
            // We check if the context menu was triggered from a row to prevent displaying both the directory and the content context menus
            const isRow = !!(event.target as Element).closest(`.${CUSTOM_ROW_CLASS}`);
            if (!isRow) {
                dispatch(setActiveDirectory(selectedDirectory?.elementUuid));
                handleOpenDirectoryMenu(event);
            } else {
                handleOpenContentMenu(event);
            }
        },
        [dispatch, handleOpenContentMenu, handleOpenDirectoryMenu, selectedDirectory?.elementUuid]
    );

    /* User interactions */
    const onCellContextMenu = useCallback<DirectoryContentTableProps['handleCellContextualMenu']>(
        (cellEvent) => {
            if (cellEvent.data && cellEvent.data.uploading !== null) {
                if (cellEvent.data.type !== 'DIRECTORY') {
                    dispatch(setActiveDirectory(selectedDirectory?.elementUuid));
                    setActiveElement({
                        hasMetadata: childrenMetadata[cellEvent.data.elementUuid] !== undefined,
                        specificMetadata: childrenMetadata[cellEvent.data.elementUuid]?.specificMetadata,
                        ...cellEvent.data,
                    });
                    if (isRowUnchecked(cellEvent.data, checkedRows)) {
                        // If some elements were already selected, we add the active element to the selected list if not already in it.
                        gridRef.current?.api.getRowNode(cellEvent.data.elementUuid)?.setSelected(true);
                    }
                }
                onContextMenu(cellEvent.event as unknown as MouseEvent<HTMLDivElement>);
            }
        },
        [checkedRows, childrenMetadata, dispatch, selectedDirectory?.elementUuid, onContextMenu]
    );

    const dialogsApi = useRef<DirectoryContentDialogApi>(null);
    const handleCellClick = useCallback<DirectoryContentTableProps['handleCellClick']>(
        /* The `window.open()` call MUST be inside the on-click callback, or else navigators like Firefox will
         * block it with their anti-popup, and user must explicitly whitelist the url/domain */
        (event) => dialogsApi.current?.handleClick(event),
        []
    );

    const updateCheckedRows = useCallback(
        () => setCheckedRows(computeCheckedElements(gridRef, childrenMetadata)),
        [childrenMetadata]
    );

    // It includes checked rows and the row with its context menu open
    const fullSelection = useMemo(() => {
        const selection = [...checkedRows];
        if (activeElement && !checkedRows.find((children) => children.elementUuid === activeElement.elementUuid)) {
            selection.push(formatMetadata(activeElement, childrenMetadata));
        }
        return selection;
    }, [activeElement, checkedRows, childrenMetadata]);

    const handleOpenDialog = useCallback(() => setOpenDialog(constants.DialogsId.ADD_ROOT_DIRECTORY), []);

    const handleButtonClick = useCallback<NonNullable<ButtonProps['onClick']>>(
        (mouseEvent) =>
            onContextMenu(mouseEvent as unknown as MouseEvent<HTMLDivElement>, {
                anchorReference: 'anchorEl',
                anchorEl: mouseEvent.currentTarget,
                anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
                transformOrigin: { vertical: 'top', horizontal: 'left' },
            }),
        [onContextMenu]
    );

    const handleEmptyDirectoryClick = useCallback<EmptyDirectoryProps['onCreateElementButtonClick']>(
        (mouseEvent) =>
            onContextMenu(mouseEvent as unknown as MouseEvent<HTMLDivElement>, {
                anchorReference: 'anchorEl',
                anchorEl: mouseEvent.currentTarget,
                anchorOrigin: { vertical: 'center', horizontal: 'right' },
                transformOrigin: { vertical: 'center', horizontal: 'left' },
            }),
        [onContextMenu]
    );

    const handleBoxDownClick = useCallback<NonNullable<BoxProps['onMouseDown']>>(
        (e) => {
            if (e.button === constants.MOUSE_EVENT_RIGHT_BUTTON && openDialog === constants.DialogsId.NONE) {
                handleCloseContentMenu();
                handleCloseDirectoryMenu();
            }
        },
        [handleCloseContentMenu, handleCloseDirectoryMenu, openDialog]
    );

    useEffect(() => {
        if (selectedDirectory?.elementUuid) {
            setIsMissingDataAfterDirChange(true);
            setCheckedRows([]);
        }
    }, [selectedDirectory?.elementUuid]);

    useEffect(() => {
        setIsMissingDataAfterDirChange(false);
        // update checkedRows ElementAttributes objects if metadata changed
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
                            onClick={handleButtonClick}
                            data-testid="AddElementInDirectoryContentButton"
                        >
                            <FormattedMessage id="createElement" />
                        </Button>
                    </div>
                )
            }
            <Grid item sx={styles.highlightedElementAnimation as SxProps} xs={12} onContextMenu={onContextMenu}>
                {/* eslint-disable no-nested-ternary -- TODO split into sub components */}
                {
                    // Here we wait for Metadata for the folder content
                    isMissingDataAfterDirChange ? (
                        // render loading content
                        <Box sx={styles.circularProgressContainer}>
                            <CircularProgress
                                size={circularProgressSize}
                                color="inherit"
                                sx={styles.centeredCircularProgress}
                            />
                        </Box>
                    ) : // If no selection or currentChildren = null (first time) render nothing
                    !rows || !selectedDirectory ? (
                        treeData.rootDirectories.length === 0 && treeData.initialized ? (
                            <NoContentDirectory handleOpenDialog={handleOpenDialog} />
                        ) : undefined
                    ) : // If empty dir then render an appropriate content
                    rows.length === 0 ? (
                        <EmptyDirectory onCreateElementButtonClick={handleEmptyDirectoryClick} />
                    ) : (
                        // Finally if we have elements then render the table
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
                    )
                }
            </Grid>
            <Box onMouseDown={handleBoxDownClick}>
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
            <DirectoryContentDialog
                ref={dialogsApi}
                broadcastChannel={broadcastChannel}
                activeElement={activeElement}
                setActiveElement={setActiveElement}
                setOpenDialog={setOpenDialog}
                selectedDirectoryElementUuid={selectedDirectory?.elementUuid}
                childrenMetadata={childrenMetadata}
            />
        </>
    );
}
