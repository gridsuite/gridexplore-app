import RadioInput from '../../../utils/radio-input';
import {
    CONTINGENCY_LIST_TYPE,
    EQUIPMENT_ID,
    NAME, SCRIPT,
} from '../../../utils/field-constants';
import { ContingencyListTypeRefactor } from '../../../../utils/elementType';
import { Grid } from '@mui/material';
import { gridItem } from '../../../utils/dialog-utils';
import Box from '@mui/material/Box';
import React from 'react';
import { useWatch } from 'react-hook-form';
import CriteriaBasedForm from '../criteria-based/criteria-based-form';
import ExplicitNamingForm from '../explicit-naming/explicit-naming-form';
import TextInput from '../../../utils/text-input';
import { FormattedMessage } from 'react-intl';
import ScriptInput from "../../../utils/script-input";

const ContingencyListCreationForm = ({}) => {

    const watchContingencyListType = useWatch({
        name: CONTINGENCY_LIST_TYPE,
    });

    const nameField = (
        <TextInput
            name={NAME}
            label={'nameProperty'}
            autoFocus
            margin="dense"
            type="text"
            style={{ width: '100%', flexGrow: 1 }}
        />
    );

    const contingencyListTypeField = (
        <RadioInput
            name={CONTINGENCY_LIST_TYPE}
            options={Object.values(ContingencyListTypeRefactor)}
        />
    );

    return (
        <Grid container spacing={2}>
            <Grid container item>
                {gridItem(nameField, 12)}
            </Grid>
            <Grid container item>
                {gridItem(contingencyListTypeField, 12)}
            </Grid>
            {watchContingencyListType ===
                ContingencyListTypeRefactor.CRITERIA_BASED.id && (
                <CriteriaBasedForm />
            )}
            {watchContingencyListType ===
                ContingencyListTypeRefactor.EXPLICIT_NAMING.id && (
                <ExplicitNamingForm />
            )}
            {watchContingencyListType ===
                ContingencyListTypeRefactor.SCRIPT.id && <ScriptInput name={SCRIPT}/>}
        </Grid>
    );
};

export default ContingencyListCreationForm;
