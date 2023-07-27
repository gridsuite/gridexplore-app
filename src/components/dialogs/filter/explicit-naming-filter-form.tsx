import React, { useCallback, useMemo } from 'react';
import {
    EQUIPMENT_ID,
    EQUIPMENT_TYPE,
    FILTER_TYPE,
} from '../../utils/field-constants';
import yup from '../../utils/yup-config';
import CustomAgGridTable, {
    ROW_DRAGGING_SELECTION_COLUMN_DEF,
} from '../../utils/rhf-inputs/ag-grid-table-rhf/custom-ag-grid-table';
import { useIntl } from 'react-intl';
import { useWatch } from 'react-hook-form';
import { FILTER_EQUIPMENTS } from '../commons/criteria-based/criteria-based-utils';
import Grid from '@mui/material/Grid';
import SelectInput from '../../utils/rhf-inputs/select-inputs/select-input';
import { ValueParserParams } from 'ag-grid-community';
import { isFloatNumber, toFloatOrNullValue } from '../../utils/dialog-utils';
import { Generator, Load } from '../../../utils/equipment-types';
import { FilterType } from '../../../utils/elementType';

export const FILTER_EQUIPMENTS_ATTRIBUTES = 'filterEquipmentsAttributes';
export const DISTRIBUTION_KEY = 'distributionKey';

export const explicitNamingFilterSchema = {
    [FILTER_EQUIPMENTS_ATTRIBUTES]: yup
        .array()
        .of(
            yup.object().shape({
                [EQUIPMENT_ID]: yup.string().nullable(),
                [DISTRIBUTION_KEY]: yup.number().nullable(),
            })
        )
        // we remove empty lines
        .compact((row) => !row[DISTRIBUTION_KEY] && !row[EQUIPMENT_ID])
        .when([FILTER_TYPE], {
            is: FilterType.EXPLICIT_NAMING.id,
            then: (schema) =>
                schema
                    .min(1, 'emptyFilterError')
                    .test(
                        'noKeyWithoutId',
                        'distributionKeyWithMissingIdError',
                        (array) => {
                            return !array!.some((row) => !row[EQUIPMENT_ID]);
                        }
                    )
                    .test(
                        'ifOneKeyThenKeyEverywhere',
                        'missingDistributionKeyError',
                        (array) => {
                            return !(
                                array!.some((row) => row[DISTRIBUTION_KEY]) &&
                                array!.some((row) => !row[DISTRIBUTION_KEY])
                            );
                        }
                    ),
        }),
};

export const explicitNamingFilterEmptyFormData = {
    [FILTER_EQUIPMENTS_ATTRIBUTES]: [],
};

const defaultRowData = {
    [EQUIPMENT_ID]: null,
    [DISTRIBUTION_KEY]: null,
};

function ExplicitNamingFilterForm() {
    const intl = useIntl();

    const watchEquipmentType = useWatch({
        name: EQUIPMENT_TYPE,
    });

    const isGeneratorOrLoad =
        watchEquipmentType === Generator.type ||
        watchEquipmentType === Load.type;

    const columnDefs = useMemo(() => {
        const columnDefs: any[] = [
            ...ROW_DRAGGING_SELECTION_COLUMN_DEF,
            {
                headerName: intl.formatMessage({ id: EQUIPMENT_ID }),
                field: EQUIPMENT_ID,
                editable: true,
                singleClickEdit: true,
                valueParser: (params: ValueParserParams) =>
                    params.newValue?.trim() ?? null,
            },
        ];
        if (isGeneratorOrLoad) {
            columnDefs.push({
                headerName: intl.formatMessage({ id: DISTRIBUTION_KEY }),
                field: DISTRIBUTION_KEY,
                editable: true,
                singleClickEdit: true,
                valueParser: (params: ValueParserParams) => {
                    if (!isFloatNumber(params.newValue)) {
                        return params.oldValue;
                    } else {
                        return toFloatOrNullValue(params.newValue);
                    }
                },
                maxWidth: 200,
            });
        }
        return columnDefs;
    }, [intl, isGeneratorOrLoad]);

    const defaultColDef = useMemo(
        () => ({
            suppressMovable: true,
        }),
        []
    );

    const csvFileHeaders = useMemo(() => {
        const csvFileHeaders = [intl.formatMessage({ id: EQUIPMENT_ID })];
        if (isGeneratorOrLoad) {
            csvFileHeaders.push(intl.formatMessage({ id: DISTRIBUTION_KEY }));
        }
        return csvFileHeaders;
    }, [intl, isGeneratorOrLoad]);

    const getDataFromCsvFile = useCallback((csvData: any) => {
        if (csvData) {
            return csvData.map((value: any) => {
                return {
                    [EQUIPMENT_ID]: value[0]?.trim(),
                    [DISTRIBUTION_KEY]: value[1]?.trim(),
                };
            });
        } else {
            return [];
        }
    }, []);

    return (
        <Grid container spacing={1}>
            <Grid item xs={12}>
                <SelectInput
                    name={EQUIPMENT_TYPE}
                    options={Object.values(FILTER_EQUIPMENTS)}
                    label={'equipmentType'}
                />
            </Grid>
            {watchEquipmentType && (
                <Grid item xs={12}>
                    <CustomAgGridTable
                        name={FILTER_EQUIPMENTS_ATTRIBUTES}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        defaultRowData={defaultRowData}
                        defaultEmptyRowsNumber={3}
                        pagination={true}
                        paginationPageSize={100}
                        minNumberOfRows={3}
                        suppressRowClickSelection
                        alwaysShowVerticalScroll
                        csvProps={{
                            fileName: intl.formatMessage({
                                id: 'filterCsvFileName',
                            }),
                            fileHeaders: csvFileHeaders,
                            getDataFromCsv: getDataFromCsvFile,
                        }}
                    />
                </Grid>
            )}
        </Grid>
    );
}

export default ExplicitNamingFilterForm;
