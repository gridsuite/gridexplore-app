import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import * as Yup from 'yup';
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

const validationSchema = Yup.object().shape({
    rows: Yup.array().of(
        Yup.object().shape({
            // Add validation rules for your row fields
            name: Yup.string().required('Name is required'),
        })
    ),
});

const useStyles = makeStyles((theme) => ({
    grid: {
        width: 'auto',
        height: '100%',
        position: 'relative',
        marginLeft: theme.spacing(2),

        '& .ag-selected-row':  {
            backgroundColor: 'red',
        },
        '& .ag-header-container': {
            backgroundColor: theme.agGridBackground.color,
        },
        '& .ag-body': {
            backgroundColor: theme.agGridBackground.color,
        },
        '& .ag-row-even': {
            backgroundColor: theme.agGridBackground.color,
        },
        '& .ag-checkbox-input-wrapper': {
            backgroundColor: theme.agGridBackground.color,
        },
        '& .ag-cell-edit-wrapper': {
            height: 'inherit',
        },
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
    initialRowData,
    formatCsvData,
    csvFileHeaders,
    csvInitialData,
}) => {
    const classes = useStyles();
    const [gridApi, setGridApi] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);
    const [uploaderOpen, setUploaderOpen] = useState(false);
    const [rowData, setRowData] = useState([]);
    const { control } = useFormContext();
    const [upDisabled, setUpDisabled] = useState(false);
    const [downDisabled, setDownDisabled] = useState(false);
    const intl = useIntl();
    const { getValues } = useFormContext();
    const { fields, append, remove, move, update } = useFieldArray({
        control,
        name: name,
    });

    useEffect(() => {
        console.log('fields values : ', getValues(name));
        setRowData(getValues(name));
    }, [fields, getValues]);

    const handleAddRow = () => {
        console.log('initialRowData : ', initialRowData);
        append(initialRowData);
    };

    const handleDeleteRow = () => {
        console.log('selectedRows  : ', selectedRows)
        selectedRows.forEach((val, index) => remove(rowData.indexOf(val)));
    };

    const handleMoveRowUp = () => {
        selectedRows.forEach((val, index) => {
            move(index, index - 1);
        });
    };

    const handleMoveRowDown = () => {
        selectedRows.forEach((val, index) => move(index, index + 1));
    };

    const defaultColDef = useMemo(
        () => ({
            flex: 1,
        }),
        []
    );

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

    useEffect(() => {
        console.log(rowData, rowData);
    }, [rowData])

    return (
        <>
            <Grid
                className="ag-theme-alpine"
                style={{ height: '100%', width: '100%' }}
            >
                <AgGridReact
                    rowData={rowData}
                    onGridReady={(params) => {
                        params.api.sizeColumnsToFit();
                        setGridApi(params);
                    }}
                    defaultColDef={defaultColDef}
                    rowSelection={'multiple'}
                    domLayout="autoHeight"
                    rowDragEntireRow
                    rowDragManaged
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
                ></AgGridReact>
            </Grid>
            <Grid item container xs={12} justifyContent={'flex-end'}>
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
                    onClick={handleDeleteRow}
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
            <ErrorInput name={name} />
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
        </>
    );
};

export default CustomAgGridTable;
