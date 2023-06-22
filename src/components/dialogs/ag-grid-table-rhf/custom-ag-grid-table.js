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
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/ControlPoint';
import DeleteIcon from '@mui/icons-material/Delete';
import { ArrowCircleDown, ArrowCircleUp, Upload } from '@mui/icons-material';
import { Grid, Tooltip } from '@mui/material';
import { useIntl } from 'react-intl';
import CsvUploader from './csv-uploader/csv-uploader';
import makeStyles from '@mui/styles/makeStyles';
import ErrorInput from '../../utils/error-input';
import clsx from 'clsx';
import { useTheme } from '@mui/styles';

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

const useStyles = makeStyles((theme) => ({
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
        '& .ag-layout-auto-height': {
            //height: '250px'
            //height: '300px',
        },
    },
    iconColor: {
        color: theme.palette.primary.main,
        justifyContent: 'flex-end',
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
    ...props
}) => {
    const classes = useStyles();
    const theme = useTheme();
    const [gridApi, setGridApi] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);
    const [uploaderOpen, setUploaderOpen] = useState(false);
    const { control } = useFormContext();
    const [upDisabled, setUpDisabled] = useState(false);
    const [downDisabled, setDownDisabled] = useState(false);
    const intl = useIntl();
    const { getValues, setValue } = useFormContext();

    const { fields, append, remove, move, update } = useFieldArray({
        control,
        name: name,
    });

    // we add the unique generated id from react hook form to each row, so we can use it in getRowId
    // the unique id used to identify the selected rows, so we can keep the selection when row index is changed.
    useEffect(() => {
        const newRows = fields.map((value, index) => {
            return { rowUuid: value.id, ...getValues(name)[index] };
        });
        setValue(name, newRows);
    }, [fields, getValues, name]);

    const handleAddRow = () => {
        append(defaultRowData);
    };

    const handleDeleteRows = () => {
        selectedRows.forEach((val, index) => {
            setSelectedRows(gridApi.api.getSelectedRows());
            const rows = getValues(name);
            const idx = rows.findIndex((obj) => {
                for (let key in val) {
                    if (obj[key] !== val[key]) {
                        return false;
                    }
                }
                return true;
            });
            remove(idx);
        });
    };

    const getIndex = (val) => {
        return getValues(name).findIndex((row) => row.rowUuid === val.rowUuid);
    };

    const handleMoveRowUp = () => {
        selectedRows
            .map((row) => getIndex(row))
            .sort()
            .forEach((idx) => {
                move(idx, idx - 1);
                if (idx === 1) {
                    setUpDisabled(true);
                }
                if (idx === fields.length - 1) {
                    setDownDisabled(false);
                }
            });
    };

    const handleMoveRowDown = () => {
        selectedRows
            .map((row) => getIndex(row))
            .sort()
            .reverse()
            .forEach((idx) => {
                move(idx, idx + 1);
                if (idx === fields.length - 2) {
                    setDownDisabled(true);
                }

                if (idx === 0) {
                    setUpDisabled(false);
                }
            });
    };

    const defaultColDef = useMemo(
        () => ({
            flex: 1,
        }),
        []
    );

    useEffect(() => {
        if (gridApi) {
            gridApi.api.sizeColumnsToFit();
        }
    }, [columnDefs, gridApi]);

    const updateButtonsState = useCallback(
        (event) => {
            if (event.rowIndex === 0) {
                setUpDisabled(event.node.selected);
            }

            if (event.rowIndex === fields.length - 1) {
                setDownDisabled(event.node.selected);
            }
        },
        [fields]
    );

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} className={clsx([theme.aggrid, classes.grid])}>
                <AgGridReact
                    rowData={getValues(name)}
                    onGridReady={(params) => {
                        params.api.sizeColumnsToFit();
                        setGridApi(params);
                    }}
                    defaultColDef={defaultColDef}
                    rowSelection={'multiple'}
                    domLayout={'autoHeight'}
                    rowDragEntireRow
                    rowDragManaged
                    suppressRowClickSelection
                    suppressBrowserResizeObserver
                    columnDefs={columnDefs}
                    detailRowAutoHeight={true}
                    onSelectionChanged={(event) => {
                        updateButtonsState(event);
                        setSelectedRows(gridApi.api.getSelectedRows());
                    }}
                    onRowSelected={(event) => {
                        updateButtonsState(event);
                    }}
                    onCellEditingStopped={(event) => {
                        update(event.rowIndex, event.data);
                    }}
                    getRowId={(row) => row.data.rowUuid}
                    {...props}
                ></AgGridReact>
            </Grid>
            <Grid
                item
                xs={12}
                textAlign={'end'}
                justifyContent={'flex-end'}
                position={'sticky'}
            >
                <IconButton
                    className={classes.iconColor}
                    onClick={() => setUploaderOpen(true)}
                >
                    <Tooltip
                        title={intl.formatMessage({
                            id: 'ImportCSV',
                        })}
                        placement="bottom"
                    >
                        <Upload />
                    </Tooltip>
                </IconButton>
                <IconButton
                    key={'addButton'}
                    onClick={handleAddRow}
                    className={classes.iconColor}
                >
                    <AddIcon />
                </IconButton>
                <IconButton
                    key={'DeleteButton'}
                    onClick={handleDeleteRows}
                    disabled={selectedRows.length === 0}
                    className={classes.iconColor}
                >
                    <DeleteIcon />
                </IconButton>
                <IconButton
                    key={'upButton'}
                    disabled={upDisabled || selectedRows.length === 0}
                    onClick={handleMoveRowUp}
                    className={classes.iconColor}
                >
                    <ArrowCircleUp />
                </IconButton>
                <IconButton
                    key={'downButton'}
                    disabled={downDisabled || selectedRows.length === 0}
                    className={classes.iconColor}
                    onClick={handleMoveRowDown}
                >
                    <ArrowCircleDown />
                </IconButton>
            </Grid>
            <Grid item xs={12}>
                <ErrorInput name={name} />
            </Grid>
            <CsvUploader
                open={uploaderOpen}
                fileName={'fileTest'}
                fileHeaders={csvFileHeaders}
                onClose={() => setUploaderOpen(false)}
                title={'title test'}
                name={name}
                tableValues={fields}
                formatCsvData={fromCsvDataToFormValues}
                csvData={csvInitialData}
            />
        </Grid>
    );
};

export default CustomAgGridTable;
