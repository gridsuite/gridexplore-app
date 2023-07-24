import { FormattedMessage } from 'react-intl';
import { TextField } from '@mui/material';
import { useCallback, useEffect } from 'react';
import makeStyles from '@mui/styles/makeStyles';

const useStyles = makeStyles(() => ({
    helperText: {
        margin: 0,
        marginTop: 4,
    },
}));

const TextValue = ({
    label,
    id = label,
    value,
    setValue,
    defaultValue = '',
    triggerReset,
    adornment,
    ...formProps
}) => {
    const classes = useStyles();

    const handleChangeValue = useCallback(
        (event) => {
            setValue(event.target.value);
        },
        [setValue]
    );

    useEffect(
        () => setValue(defaultValue),
        [triggerReset, defaultValue, setValue]
    );

    return (
        <TextField
            key={id}
            margin="dense"
            id={id}
            label={id && <FormattedMessage id={label} />}
            onChange={handleChangeValue}
            value={value}
            style={{ width: '100%' }}
            FormHelperTextProps={{
                className: classes.helperText,
            }}
            {...formProps}
            {...(adornment && { InputProps: adornment })}
        />
    );
};

TextValue.propTypes = {};

export default TextValue;
