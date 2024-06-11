/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
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
