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
import { AG_GRID_ROW_UUID } from "../../field-constants";

export const ROW_DRAGGING_SELECTION_COLUMN_DEF = [
    {
        rowDrag: true,
        maxWidth: 35,
    },
    {
        headerCheckboxSelection: true,
        checkboxSelection: true,
        maxWidth: 50,
    },
];

const style = {
    grid: (theme) => ({
        width: 'auto',
        height: '100%',
        position: 'relative',

        //overrides the default computed max heigt for ag grid default selector editor to make it more usable
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
        '& .ag-cell-edit-wrapper': {
            height: 'inherit',
        },
    }),
};

export const CustomAgGridTable = ({
    name,
    columnDefs,
    defaultRowData,
    csvProps,
    ...props
}) => {
    const theme = useTheme();
    const [gridApi, setGridApi] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);

    const { control, getValues, setValue } = useFormContext();
    const { append, remove, update, swap, move } = useFieldArray({
        control,
        name: name,
    });

    const getRowData = () => {
        // if the table has default values without rowUuid, we add it
        const rowWithoutUuid = getValues(name).some((r) => !r[AG_GRID_ROW_UUID]);
        if (rowWithoutUuid) {
            const rowsWithId = getValues(name).map((r) => {
                if (r[AG_GRID_ROW_UUID]) {
                    return r;
                }
                return {
                    agGridRowUuid: crypto.randomUUID(),
                    ...r,
                };
            });
            setValue(name, rowsWithId);
            return rowsWithId;
        }
        return getValues(name);
    };

    const isFirstSelected =
        getRowData() &&
        gridApi?.api?.getRowNode(getRowData()[0]?.agGridRowUuid)?.isSelected();

    const isLastSelected =
        getRowData() &&
        gridApi?.api
            ?.getRowNode(getRowData()[getRowData().length - 1]?.agGridRowUuid)
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
        selectedRows.forEach((val, index) => {
            const idx = getIndex(val);
            remove(idx);
        });
    };

    const handleAddRow = () => {
        append({
            agGridRowUuid: crypto.randomUUID(),
            ...defaultRowData,
        });
    };

    const getIndex = (val) => {
        return getRowData().findIndex((row) => row.agGridRowUuid === val.agGridRowUuid);
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

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} className={theme.aggrid} sx={style.grid}>
                <AgGridReact
                    rowData={getRowData()}
                    onGridReady={onGridReady}
                    getLocaleText={getLocaleText}
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
                    onCellEditingStopped={(event) => {
                        update(event.rowIndex, event.data);
                    }}
                    getRowId={(row) => row.data.agGridRowUuid}
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
            />
        </Grid>
    );
};

export default CustomAgGridTable;
