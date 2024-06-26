/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useForm } from 'react-hook-form';
import { Box, Grid } from '@mui/material';
import { useIntl } from 'react-intl';
import { useCallback, useEffect } from 'react';
import UploadNewCase from '../commons/upload-new-case';
import {
    createStudy,
    deleteCase,
    getCaseImportParameters,
} from '../../../utils/rest-api';
import {
    HTTP_CONNECTION_FAILED_MESSAGE,
    HTTP_UNPROCESSABLE_ENTITY_STATUS,
} from '../../../utils/UIconstants';
import {
    useSnackMessage,
    ErrorInput,
    FieldErrorAlert,
    ExpandingTextField,
    ElementType,
    CustomMuiDialog,
    FieldConstants,
    isObjectEmpty,
    keyGenerator,
    ModifyElementSelection,
} from '@gridsuite/commons-ui';
import { useDispatch, useSelector } from 'react-redux';
import ImportParametersSection from './importParametersSection';
import {
    addUploadingElement,
    removeUploadingElement,
    setActiveDirectory,
} from '../../../redux/actions';
import {
    createStudyDialogFormValidationSchema,
    getCreateStudyDialogFormDefaultValues,
} from './create-study-dialog-utils';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import PrefilledNameInput from '../commons/prefilled-name-input';
import { handleMaxElementsExceededError } from '../../utils/rest-errors';

const STRING_LIST = 'STRING_LIST';

function customizeCurrentParameters(params) {
    return params.reduce((obj, parameter) => {
        // we check if the parameter is for extensions. If so, we select all possible values by default.
        // the only way for the moment to check if the parameter is for extension, is by checking his name.
        //TODO: implement a cleaner way to determine the extensions field
        if (
            parameter.type === STRING_LIST &&
            parameter.name?.endsWith('extensions')
        ) {
            obj[parameter.name] = parameter.possibleValues.toString();
        }
        return obj;
    }, {});
}

function formatCaseImportParameters(params) {
    // sort possible values alphabetically to display select options sorted
    return params?.map((parameter) => {
        parameter.possibleValues = parameter.possibleValues?.sort((a, b) =>
            a.localeCompare(b)
        );
        return parameter;
    });
}

const CreateStudyDialog = ({ open, onClose, providedExistingCase }) => {
    const intl = useIntl();
    const { snackError } = useSnackMessage();
    const dispatch = useDispatch();

    const activeDirectory = useSelector((state) => state.activeDirectory);
    const selectedDirectory = useSelector((state) => state.selectedDirectory);
    const userId = useSelector((state) => state.user.profile.sub);

    const { elementUuid, elementName } = providedExistingCase || {};

    const createStudyFormMethods = useForm({
        defaultValues: getCreateStudyDialogFormDefaultValues({
            directory: activeDirectory,
            studyName: elementName,
            caseFile: providedExistingCase,
            caseUuid: elementUuid,
        }),
        resolver: yupResolver(createStudyDialogFormValidationSchema),
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
        (error) => {
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
        (uuid) => {
            getCaseImportParameters(uuid)
                .then((result) => {
                    const formattedParams = formatCaseImportParameters(
                        result.parameters
                    );
                    setValue(
                        FieldConstants.CURRENT_PARAMETERS,
                        customizeCurrentParameters(formattedParams)
                    );

                    setValue(
                        FieldConstants.FORMATTED_CASE_PARAMETERS,
                        formattedParams,
                        {
                            shouldDirty: true,
                        }
                    );
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
    }) => {
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

        const uploadingStudy = {
            id: keyGenerator(),
            elementName: studyName,
            directory,
            type: ElementType.STUDY,
            owner: userId,
            lastModifiedBy: userId,
            uploading: true,
            caseFormat,
        };

        createStudy(
            studyName,
            description,
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
                if (handleMaxElementsExceededError(error, snackError)) {
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
                dispatch(removeUploadingElement(uploadingStudy));
            });

        dispatch(addUploadingElement(uploadingStudy));
    };

    /* Effects */
    // handle create study from existing case
    useEffect(() => {
        if (providedExistingCase) {
            const { elementUuid } = providedExistingCase;
            getCurrentCaseImportParams(elementUuid);
        }
    }, [getCurrentCaseImportParams, providedExistingCase, setValue]);

    return (
        <CustomMuiDialog
            titleId={'createNewStudy'}
            formSchema={createStudyDialogFormValidationSchema}
            formMethods={createStudyFormMethods}
            removeOptional={true}
            open={open}
            onClose={onClose}
            onSave={handleCreateNewStudy}
            onCancel={handleDeleteCase}
            disabledSave={!isFormValid}
        >
            <Grid container spacing={2} marginTop={'auto'} direction="column">
                <Grid item>
                    <PrefilledNameInput
                        name={FieldConstants.STUDY_NAME}
                        label={'nameProperty'}
                        elementType={ElementType.STUDY}
                    />
                </Grid>
                <Grid item>
                    <Box>
                        <ExpandingTextField
                            name={FieldConstants.DESCRIPTION}
                            label={'descriptionProperty'}
                            minRows={3}
                            rows={5}
                        />
                    </Box>
                </Grid>
            </Grid>
            {providedExistingCase ? (
                <ModifyElementSelection
                    elementType={ElementType.DIRECTORY}
                    dialogOpeningButtonLabel={'showSelectDirectoryDialog'}
                    dialogTitleLabel={'selectDirectoryDialogTitle'}
                    dialogMessageLabel={'moveItemContentText'}
                />
            ) : (
                <UploadNewCase
                    isNewStudyCreation={true}
                    getCurrentCaseImportParams={getCurrentCaseImportParams}
                    handleApiCallError={handleApiCallError}
                />
            )}
            <ImportParametersSection />
            <Grid pt={1}>
                <ErrorInput
                    name={FieldConstants.API_CALL}
                    InputField={FieldErrorAlert}
                />
                <ErrorInput
                    name={FieldConstants.CASE_FILE}
                    InputField={FieldErrorAlert}
                />
            </Grid>
        </CustomMuiDialog>
    );
};

export default CreateStudyDialog;
