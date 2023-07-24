import AutocompleteInput from './autocomplete-input';
import { Chip } from '@mui/material';
import React, { useState } from 'react';
import { useFieldArray, useWatch } from 'react-hook-form';

const MultipleAutocompleteInput = ({ name, ...props }) => {
    const [unsavedInput, setUnsavedInput] = useState('');
    const watchAutocompleteValues = useWatch({
        name,
    });

    const { append, remove } = useFieldArray({
        name,
    });

    const handleOnBlur = () => {
        if (unsavedInput && !watchAutocompleteValues.includes(unsavedInput)) {
            append(unsavedInput);
        }
        setUnsavedInput('');
    };

    const outputTransform = (values) => {
        return values
            .map((val) => val.trim())
            .filter((val, index) => values.indexOf(val) === index);
    };

    return (
        <AutocompleteInput
            name={name}
            fullWidth
            options={[]}
            allowNewValue
            clearOnBlur
            disableClearable={true}
            outputTransform={outputTransform}
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
