import React, { FunctionComponent, ReactElement, useEffect } from 'react';
import { TextInput } from '@gridsuite/commons-ui';
import { useFormContext } from 'react-hook-form';

interface IProvidedExistingCase {
    accessRights: {
        isPrivate: boolean | null;
    };
    creationDate: string;
    description: string;
    elementName: string;
    elementUuid: string;
    lastModificationDate: string;
    lastModifiedBy: string;
    notClickable: boolean;
    owner: string;
    subdirectoriesCount: number;
    type: 'CASE';
}

interface IPrefilledTextInput {
    label: string;
    name: string;
    providedExistingCase: IProvidedExistingCase;
    adornment: ReactElement | null;
}

const PrefilledTextInput: FunctionComponent<IPrefilledTextInput> = ({
    label,
    name,
    providedExistingCase,
    adornment,
}) => {
    const {
        setValue,
        clearErrors,
        getValues,
        formState: { errors },
    } = useFormContext();

    const { caseFile } = getValues();
    const caseFileErrorMessage = errors.caseFile?.message;
    const apiCallErrorMessage = errors.root?.apiCall?.message;

    useEffect(() => {
        if (caseFile && !apiCallErrorMessage && !caseFileErrorMessage) {
            const { name: caseFileName } = caseFile;

            if (caseFileName) {
                clearErrors(name);
                setValue(
                    name,
                    caseFileName.substring(0, caseFileName.indexOf('.')),
                    { shouldDirty: true }
                );
            }
        }

        if (providedExistingCase) {
            const { elementName: existingCaseName } = providedExistingCase;
            setValue(name, existingCaseName, { shouldDirty: true });
        }
    }, [
        caseFile,
        apiCallErrorMessage,
        caseFileErrorMessage,
        providedExistingCase,
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

export default PrefilledTextInput;
