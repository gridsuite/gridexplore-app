import React, {
    forwardRef,
    useCallback,
    useEffect, useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react';
import { AgGridReact } from 'ag-grid-react';
import makeStyles from '@mui/styles/makeStyles';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import {Grid, Input, Tooltip} from '@mui/material';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/ControlPoint';
import DeleteIcon from '@mui/icons-material/Delete';
import {ArrowCircleDown, ArrowCircleUp, Upload} from '@mui/icons-material';
import {useTheme} from "@mui/styles";
import clsx from "clsx";
import CsvImportDialog from "../csv-import-dialog";
import {useIntl} from "react-intl";

const useStyles = makeStyles((theme) => ({
    grid: {
        width: 'auto',
        height: '100%',
        position: 'relative',
        marginLeft: theme.spacing(2),
        backgroundColor: 'red',

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
            height: 'inherit'
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
}));

const AggridTableForm = ({ name, equipmentType, rowData, setRowData, columnDefs, frameworkComponents }) => {
    const theme = useTheme();
    const classes = useStyles();
    const containerStyle = useMemo(
        () => ({ width: '100%', height: '200px' }),
        []
    );
    const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
    const [rowCount, setRowCount] = useState(0);
    const [upDisabled, setUpDisabled] = useState(false);
    const [downDisabled, setDownDisabled] = useState(false);
    const [uploaderOpen, setUploaderOpen] = useState(false)
    const intl =useIntl();
    const gridRef = useRef();
    //const [rowData, setRowData] = useState([]);
    //const [columnDefs, setColumnDefs] = useState();
    const defaultColDef = useMemo(
        () => ({
            sortable: true,
            flex: 1,
            resizable: true,
            editable: true,
            autoHeight: true,
        }),
        []
    );

    useEffect(() => {
        console.log('rows : ', rowData);
    }, [rowData]);

    const onGridReady = useCallback((params) => {
        gridRef.current = params;
    }, []);

    return (
        <Grid container style={containerStyle}>
            <Grid item style={gridStyle} className={clsx([theme.aggrid, classes.grid])} xs={12}>
                <AgGridReact
                    ref={gridRef}
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    onGridReady={onGridReady}
                    rowSelection={'multiple'}
                    suppressRowClickSelection={true}
                    rowDragManaged={true}
                    domLayout={'autoHeight'}
                    //suppressCellSelection={true}
                    singleClickEdit={true}
                    frameworkComponents={frameworkComponents}
                    onRowSelected={(event) => {
                        if (event.rowIndex === 0) {
                            setUpDisabled(event.node.selected);
                        }

                        if (event.rowIndex === rowCount - 1) {
                            setDownDisabled(event.node.selected);
                        }
                    }}
                    /*onCellEditingStopped={(event) => {
                        const rows = [];
                        gridRef.current.api.forEachNode((node) => {
                            rows.push(node?.data);
                        });
                        setRowData(rows);
                    }}*/
                    //detailRowAutoHeight={true}
                ></AgGridReact>
            </Grid>
            <Grid item container xs={12} justifyContent={'flex-end'}>
                <IconButton
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
                    onClick={() => {
                        gridRef.current.api.applyTransaction({ add: [{}] });
                        setRowCount((oldValues) => ++oldValues);
                    }}
                    className={classes.iconColor}
                >
                    <AddIcon />
                </IconButton>
                <IconButton
                    onClick={() => {
                        const selectedRows =
                            gridRef.current?.api.getSelectedRows();
                        gridRef.current.api.applyTransaction({
                            remove: selectedRows,
                        });
                        setRowCount(
                            (oldValues) => oldValues - selectedRows.length
                        );
                    }}
                    disabled={
                        gridRef.current?.api.getSelectedRows().length === 0
                    }
                    className={classes.iconColor}
                >
                    <DeleteIcon />
                </IconButton>
                <IconButton
                    key={'upButton'}
                    disabled={
                        upDisabled ||
                        gridRef.current?.api.getSelectedRows().length === 0
                    }
                    //onClick={() => {}}
                    className={classes.iconColor}
                >
                    <ArrowCircleUp />
                </IconButton>
                <IconButton
                    key={'downButton'}
                    disabled={
                        downDisabled ||
                        gridRef.current?.api.getSelectedRows().length === 0
                    }
                    className={classes.iconColor}
                >
                    <ArrowCircleDown />
                </IconButton>
            </Grid>
            <CsvImportDialog
                open={uploaderOpen}
                fileName={'fileTest'}
                fileHeaders={[
                    intl.formatMessage({ id: 'equipmentID' }),
                    intl.formatMessage({ id: 'distributionKey' }),
                ]}
                onClose={() => setUploaderOpen(false)}
                title={'title test'}
                tableValues={rowData}
                setRows={setRowData}
            />
        </Grid>
    );
};

export default AggridTableForm;
