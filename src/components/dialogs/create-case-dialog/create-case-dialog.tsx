/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FunctionComponent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Grid } from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import {
    CustomMuiDialog,
    DescriptionField,
    ElementType,
    ErrorInput,
    FieldConstants,
    FieldErrorAlert,
    isObjectEmpty,
    keyGenerator,
    useConfidentialityWarning,
    useSnackMessage,
} from '@gridsuite/commons-ui';
import { createCase } from '../../../utils/rest-api';
import { HTTP_UNPROCESSABLE_ENTITY_STATUS } from '../../../utils/UIconstants';
import { addUploadingElement } from '../../../redux/actions';
import UploadNewCase from '../commons/upload-new-case';
import {
    createCaseDialogFormValidationSchema,
    getCreateCaseDialogFormValidationDefaultValues,
} from './create-case-dialog-utils';
import { AppState, UploadingElement } from '../../../redux/reducer';
import PrefilledNameInput from '../commons/prefilled-name-input';
import { handleMaxElementsExceededError } from '../../utils/rest-errors';
import { AppDispatch } from '../../../redux/store';

interface IFormData {
    [FieldConstants.CASE_NAME]: string;
    [FieldConstants.DESCRIPTION]?: string;
    [FieldConstants.CASE_FILE]: File | null;
}

interface CreateCaseDialogProps {
    onClose: (e?: unknown, nextSelectedDirectoryId?: string | null) => void;
    open: boolean;
}

const CreateCaseDialog: FunctionComponent<CreateCaseDialogProps> = ({ onClose, open }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { snackError } = useSnackMessage();
    const confidentialityWarningKey = useConfidentialityWarning();

    const createCaseFormMethods = useForm<IFormData>({
        defaultValues: getCreateCaseDialogFormValidationDefaultValues(),
        resolver: yupResolver<IFormData>(createCaseDialogFormValidationSchema),
    });

    const {
        formState: { errors, isValid },
    } = createCaseFormMethods;

    const isFormValid = isObjectEmpty(errors) && isValid;

    const activeDirectory = useSelector((state: AppState) => state.activeDirectory);
    const userId = useSelector((state: AppState) => state.user?.profile.sub);

    const handleCreateNewCase = ({ caseName, description, caseFile }: IFormData): void => {
        const uploadingCase: UploadingElement = {
            // @ts-expect-error: TODO wrong ID here
            id: keyGenerator(),
            elementName: caseName,
            directory: activeDirectory,
            type: ElementType.CASE,
            owner: userId,
            lastModifiedBy: userId,
            uploading: true,
        };

        // @ts-expect-error TODO: manage null cases here
        createCase(caseName, description ?? '', caseFile, activeDirectory)
            .then(onClose)
            .catch((err) => {
                if (handleMaxElementsExceededError(err, snackError)) {
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
            });
        // the uploadingCase ghost element will be removed when directory content updated by fetch
        dispatch(addUploadingElement(uploadingCase));
    };

    return (
        <CustomMuiDialog
            titleId="ImportNewCase"
            formSchema={createCaseDialogFormValidationSchema}
            formMethods={createCaseFormMethods}
            removeOptional
            open={open}
            onClose={onClose}
            onSave={handleCreateNewCase}
            disabledSave={!isFormValid}
            confirmationMessageKey={confidentialityWarningKey}
        >
            <Grid container spacing={2} marginTop="auto" direction="column">
                <Grid item>
                    <PrefilledNameInput
                        name={FieldConstants.CASE_NAME}
                        label="nameProperty"
                        elementType={ElementType.CASE}
                    />
                </Grid>
                <Grid item>
                    <DescriptionField />
                </Grid>
            </Grid>
            <ErrorInput name={FieldConstants.CASE_FILE} InputField={FieldErrorAlert} />
            <UploadNewCase />
        </CustomMuiDialog>
    );
};

export default CreateCaseDialog;
