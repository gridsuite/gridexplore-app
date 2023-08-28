import React, { FunctionComponent, ReactElement, useEffect } from 'react';
import { TextInput } from '@gridsuite/commons-ui';
import { useFormContext } from 'react-hook-form';
import { CASE_FILE } from '../../utils/field-constants';

interface IPrefilledTextInput {
    label: string;
    fieldName: string;
    adornment: ReactElement | null;
}

const StudyNamePrefilledInput: FunctionComponent<IPrefilledTextInput> = ({
    label,
    fieldName,
    adornment,
}) => {
    const {
        setValue,
        clearErrors,
        watch,
        formState: { errors },
    } = useFormContext();

    const caseFile = watch(CASE_FILE) as File;
    const caseFileErrorMessage = errors.caseFile?.message;
    const apiCallErrorMessage = errors.root?.apiCall?.message;

    useEffect(() => {
        if (caseFile && !apiCallErrorMessage && !caseFileErrorMessage) {
            const { name } = caseFile;

            if (name) {
                clearErrors(fieldName);
                setValue(fieldName, name.substring(0, name.indexOf('.')), {
                    shouldDirty: true,
                    shouldValidate: true,
                });
            }
        }
    }, [
        caseFile,
        apiCallErrorMessage,
        caseFileErrorMessage,
        setValue,
        clearErrors,
        fieldName,
    ]);

    return (
        <TextInput
            label={label}
            name={fieldName}
            customAdornment={adornment}
            formProps={{
                size: 'medium',
                autoFocus: true,
            }}
        />
    );
};

export default StudyNamePrefilledInput;
