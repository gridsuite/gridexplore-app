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
} from '../../../utils/field-constants';
import { useIntl } from 'react-intl';
import React, { useCallback, useMemo } from 'react';
import CustomAgGridTable, {
    ROW_DRAGGING_SELECTION_COLUMN_DEF,
} from '../../ag-grid-table-rhf/custom-ag-grid-table';
import chipsArrayEditor from '../../ag-grid-table-rhf/cell-editors/chips-array-editor';
import { gridItem } from '../../../utils/dialog-utils';

const suppressEnter = (params) => {
    const KEY_ENTER = 'Enter';
    const event = params.event;
    const key = event.key;
    if (key === KEY_ENTER) {
    }
    return key === KEY_ENTER;
};

const ExplicitNamingForm = () => {
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
                singleClickEdit: true,
                cellRenderer: chipsArrayEditor,
            },
        ];
    }, []);

    const fromCsvDataToFormValues = useCallback((results) => {
        return results.map((value, index) => {
            return {
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

    const equipmentTableField = (
        <CustomAgGridTable
            name={EQUIPMENT_TABLE}
            columnDefs={columnDefs}
            csvFileHeaders={csvFileHeaders}
            csvInitialData={csvInitialData}
            fromCsvDataToFormValues={fromCsvDataToFormValues}
            defaultRowData={{ [CONTINGENCY_NAME]: '', [EQUIPMENT_IDS]: [] }}
            minNumberOfRows={3}
            pagination={true}
            paginationPageSize={100}
        />
    );

    return <>{gridItem(equipmentTableField, 12)}</>;
};

export default ExplicitNamingForm;
