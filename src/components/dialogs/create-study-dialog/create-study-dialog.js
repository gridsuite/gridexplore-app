/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';

import { useDispatch, useSelector } from 'react-redux';
import {
    addUploadingElement,
    removeUploadingElement,
    selectFile,
    setActiveDirectory,
} from '../../../redux/actions';

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Alert,
} from '@mui/material';

import {
    createCaseWithoutDirectoryElementCreation,
    createStudy,
    deleteCase,
    fetchPath,
    getCaseImportParameters,
} from '../../../utils/rest-api';

import {
    useFileValue,
    useNameField,
    usePrefillNameField,
    useTextValue,
} from '../field-hook';

import { useSnackMessage } from '@gridsuite/commons-ui';
import { ElementType } from '../../../utils/elementType';
import { keyGenerator } from '../../../utils/functions.js';
import {
    HTTP_CONNECTION_FAILED_MESSAGE,
    HTTP_UNPROCESSABLE_ENTITY_STATUS,
} from '../../../utils/UIconstants.js';
import ImportParametersSection from './importParametersSection';
import DirectorySelect from './directory-select';

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
    const [error, setError] = useState('');

    const userId = useSelector((state) => state.user.profile.sub);
    const { activeDirectory, selectedDirectory } = useSelector(
        (state) => state
    );

    const [folderSelectorOpen, setFolderSelectorOpen] = useState(false);
    const [activeDirectoryName, setActiveDirectoryName] = useState(null);

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

    const [isUploadingFileInProgress, setIsUploadingFileInProgress] =
        useState(false);

    const [fileCheckedCase, setFileCheckedCase] = useState(
        !!providedExistingCase
    );

    const [
        studyName,
        NameField,
        nameError,
        studyNameOk,
        setStudyName,
        touched,
    ] = useNameField({
        label: 'nameProperty',
        autoFocus: true,
        elementType: ElementType.STUDY,
        parentDirectoryId: activeDirectory,
        active: open,
        style: {
            width: '90%',
        },
    });

    const [caseUuid, setCaseUuid] = useState(null);

    const [isParamsDisplayed, setIsParamsDisplayed] = useState(false);

    const [formatWithParameters, setFormatWithParameters] = useState([]);

    const [currentParameters, setCurrentParameters] = useState({});

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

    const [description, DescriptionField] = useTextValue({
        label: 'descriptionProperty',
        style: {
            width: '90%',
        },
    });

    const [
        providedCaseFile,
        FileField,
        providedCaseFileError,
        providedCaseFileOk,
        resetProvidedCaseFile,
        setProvidedCaseFileOk,
    ] = useFileValue({
        label: 'Case',
        isLoading: isUploadingFileInProgress,
    });

    usePrefillNameField({
        selectedFile: providedExistingCase ?? providedCaseFile,
        setValue: setStudyName,
        selectedFileOk: providedCaseFileOk,
        fileError: error,
        fileCheckedCase,
        touched,
    });

    //Inits the dialog
    useEffect(() => {
        if (open && providedExistingCase) {
            setSelectedCase(providedExistingCase.elementUuid);
            getCurrentCaseImportParams(
                providedExistingCase.elementUuid,
                setFormatWithParameters
            );
        } else if (open && providedCaseFile) {
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
                    getCurrentCaseImportParams(
                        newCaseUuid,
                        setFormatWithParameters
                    );
                    setError('');
                })
                .catch((error) => {
                    setCaseUuid(null);
                    handleFileUploadError(error);
                    dispatch(selectFile(null));
                    setFormatWithParameters([]);
                    setProvidedCaseFileOk(false);
                })
                .finally(() => {
                    setIsUploadingFileInProgress(false);
                    setFileCheckedCase(true);
                });
        }
    }, [
        open,
        dispatch,
        selectedDirectory?.elementName,
        providedExistingCase,
        providedCaseFile,
        getCurrentCaseImportParams,
        handleFileUploadError,
        setStudyName,
        setProvidedCaseFileOk,
    ]);
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
            currentParameters && isParamsDisplayed
                ? JSON.stringify(currentParameters)
                : ''
        )
            .then(() => {
                setCaseUuid(null);
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
            !formatWithParameters.length ||
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
        }
    };

    const handleCloseDialog = (_, reason) => {
        if (reason && reason === 'backdropClick') {
            handleDeleteCase();
        }

        dispatch(setActiveDirectory(selectedDirectory?.elementUuid));
        setSelectedCase(null);
        resetProvidedCaseFile();
        onClose();
    };

    const handleCancelCreation = () => {
        handleDeleteCase();
        handleCloseDialog();
    };

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
                    {NameField}
                    {DescriptionField}
                    {nameError && <Alert severity="error">{nameError}</Alert>}
                    {!selectedCase ? (
                        FileField
                    ) : (
                        <DirectorySelect
                            activeDirectoryName={activeDirectoryName}
                            open={folderSelectorOpen}
                            setOpen={setFolderSelectorOpen}
                            types={[ElementType.DIRECTORY]}
                        />
                    )}
                    <ImportParametersSection
                        isParamsDisplayed={isParamsDisplayed}
                        setIsParamsDisplayed={setIsParamsDisplayed}
                        currentParameters={currentParameters}
                        setCurrentParameters={setCurrentParameters}
                        formatWithParameters={formatWithParameters}
                    />
                    {error !== '' && (
                        <Alert
                            style={{
                                marginTop: '10px',
                            }}
                            severity="error"
                        >
                            {error}
                        </Alert>
                    )}
                    {providedCaseFileError && (
                        <Alert severity="error">{providedCaseFileError}</Alert>
                    )}
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
