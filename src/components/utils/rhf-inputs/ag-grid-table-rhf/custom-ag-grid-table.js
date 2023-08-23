/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Grid } from '@mui/material';
import { useTheme } from '@mui/styles';
import BottomRightButtons from './bottom-right-buttons';
import { useIntl } from 'react-intl';
import { AG_GRID_ROW_UUID } from '../../field-constants';

export const ROW_DRAGGING_SELECTION_COLUMN_DEF = [
    {
        rowDrag: true,
        headerCheckboxSelection: true,
        checkboxSelection: true,
        maxWidth: 50,
        cellStyle: {
            backgroundColor: 'transparent',
        },
    },
];

const style = (customProps) => ({
    grid: (theme) => ({
        width: 'auto',
        height: '100%',
        position: 'relative',

        // It shouldn't be like this, but I couldn't make it works
        // https://www.ag-grid.com/react-data-grid/global-style-customisation/
        '--ag-checkbox-checked-color':
            theme.palette.primary.main + ' !important',

        //overrides the default computed max height for ag grid default selector editor to make it more usable
        //can be removed if a custom selector editor is implemented
        '& .ag-select-list': {
            maxHeight: '300px !important',
        },

        '& .ag-root-wrapper-body': {
            maxHeight: '500px',
        },

        '& .ag-header-container': {
            backgroundColor: theme.agGridBackground.color,
        },
        '& .ag-body': {
            backgroundColor: theme.agGridBackground.color,
        },
        '& .ag-row': {
            backgroundColor: theme.agGridBackground.color,
        },
        '& .ag-checkbox-input-wrapper': {
            backgroundColor: theme.agGridBackground.color,
        },
        '& .ag-input-field-input': {
            backgroundColor: theme.agGridBackground.color,
        },
        '& .ag-cell-focus': {
            backgroundColor: theme.agGridBackground.color,
        },
        '& .ag-cell': {
            boxShadow: 'none',
        },
        '& .ag-cell-edit-wrapper': {
            height: 'inherit',
        },
        '& .ag-row-hover': {
            cursor: 'text',
        },
        '& .numeric-input': {
            fontSize: 'calc(var(--ag-font-size) + 1px)',
            paddingLeft: 'calc(var(--ag-cell-horizontal-padding) - 1px)',
            boxSizing: 'border-box',
            width: '100%',
            height: '100%',
            border: 'inherit',
            outline: 'inherit',
        },
        '& .ag-row-selected::before': {
            backgroundColor: 'var(--ag-row-background-color)',
        },
        ...customProps,
    }),
});

