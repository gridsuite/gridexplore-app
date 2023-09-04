import React, { FunctionComponent, ReactElement, useEffect } from 'react';
import { TextInput } from '@gridsuite/commons-ui';
import { useFormContext } from 'react-hook-form';
import { CASE_FILE } from '../../utils/field-constants';

interface StudyNamePrefilledInputProps {
    label: string;
    name: string;
    adornment: ReactElement | null;
}

const StudyNamePrefilledInput: FunctionComponent<
    StudyNamePrefilledInputProps
> = ({ label, name, adornment }) => {
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
            const { name: caseName } = caseFile;

            if (caseName) {
                clearErrors(name);
                setValue(name, caseName.substring(0, caseName.indexOf('.')), {
                    shouldDirty: true,
                });
            }
        }
    }, [
        caseFile,
        apiCallErrorMessage,
        caseFileErrorMessage,
        setValue,
        clearErrors,
        name,
    ]);

    return (
        <TextInput
            label={label}
            name={name}
            customAdornment={adornment}
            formProps={{
                size: 'medium',
                autoFocus: true,
            }}
        />
    );
};

export default StudyNamePrefilledInput;
