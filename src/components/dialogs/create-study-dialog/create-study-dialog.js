/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { FormProvider, useForm } from 'react-hook-form';
import {
    Button,
    Dialog,
    DialogContent,
    DialogActions,
    DialogTitle,
    Alert,
    Grid,
} from '@mui/material';
import { FormattedMessage, useIntl } from 'react-intl';
import React, { useCallback, useEffect, useState } from 'react';
import UploadNewCase from '../commons/upload-new-case';
import {
    createCaseWithoutDirectoryElementCreation,
    createStudy,
    deleteCase,
    getCaseImportParameters,
} from '../../../utils/rest-api';
import {
    HTTP_CONNECTION_FAILED_MESSAGE,
    HTTP_UNPROCESSABLE_ENTITY_STATUS,
} from '../../../utils/UIconstants';
import { useSnackMessage } from '@gridsuite/commons-ui';
import { useDispatch, useSelector } from 'react-redux';
import ImportParametersSection from './importParametersSection';
import { ElementType } from '../../../utils/elementType';
import DirectorySelect from './directory-select';
import { useNameCheck } from '../commons/use-name-check';
import { keyGenerator } from '../../../utils/functions';
import {
    addUploadingElement,
    removeUploadingElement,
    setActiveDirectory,
} from '../../../redux/actions';
import { getCreateStudyDialogFormDefaultValues } from './create-study-dialog-utils';
import {
    API_CALL,
    CASE_FILE,
    CASE_NAME,
    CASE_UUID,
    CURRENT_PARAMETERS,
    DESCRIPTION,
    FORMATTED_CASE_PARAMETERS,
    STUDY_NAME,
} from '../../utils/field-constants';
import TextInput from '../../utils/rhf-inputs/text-input';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import yup from '../../utils/yup-config';

const MAX_FILE_SIZE_IN_MO = 100;
const MAX_FILE_SIZE_IN_BYTES = MAX_FILE_SIZE_IN_MO * 1024 * 1024;

