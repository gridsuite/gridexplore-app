/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';

import { useDispatch, useSelector } from 'react-redux';
import {
    addUploadingElement,
    removeUploadingElement,
    setActiveDirectory,
} from '../../../redux/actions';

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Alert,
    InputAdornment,
    CircularProgress,
} from '@mui/material';

import {
    createCaseWithoutDirectoryElementCreation,
    createStudy,
    deleteCase,
    elementExists,
    fetchPath,
    getCaseImportParameters,
} from '../../../utils/rest-api';

import { useSnackMessage } from '@gridsuite/commons-ui';
import { ElementType } from '../../../utils/elementType';
import { keyGenerator } from '../../../utils/functions.js';
import {
    HTTP_CONNECTION_FAILED_MESSAGE,
    HTTP_UNPROCESSABLE_ENTITY_STATUS,
} from '../../../utils/UIconstants.js';
import ImportParametersSection from './importParametersSection';
import DirectorySelect from './directory-select';
import { UploadCase } from '../upload-case';
import CheckIcon from '@mui/icons-material/Check';
import TextFieldInput from '../commons/text-field-input';
import CreateStudyDialogError from './create-study-dialog-error';

/**
 * Dialog to create a study
 * @param {Boolean} open Is the dialog open ?
 * @param {EventListener} onClose Event to close the dialog
 * @param providedExistingCase
 */
