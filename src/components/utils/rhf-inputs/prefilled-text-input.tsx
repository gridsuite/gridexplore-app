import React, { FunctionComponent, ReactElement, useEffect } from 'react';
import { STUDY_NAME } from '../field-constants';
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
    providedExistingCase: IProvidedExistingCase;
    studyNameAdornment: ReactElement | null;
}

const PrefilledTextInput: FunctionComponent<IPrefilledTextInput> = ({
    providedExistingCase,
    studyNameAdornment,
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
                clearErrors(STUDY_NAME);
                setValue(
                    STUDY_NAME,
                    caseFileName.substring(0, caseFileName.indexOf('.')),
                    { shouldDirty: true }
                );
            }
        }

        if (providedExistingCase) {
            const { elementName: existingCaseName } = providedExistingCase;
            setValue(STUDY_NAME, existingCaseName, { shouldDirty: true });
        }
    }, [
        caseFile,
        apiCallErrorMessage,
        caseFileErrorMessage,
        providedExistingCase,
        setValue,
        clearErrors,
    ]);

    return (
        <TextInput
            label={'nameProperty'}
            name={STUDY_NAME}
            customAdornment={studyNameAdornment}
            formProps={{
                size: 'medium',
                autoFocus: true,
            }}
        />
    );
};

export default PrefilledTextInput;
