import Alert from '@mui/material/Alert';
import { useController } from 'react-hook-form';
import { useIntl } from 'react-intl';
import { useEffect, useState } from 'react';

const ErrorInput = ({ name }) => {
    const intl = useIntl();
    const [errorMsg, setErrorMsg] = useState(null);

    const {
        fieldState: { error },
    } = useController({
        name,
    });

    const errorProps = (errorMsg) => {
        if (typeof errorMsg === 'string') {
            return {
                id: errorMsg,
            };
        } else if (typeof errorMsg === 'object') {
            return {
                id: errorMsg.id,
                values: {
                    value: errorMsg.value,
                },
            };
        }
        return {};
    };

    useEffect(() => {
        if (error?.message) {
            setErrorMsg(intl.formatMessage({ ...errorProps(error.message) }));
        }
    }, [error, intl]);

    return errorMsg && <Alert severity={'error'}>{errorMsg}</Alert>;
};

export default ErrorInput;
