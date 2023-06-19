import { Grid } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import {getIn} from "yup";

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

export const isFieldRequired = (fieldName, schema, values) => {
    const { schema: fieldSchema, parent: parentValues } =
    getIn(schema, fieldName, values) || {};
    return fieldSchema.describe({ parent: parentValues })?.optional === false;

    //static way, not working when using "when" in schema, but does not need form values
    //return yup.reach(schema, fieldName)?.exclusiveTests?.required === true;
};

export const isFloatNumber = (val) => {
    return /^-?[0-9]*[.,]?[0-9]*$/.test(val);
};

export const func_identity = (e) => e;