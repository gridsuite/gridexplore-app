/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
    COUNTRIES_1,
    COUNTRIES_2,
    EQUIPMENT_TYPE,
    NOMINAL_VOLTAGE_1,
    NOMINAL_VOLTAGE_2,
} from '../../../utils/field-constants';
import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { gridItem } from '../../../utils/dialog-utils';
import { Grid } from '@mui/material';
import SelectInput from '../../../utils/rhf-inputs/select-input';
import InputWithPopupConfirmation from '../../../utils/rhf-inputs/input-with-popup-confirmation';
import { DEFAULT_RANGE_VALUE } from '../../../utils/rhf-inputs/range-input';

const CriteriaBasedForm = ({ equipments }) => {
    const watchEquipmentType = useWatch({
        name: EQUIPMENT_TYPE,
    });

    const { setValue, getValues } = useFormContext();

    const openConfirmationPopup = () => {
        const defaultRangeValue = JSON.stringify(DEFAULT_RANGE_VALUE);
        return (
            watchEquipmentType &&
            (getValues(COUNTRIES_1).length > 0 ||
                getValues(COUNTRIES_2).length > 0 ||
                JSON.stringify(getValues(NOMINAL_VOLTAGE_1)) !==
                    defaultRangeValue ||
                JSON.stringify(getValues(NOMINAL_VOLTAGE_2)) !==
                    defaultRangeValue)
        );
    };

    const handleResetOnConfirmation = () => {
        setValue(COUNTRIES_1, []);
        setValue(COUNTRIES_2, []);
        setValue(NOMINAL_VOLTAGE_1, DEFAULT_RANGE_VALUE);
        setValue(NOMINAL_VOLTAGE_2, DEFAULT_RANGE_VALUE);
    };

    const equipmentTypeSelectionField = (
        <InputWithPopupConfirmation
            Input={SelectInput}
            name={EQUIPMENT_TYPE}
            options={Object.values(equipments)}
            label={'equipmentType'}
            shouldOpenPopup={openConfirmationPopup}
            resetOnConfirmation={handleResetOnConfirmation}
        />
    );

    return (
        <Grid container item spacing={2}>
            {gridItem(equipmentTypeSelectionField, 12)}
            {watchEquipmentType &&
                equipments[watchEquipmentType].fields.map(
                    (equipment, index) => {
                        const EquipmentForm = equipment.renderer;
                        return (
                            <Grid item xs={12} key={index}>
                                <EquipmentForm {...equipment.props} />
                            </Grid>
                        );
                    }
                )}
        </Grid>
    );
};

export default CriteriaBasedForm;
