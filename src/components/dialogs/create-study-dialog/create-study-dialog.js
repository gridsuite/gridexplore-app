/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Alert,
    Grid,
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import TextFieldInput from '../commons/text-field-input';
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
import { ElementType } from '../../../utils/elementType';
import DirectorySelect from './directory-select';
import ImportParametersSection from './importParametersSection';
import { useDispatch, useSelector } from 'react-redux';
import { keyGenerator } from '../../../utils/functions';
import { useSnackMessage } from '@gridsuite/commons-ui';
import {
    addUploadingElement,
    removeUploadingElement,
    setActiveDirectory,
} from '../../../redux/actions';
import { useNameCheck } from '../commons/use-name-check';

const MAX_FILE_SIZE_IN_MO = 100;
const MAX_FILE_SIZE_IN_BYTES = MAX_FILE_SIZE_IN_MO * 1024 * 1024;

const CreateStudyDialog = ({ open, onClose, providedExistingCase }) => {
    const intl = useIntl();
    const { snackError } = useSnackMessage();
    const dispatch = useDispatch();

    // States
    const [isCreationAllowed, setIsCreationAllowed] = useState(false);
    const [studyName, setStudyName] = useState('');
    const [studyNameChanged, setStudyNameChanged] = useState(false);
    const [description, setDescription] = useState('');

    const [caseFile, setCaseFile] = useState(null);
    const [caseFileLoading, setCaseFileLoading] = useState(false);
    const [caseFileError, setCaseFileError] = useState('');
    const [caseUuid, setCaseUuid] = useState('');

    const [currentParams, setCurrentParams] = useState({});
    const [formattedCaseParams, setFormattedCaseParams] = useState([]);

    const [apiCallError, setApiCallError] = useState('');

    const activeDirectory = useSelector((state) => state.activeDirectory);
    const selectedDirectory = useSelector((state) => state.selectedDirectory);
    const userId = useSelector((state) => state.user.profile.sub);

    // Functions
    const handleApiCallError = useCallback(
        (error) => {
            if (error.status === HTTP_UNPROCESSABLE_ENTITY_STATUS) {
                setApiCallError(
                    intl.formatMessage({ id: 'invalidFormatOrName' })
                );
            } else if (error.message.includes(HTTP_CONNECTION_FAILED_MESSAGE)) {
                setApiCallError(
                    intl.formatMessage({ id: 'serverConnectionFailed' })
                );
            } else {
                setApiCallError(error.message);
            }
        },
        [intl]
    );

    const getCurrentCaseImportParams = useCallback(
        (uuid) => {
            getCaseImportParameters(uuid)
                .then(({ parameters = [] }) => {
                    setFormattedCaseParams(
                        parameters.map((parameter) => ({
                            ...parameter,
                            possibleValues: parameter.possibleValues?.sort(
                                (a, b) => a.localeCompare(b)
                            ),
                        }))
                    );
                })
                .catch(() => {
                    setFormattedCaseParams([]);
                    setApiCallError(
                        intl.formatMessage({ id: 'parameterLoadingProblem' })
                    );
                });
        },
        [intl]
    );

    // handle check studyName
    const [studyNameAdornment, studyNameError, studyNameChecking] =
        useNameCheck({
            name: studyName,
            nameChanged: studyNameChanged,
            elementType: ElementType.STUDY,
        });

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

    const handleCreateNewStudy = () => {
        //We don't do anything if the checks are not over or the name is not valid
        if (!caseUuid && !providedExistingCase?.elementUuid) {
            setApiCallError(intl.formatMessage({ id: 'caseNameErrorMsg' }));
            return;
        }
        if (!caseUuid && !providedExistingCase) {
            setApiCallError(intl.formatMessage({ id: 'uploadErrorMsg' }));
            return;
        }

        const uploadingStudy = {
            id: keyGenerator(),
            elementName: studyName,
            directory: activeDirectory,
            type: 'STUDY',
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
            currentParams ? JSON.stringify(currentParams) : ''
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
                setCaseUuid(null);
                dispatch(removeUploadingElement(uploadingStudy));
            });

        dispatch(addUploadingElement(uploadingStudy));
    };

    const handleCaseFileUpload = (event) => {
        event.preventDefault();

        setCaseFileError('');

        const files = event.target.files;
        if (files?.length) {
            const currentFile = files[0];

            if (currentFile.size <= MAX_FILE_SIZE_IN_BYTES) {
                setCaseFileLoading(true);
                setCaseFile(currentFile);

                // Create new case
                createCaseWithoutDirectoryElementCreation(currentFile)
                    .then((newCaseUuid) => {
                        setCaseUuid((prevCaseUuid) => {
                            if (prevCaseUuid && prevCaseUuid !== newCaseUuid) {
                                deleteCase(prevCaseUuid)
                                    .then()
                                    .catch((error) =>
                                        handleApiCallError(error)
                                    );
                            }

                            return newCaseUuid;
                        });

                        getCurrentCaseImportParams(newCaseUuid);
                    })
                    .catch(() => {
                        handleApiCallError(apiCallError);
                    })
                    .finally(() => {
                        setCaseFileLoading(false);
                    });
            } else {
                setCaseFileError(
                    intl.formatMessage(
                        {
                            id: 'uploadFileExceedingLimitSizeErrorMsg',
                        },
                        {
                            maxSize: MAX_FILE_SIZE_IN_MO,
                            br: <br />,
                        }
                    )
                );
            }
        }
    };

    const handleParamsChange = (paramName, value, isEdit) => {
        if (!isEdit) {
            setCurrentParams((prevCurrentParameters) => ({
                ...prevCurrentParameters,
                ...{ [paramName]: value },
            }));
        }
    };

    /* Effects */
    // handle create study from existing case
    useEffect(() => {
        if (providedExistingCase) {
            const { elementUuid } = providedExistingCase;
            setCaseFile(providedExistingCase);

            setCaseUuid(elementUuid);
            getCurrentCaseImportParams(elementUuid);
        }
    }, [getCurrentCaseImportParams, providedExistingCase]);

    // handle set study name
    useEffect(() => {
        if (caseFile && !apiCallError && !caseFileError) {
            const { name: caseFileName } = caseFile;

            if (caseFileName) {
                setStudyName(
                    caseFileName.substring(0, caseFileName.indexOf('.'))
                );
            }
        }

        if (providedExistingCase) {
            const { elementName: existingCaseName } = providedExistingCase;
            setStudyName(existingCaseName);
        }
    }, [caseFile, apiCallError, caseFileError, providedExistingCase]);

    // handle change possibility to create new study
    useEffect(() => {
        setIsCreationAllowed(
            !!studyName &&
                formattedCaseParams.length &&
                !caseFileLoading &&
                !studyNameChecking &&
                !studyNameError &&
                !apiCallError
        );
    }, [
        caseFileLoading,
        formattedCaseParams.length,
        studyName,
        studyNameChecking,
        apiCallError,
        studyNameError,
    ]);

    return (
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
                <TextFieldInput
                    label={'nameProperty'}
                    value={studyName}
                    setValue={setStudyName}
                    error={!!studyNameError}
                    autoFocus
                    adornment={studyNameAdornment}
                    setValueHasChanged={setStudyNameChanged}
                />
                <TextFieldInput
                    label={'descriptionProperty'}
                    value={description}
                    setValue={setDescription}
                />
                {studyNameError && (
                    <Alert severity="error">{studyNameError}</Alert>
                )}
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
                    currentParameters={currentParams}
                    formatWithParameters={formattedCaseParams}
                />
                <Grid pt={1}>
                    {!!apiCallError && (
                        <Alert severity="error">{apiCallError}</Alert>
                    )}
                    {caseFileError && (
                        <Alert severity="error">{caseFileError}</Alert>
                    )}
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCancelStudyCreation}>
                    <FormattedMessage id="cancel" />
                </Button>
                <Button
                    onClick={handleCreateNewStudy}
                    disabled={!isCreationAllowed}
                    variant="outlined"
                >
                    <FormattedMessage id="validate" />
                </Button>
            </DialogActions>
        </Dialog>
    );
};

CreateStudyDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    providedExistingCase: PropTypes.any,
};

export default CreateStudyDialog;
