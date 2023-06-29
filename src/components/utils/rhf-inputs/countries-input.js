import { useParameterState } from '../../dialogs/parameters-dialog';
import { PARAM_LANGUAGE } from '../../../utils/config-params';
import React, { useCallback, useMemo } from 'react';
import { getComputedLanguage } from '../../../utils/language';
import { Chip } from '@mui/material';
import TextField from '@mui/material/TextField';
import { FormattedMessage } from 'react-intl';
import AutocompleteInput from './autocomplete-input';

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
    return (
        <AutocompleteInput
            fullWidth
            name={name}
            multiple
            options={Object.keys(countriesList.object())}
            getOptionLabel={(code) => countriesList.get(code)}
            renderInput={(props) => (
                <TextField label={<FormattedMessage id={label} />} {...props} />
            )}
            renderTags={(val, getTagsProps) =>
                val.map((code, index) => (
                    <Chip
                        id={'chip_' + code}
                        size={'small'}
                        label={countriesList.get(code)}
                        {...getTagsProps({ index })}
                    />
                ))
            }
        />
    );
};

export default CountriesInput;
