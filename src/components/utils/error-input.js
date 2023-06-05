import {Grid} from "@mui/material";
import Alert from "@mui/material/Alert";
import {useController} from "react-hook-form";
import {FormattedMessage} from "react-intl";
import {useEffect} from "react";

const ErrorInput = ({name}) => {

    const {
        fieldState: { error },
    } = useController({
        name,
    });

    useEffect(() => {
        console.log('errors errors : ', error);
    }, [error])

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

    return (
        error?.message && (
            <Alert
                severity={'error'}
                message={<FormattedMessage {...errorProps(error?.message)} />}
            />
        )
    );
}

export default ErrorInput;