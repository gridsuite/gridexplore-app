/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
    RadioInput,
    getCriteriaBasedFormData,
    CONTINGENCY_LIST_EQUIPMENTS,
    CriteriaBasedForm,
    FieldConstants,
    UniqueNameInput,
    ExpandingTextField,
    ElementType,
    gridItem,
} from '@gridsuite/commons-ui';
import { ContingencyListType } from '../../../../utils/elementType';
import { Box, Grid } from '@mui/material';
import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import ExplicitNamingForm from '../explicit-naming/explicit-naming-form';
import ScriptInputForm from '../script/script-input-form';

const ContingencyListCreationForm = () => {
    const { setValue } = useFormContext();

    const watchContingencyListType = useWatch({
        name: FieldConstants.CONTINGENCY_LIST_TYPE,
    });

    // We do this because setValue don't set the field dirty
    const handleChange = (_event, value) => {
        setValue(FieldConstants.CONTINGENCY_LIST_TYPE, value);
    };

    const contingencyListTypeField = (
        <RadioInput
            name={FieldConstants.CONTINGENCY_LIST_TYPE}
            options={Object.values(ContingencyListType)}
            formProps={{ onChange: handleChange }} // need to override this in order to do not activate the validate button when changing the filter type
        />
    );

    const emptyValues = getCriteriaBasedFormData();
    return (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <UniqueNameInput
                    name={FieldConstants.NAME}
                    label={'nameProperty'}
                    elementType={ElementType.CONTINGENCY_LIST}
                    autoFocus
                />
            </Grid>
            <Grid item xs={12}>
                <Box>
                    <ExpandingTextField
                        name={FieldConstants.DESCRIPTION}
                        label={'descriptionProperty'}
                        minRows={3}
                        rows={5}
                    />
                </Box>
            </Grid>
            <Grid container item>
                {gridItem(contingencyListTypeField, 12)}
            </Grid>
            {watchContingencyListType ===
                ContingencyListType.CRITERIA_BASED.id && (
                <CriteriaBasedForm
                    equipments={CONTINGENCY_LIST_EQUIPMENTS}
                    defaultValues={emptyValues[FieldConstants.CRITERIA_BASED]}
                />
            )}
            {watchContingencyListType ===
                ContingencyListType.EXPLICIT_NAMING.id && (
                <ExplicitNamingForm />
            )}
            {watchContingencyListType === ContingencyListType.SCRIPT.id && (
                <ScriptInputForm name={FieldConstants.SCRIPT} />
            )}
        </Grid>
    );
};

export default ContingencyListCreationForm;
