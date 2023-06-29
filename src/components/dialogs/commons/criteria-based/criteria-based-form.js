/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { EQUIPMENT_TYPE } from '../../../utils/field-constants';
import React from 'react';
import { useWatch } from 'react-hook-form';
import { gridItem } from '../../../utils/dialog-utils';
import { Grid } from '@mui/material';
import SelectInput from '../../../utils/rhf-inputs/select-input';
import InputWithPopupConfirmation from '../../../utils/rhf-inputs/input-with-popup-confirmation';

const CriteriaBasedForm = ({
    equipments,
    openConfirmationPopup,
    handleResetOnConfirmation,
}) => {
    const watchEquipmentType = useWatch({
        name: EQUIPMENT_TYPE,
    });

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
