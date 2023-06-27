/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Grid } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useTheme } from '@mui/styles';
import BottomRightButtons from './bottom-right-buttons';
import { useIntl } from 'react-intl';

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

const useStyles = makeStyles()((theme, _params, classes) => ({
    grid: {
        width: 'auto',
        height: '100%',
        position: 'relative',

        //overrides the default computed max heigt for ag grid default selector editor to make it more usable
        //can be removed if a custom selector editor is implemented
        '& .ag-select-list': {
            maxHeight: '300px !important',
        },

        //allows to hide the scrollbar in the pinned rows section as it is unecessary to our implementation
        '& .ag-body-horizontal-scroll:not(.ag-scrollbar-invisible) .ag-horizontal-left-spacer:not(.ag-scroller-corner)':
            {
                visibility: 'hidden',
            },
        '& .ag-body-horizontal-scroll-viewport': {
            visibility: 'hidden',
        },

        // hides right border for header of "Edit" column due to column being pinned

        '& .ag-header-container': {
            backgroundColor: theme.agGridBackground.color,
        },
        '& .ag-body': {
            backgroundColor: theme.agGridBackground.color,
            //overflowY: 'scroll',
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
    },
}));

export const CustomAgGridTable = ({
    name,
    columnDefs,
    defaultRowData,
    fromCsvDataToFormValues, // this used to transform rows from csv file, to data can be displayed in the table
    csvFileHeaders,
    csvInitialData, // this is used if csv file generated has some row by default (comments for example)
    getRowID, // this used by Ag Grid to get the id of each row
    csvProps,
    defaultRowsNumber = 0,
    ...props
}) => {
    const { classes, cx } = useStyles();
    const theme = useTheme();
    const [gridApi, setGridApi] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);

    const { control, getValues } = useFormContext();
    const { append, remove, update, swap, move } = useFieldArray({
        control,
        name: name,
    });

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
            rowUuid: crypto.randomUUID(),
            ...defaultRowData,
        });
    };

    const getIndex = (val) => {
        return getValues(name).findIndex((row) => row.rowUuid === val.rowUuid);
    };

    const defaultColDef = useMemo(
        () => ({
            flex: 1,
            suppressMovable: true,
        }),
        []
    );

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

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} className={cx([theme.aggrid, classes.grid])}>
                <AgGridReact
                    rowData={getValues(name)}
                    onGridReady={(params) => {
                        setGridApi(params);
                        params.api.sizeColumnsToFit();
                    }}
                    getLocaleText={getLocaleText}
                    defaultColDef={defaultColDef}
                    oncelled
                    rowSelection={'multiple'}
                    domLayout={'autoHeight'}
                    rowDragEntireRow
                    rowDragManaged
                    onRowDragEnd={(e) =>
                        move(getIndex(e.node.data), e.overIndex)
                    }
                    suppressRowClickSelection
                    suppressBrowserResizeObserver
                    columnDefs={columnDefs}
                    detailRowAutoHeight={true}
                    onSelectionChanged={(event) => {
                        setSelectedRows(gridApi.api.getSelectedRows());
                    }}
                    onCellEditingStopped={(event) => {
                        update(event.rowIndex, event.data);
                    }}
                    getRowId={(row) => {
                        return row.data.rowUuid;
                    }}
                    {...props}
                ></AgGridReact>
            </Grid>
            <BottomRightButtons
                name={name}
                rowData={getValues(name)}
                gridApi={gridApi}
                selectedRows={selectedRows}
                handleAddRow={handleAddRow}
                handleDeleteRows={handleDeleteRows}
                handleMoveRowDown={handleMoveRowDown}
                handleMoveRowUp={handleMoveRowUp}
                csvProps={csvProps}
            />
        </Grid>
    );
};

export default CustomAgGridTable;
