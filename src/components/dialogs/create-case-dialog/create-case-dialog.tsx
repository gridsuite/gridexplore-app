/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createCase } from '../../../utils/rest-api';
import {
    HTTP_MAX_ELEMENTS_EXCEEDED_MESSAGE,
    HTTP_UNPROCESSABLE_ENTITY_STATUS,
} from '../../../utils/UIconstants';
import { Grid } from '@mui/material';
import {
    addUploadingElement,
    removeUploadingElement,
} from '../../../redux/actions';
import UploadNewCase from '../commons/upload-new-case';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import {
    createCaseDialogFormValidationSchema,
    getCreateCaseDialogFormValidationDefaultValues,
} from './create-case-dialog-utils';
import { ReduxState } from '../../../redux/reducer.type';
import PrefilledNameInput from '../commons/prefilled-name-input';
import {
    CustomMuiDialog,
    ElementType,
    ErrorInput,
    ExpandingTextField,
    FieldConstants,
    FieldErrorAlert,
    isObjectEmpty,
    keyGenerator,
    useSnackMessage,
} from '@gridsuite/commons-ui';

interface IFormData {
    [FieldConstants.CASE_NAME]: string;
    [FieldConstants.DESCRIPTION]?: string;
    [FieldConstants.CASE_FILE]: File | null;
}

interface CreateCaseDialogProps {
    onClose: () => void;
    open: boolean;
}

const CreateCaseDialog: React.FunctionComponent<CreateCaseDialogProps> = ({
    onClose,
    open,
}) => {
    const dispatch = useDispatch();
    const { snackError } = useSnackMessage();

    const createCaseFormMethods = useForm<IFormData>({
        defaultValues: getCreateCaseDialogFormValidationDefaultValues(),
        resolver: yupResolver<IFormData>(createCaseDialogFormValidationSchema),
    });

    const {
        formState: { errors, isValid },
    } = createCaseFormMethods;

    const isFormValid = isObjectEmpty(errors) && isValid;

    const activeDirectory = useSelector(
        (state: ReduxState) => state.activeDirectory
    );
    const userId = useSelector((state: ReduxState) => state.user.profile.sub);

    const handleCreateNewCase = ({
        caseName,
        description,
        caseFile,
    }: IFormData): void => {
        const uploadingCase = {
            id: keyGenerator(),
            elementName: caseName,
            directory: activeDirectory,
            type: ElementType.CASE,
            owner: userId,
            lastModifiedBy: userId,
            uploading: true,
        };

        createCase({
            name: caseName,
            description,
            file: caseFile,
            parentDirectoryUuid: activeDirectory,
        })
            .then(onClose)
            .catch((err) => {
                if (
                    err.status === 403 &&
                    err.message.includes(HTTP_MAX_ELEMENTS_EXCEEDED_MESSAGE)
                ) {
                    snackError({
                        messageId: 'maxElementExceededError',
                    });
                } else if (err?.status === HTTP_UNPROCESSABLE_ENTITY_STATUS) {
                    snackError({
                        messageId: 'invalidFormatOrName',
                        headerId: 'caseCreationError',
                        headerValues: { name: caseName },
                    });
                } else {
                    snackError({
                        messageTxt: err?.message,
                        headerId: 'caseCreationError',
                        headerValues: { name: caseName },
                    });
                }
            })
            .finally(() => dispatch(removeUploadingElement(uploadingCase)));

        dispatch(addUploadingElement(uploadingCase));
    };

    return (
        <CustomMuiDialog
            titleId={'ImportNewCase'}
            formSchema={createCaseDialogFormValidationSchema}
            formMethods={createCaseFormMethods}
            removeOptional={true}
            open={open}
            onClose={onClose}
            onSave={handleCreateNewCase}
            disabledSave={!isFormValid}
        >
            <Grid container spacing={2} marginTop={'auto'} direction="column">
                <Grid item>
                    <PrefilledNameInput
                        name={FieldConstants.CASE_NAME}
                        label={'nameProperty'}
                        elementType={ElementType.CASE}
                    />
                </Grid>
                <Grid item>
                    <ExpandingTextField
                        name={FieldConstants.DESCRIPTION}
                        label={'descriptionProperty'}
                        minRows={3}
                        rows={5}
                    />
                </Grid>
            </Grid>
            <ErrorInput
                name={FieldConstants.CASE_FILE}
                InputField={FieldErrorAlert}
            />
            <UploadNewCase />
        </CustomMuiDialog>
    );
};

export default CreateCaseDialog;
