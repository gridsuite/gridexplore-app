import { useWatch } from 'react-hook-form';
import { OPERATION_TYPE, VALUE_1, VALUE_2 } from '../field-constants';
import FloatInput from './float-input';
import yup from '../yup-config';
import { FormattedMessage } from 'react-intl';
import React, { useMemo } from 'react';
import InputLabel from '@mui/material/InputLabel';
import { Grid } from '@mui/material';
import FormControl from '@mui/material/FormControl';
import MuiSelectInput from './slect-inputs/mui-select-input';

const style = {
    inputLegend: (theme) => ({
        backgroundImage:
            'linear-gradient(rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.16))',
        backgroundColor: theme.palette.background.paper,
        padding: '0 8px 0 8px',
    }),
};

export const RangeType = {
    EQUALITY: { id: 'EQUALITY', label: 'equality' },
    GREATER_THAN: { id: 'GREATER_THAN', label: 'greaterThan' },
    GREATER_OR_EQUAL: { id: 'GREATER_OR_EQUAL', label: 'greaterOrEqual' },
    LESS_THAN: { id: 'LESS_THAN', label: 'lessThan' },
    LESS_OR_EQUAL: { id: 'LESS_OR_EQUAL', label: 'lessOrEqual' },
    RANGE: { id: 'RANGE', label: 'range' },
};

export const DEFAULT_RANGE_VALUE = {
    [OPERATION_TYPE]: RangeType.EQUALITY.id,
    [VALUE_1]: null,
    [VALUE_2]: null,
};
export const getRangeInputDataForm = (
    name,
    rangeValue = DEFAULT_RANGE_VALUE
) => ({
    [name]: rangeValue,
});

export const getRangeInputSchema = (name) => ({
    [name]: yup.object().shape({
        [OPERATION_TYPE]: yup.string(),
        [VALUE_1]: yup.number().nullable(),
        [VALUE_2]: yup.number().nullable(),
    }),
});

const RangeInput = ({ name, label }) => {
    const watchOperationType = useWatch({
        name: `${name}.${OPERATION_TYPE}`,
    });

    const isOperationTypeRange = useMemo(
        () => watchOperationType === RangeType.RANGE.id,
        [watchOperationType]
    );

    const firstValueField = (
        <FloatInput
            label={''}
            name={`${name}.${VALUE_1}`}
            clearable={false}
            formProps={{
                placeholder: isOperationTypeRange ? 'Min' : '',
            }}
        />
    );

    const secondValueField = (
        <FloatInput
            name={`${name}.${VALUE_2}`}
            clearable={false}
            label={''}
            formProps={{
                placeholder: 'Max',
            }}
        />
    );

    const operationTypeField = (
        <MuiSelectInput
            name={`${name}.${OPERATION_TYPE}`}
            options={Object.values(RangeType)}
            fullWidth
            style={{
                borderRadius: '4px 0 0 4px',
            }}
        />
    );

    return (
        <FormControl fullWidth>
            <InputLabel sx={style.inputLegend}>
                <FormattedMessage id={label} />
            </InputLabel>
            <Grid container spacing={0}>
                <Grid
                    item
                    style={
                        isOperationTypeRange
                            ? {
                                  flex: 'min-content',
                              }
                            : {}
                    }
                >
                    {operationTypeField}
                </Grid>
                <Grid item>{firstValueField}</Grid>
                {isOperationTypeRange && <Grid item>{secondValueField}</Grid>}
            </Grid>
        </FormControl>
    );
};

export default RangeInput;
