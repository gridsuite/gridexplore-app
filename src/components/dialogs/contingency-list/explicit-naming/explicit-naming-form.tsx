/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useIntl } from 'react-intl';
import { useCallback, useMemo } from 'react';
import { v4 as uuid4 } from 'uuid';
import { CustomAgGridTable, FieldConstants } from '@gridsuite/commons-ui';
import { ColDef, SuppressKeyboardEventParams } from 'ag-grid-community';
import ChipsArrayEditor from '../../../utils/rhf-inputs/ag-grid-table-rhf/cell-editors/chips-array-editor';
import { makeDefaultRowData } from '../contingency-list-utils';

const suppressKeyboardEvent = (params: SuppressKeyboardEventParams) => {
    const { key } = params.event;
    return key === 'Enter' || key === 'ArrowLeft' || key === 'ArrowRight';
};

export default function ExplicitNamingForm() {
    const intl = useIntl();
    const columnDefs = useMemo<ColDef[]>(
        () => [
            {
                headerName: intl.formatMessage({ id: 'elementName' }),
                field: FieldConstants.CONTINGENCY_NAME,
                editable: true,
                rowDrag: true,
                singleClickEdit: true,
                flex: 1,
            },
            {
                headerName: intl.formatMessage({ id: 'equipments' }),
                field: FieldConstants.EQUIPMENT_IDS,
                suppressKeyboardEvent: (params: SuppressKeyboardEventParams) =>
                    // we suppress the keys that are used by cellRenderer
                    suppressKeyboardEvent(params),
                autoHeight: true,
                wrapText: true,
                singleClickEdit: true,
                cellRenderer: ChipsArrayEditor,
                cellRendererParams: {
                    name: FieldConstants.EQUIPMENT_TABLE,
                },
                cellStyle: { padding: 0 },
                flex: 1,
            },
        ],
        [intl]
    );

    const getDataFromCsvFile = useCallback((csvData: string[][]) => {
        if (csvData) {
            return csvData.map((value) => ({
                [FieldConstants.AG_GRID_ROW_UUID]: uuid4(),
                [FieldConstants.CONTINGENCY_NAME]: value[0]?.trim() || '',
                [FieldConstants.EQUIPMENT_IDS]:
                    value[1]
                        ?.split('|')
                        .map((n) => n.trim())
                        .filter((n) => n) || undefined,
            }));
        }
        return [];
    }, []);

    const csvFileHeaders = useMemo(
        () => [intl.formatMessage({ id: 'elementName' }), intl.formatMessage({ id: 'equipments' })],
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

    return (
        <CustomAgGridTable
            name={FieldConstants.EQUIPMENT_TABLE}
            columnDefs={columnDefs}
            makeDefaultRowData={makeDefaultRowData}
            pagination
            paginationPageSize={100}
            rowSelection={{
                mode: 'multiRow',
                enableClickSelection: false,
                checkboxes: true,
                headerCheckbox: true,
            }}
            defaultColDef={defaultColDef}
            alwaysShowVerticalScroll
            stopEditingWhenCellsLoseFocus
            csvProps={{
                fileName: intl.formatMessage({ id: 'contingencyListCreation' }),
                fileHeaders: csvFileHeaders,
                getDataFromCsv: getDataFromCsvFile,
                csvData: csvInitialData,
            }}
            cssProps={{
                padding: 1,
                '& .ag-root-wrapper-body': {
                    maxHeight: 'unset',
                },
            }}
        />
    );
}
