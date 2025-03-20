/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useForm } from 'react-hook-form';
import { Grid } from '@mui/material';
import { useIntl } from 'react-intl';
import { useCallback, useEffect } from 'react';
import {
    CustomMuiDialog,
    DescriptionField,
    ElementAttributes,
    ElementType,
    ErrorInput,
    FieldConstants,
    FieldErrorAlert,
    isObjectEmpty,
    keyGenerator,
    ModifyElementSelection,
    Parameter,
    useConfidentialityWarning,
    useSnackMessage,
} from '@gridsuite/commons-ui';
import { useDispatch, useSelector } from 'react-redux';
import { yupResolver } from '@hookform/resolvers/yup';
import { UUID } from 'crypto';
import UploadNewCase from '../commons/upload-new-case';
import { createStudy, deleteCase, getCaseImportParameters } from '../../../utils/rest-api';
import { HTTP_CONNECTION_FAILED_MESSAGE, HTTP_UNPROCESSABLE_ENTITY_STATUS } from '../../../utils/UIconstants';
import ImportParametersSection from './importParametersSection';
import { addUploadingElement, removeUploadingElement, setActiveDirectory } from '../../../redux/actions';
import {
    createStudyDialogFormValidationSchema,
    CreateStudyDialogFormValues,
    getCreateStudyDialogFormDefaultValues,
} from './create-study-dialog-utils';
import PrefilledNameInput from '../commons/prefilled-name-input';
import { handleMaxElementsExceededError, handleNotAllowedError } from '../../utils/rest-errors';
import { AppState, UploadingElement } from '../../../redux/types';

const STRING_LIST = 'STRING_LIST';

function customizeCurrentParameters(params: Parameter[]): Record<string, string> {
    return params.reduce((obj, parameter) => {
        // we check if the parameter is for extensions. If so, we select all possible values by default.
        // the only way for the moment to check if the parameter is for extension, is by checking his name.
        // TODO: implement a cleaner way to determine the extensions field
        if (parameter.type === STRING_LIST && parameter.name?.endsWith('extensions')) {
            return { ...obj, [parameter.name]: parameter.possibleValues.toString() };
        }
        return obj;
    }, {} as Record<string, string>);
}

function formatCaseImportParameters(params: Parameter[]): Parameter[] {
    // sort possible values alphabetically to display select options sorted
    return params?.map((parameter) => ({
        ...parameter,
        possibleValues: parameter.possibleValues?.sort((a: any, b: any) => a.localeCompare(b)),
    }));
}

export interface CreateStudyDialogProps {
    open: boolean;
    onClose: () => void;
    providedExistingCase?: ElementAttributes;
}

