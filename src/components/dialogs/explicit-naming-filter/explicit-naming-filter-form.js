import TextInput from '../../utils/text-input';
import {
    EQUIPMENT_ID,
    EQUIPMENT_TABLE,
    EQUIPMENT_TYPE,
    NAME,
} from '../../utils/field-constants';
import { FormattedMessage, useIntl } from 'react-intl';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { filterEquipmentDefinition } from '../../../utils/equipment-types';
import SelectInput from '../../utils/select-input';
import AggridTableForm from '../ag-grid-table/aggrid-table-form';
import { useFormContext, useWatch } from 'react-hook-form';
import { Grid } from '@mui/material';
import { gridItem } from '../../utils/dialog-utils';
import Box from '@mui/material/Box';
import CustomAgGridTable from '../ag-grid-table-rhf/custom-ag-grid-table';
import NumberEditor from '../ag-grid-table/cell-editors/number-editors';
import { renderPopup } from '../create-filter-dialog';
import Alert from '@mui/material/Alert';

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
    console.log('defaultEquipmentType : ', defaultEquipmentType);
    useEffect(() => {
        if (
            watchEquipmentType &&
            watchEquipmentType !== defaultEquipmentType &&
            watchEquipmentTable?.length > 0
        ) {
            setIsConfirmationPopupOpen(true);
        }
    }, [watchEquipmentType]);

    const handlePopupConfirmation = () => {
        setIsConfirmationPopupOpen(false);
        setValue(EQUIPMENT_TABLE, []);
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
                          distributionKey: val[1],
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
        () =>
            isGeneratorOrLoad
                ? [
                      {
                          field: 'equipmentID',
                          minWidth: 150,
                          headerCheckboxSelection: true,
                          checkboxSelection: true,
                          editable:true,
                          rowDrag: true,
                      },
                      {
                          field: 'distributionKey',
                          filter: 'agNumberColumnFilter',
                          numeric: true,
                          editable:true,
                          cellEditor: NumberEditor,
                      },
                  ]
                : [
                      {
                          field: 'equipmentID',
                          minWidth: 150,
                          headerCheckboxSelection: true,
                          checkboxSelection: true,
                          editable:true,
                          rowDrag: true,
                      },
                  ],
        [isGeneratorOrLoad]
    );

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
        />
    );

    const equipmentTableField = (
        <CustomAgGridTable
            name={EQUIPMENT_TABLE}
            columnDefs={columnDefs}
            formatCsvData={formatCsvData}
            csvFileHeaders={[
                intl.formatMessage({ id: 'equipmentID' }),
                intl.formatMessage({ id: 'distributionKey' }),
            ]}
            initialRowData={{ equipmentID: '', distributionKey: '' }}
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