const CreateStudyDialog = ({ open, onClose, providedExistingCase }) => {
    const intl = useIntl();
    const { snackError } = useSnackMessage();
    const dispatch = useDispatch();

    const [caseFileLoading, setCaseFileLoading] = useState(false);
    const [isCreationAllowed, setIsCreationAllowed] = useState(false);

    const activeDirectory = useSelector((state) => state.activeDirectory);
    const selectedDirectory = useSelector((state) => state.selectedDirectory);
    const userId = useSelector((state) => state.user.profile.sub);

    const schema = yup.object().shape({
        [STUDY_NAME]: yup
            .string()
            .test(
                'empty-check',
                intl.formatMessage({ id: 'nameEmpty' }),
                (studyName) => !!studyName.length
            ),
        [FORMATTED_CASE_PARAMETERS]: yup.mixed(),
        [DESCRIPTION]: yup.string(),
        [CURRENT_PARAMETERS]: yup.mixed(),
        [CASE_UUID]: yup.string(),
        [CASE_FILE]: yup.mixed(),
    });
    const createStudyFormMethods = useForm({
        mode: 'onChange',
        defaultValues: getCreateStudyDialogFormDefaultValues(),
        resolver: yupResolver(schema),
    });

    const {
        handleSubmit,
        setValue,
        formState: { errors },
        setError,
        watch,
        clearErrors,
    } = createStudyFormMethods;

    // Constants
    const caseFileErrorMessage = errors.caseFile?.message;
    const apiCallErrorMessage = errors.apiCall?.message;
    const studyNameErrorMessage = errors.studyName?.message;

    const caseFile = watch(CASE_FILE);
    const caseUuid = watch(CASE_UUID);
    const currentParameters = watch(CURRENT_PARAMETERS);
    const formattedCaseParameters = watch(FORMATTED_CASE_PARAMETERS);
    const studyName = watch(STUDY_NAME);

    // callbacks
    const handleApiCallError = useCallback(
        (error) => {
            if (error.status === HTTP_UNPROCESSABLE_ENTITY_STATUS) {
                setError(API_CALL, {
                    type: 'invalidFormatOrName',
                    message: intl.formatMessage({ id: 'invalidFormatOrName' }),
                });
            } else if (error.message.includes(HTTP_CONNECTION_FAILED_MESSAGE)) {
                setError(API_CALL, {
                    type: 'serverConnectionFailed',
                    message: intl.formatMessage({
                        id: 'serverConnectionFailed',
                    }),
                });
            } else {
                setError(API_CALL, {
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
                .then(({ parameters = [] }) => {
                    setValue(
                        FORMATTED_CASE_PARAMETERS,
                        parameters.map((parameter) => ({
                            ...parameter,
                            possibleValues: parameter.possibleValues?.sort(
                                (a, b) => a.localeCompare(b)
                            ),
                        }))
                    );
                })
                .catch(() => {
                    setValue(FORMATTED_CASE_PARAMETERS, []);
                    setError(API_CALL, {
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
        // if we cancel case creation, we need to delete the associated newly created case (if we created one)
        if (caseUuid && !providedExistingCase) {
            deleteCase(caseUuid).then().catch(handleApiCallError);
        }
    };

    const handleCloseDialog = (_, reason) => {
        if (reason && reason === 'backdropClick') {
            handleDeleteCase();
        }

        onClose();
    };

    const handleCancelStudyCreation = () => {
        handleDeleteCase();
        onClose();
    };

    const handleCreateNewStudy = ({
        caseUuid,
        studyName,
        description,
        currentParameters,
    }) => {
        if (!caseUuid && !providedExistingCase?.elementUuid) {
            setError(API_CALL, intl.formatMessage({ id: 'caseNameErrorMsg' }));
            return;
        }
        if (!caseUuid && !providedExistingCase) {
            setError(API_CALL, intl.formatMessage({ id: 'uploadErrorMsg' }));
            return;
        }

        const uploadingStudy = {
            id: keyGenerator(),
            elementName: studyName,
            directory: activeDirectory,
            type: ElementType.STUDY,
            owner: userId,
            lastModifiedBy: userId,
            uploading: true,
        };

        createStudy(
            studyName,
            description,
            caseUuid,
            !!providedExistingCase,
            activeDirectory,
            currentParameters ? JSON.stringify(currentParameters) : ''
        )
            .then(() => {
                dispatch(setActiveDirectory(selectedDirectory?.elementUuid));
                handleCloseDialog();
            })
            .catch((error) => {
                snackError({
                    messageTxt: error.message,
                    headerId: 'studyCreationError',
                    headerValues: {
                        studyName,
                    },
                });
            })

            .finally(() => {
                setValue(CASE_UUID, null);
                dispatch(removeUploadingElement(uploadingStudy));
            });

        dispatch(addUploadingElement(uploadingStudy));
    };

    const handleCaseFileUpload = (event) => {
        event.preventDefault();

        clearErrors(CASE_FILE);

        const files = event.target.files;
        if (files?.length) {
            const currentFile = files[0];

            if (currentFile.size <= MAX_FILE_SIZE_IN_BYTES) {
                setCaseFileLoading(true);
                setValue(CASE_FILE, currentFile);

                // Create new case
                createCaseWithoutDirectoryElementCreation(currentFile)
                    .then((newCaseUuid) => {
                        const prevCaseUuid =
                            createStudyFormMethods.getValues().caseUuid;

                        if (prevCaseUuid && prevCaseUuid !== newCaseUuid) {
                            deleteCase(prevCaseUuid).catch((error) =>
                                handleApiCallError(error)
                            );
                        }
                        setValue(CASE_UUID, newCaseUuid);

                        getCurrentCaseImportParams(newCaseUuid);
                    })
                    .catch(() => {
                        handleApiCallError(errors.apiCallError);
                    })
                    .finally(() => {
                        setCaseFileLoading(false);
                    });
            } else {
                setError(CASE_FILE, {
                    type: 'caseFileSize',
                    message: intl.formatMessage(
                        {
                            id: 'uploadFileExceedingLimitSizeErrorMsg',
                        },
                        {
                            maxSize: MAX_FILE_SIZE_IN_MO,
                            br: <br />,
                        }
                    ),
                });
            }
        }
    };

    const handleParamsChange = (paramName, value, isEdit) => {
        if (!isEdit) {
            setValue(CURRENT_PARAMETERS, {
                ...currentParameters,
                ...{ [paramName]: value },
            });
        }
    };

    // handle check studyName
    const [studyNameAdornment, studyNameChecking] = useNameCheck({
        field: STUDY_NAME,
        name: studyName,
        elementType: ElementType.STUDY,
        setError,
    });

    /* Effects */
    // handle create study from existing case
    useEffect(() => {
        if (providedExistingCase) {
            const { elementUuid } = providedExistingCase;
            setValue(CASE_FILE, providedExistingCase);
            setValue(CASE_UUID, elementUuid);

            getCurrentCaseImportParams(elementUuid);
        }
    }, [getCurrentCaseImportParams, providedExistingCase, setValue]);

    // handle set study name
    useEffect(() => {
        if (caseFile && !apiCallErrorMessage && !caseFileErrorMessage) {
            const { name: caseFileName } = caseFile;

            if (caseFileName) {
                clearErrors(STUDY_NAME);
                setValue(
                    STUDY_NAME,
                    caseFileName.substring(0, caseFileName.indexOf('.'))
                );
            }
        }

        if (providedExistingCase) {
            const { elementName: existingCaseName } = providedExistingCase;
            setValue(STUDY_NAME, existingCaseName);
        }
    }, [
        caseFile,
        apiCallErrorMessage,
        caseFileErrorMessage,
        providedExistingCase,
        setValue,
    ]);

    // handle change possibility to create new study
    useEffect(() => {
        setIsCreationAllowed(
            !!studyName &&
                formattedCaseParameters.length &&
                !caseFileLoading &&
                !studyNameChecking &&
                !studyNameErrorMessage &&
                !apiCallErrorMessage
        );
    }, [
        apiCallErrorMessage,
        caseFileLoading,
        formattedCaseParameters.length,
        studyName,
        studyNameChecking,
        studyNameErrorMessage,
    ]);

    return (
        <FormProvider
            {...createStudyFormMethods}
            validationSchema={schema}
            removeOptional={true}
        >
            <Dialog
                fullWidth={true}
                open={open}
                onClose={handleCloseDialog}
                aria-labelledby="create-study-form-dialog-title"
            >
                <DialogTitle id="create-study-form-dialog-title">
                    <FormattedMessage id="createNewStudy" />
                </DialogTitle>
                <DialogContent>
                    <TextInput
                        label={'nameProperty'}
                        name={STUDY_NAME}
                        customAdornment={studyNameAdornment}
                        inputProps={{
                            autoFocus: true,
                        }}
                        withMargin
                    />
                    <TextInput
                        name={DESCRIPTION}
                        label={'descriptionProperty'}
                        withMargin
                    />
                    {providedExistingCase ? (
                        <DirectorySelect types={[ElementType.DIRECTORY]} />
                    ) : (
                        <UploadNewCase
                            caseFile={caseFile}
                            caseFileLoading={caseFileLoading}
                            handleCaseFileUpload={handleCaseFileUpload}
                        />
                    )}
                    <ImportParametersSection
                        onChange={handleParamsChange}
                        currentParameters={currentParameters}
                        formatWithParameters={formattedCaseParameters}
                    />
                    <Grid pt={1}>
                        {!!apiCallErrorMessage && (
                            <Alert severity="error">
                                {apiCallErrorMessage}
                            </Alert>
                        )}
                        {caseFileErrorMessage && (
                            <Alert severity="error">
                                {caseFileErrorMessage}
                            </Alert>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelStudyCreation}>
                        <FormattedMessage id="cancel" />
                    </Button>
                    <Button
                        onClick={handleSubmit(handleCreateNewStudy)}
                        disabled={!isCreationAllowed}
                        variant="outlined"
                    >
                        <FormattedMessage id="validate" />
                    </Button>
                </DialogActions>
            </Dialog>
        </FormProvider>
    );
};

export default CreateStudyDialog;