export default function CreateStudyDialog({ open, onClose, providedExistingCase }: Readonly<CreateStudyDialogProps>) {
    const intl = useIntl();
    const { snackError } = useSnackMessage();
    const dispatch = useDispatch();
    const confidentialityWarningKey = useConfidentialityWarning();

    const activeDirectory = useSelector((state: AppState) => state.activeDirectory);
    const selectedDirectory = useSelector((state: AppState) => state.selectedDirectory);
    const userId = useSelector((state: AppState) => state.user?.profile.sub);

    const { elementUuid, elementName } = providedExistingCase || {};

    const createStudyFormMethods = useForm<CreateStudyDialogFormValues>({
        defaultValues: getCreateStudyDialogFormDefaultValues({
            directory: activeDirectory,
            studyName: elementName,
            caseFile: providedExistingCase,
            caseUuid: elementUuid,
        }),
        resolver: yupResolver<CreateStudyDialogFormValues>(createStudyDialogFormValidationSchema),
    });

    const {
        setValue,
        formState: { errors, isValid },
        setError,
        getValues,
    } = createStudyFormMethods;

    const isFormValid = isObjectEmpty(errors) && isValid;

    // callbacks
    const handleApiCallError = useCallback(
        (error: any) => {
            if (error.status === HTTP_UNPROCESSABLE_ENTITY_STATUS) {
                setError(`root.${FieldConstants.API_CALL}`, {
                    type: 'invalidFormatOrName',
                    message: intl.formatMessage({ id: 'invalidFormatOrName' }),
                });
            } else if (error.message.includes(HTTP_CONNECTION_FAILED_MESSAGE)) {
                setError(`root.${FieldConstants.API_CALL}`, {
                    type: 'serverConnectionFailed',
                    message: intl.formatMessage({
                        id: 'serverConnectionFailed',
                    }),
                });
            } else {
                setError(`root.${FieldConstants.API_CALL}`, {
                    type: 'apiCall',
                    message: error.message,
                });
            }
        },
        [intl, setError]
    );

    const getCurrentCaseImportParams = useCallback(
        (uuid: UUID) => {
            getCaseImportParameters(uuid)
                .then((result) => {
                    const formattedParams = formatCaseImportParameters(result.parameters);
                    setValue(FieldConstants.CURRENT_PARAMETERS, customizeCurrentParameters(formattedParams));

                    setValue(FieldConstants.FORMATTED_CASE_PARAMETERS, formattedParams, {
                        shouldDirty: true,
                    });
                    setValue(FieldConstants.CASE_FORMAT, result.formatName);
                })
                .catch(() => {
                    setValue(FieldConstants.FORMATTED_CASE_PARAMETERS, []);
                    setValue(FieldConstants.CASE_FORMAT, '');
                    setError(`root.${FieldConstants.API_CALL}`, {
                        type: 'parameterLoadingProblem',
                        message: intl.formatMessage({
                            id: 'parameterLoadingProblem',
                        }),
                    });
                });
        },
        [intl, setError, setValue]
    );

    // Methods
    const handleDeleteCase = () => {
        const caseUuid = getValues(FieldConstants.CASE_UUID);
        // if we cancel case creation, we need to delete the associated newly created case (if we created one)
        if (caseUuid && !providedExistingCase) {
            deleteCase(caseUuid).catch(handleApiCallError);
        }
    };

    const handleCreateNewStudy = ({
        caseUuid,
        studyName,
        description,
        currentParameters,
        directory,
    }: CreateStudyDialogFormValues) => {
        if (!caseUuid && !providedExistingCase?.elementUuid) {
            setError(FieldConstants.CASE_NAME, {
                type: 'custom',
                message: intl.formatMessage({ id: 'caseNameErrorMsg' }),
            });
            return;
        }
        if (!caseUuid && !providedExistingCase) {
            setError(FieldConstants.CASE_FILE, {
                type: 'custom',
                message: intl.formatMessage({ id: 'uploadErrorMsg' }),
            });
            return;
        }
        const caseFormat = getValues(FieldConstants.CASE_FORMAT);

        const uploadingStudy: UploadingElement = {
            id: keyGenerator()(),
            elementName: studyName,
            directory,
            type: ElementType.STUDY,
            owner: userId,
            lastModifiedBy: userId,
            uploading: true,
            caseFormat,
        };

        if (caseFormat && caseUuid) {
            createStudy(
                studyName,
                description ?? '',
                caseUuid,
                !!providedExistingCase,
                directory,
                currentParameters ? JSON.stringify(currentParameters) : '',
                caseFormat
            )
                .then(() => {
                    dispatch(setActiveDirectory(selectedDirectory?.elementUuid));
                    onClose();
                })
                .catch((error) => {
                    dispatch(removeUploadingElement(uploadingStudy));
                    if (handleMaxElementsExceededError(error, snackError)) {
                        return;
                    }
                    if (handleNotAllowedError(error, snackError)) {
                        return;
                    }
                    snackError({
                        messageTxt: error.message,
                        headerId: 'studyCreationError',
                        headerValues: {
                            studyName,
                        },
                    });
                })
                .finally(() => {
                    setValue(FieldConstants.CASE_UUID, null);
                });

            // the uploadingStudy ghost element will be removed when directory
            // content updated by fetch
            dispatch(addUploadingElement(uploadingStudy));
        }
    };

    /* Effects */
    // handle create study from existing case
    useEffect(() => {
        if (providedExistingCase) {
            getCurrentCaseImportParams(providedExistingCase.elementUuid);
        }
    }, [getCurrentCaseImportParams, providedExistingCase, setValue]);

    return (
        <CustomMuiDialog
            titleId="createNewStudy"
            formSchema={createStudyDialogFormValidationSchema}
            formMethods={createStudyFormMethods}
            removeOptional
            open={open}
            onClose={onClose}
            onSave={handleCreateNewStudy}
            onCancel={handleDeleteCase}
            disabledSave={!isFormValid}
            confirmationMessageKey={confidentialityWarningKey}
        >
            <Grid container spacing={2} marginTop="auto" direction="column">
                <Grid item>
                    <PrefilledNameInput
                        name={FieldConstants.STUDY_NAME}
                        label="nameProperty"
                        elementType={ElementType.STUDY}
                    />
                </Grid>
                <Grid item>
                    <DescriptionField />
                </Grid>
            </Grid>
            {providedExistingCase ? (
                <ModifyElementSelection
                    elementType={ElementType.DIRECTORY}
                    dialogOpeningButtonLabel="showSelectDirectoryDialog"
                    dialogTitleLabel="selectDirectoryDialogTitle"
                    dialogMessageLabel="moveItemContentText"
                />
            ) : (
                <UploadNewCase
                    isNewStudyCreation
                    getCurrentCaseImportParams={getCurrentCaseImportParams}
                    handleApiCallError={handleApiCallError}
                />
            )}
            <ImportParametersSection />
            <Grid pt={1}>
                <ErrorInput name={FieldConstants.API_CALL} InputField={FieldErrorAlert} />
                <ErrorInput name={FieldConstants.CASE_FILE} InputField={FieldErrorAlert} />
            </Grid>
        </CustomMuiDialog>
    );
}
