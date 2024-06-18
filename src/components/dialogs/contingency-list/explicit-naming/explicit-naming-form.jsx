/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useIntl } from 'react-intl';
import React, { useCallback, useMemo } from 'react';
import yup from '../../../utils/yup-config';
import { makeDefaultRowData } from '../contingency-list-utils';
import ChipsArrayEditor from '../../../utils/rhf-inputs/ag-grid-table-rhf/cell-editors/chips-array-editor';
import { ContingencyListType } from 'utils/elementType';
import { v4 as uuid4 } from 'uuid';
import {
    FieldConstants,
    gridItem,
    CustomAgGridTable,
    ROW_DRAGGING_SELECTION_COLUMN_DEF,
} from '@gridsuite/commons-ui';
import { RECORD_SEP, UNIT_SEP } from 'papaparse';

export const getExplicitNamingSchema = (id) => {
    return {
        [id]: yup
            .array()
            .of(
                yup.object().shape({
                    [FieldConstants.CONTINGENCY_NAME]: yup.string().nullable(),
                    [FieldConstants.EQUIPMENT_IDS]: yup
                        .array()
                        .of(yup.string().nullable()),
                })
            )
            // we remove empty lines
            .compact(
                (row) =>
                    !row[FieldConstants.CONTINGENCY_NAME] &&
                    !row[FieldConstants.EQUIPMENT_IDS]?.length
            )
            .when([FieldConstants.CONTINGENCY_LIST_TYPE], {
                is: ContingencyListType.EXPLICIT_NAMING.id,
                then: (schema) => getExplicitNamingConditionSchema(schema),
            }),
    };
};

export const getExplicitNamingEditSchema = (id) => {
    const schema = yup
        .array()
        .of(
            yup.object().shape({
                [FieldConstants.CONTINGENCY_NAME]: yup.string().nullable(),
                [FieldConstants.EQUIPMENT_IDS]: yup
                    .array()
                    .of(yup.string().nullable()),
            })
        ) // we remove empty lines
        .compact(
            (row) =>
                !row[FieldConstants.CONTINGENCY_NAME] &&
                !row[FieldConstants.EQUIPMENT_IDS]?.length
        );

    return {
        [id]: getExplicitNamingConditionSchema(schema),
    };
};

const getExplicitNamingConditionSchema = (schema) => {
    return schema
        .min(1, 'contingencyTableContainAtLeastOneRowError')
        .test(
            'rowWithoutName',
            'contingencyTablePartiallyDefinedError',
            (array) => {
                return !array.some(
                    (row) => !row[FieldConstants.CONTINGENCY_NAME]?.trim()
                );
            }
        )
        .test(
            'rowWithoutEquipments',
            'contingencyTablePartiallyDefinedError',
            (array) => {
                return !array.some(
                    (row) => !row[FieldConstants.EQUIPMENT_IDS]?.length
                );
            }
        );
};

const suppressKeyboardEvent = (params) => {
    const key = params.event.key;
    return key === 'Enter' || key === 'ArrowLeft' || key === 'ArrowRight';
};

const ExplicitNamingForm = () => {
    const intl = useIntl();
    const columnDefs = useMemo(() => {
        return [
            ...ROW_DRAGGING_SELECTION_COLUMN_DEF,
            {
                headerName: intl.formatMessage({ id: 'elementName' }),
                field: FieldConstants.CONTINGENCY_NAME,
                editable: true,
                singleClickEdit: true,
            },
            {
                headerName: intl.formatMessage({ id: 'equipments' }),
                field: FieldConstants.EQUIPMENT_IDS,
                suppressKeyboardEvent: (params) =>
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
            },
        ];
    }, [intl]);

    const getDataFromCsvFile = useCallback((csvData) => {
        if (csvData) {
            return csvData.map((value) => {
                return {
                    [FieldConstants.AG_GRID_ROW_UUID]: uuid4(),
                    [FieldConstants.CONTINGENCY_NAME]: value[0]?.trim() || '',
                    [FieldConstants.EQUIPMENT_IDS]:
                        value[1]
                            ?.split('|')
                            .map((n) => n.trim())
                            .filter((n) => n) || undefined,
                };
            });
        }
        return [];
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
            name={FieldConstants.EQUIPMENT_TABLE}
            columnDefs={columnDefs}
            makeDefaultRowData={makeDefaultRowData}
            pagination={true}
            paginationPageSize={100}
            suppressRowClickSelection
            defaultColDef={defaultColDef}
            alwaysShowVerticalScroll
            stopEditingWhenCellsLoseFocus
            csvProps={{
                fileName: intl.formatMessage({ id: 'contingencyListCreation' }),
                fileHeaders: csvFileHeaders,
                getDataFromCsv: getDataFromCsvFile,
                csvData: csvInitialData,
                config: {
                    delimitersToGuess: [',', '	', ';', RECORD_SEP, UNIT_SEP],
                },
            }}
        />
    );

    return gridItem(equipmentTableField, 12);
};

export default ExplicitNamingForm;
