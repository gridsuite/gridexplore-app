import TextInput from '../../utils/text-input';
import {CONTINGENCY_NAME, EQUIPMENT_ID, EQUIPMENT_IDS, EQUIPMENT_TABLE, NAME} from '../../utils/field-constants';
import { FormattedMessage, useIntl } from 'react-intl';
import React, {useEffect, useMemo} from 'react';
import CustomAgGridTable, {ROW_DRAGGING_SELECTION_COLUMN_DEF} from '../ag-grid-table-rhf/custom-ag-grid-table';
import {Chip, Grid} from '@mui/material';
import chipsArrayEditor, {ChipsArray} from '../ag-grid-table-rhf/cell-editors/chips-array-editor';
import {useCallback} from "react";
import {gridItem} from "../../utils/dialog-utils";
import Box from "@mui/material/Box";
import {useWatch} from "react-hook-form";

const suppressEnter = (params) => {
    const KEY_ENTER = 'Enter';
    const event = params.event;
    const key = event.key;
    if (key === KEY_ENTER) {
    }
    return key === KEY_ENTER;
};

const ExplicitNamingContingencyListForm = ({}) => {
    const watchEquipmentId = useWatch({
        name: EQUIPMENT_ID,
    });

    const intl = useIntl();
    const columnDefs = useMemo(() => {
        return [
            ...ROW_DRAGGING_SELECTION_COLUMN_DEF,
            {
                field: CONTINGENCY_NAME,
                minWidth: 150,
                editable: true,
                singleClickEdit: true,
            },
            {
                field: EQUIPMENT_IDS,
                suppressKeyboardEvent: (params) => {
                    return suppressEnter(params);
                },
                autoHeight: true,
                wrapText: true,
                cellEditorPopup: true,
                cellEditorParams: {
                    cellHeight: 50,
                },
                singleClickEdit: true,
                cellRenderer: chipsArrayEditor,
            },
        ];
    }, []);

    const nameField = (
        <TextInput
            name={NAME}
            label={<FormattedMessage id="nameProperty" />}
            autoFocus
            margin="dense"
            type="text"
            style={{ width: '100%', flexGrow: 1 }}
        />
    );

    const formatCsvData = useCallback((results) => {
        const contingencyList = results.map((value, index) => {
            return {
                [CONTINGENCY_NAME]: value[0]?.trim() || '',
                [EQUIPMENT_IDS]:
                    value[1]
                        ?.split('|')
                        .map((n) => n.trim())
                        .filter((n) => n) || undefined,
            };
        });
        return contingencyList;
    }, [])

    const csvFileHeaders = useMemo(() => [
        intl.formatMessage({ id: 'elementName' }),
        intl.formatMessage({ id: 'equipments' }),
    ], []);

    const csvInitialData = useMemo(() => [
        [intl.formatMessage({ id: 'CSVFileCommentContingencyList1' })],
        [intl.formatMessage({ id: 'CSVFileCommentContingencyList2' })],
        [intl.formatMessage({ id: 'CSVFileCommentContingencyList3' })],
        [intl.formatMessage({ id: 'CSVFileCommentContingencyList4' })]
    ], []);

    const equipmentTableField = (
        <CustomAgGridTable
            name={EQUIPMENT_TABLE}
            columnDefs={columnDefs}
            csvFileHeaders={csvFileHeaders}
            csvInitialData={csvInitialData}
            formatCsvData={formatCsvData}
            defaultRowData={{ [CONTINGENCY_NAME]: '', [EQUIPMENT_IDS]:[] }}
            minNumberOfRows={3}
        />
    );

    return (
        <>
            <Grid container spacing={3}>
                {!watchEquipmentId && (
                    <Grid container item>
                        {gridItem(nameField, 12)}
                    </Grid>
                )}
                <Box maxWidth />
                <Grid container item>
                    {gridItem(equipmentTableField, 12)}
                </Grid>
            </Grid>
        </>
    )
};

export default ExplicitNamingContingencyListForm;
