import { Grid } from '@mui/material';
import { FormattedMessage } from 'react-intl';

export const gridItem = (field, size = 6) => {
    return (
        <Grid item xs={size} align={'start'}>
            {field}
        </Grid>
    );
};

export function genHelperError(...errors) {
    const inError = errors.find((e) => e);
    if (inError) {
        return {
            error: true,
            helperText: <FormattedMessage id={inError} />,
        };
    }
    return {};
}

export const FieldLabel = ({ label, optional, values = undefined }) => {
    return (
        <>
            <FormattedMessage id={label} values={values} />
            {optional && <FormattedMessage id="Optional" />}
        </>
    );
};

export const isFloatNumber = (val) => {
    return /^-?[0-9]*[.,]?[0-9]*$/.test(val);
};

export const func_identity = (e) => e;
