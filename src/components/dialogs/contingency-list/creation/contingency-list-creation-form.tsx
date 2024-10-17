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
    DescriptionField,
    ElementType,
    gridItem,
} from '@gridsuite/commons-ui';
import { ContingencyListType } from '../../../../utils/elementType';
import { Grid } from '@mui/material';
import { useFormContext, useWatch } from 'react-hook-form';
import ExplicitNamingForm from '../explicit-naming/explicit-naming-form';
import ScriptInputForm from '../script/script-input-form';
import { useSelector } from 'react-redux';
import { elementExists } from '../../../../utils/rest-api';
import { ChangeEvent, FunctionComponent } from 'react';
import { AppState } from 'redux/reducer';

const ContingencyListCreationForm: FunctionComponent = () => {
    const { setValue } = useFormContext();

    const watchContingencyListType = useWatch({
        name: FieldConstants.CONTINGENCY_LIST_TYPE,
    });

    const activeDirectory = useSelector((state: AppState) => state.activeDirectory);

    // We do this because setValue don't set the field dirty
    const handleChange = (_event: ChangeEvent<HTMLInputElement>, value: string) => {
        setValue(FieldConstants.CONTINGENCY_LIST_TYPE, value);
    };

    const contingencyListTypeField = (
        <RadioInput
            name={FieldConstants.CONTINGENCY_LIST_TYPE}
            options={Object.values(ContingencyListType)}
            formProps={{ onChange: handleChange }} // need to override this in order to do not activate the validate button when changing the filter type
        />
    );

    const emptyValues = getCriteriaBasedFormData({}, {});
    return (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <UniqueNameInput
                    name={FieldConstants.NAME}
                    label={'nameProperty'}
                    elementType={ElementType.CONTINGENCY_LIST}
                    autoFocus
                    activeDirectory={activeDirectory}
                    elementExists={elementExists}
                />
            </Grid>
            <Grid item xs={12}>
                <DescriptionField />
            </Grid>
            <Grid container item>
                {gridItem(contingencyListTypeField, 12)}
            </Grid>
            {watchContingencyListType === ContingencyListType.CRITERIA_BASED.id && (
                <Grid item xs={12}>
                    <CriteriaBasedForm
                        equipments={CONTINGENCY_LIST_EQUIPMENTS}
                        defaultValues={emptyValues[FieldConstants.CRITERIA_BASED]}
                    />
                </Grid>
            )}
            {watchContingencyListType === ContingencyListType.EXPLICIT_NAMING.id && <ExplicitNamingForm />}
            {watchContingencyListType === ContingencyListType.SCRIPT.id && <ScriptInputForm />}
        </Grid>
    );
};

export default ContingencyListCreationForm;
