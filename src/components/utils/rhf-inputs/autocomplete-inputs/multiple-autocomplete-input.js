import AutocompleteInput from './autocomplete-input';
import { Chip } from '@mui/material';
import React, { useState } from 'react';
import { useFieldArray } from 'react-hook-form';

const MultipleAutocompleteInput = ({ name, ...props }) => {
    const [unsavedInput, setUnsavedInput] = useState('');

    const { append, remove } = useFieldArray({
        name,
    });

    const handleOnBlur = () => {
        if (unsavedInput) {
            append(unsavedInput);
        }
        setUnsavedInput('');
    };

    return (
        <AutocompleteInput
            name={name}
            fullWidth
            options={[]}
            allowNewValue
            clearOnBlur
            disableClearable={true}
            onInputChange={(_, val) => setUnsavedInput(val.trim() ?? '')}
            onBlur={handleOnBlur}
            blurOnSelect={false}
            size={'small'}
            multiple
            renderTags={(val, getTagsProps) =>
                val
                    .filter((value) => value)
                    .map((value, index) => (
                        <Chip
                            key={index}
                            size={'small'}
                            label={value}
                            {...getTagsProps({ index })}
                            onDelete={() => {
                                remove(index);
                            }}
                        />
                    ))
            }
            {...props}
        />
    );
};

export default MultipleAutocompleteInput;
