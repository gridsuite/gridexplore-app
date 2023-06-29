import AutocompleteInput from './autocomplete-input';
import { Chip } from '@mui/material';
import React from 'react';

const ChipsArrayInput = ({ getChipLabel = (value) => value, ...props }) => {
    return (
        <AutocompleteInput
            multiple
            renderTags={(val, getTagsProps) =>
                val
                    .filter((val) => val)
                    .map((value, index) => (
                        <Chip
                            id={'chip_' + value}
                            size={'small'}
                            label={getChipLabel(value)}
                            {...getTagsProps({ index })}
                        />
                    ))
            }
            {...props}
        />
    );
};

export default ChipsArrayInput;
