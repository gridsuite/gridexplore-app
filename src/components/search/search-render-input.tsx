import { Search } from '@mui/icons-material';
import {
    AutocompleteRenderInputParams,
    TextField,
    TextFieldProps,
} from '@mui/material';
import { RefObject } from 'react';
import { useIntl } from 'react-intl';

interface SearchRenderInputProps extends AutocompleteRenderInputParams {
    inputRef: RefObject<TextFieldProps>;
}

export const SearchRenderInput = (props: SearchRenderInputProps) => {
    const intl = useIntl();
    const { inputRef, InputProps } = props;

    return (
        <TextField
            autoFocus={true}
            {...props}
            inputRef={inputRef}
            placeholder={intl.formatMessage({
                id: 'searchPlaceholder',
            })}
            variant="outlined"
            InputProps={{
                ...InputProps,
                startAdornment: (
                    <>
                        <Search />
                        {InputProps.startAdornment}
                    </>
                ),
            }}
        />
    );
};
