import TextInput from '../../utils/text-input';
import {DISTRIBUTION_KEY, EQUIPMENT_ID, EQUIPMENT_TABLE, EQUIPMENT_TYPE, NAME,} from '../../utils/field-constants';
import {FormattedMessage, useIntl} from 'react-intl';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {filterEquipmentDefinition} from '../../../utils/equipment-types';
import SelectInput from '../../utils/select-input';
import {useFormContext, useWatch} from 'react-hook-form';
import {Grid} from '@mui/material';
import {gridItem} from '../../utils/dialog-utils';
import Box from '@mui/material/Box';
import CustomAgGridTable, {ROW_DRAGGING_SELECTION_COLUMN_DEF} from '../ag-grid-table-rhf/custom-ag-grid-table';
import {renderPopup} from '../create-filter-dialog';
import {DEFAULT_EQUIPMENT_TABLE_ROWS} from "./explicit-naming-filter-dialog";
import NumberEditor from "../ag-grid-table-rhf/cell-editors/number-editors";

const ExplicitNamingFilterForm = ({ defaultEquipmentType }) => {
    const intl = useIntl();
    const [isConfirmationPopupOpen, setIsConfirmationPopupOpen] =
        useState(false);
    const watchEquipmentType = useWatch({
        name: EQUIPMENT_TYPE,
    });

    const watchEquipmentId = useWatch({
        name: EQUIPMENT_ID,
    });

    const watchEquipmentTable = useWatch({
        name: EQUIPMENT_TABLE,
    });

    const { setValue } = useFormContext();
    useEffect(() => {
        const isTableEmpty = watchEquipmentTable.every((el, i) => {
            return !el[EQUIPMENT_ID] && !el[DISTRIBUTION_KEY]
        })
        if (
            watchEquipmentType &&
            watchEquipmentType !== defaultEquipmentType &&
            !isTableEmpty
        ) {
            setIsConfirmationPopupOpen(true);
        } else if (watchEquipmentType !== defaultEquipmentType) {
            setValue(EQUIPMENT_TABLE, DEFAULT_EQUIPMENT_TABLE_ROWS);
        }
    }, [watchEquipmentType]);

    const handlePopupConfirmation = () => {
        setIsConfirmationPopupOpen(false);
        setValue(EQUIPMENT_TABLE, DEFAULT_EQUIPMENT_TABLE_ROWS);
    };
    const isGeneratorOrLoad = useMemo(
        () =>
            watchEquipmentType === filterEquipmentDefinition.GENERATOR.type ||
            watchEquipmentType === filterEquipmentDefinition.LOAD.type,
        [watchEquipmentType]
    );

    const formatCsvData = useCallback(
        (result) => {
            return isGeneratorOrLoad
                ? result.map((val) => {
                      return {
                          equipmentID: val[0],
                          distributionKey: val[1] || null,
                      };
                  })
                : result.map((val) => {
                      return {
                          equipmentID: val[0],
                      };
                  });
        },
        [isGeneratorOrLoad]
    );
    const columnDefs = useMemo(
        () => {
            return isGeneratorOrLoad
                ? [
                    ...ROW_DRAGGING_SELECTION_COLUMN_DEF,
                    {
                        field: 'equipmentID',
                        editable: true,
                        maxWidth: 300,
                        flex: 1,
                        singleClickEdit: true,
                    },
                    {
                        field: 'distributionKey',
                        numeric: true,
                        editable: true,
                        cellEditor: NumberEditor,
                        singleClickEdit: true,
                    },
                ]
                : [
                    ...ROW_DRAGGING_SELECTION_COLUMN_DEF,
                    {
                        field: 'equipmentID',
                        editable: true,
                        flex: 1,
                        singleClickEdit: true,
                    },
                ];
        },
        [isGeneratorOrLoad]
    );

    useEffect(() => {

    }, [watchEquipmentType])
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

    const equipmentTypeSelectionField = (
        <SelectInput
            name={EQUIPMENT_TYPE}
            options={Object.entries(filterEquipmentDefinition)}
            labelId={'equipmentType'}
        />
    );

    const initialData = useMemo(() => {
        return { [EQUIPMENT_ID]: '', [DISTRIBUTION_KEY]: null }
    }, [])

    const csvFileHeaders = useMemo(() => [
        intl.formatMessage({ id: 'equipmentID' }),
        intl.formatMessage({ id: 'distributionKey' }),
    ], []);

    const equipmentTableField = (
        <CustomAgGridTable
            name={EQUIPMENT_TABLE}
            columnDefs={columnDefs}
            formatCsvData={formatCsvData}
            csvFileHeaders={csvFileHeaders}
            defaultRowData={initialData}
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
                    {gridItem(equipmentTypeSelectionField, 12)}
                </Grid>
                <Box maxWidth />
                {watchEquipmentType && (
                    <Grid container item>
                        {gridItem(equipmentTableField, 12)}
                    </Grid>
                )}
            </Grid>
            {renderPopup(
                isConfirmationPopupOpen,
                intl,
                setIsConfirmationPopupOpen,
                handlePopupConfirmation
            )}
        </>
    );
};

export default ExplicitNamingFilterForm;
