import { useWatch } from 'react-hook-form';
import { OPERATION_TYPE, VALUE_1, VALUE_2 } from './field-constants';
import FloatInput from './float-input';
import AutocompleteSelectInput from './autocomplete-select-input';
import { Grid, InputLabel } from '@mui/material';
import yup from './yup-config';
import FormControl from '@mui/material/FormControl';
import { FormattedMessage } from 'react-intl';
import React, {useEffect, useMemo} from 'react';
import makeStyles from '@mui/styles/makeStyles';

const useStyles = makeStyles((theme) => ({
    inputLegend: {
        backgroundImage:
            'linear-gradient(rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.16))',
        backgroundColor: theme.palette.background.paper,
        padding: '0 8px 0 8px',
        position: 'inherit',
        width: 'fit-content',
    },
}));

export const RangeType = {
    EQUALITY: { id: 'EQUALITY', label: 'equality' },
    GREATER_THAN: { id: 'GREATER_THAN', label: 'greaterThan' },
    GREATER_OR_EQUAL: { id: 'GREATER_OR_EQUAL', label: 'greaterOrEqual' },
    LESS_THAN: { id: 'LESS_THAN', label: 'lessThan' },
    LESS_OR_EQUAL: { id: 'LESS_OR_EQUAL', label: 'lessOrEqual' },
    RANGE: { id: 'RANGE', label: 'range' },
};

export const getRangeInputEmptyDataForm = (name) => ({
    [name]: {
        [OPERATION_TYPE]: RangeType.EQUALITY.id,
        [VALUE_1]: null,
        [VALUE_2]: null,
    },
});

export const getRangeInputSchema = (name) => ({
    [name]: yup.object().shape({
        [OPERATION_TYPE]: yup.string().required(),
        [VALUE_1]: yup.number().nullable(),
        [VALUE_2]: yup.number().nullable(),
    }),
});

const RangeInput = ({ name, label }) => {
    const classes = useStyles();
    const watchOperationType = useWatch({
        name: `${name}.${OPERATION_TYPE}`,
    });

    const isOperationTypeRange = useMemo(
        () => watchOperationType.id === RangeType.RANGE.id,
        [watchOperationType]
    );

    useEffect(() => {
        console.log('watchOperationType : ', watchOperationType)
    }, [watchOperationType]);

    const firstValueField = (
        <FloatInput
            name={`${name}.${VALUE_1}`}
            label={isOperationTypeRange ? 'Min' : ''}
            clearable={false}
            InputProps={
                isOperationTypeRange
                    ? {
                          style: {
                              borderRadius: '0 0 0 0',
                          },
                      }
                    : {
                          style: {
                              borderRadius: '0 4px 4px 0',
                          },
                      }
            }
        />
    );

    const secondValueField = (
        <FloatInput
            name={`${name}.${VALUE_2}`}
            label={'Max'}
            InputProps={{
                style: {
                    borderRadius: '0 4px 4px 0',
                },
            }}
            clearable={false}
        />
    );

    const operationTypeField = (
        <AutocompleteSelectInput
            name={`${name}.${OPERATION_TYPE}`}
            options={Object.values(RangeType)}
            style={{
                borderRadius: '4px 0 0 4px',
                width: 'fit-content'
            }}
            clearable={false}
        />
    );

    return (
        <>
            <FormControl fullWidth margin="dense">
                <InputLabel className={classes.inputLegend}>
                    <FormattedMessage id={label} />
                </InputLabel>
                <Grid container spacing={0}>
                    <Grid item>{operationTypeField}</Grid>
                    <Grid item>{firstValueField}</Grid>
                    {isOperationTypeRange && (
                        <Grid item>{secondValueField}</Grid>
                    )}
                </Grid>
            </FormControl>
        </>
    );
};

export default RangeInput;
