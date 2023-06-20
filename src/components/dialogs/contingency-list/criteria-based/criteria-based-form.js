/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { filterEquipmentDefinition } from '../../../../utils/equipment-types';
import {
    COUNTRIES_1,
    COUNTRIES_2,
    EQUIPMENT_TYPE,
    NOMINAL_VOLTAGE_1,
    NOMINAL_VOLTAGE_2,
} from '../../../utils/field-constants';
import React, { useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { gridItem } from '../../../utils/dialog-utils';
import { Grid } from '@mui/material';
import CountriesInput from '../../../utils/countries-input';
import RangeInput from '../../../utils/range-input';
import SelectInput from '../../../utils/select-input';
import { CONTINGENCY_LIST_EQUIPMENTS } from '../contingency-list-utils';

const CriteriaBasedForm = () => {
    const { getValues } = useFormContext();
    const watchEquipmentType = useWatch({
        name: EQUIPMENT_TYPE,
    });

    const equipmentTypeSelectionField = (
        <SelectInput
            name={EQUIPMENT_TYPE}
            options={Object.values(CONTINGENCY_LIST_EQUIPMENTS)}
            label={'equipmentType'}
        />
    );

    const isLineOrHvdc = useMemo(
        () =>
            watchEquipmentType === filterEquipmentDefinition.LINE.type ||
            watchEquipmentType === filterEquipmentDefinition.HVDC_LINE.type,
        [watchEquipmentType]
    );

    const isLineOrTransformer = useMemo(
        () =>
            watchEquipmentType === filterEquipmentDefinition.LINE.type ||
            watchEquipmentType ===
                filterEquipmentDefinition.TWO_WINDINGS_TRANSFORMER.type,
        [watchEquipmentType]
    );

    const countries1 = (
        <CountriesInput name={COUNTRIES_1} titleMessage={'Countries1'} />
    );

    const countries2 = (
        <CountriesInput name={COUNTRIES_2} titleMessage={'Countries2'} />
    );

    const nominalValue1Field = (
        <RangeInput name={NOMINAL_VOLTAGE_1} label={'nominalVoltage1'} />
    );

    const nominalValue2Field = (
        <RangeInput name={NOMINAL_VOLTAGE_2} label={'nominalVoltage2'} />
    );

    return (
        <Grid container item>
            {gridItem(equipmentTypeSelectionField, 12)}
            {getValues(EQUIPMENT_TYPE) && (
                <>
                    {gridItem(countries1, 12)}
                    {isLineOrHvdc && gridItem(countries2, 12)}
                    {gridItem(nominalValue1Field, 12)}
                    {isLineOrTransformer && gridItem(nominalValue2Field, 12)}
                </>
            )}
        </Grid>
    );
};

export default CriteriaBasedForm;
