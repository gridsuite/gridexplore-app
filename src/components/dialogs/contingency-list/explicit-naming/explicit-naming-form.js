/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
    CONTINGENCY_NAME,
    EQUIPMENT_IDS,
    EQUIPMENT_TABLE,
    ROW_UUID,
} from '../../../utils/field-constants';
import { FormattedMessage, useIntl } from 'react-intl';
import React, { useCallback, useMemo } from 'react';
import CustomAgGridTable, {
    ROW_DRAGGING_SELECTION_COLUMN_DEF,
} from '../../../utils/rhf-inputs/ag-grid-table-rhf/custom-ag-grid-table';
import { gridItem } from '../../../utils/dialog-utils';
import yup from '../../../utils/yup-config';
import { Grid } from '@mui/material';
import Alert from '@mui/material/Alert';
import { DEFAULT_ROW_VALUE } from '../contingency-list-utils';
import ChipsArrayEditor from '../../../utils/rhf-inputs/ag-grid-table-rhf/cell-editors/chips-array-editor';

export const getExplicitNamingSchema = (id) => ({
    [id]: yup.array().of(
        yup.object().shape({
            [CONTINGENCY_NAME]: yup.string().nullable(),
            [EQUIPMENT_IDS]: yup.array().of(yup.string().nullable()),
        })
    ),
});
const suppressEnter = (params) => {
    const KEY_ENTER = 'Enter';
    const event = params.event;
    const key = event.key;
    return key === KEY_ENTER;
};

const ExplicitNamingForm = () => {
    const intl = useIntl();
    const columnDefs = useMemo(() => {
        return [
            ...ROW_DRAGGING_SELECTION_COLUMN_DEF,
            {
                headerName: intl.formatMessage({ id: 'elementName' }),
                field: CONTINGENCY_NAME,
                editable: true,
                singleClickEdit: true,
            },
            {
                headerName: intl.formatMessage({ id: 'equipments' }),
                field: EQUIPMENT_IDS,
                suppressKeyboardEvent: (params) => {
                    return suppressEnter(params);
                },
                autoHeight: true,
                wrapText: true,
                singleClickEdit: true,
                cellRenderer: ChipsArrayEditor,
                cellRendererParams: {
                    name: EQUIPMENT_TABLE,
                },
            },
        ];
    }, [intl]);

    const fromCsvDataToFormValues = useCallback((results) => {
        return results.map((value, index) => {
            return {
                [ROW_UUID]: 'csv_row_' + index,
                [CONTINGENCY_NAME]: value[0]?.trim() || '',
                [EQUIPMENT_IDS]:
                    value[1]
                        ?.split('|')
                        .map((n) => n.trim())
                        .filter((n) => n) || undefined,
            };
        });
    }, []);

    const csvFileHeaders = useMemo(
        () => [
            intl.formatMessage({ id: 'elementName' }),
            intl.formatMessage({ id: 'equipments' }),
        ],
        [intl]
    );

    const csvInitialData = useMemo(
        () => [
            [intl.formatMessage({ id: 'CSVFileCommentContingencyList1' })],
            [intl.formatMessage({ id: 'CSVFileCommentContingencyList2' })],
            [intl.formatMessage({ id: 'CSVFileCommentContingencyList3' })],
            [intl.formatMessage({ id: 'CSVFileCommentContingencyList4' })],
        ],
        [intl]
    );

    const defaultColDef = useMemo(
        () => ({
            flex: 1,
            suppressMovable: true,
        }),
        []
    );

    const equipmentTableField = (
        <CustomAgGridTable
            name={EQUIPMENT_TABLE}
            columnDefs={columnDefs}
            defaultRowData={DEFAULT_ROW_VALUE}
            pagination={true}
            paginationPageSize={100}
            suppressRowClickSelection
            defaultColDef={defaultColDef}
            alwaysShowVerticalScroll
            csvProps={{
                fileName: intl.formatMessage({ id: 'contingencyListCreation' }),
                fileHeaders: csvFileHeaders,
                formatCsvData: fromCsvDataToFormValues,
                csvData: csvInitialData,
            }}
        />
    );

    return (
        <>
            <Grid item xs={12}>
                <Alert severity={'warning'}>
                    <FormattedMessage id={'temporaryContingencyWarning'} />
                </Alert>
            </Grid>
            {gridItem(equipmentTableField, 12)}
        </>
    );
};

export default ExplicitNamingForm;