export const CreateStudyDialog = ({ open, onClose, providedExistingCase }) => {
    const intl = useIntl();
    const { snackError } = useSnackMessage();
    const dispatch = useDispatch();

    const [selectedCase, setSelectedCase] = useState(null);
    const [caseUuid, setCaseUuid] = useState(null);

    const [providedCaseFile, setProvidedCaseFile] = useState(null);
    const [providedCaseFileOk, setProvidedCaseFileOk] = useState(false);
    const [providedCaseFileError, setProvidedCaseFileError] = useState('');
    const [providedCaseFileChecking, setProvidedCaseFileChecking] =
        useState(false);
    const [
        providedCaseFileCheckingAdornment,
        setProvidedCaseFileCheckingAdornment,
    ] = useState(null);

    const [folderSelectorOpen, setFolderSelectorOpen] = useState(false);
    const [activeDirectoryName, setActiveDirectoryName] = useState(null);

    const [areParamsDisplayed, setAreParamsDisplayed] = useState(false);
    const [formattedParams, setFormattedParams] = useState([]);
    const [currentParams, setCurrentParams] = useState({});

    const [isUploadingFileInProgress, setIsUploadingFileInProgress] =
        useState(false);

    const [fileCheckedCase, setFileCheckedCase] = useState(
        !!providedExistingCase
    );

    const [studyName, setStudyName] = useState('');
    const [isStudyNameChanged, setIsStudyNameChanged] = useState(false);
    const [studyNameError, setStudyNameError] = useState('');

    const [description, setDescription] = useState('');

    const [error, setError] = useState('');

    const userId = useSelector((state) => state.user.profile.sub);
    const selectedDirectory = useSelector((state) => state.selectedDirectory);
    const activeDirectory = useSelector((state) => state.activeDirectory);

    const isElementExists = useCallback(
        (name) => elementExists(activeDirectory, name, ElementType.STUDY),
        [activeDirectory]
    );

    const studyNameOk =
        studyName?.replace(/ /g, '') !== '' &&
        !studyNameError &&
        !providedCaseFileChecking;

    const selectedFile = providedExistingCase ?? providedCaseFile;

    const handleFileUploadError = useCallback(
        (error) => {
            if (error.status === HTTP_UNPROCESSABLE_ENTITY_STATUS) {
                setError(intl.formatMessage({ id: 'invalidFormatOrName' }));
            } else if (error.message.includes(HTTP_CONNECTION_FAILED_MESSAGE)) {
                setError(intl.formatMessage({ id: 'serverConnectionFailed' }));
            } else {
                setError(error.message);
            }
        },
        [intl]
    );

    const getCurrentCaseImportParams = useCallback(
        (caseUuid, setFormatWithParameters) => {
            getCaseImportParameters(caseUuid)
                .then(({ parameters = [] }) => {
                    // sort possible values alphabetically to display select options sorted
                    setFormatWithParameters(
                        parameters?.map((parameter) => ({
                            ...parameter,
                            possibleValues: parameter.possibleValues?.sort(
                                (a, b) => a.localeCompare(b)
                            ),
                        }))
                    );
                })
                .catch(() => {
                    setFormatWithParameters([]);
                    setError(
                        intl.formatMessage({ id: 'parameterLoadingProblem' })
                    );
                });
        },
        [intl]
    );

    /* Functions */
    const handleCreateNewStudy = () => {
        //To manage the case when we never tried to enter a name
        if (studyName === '') {
            setError(intl.formatMessage({ id: 'nameEmpty' }));
            return;
        }
        //We don't do anything if the checks are not over or the name is not valid
        if (!studyNameOk) {
            return;
        }
        if (!!providedExistingCase && selectedCase === null) {
            setError(intl.formatMessage({ id: 'caseNameErrorMsg' }));
            return;
        }
        if (!providedExistingCase && providedCaseFile === null) {
            setError(intl.formatMessage({ id: 'uploadErrorMsg' }));
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
            selectedCase ?? caseUuid,
            !!providedExistingCase,
            activeDirectory,
            currentParams && areParamsDisplayed
                ? JSON.stringify(currentParams)
                : ''
        )
            .then(() => {
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

    const isCreationAllowed = () => {
        return !(
            studyName === '' ||
            !studyNameOk ||
            !formattedParams.length ||
            (!providedExistingCase && !providedCaseFileOk) ||
            isUploadingFileInProgress
        );
    };

    const handleDeleteCase = () => {
        // if we cancel case creation, we need to delete the associated newly created case (if we created one)
        if (providedCaseFile && caseUuid) {
            deleteCase(caseUuid)
                .then()
                .catch((error) => handleFileUploadError(error));
            setCaseUuid(null);
        }
    };

    const handleCloseDialog = (_, reason) => {
        if (reason && reason === 'backdropClick') {
            handleDeleteCase();
        }

        dispatch(setActiveDirectory(selectedDirectory?.elementUuid));
        setSelectedCase(null);
        setProvidedCaseFile(null);
        onClose();
    };

    const handleCancelCreation = () => {
        handleDeleteCase();
        handleCloseDialog();
    };

    /* Effects */
    //Updates the path display
    useEffect(() => {
        if (activeDirectory) {
            fetchPath(activeDirectory).then((res) => {
                setActiveDirectoryName(
                    res
                        .map((element) => element.elementName.trim())
                        .reverse()
                        .join('/')
                );
            });
        }
    }, [activeDirectory]);

    // Inits the dialog
    useEffect(() => {
        setStudyNameError('');

        if (providedExistingCase) {
            setSelectedCase(providedExistingCase.elementUuid);
            getCurrentCaseImportParams(
                providedExistingCase.elementUuid,
                setFormattedParams
            );
        } else if (providedCaseFile) {
            setIsUploadingFileInProgress(true);
            createCaseWithoutDirectoryElementCreation(providedCaseFile)
                .then((newCaseUuid) => {
                    setCaseUuid((prevCaseUuid) => {
                        if (prevCaseUuid && prevCaseUuid !== newCaseUuid) {
                            deleteCase(prevCaseUuid)
                                .then()
                                .catch((error) => handleFileUploadError(error));
                        }

                        return newCaseUuid;
                    });
                    getCurrentCaseImportParams(newCaseUuid, setFormattedParams);
                    setError('');
                    setIsStudyNameChanged(false);
                })
                .catch((error) => {
                    setCaseUuid(null);
                    setProvidedCaseFile(null);
                    setFormattedParams([]);
                    setProvidedCaseFileOk(false);
                    handleFileUploadError(error);
                })
                .finally(() => {
                    setIsUploadingFileInProgress(false);
                    setFileCheckedCase(true);
                });
        }
    }, [
        getCurrentCaseImportParams,
        handleFileUploadError,
        providedCaseFile,
        providedExistingCase,
    ]);

    // setting studyName
    useEffect(() => {
        //here selectedFile is a file the user chosen through a picker
        if (
            selectedFile?.name &&
            !error &&
            providedCaseFileOk &&
            fileCheckedCase &&
            !isStudyNameChanged
        ) {
            setStudyName(
                selectedFile.name.substr(0, selectedFile.name.indexOf('.'))
            );
        }
        //here selectedFile is an already stored case
        else if (selectedFile?.elementName && !error) {
            setStudyName(selectedFile.elementName);
        } else if (!selectedFile && !isStudyNameChanged) {
            setStudyName('');
        }
    }, [
        error,
        fileCheckedCase,
        providedCaseFileOk,
        selectedFile,
        isStudyNameChanged,
        studyName,
    ]);

    // StudyName checking (using adornment on input)
    useEffect(() => {
        const nameFormatted = studyName.replace(/ /g, '');

        if (!nameFormatted || studyNameError) {
            // studyName is not valid
            setProvidedCaseFileCheckingAdornment(false);

            if (isStudyNameChanged) {
                setStudyNameError(intl.formatMessage({ id: 'nameEmpty' }));
            }
        } else {
            setProvidedCaseFileChecking(true);
            setProvidedCaseFileCheckingAdornment(
                <InputAdornment position="end">
                    <CircularProgress size="1rem" />
                </InputAdornment>
            );
            //If the studyName is not only white spaces
            isElementExists(studyName)
                .then((data) => {
                    setStudyNameError(
                        data
                            ? intl.formatMessage({
                                  id: 'nameAlreadyUsed',
                              })
                            : ''
                    );
                    setProvidedCaseFileCheckingAdornment(
                        <InputAdornment position="end">
                            <CheckIcon style={{ color: 'green' }} />
                        </InputAdornment>
                    );
                })
                .catch((error) => {
                    setStudyNameError(
                        intl.formatMessage({
                            id: 'nameValidityCheckErrorMsg',
                        }) + error.message
                    );
                    setProvidedCaseFileCheckingAdornment(false);
                })
                .finally(() => {
                    setProvidedCaseFileChecking(false);
                });
        }
    }, [intl, isElementExists, studyName, studyNameError, isStudyNameChanged]);

    return (
        <div>
            <Dialog
                fullWidth={true}
                open={open}
                onClose={handleCloseDialog}
                aria-labelledby="form-dialog-title"
            >
                <DialogTitle id="form-dialog-title">
                    <FormattedMessage id="createNewStudy" />
                </DialogTitle>
                <DialogContent>
                    <TextFieldInput
                        label={'nameProperty'}
                        value={studyName}
                        setValue={setStudyName}
                        setHasChanged={setIsStudyNameChanged}
                        autoFocus
                        adornment={providedCaseFileCheckingAdornment}
                        error={!!studyNameError}
                    />
                    <TextFieldInput
                        label={'descriptionProperty'}
                        value={description}
                        setValue={setDescription}
                    />
                    {studyNameError && (
                        <Alert severity="error">{studyNameError}</Alert>
                    )}
                    {!selectedCase ? (
                        <UploadCase
                            isLoading={isUploadingFileInProgress}
                            providedCaseFile={providedCaseFile}
                            setProvidedCaseFile={setProvidedCaseFile}
                            setProvidedCaseFileError={setProvidedCaseFileError}
                            setProvidedCaseFileOk={setProvidedCaseFileOk}
                        />
                    ) : (
                        <DirectorySelect
                            activeDirectoryName={activeDirectoryName}
                            open={folderSelectorOpen}
                            setOpen={setFolderSelectorOpen}
                            types={[ElementType.DIRECTORY]}
                        />
                    )}
                    <ImportParametersSection
                        isParamsDisplayed={areParamsDisplayed}
                        setIsParamsDisplayed={setAreParamsDisplayed}
                        currentParameters={currentParams}
                        setCurrentParameters={setCurrentParams}
                        formatWithParameters={formattedParams}
                    />
                    <CreateStudyDialogError
                        error={error}
                        providedCaseFileError={providedCaseFileError}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => handleCancelCreation()}>
                        <FormattedMessage id="cancel" />
                    </Button>
                    <Button
                        onClick={handleCreateNewStudy}
                        disabled={!isCreationAllowed()}
                        variant="outlined"
                    >
                        <FormattedMessage id="validate" />
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

CreateStudyDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    providedExistingCase: PropTypes.any,
};

export default CreateStudyDialog;
