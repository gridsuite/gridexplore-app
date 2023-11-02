import React, { useMemo } from 'react';
import { Chip } from '@mui/material';
import { AutocompleteInput } from '@gridsuite/commons-ui';
import { useCountriesListCB } from '../../dialog-utils';

export const CountriesInput = ({ name, label }) => {
    const countriesListCB = useCountriesListCB();

    const countriesList = useMemo(() => countriesListCB(), [countriesListCB]);

    const getLabel = (code) => {
        return countriesList.get(code);
    };

    return (
        <AutocompleteInput
            name={name}
            label={label}
            options={Object.keys(countriesList.object())}
            getOptionLabel={getLabel}
            fullWidth
            multiple
            renderTags={(val, getTagsProps) =>
                val.map((code, index) => (
                    <Chip
                        key={code}
                        size={'small'}
                        label={getLabel(code)}
                        {...getTagsProps({ index })}
                    />
                ))
            }
        />
    );
};

export default CountriesInput;
