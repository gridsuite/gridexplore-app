/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useIntl } from 'react-intl';
import { useCallback, useMemo, useRef, useState } from 'react';
import { FieldValues, useFormContext, UseFieldArrayReturn } from 'react-hook-form';
import { v4 as uuid4 } from 'uuid';
import {
    CsvPicker,
    CustomAgGridTable,
    DescriptionField,
    ElementType,
    FieldConstants,
    hasNonEmptyRows,
    LANG_FRENCH,
    PARAM_LANGUAGE,
    UniqueNameInput,
} from '@gridsuite/commons-ui';
import { ColDef, SuppressKeyboardEventParams } from 'ag-grid-community';
import { Alert, Grid2 as Grid } from '@mui/material';
import { useSelector } from 'react-redux';
import ChipsArrayEditor from '../../../utils/rhf-inputs/ag-grid-table-rhf/cell-editors/chips-array-editor';
import { makeDefaultRowData } from '../contingency-list-utils';
import { AGGRID_LOCALES } from '../../../../translations/not-intl/aggrid-locales';
import { manageContingencyName } from './explicit-naming-utils';
import { useParameterState } from '../../use-parameters-dialog';
import { AppState } from '../../../../redux/types';

const suppressKeyboardEvent = (params: SuppressKeyboardEventParams) => {
    const { key } = params.event;
    return key === 'Enter' || key === 'ArrowLeft' || key === 'ArrowRight';
};

export default function ExplicitNamingForm() {
    const intl = useIntl();
    const activeDirectory = useSelector((state: AppState) => state.activeDirectory);
    const [languageLocal] = useParameterState(PARAM_LANGUAGE);
    const { getValues } = useFormContext();
    const tableRef = useRef<UseFieldArrayReturn<FieldValues, string>>(null);
    const [selectedFile, setSelectedFile] = useState<File | undefined>();
    const [fileErrorMessage, setFileErrorMessage] = useState<string | undefined>();
    const columnDefs = useMemo<ColDef[]>(
        () => [
            {
                headerName: intl.formatMessage({ id: 'equipments' }),
                field: FieldConstants.EQUIPMENT_IDS,
                suppressKeyboardEvent: (params: SuppressKeyboardEventParams) =>
                    // we suppress the keys that are used by cellRenderer
                    suppressKeyboardEvent(params),
                autoHeight: true,
                wrapText: true,
                cellRenderer: ChipsArrayEditor,
                cellRendererParams: {
                    name: FieldConstants.EQUIPMENT_TABLE,
                    sideActionCallback: manageContingencyName,
                },
                cellStyle: { padding: 0 },
            },
            {
                headerName: intl.formatMessage({ id: 'elementName' }),
                field: FieldConstants.CONTINGENCY_NAME,
                editable: true,
            },
        ],
        [intl]
    );

    const csvFileHeaders = useMemo(() => columnDefs.map((c) => c.headerName as string), [columnDefs]);

    const getDataFromCsvFile = useCallback(
        (csvData: Record<string, string>[]) => {
            const [equipmentsHeader, contingencyHeader] = csvFileHeaders;
            return csvData.map((row) => ({
                [FieldConstants.AG_GRID_ROW_UUID]: uuid4(),
                [FieldConstants.EQUIPMENT_IDS]:
                    row[equipmentsHeader]
                        ?.split('|')
                        .map((n) => n.trim())
                        .filter((n) => n) || undefined,
                [FieldConstants.CONTINGENCY_NAME]: row[contingencyHeader]?.trim() || '',
            }));
        },
        [csvFileHeaders]
    );

    const csvInitialData = useMemo(() => {
        const separator = languageLocal === LANG_FRENCH ? ';' : ',';
        return [
            [intl.formatMessage({ id: 'CSVFileCommentContingencyList1' })],
            intl.formatMessage({ id: 'CSVFileCommentContingencyList2' }).split(separator),
            intl.formatMessage({ id: 'CSVFileCommentContingencyList3' }).split(separator),
            intl.formatMessage({ id: 'CSVFileCommentContingencyList4' }).split(separator),
        ];
    }, [intl, languageLocal]);

    const defaultColDef = useMemo(
        () => ({
            flex: 1,
            suppressMovable: true,
            singleClickEdit: true,
        }),
        []
    );

    const hasExistingData = useCallback(() => hasNonEmptyRows(getValues(FieldConstants.EQUIPMENT_TABLE)), [getValues]);

    const getTemplateData = useCallback(() => [csvFileHeaders, ...csvInitialData], [csvFileHeaders, csvInitialData]);

    const getTableData = useCallback(() => {
        const rows = (getValues(FieldConstants.EQUIPMENT_TABLE) ?? []) as Record<string, any>[];
        return [
            csvFileHeaders,
            ...rows.map((r) => [
                (r[FieldConstants.EQUIPMENT_IDS] ?? []).join('|'),
                r[FieldConstants.CONTINGENCY_NAME] ?? '',
            ]),
        ];
    }, [csvFileHeaders, getValues]);

    return (
        <Grid container direction="column" spacing={2} sx={{ flexGrow: 1, flexWrap: 'nowrap', minHeight: 0 }}>
            <Grid>
                <UniqueNameInput
                    name={FieldConstants.NAME}
                    label="nameProperty"
                    elementType={ElementType.CONTINGENCY_LIST}
                    activeDirectory={activeDirectory}
                />
            </Grid>
            <Grid container justifyContent="space-between" alignItems="center">
                <Grid>
                    <DescriptionField />
                </Grid>
                <Grid>
                    <CsvPicker<Record<string, string>>
                        label="UploadCSV"
                        header={csvFileHeaders}
                        language={languageLocal}
                        selectedFile={selectedFile}
                        onFileChange={setSelectedFile}
                        onFileError={setFileErrorMessage}
                        hasExistingData={hasExistingData}
                        onAppend={(results) => tableRef.current?.append(getDataFromCsvFile(results.data))}
                        onReplace={(results) => tableRef.current?.replace(getDataFromCsvFile(results.data))}
                    />
                </Grid>
            </Grid>
            {fileErrorMessage && (
                <Grid>
                    <Alert severity="error">{fileErrorMessage}</Alert>
                </Grid>
            )}
            <Grid sx={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <CustomAgGridTable
                    ref={tableRef}
                    name={FieldConstants.EQUIPMENT_TABLE}
                    columnDefs={columnDefs}
                    makeDefaultRowData={makeDefaultRowData}
                    pagination
                    rowSelection={{
                        mode: 'multiRow',
                        enableClickSelection: false,
                        checkboxes: true,
                        headerCheckbox: true,
                    }}
                    defaultColDef={defaultColDef}
                    alwaysShowVerticalScroll
                    overrideLocales={AGGRID_LOCALES}
                    csvProps={{
                        fileName: intl.formatMessage({ id: 'contingencyListCreation' }),
                        language: languageLocal,
                        getTemplateData,
                        getTableData,
                    }}
                />
            </Grid>
        </Grid>
    );
}
