import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useFieldArray, useFormContext} from 'react-hook-form';
import {AgGridReact} from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/ControlPoint';
import DeleteIcon from '@mui/icons-material/Delete';
import {ArrowCircleDown, ArrowCircleUp, Upload} from '@mui/icons-material';
import {Grid, Tooltip} from '@mui/material';
import {useIntl} from 'react-intl';
import CsvUploader from './csv-uploader/csv-uploader';
import makeStyles from '@mui/styles/makeStyles';
import ErrorInput from '../../utils/error-input';
import clsx from "clsx";
import {useTheme} from "@mui/styles";

export const ROW_DRAGGING_SELECTION_COLUMN_DEF = [
    {
        rowDrag: true,
        maxWidth:35
    },
    {
        headerCheckboxSelection: true,
        checkboxSelection: true,
        maxWidth:50
    },
]

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

        // hides right border for header of "Edit" column due to column being pinned

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
            //border: 'none'
        },
    },
    iconColor: {
        color: theme.palette.primary.main,
        justifyContent: 'flex-end',
    },
    selectedRow: {
        backgroundColor: 'red',
    },
}));

export const CustomAgGridTable = ({
    name,
    columnDefs,
    defaultRowData,
    formatCsvData,
    csvFileHeaders,
    csvInitialData,
    minNumberOfRows = 0,
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
    const { getValues, setValue, } = useFormContext();
    const { fields, append, remove, move, update } = useFieldArray({
        control,
        name: name,
    });

    useEffect(() => {
        setRowData(getValues(name));
    }, [fields, getValues])
    const [rowData, setRowData] = useState(getValues(name) ?? []);

    const handleAddRow = () => {
        append(defaultRowData);
        setRowData(getValues(name))
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
            } )
            if (rows.length === minNumberOfRows) {
                update(idx, defaultRowData)
            }
            else {
                remove(idx)
            }
        });
        setRowData(getValues(name));
    };

    const handleMoveRowUp = () => {
        selectedRows.forEach((val, index) => {
            const rows = getValues(name);
            const idx = rows.findIndex((obj) => {
                for (let key in val) {
                    if (obj[key] !== val[key]) {
                        return false;
                    }
                }
                return true;
            } )
            move(idx, idx - 1);
        });
        setRowData(getValues(name))
    };

    const handleMoveRowDown = () => {
        selectedRows.forEach((val, index) => {
            const rows = getValues(name);
            const idx = rows.findIndex((obj) => {
                for (let key in val) {
                    if (obj[key] !== val[key]) {
                        return false;
                    }
                }
                return true;
            } )
            move(idx, idx + 1);
        });
        setRowData(getValues(name))
    };

    const defaultColDef = useMemo(
        () => ({
            flex: 1,
        }),
        []
    );

    useEffect(() => {
        if (gridApi) {
            //gridApi.api.setColumnDefs(columnDefs);
            gridApi.api.sizeColumnsToFit();
        }
    }, [columnDefs])

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
            <Grid
                item
                xs={12}
                className={clsx([theme.aggrid, classes.grid])}
            >
                <AgGridReact
                    rowData={rowData}
                    onGridReady={(params) => {
                        params.api.setDomLayout('autoHeight');
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
                    pagination={true}
                    paginationPageSize={100}
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
                    //onCellValueChanged={onCellValueChanged}
                ></AgGridReact>
            </Grid>
            <Grid item xs={12} textAlign={'end'} justifyContent={'flex-end'} position={'sticky'}>
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
                <ErrorInput name={name}/>
            </Grid>
            <CsvUploader
                open={uploaderOpen}
                fileName={'fileTest'}
                fileHeaders={csvFileHeaders}
                onClose={() => setUploaderOpen(false)}
                title={'title test'}
                name={name}
                tableValues={fields}
                formatCsvData={formatCsvData}
                csvData={csvInitialData}
            />
        </Grid>
    );
};

export default CustomAgGridTable;
