import { Grid } from '@mui/material';
import { getIn } from 'yup';
import { useParameterState } from '../dialogs/parameters-dialog';
import { useCallback } from 'react';
import { getComputedLanguage } from '../../utils/language';
import { PARAM_LANGUAGE } from '../../utils/config-params';

export const isFieldRequired = (fieldName, schema, values) => {
    const { schema: fieldSchema, parent: parentValues } =
        getIn(schema, fieldName, values) || {};
    return fieldSchema.describe({ parent: parentValues })?.optional === false;

    //static way, not working when using "when" in schema, but does not need form values
    //return yup.reach(schema, fieldName)?.exclusiveTests?.required === true;
};

export const gridItem = (field, size = 6) => {
    return (
        <Grid item xs={size} align={'start'}>
            {field}
        </Grid>
    );
};

export const isFloatNumber = (val) => {
    return /^-?[0-9]*[.,]?[0-9]*$/.test(val);
};

export const func_identity = (e) => e;

export const toFloatOrNullValue = (value) => {
    if (value === '-') {
        return value;
    }
    if (value === '0') {
        return 0;
    }
    const tmp = value?.replace(',', '.') || '';
    return parseFloat(tmp) || null;
};

export const useCountriesListCB = () => {
    const [languageLocal] = useParameterState(PARAM_LANGUAGE);
    return useCallback(() => {
        try {
            return require('localized-countries')(
                require('localized-countries/data/' +
                    getComputedLanguage(languageLocal).substr(0, 2))
            );
        } catch (error) {
            // fallback to English if no localized list is found
            return require('localized-countries')(
                require('localized-countries/data/en')
            );
        }
    }, [languageLocal]);
};
