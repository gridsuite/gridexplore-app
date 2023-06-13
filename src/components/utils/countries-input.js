import { useParameterState } from '../dialogs/parameters-dialog';
import { PARAM_LANGUAGE } from '../../utils/config-params';
import React, { useCallback, useState } from '@types/react';
import { getComputedLanguage } from '../../utils/language';
import { Chip, FormControl } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { FormattedMessage } from 'react-intl';
import {useController} from "react-hook-form";
import {useMemo} from "react";

export const CountriesInput = ({ name, titleMessage }) => {
    const {
        field: { onChange, value },
    } = useController({ name });

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

    const countriesList = useMemo(() => countriesListCB(), [])
    return (
        <>
            <FormControl fullWidth margin="dense">
                <Autocomplete
                    id="select_countries"
                    value={value}
                    multiple
                    onChange={onChange}
                    options={Object.keys(countriesList.object())}
                    getOptionLabel={(code) => countriesList.get(code)}
                    renderInput={(props) => (
                        <TextField
                            label={<FormattedMessage id={titleMessage} />}
                            {...props}
                        />
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
            </FormControl>
        </>
    );
};

export default CountriesInput;
