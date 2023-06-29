import { useParameterState } from '../../dialogs/parameters-dialog';
import { PARAM_LANGUAGE } from '../../../utils/config-params';
import React, { useCallback, useMemo } from 'react';
import { getComputedLanguage } from '../../../utils/language';
import ChipsArrayInput from './chips-array-input';

export const CountriesInput = ({ name, label }) => {
    const [languageLocal] = useParameterState(PARAM_LANGUAGE);
    const countriesListCB = useCallback(() => {
        try {
            return require('localized-countries')(
                require('localized-countries/data/' +
                    getComputedLanguage(languageLocal).substr(0, 2))
            );
        } catch (error) {
            // fallback to english if no localised list found
            return require('localized-countries')(
                require('localized-countries/data/en')
            );
        }
    }, [languageLocal]);

    const countriesList = useMemo(() => countriesListCB(), [countriesListCB]);

    const getLabel = (code) => {
        return countriesList.get(code);
    };

    return (
        <ChipsArrayInput
            name={name}
            label={label}
            options={Object.keys(countriesList.object())}
            getChipLabel={getLabel}
            getOptionLabel={getLabel}
            fullWidth
        />
    );
};

export default CountriesInput;