export const CustomAgGridTable = ({
    name,
    columnDefs,
    defaultRowData,
    csvProps,
    cssProps,
    ...props
}) => {
    const theme = useTheme();
    const [gridApi, setGridApi] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);
    const [newRowAdded, setNewRowAdded] = useState(false);

    const { control, getValues, setValue, watch } = useFormContext();
    const useFieldArrayOutput = useFieldArray({
        control,
        name: name,
    });
    const { append, remove, update, swap, move } = useFieldArrayOutput;

    const rowData = watch(name);

    const makeEmptyRow = useCallback(() => {
        return {
            [AG_GRID_ROW_UUID]: crypto.randomUUID(),
            ...defaultRowData,
        };
    }, [defaultRowData]);

    // It is not optimal in terms of performance, but we made the decision to isolate the AG_GRID_ROW_UUID inside this component
    useEffect(() => {
        // if the table has default values without rowUuid, we add it
        const rowWithoutUuid = rowData.some((r) => !r[AG_GRID_ROW_UUID]);
        if (rowWithoutUuid) {
            const rowsWithId = rowData.map((r) => {
                if (r[AG_GRID_ROW_UUID]) {
                    return r;
                }
                return {
                    [AG_GRID_ROW_UUID]: crypto.randomUUID(),
                    ...r,
                };
            });
            setValue(name, rowsWithId);
        }
    }, [name, rowData, setValue]);

    const isFirstSelected =
        rowData?.length &&
        gridApi?.api.getRowNode(rowData[0][AG_GRID_ROW_UUID])?.isSelected();

    const isLastSelected =
        rowData?.length &&
        gridApi?.api
            .getRowNode(rowData[rowData.length - 1][AG_GRID_ROW_UUID])
            ?.isSelected();

    const noRowSelected = selectedRows.length === 0;

    const handleMoveRowUp = () => {
        selectedRows
            .map((row) => getIndex(row))
            .sort()
            .forEach((idx) => {
                swap(idx, idx - 1);
            });
    };

    const handleMoveRowDown = () => {
        selectedRows
            .map((row) => getIndex(row))
            .sort()
            .reverse()
            .forEach((idx) => {
                swap(idx, idx + 1);
            });
    };

    const handleDeleteRows = () => {
        selectedRows.forEach((val) => {
            const idx = getIndex(val);
            remove(idx);
        });
    };

    useEffect(() => {
        if (gridApi) {
            gridApi.api.refreshCells({
                force: true,
            });
        }
    }, [gridApi, rowData]);

    const handleAddRow = () => {
        append(makeEmptyRow());
        setNewRowAdded(true);
    };

    const getIndex = (val) => {
        return getValues(name).findIndex(
            (row) => row[AG_GRID_ROW_UUID] === val[AG_GRID_ROW_UUID]
        );
    };

    useEffect(() => {
        if (gridApi) {
            gridApi.api.sizeColumnsToFit();
        }
    }, [columnDefs, gridApi]);

    const intl = useIntl();
    const getLocaleText = useCallback(
        (params) => {
            const key = 'agGrid.' + params.key;
            return intl.messages[key] || params.defaultValue;
        },
        [intl]
    );

    const onGridReady = (params) => {
        setGridApi(params);
        params.api.sizeColumnsToFit();
    };

    const onRowDataUpdated = () => {
        setNewRowAdded(false);
        if (gridApi?.api) {
            // update due to new appended row, let's scroll
            const lastIndex = rowData.length - 1;
            gridApi.api.paginationGoToLastPage();
            gridApi.api.ensureIndexVisible(lastIndex, 'bottom');
        }
    };

    const readyToDisplay =
        // We may have a display issue because we receive the rows 2 times:
        // at init time and once we have added uuid for all rows.
        // We can display rows in the table when:
        // - it's a small nb of lines (even if we have 2 updates)
        // - it's a bigger number, so we wait for the row uuid to be set (Loading... in the meantime)
        rowData &&
        (rowData.length <= 200 ||
            rowData.at(0)[AG_GRID_ROW_UUID] !== undefined);

    return (
        <Grid container spacing={2}>
            <Grid
                item
                xs={12}
                className={theme.aggrid}
                sx={style(cssProps).grid}
            >
                <AgGridReact
                    rowData={readyToDisplay ? rowData : null}
                    onGridReady={onGridReady}
                    getLocaleText={getLocaleText}
                    cacheOverflowSize={10}
                    rowSelection={'multiple'}
                    domLayout={'autoHeight'}
                    rowDragEntireRow
                    rowDragManaged
                    onRowDragEnd={(e) =>
                        move(getIndex(e.node.data), e.overIndex)
                    }
                    suppressBrowserResizeObserver
                    columnDefs={columnDefs}
                    detailRowAutoHeight={true}
                    onSelectionChanged={(event) => {
                        setSelectedRows(gridApi.api.getSelectedRows());
                    }}
                    onRowDataUpdated={
                        newRowAdded ? onRowDataUpdated : undefined
                    }
                    onCellEditingStopped={(event) => {
                        update(event.rowIndex, event.data);
                    }}
                    getRowId={(row) => row.data[AG_GRID_ROW_UUID]}
                    {...props}
                ></AgGridReact>
            </Grid>
            <BottomRightButtons
                name={name}
                handleAddRow={handleAddRow}
                handleDeleteRows={handleDeleteRows}
                handleMoveRowDown={handleMoveRowDown}
                handleMoveRowUp={handleMoveRowUp}
                disableUp={noRowSelected || isFirstSelected}
                disableDown={noRowSelected || isLastSelected}
                disableDelete={noRowSelected}
                csvProps={csvProps}
                useFieldArrayOutput={useFieldArrayOutput}
            />
        </Grid>
    );
};

export default CustomAgGridTable;
