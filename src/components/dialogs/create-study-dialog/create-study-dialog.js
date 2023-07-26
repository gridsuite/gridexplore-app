/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';

import { useDispatch, useSelector } from 'react-redux';
import {
    addUploadingElement,
    removeSelectedCase,
    removeUploadingElement,
    selectCase,
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

    const [createStudyErr, setCreateStudyErr] = useState('');

    const userId = useSelector((state) => state.user.profile.sub);
    const { activeDirectory, selectedDirectory, selectedCase } = useSelector(
        (state) => state
    );

    const oldTempCaseUuid = useRef(null);

    const [tempCaseUuid, setTempCaseUuid] = useState(null);
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

    const [isUploadingFileInProgress, setUploadingFileInProgress] =
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

    const [description, DescriptionField] = useTextValue({
        label: 'descriptionProperty',
        style: {
            width: '90%',
        },
    });

    const studyNameRef = useRef(studyName);

    useEffect(() => {
        studyNameRef.current = studyName;
    }, [studyName]);

    const [isParamsDisplayed, setIsParamsDisplayed] = useState(false);
    const [currentParameters, setCurrentParameters] = useState({});
    const [formatWithParameters, setFormatWithParameters] = useState([]);
    const onParametersChange = useCallback((paramName, value, isEdit) => {
        if (!isEdit) {
            setCurrentParameters((prevCurrentParameters) => ({
                ...prevCurrentParameters,
                ...{ [paramName]: value },
            }));
        }
    }, []);

    const handleShowParametersClick = () => {
        setIsParamsDisplayed((oldValue) => !oldValue);
    };

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

    const getCaseImportParams = useCallback(
        (caseUuid, setFormatWithParameters) => {
            getCaseImportParameters(caseUuid)
                .then((result) => {
                    // sort possible values alphabetically to display select options sorted
                    setFormatWithParameters({
                        ...result,
                        parameters: result.parameters?.map((parameter) => ({
                            ...parameter,
                            possibleValues: parameter.possibleValues?.sort(
                                (a, b) => a.localeCompare(b)
                            ),
                        })),
                    });
                })
                .catch(() => {
                    setFormatWithParameters([]);
                    setCreateStudyErr(
                        intl.formatMessage({ id: 'parameterLoadingProblem' })
                    );
                });
        },
        [intl]
    );

    const handleFileUploadError = useCallback(
        (error, setCreateStudyErr) => {
            if (error.status === HTTP_UNPROCESSABLE_ENTITY_STATUS) {
                setCreateStudyErr(
                    intl.formatMessage({ id: 'invalidFormatOrName' })
                );
            } else if (error.message.includes(HTTP_CONNECTION_FAILED_MESSAGE)) {
                setCreateStudyErr(
                    intl.formatMessage({ id: 'serverConnectionFailed' })
                );
            } else {
                setCreateStudyErr(error.message);
            }
        },
        [intl]
    );

    useEffect(() => {
        if (!open) {
            setTempCaseUuid(null);
        }
    }, [open]);

    useEffect(() => {
        if (oldTempCaseUuid.current !== tempCaseUuid) {
            if (oldTempCaseUuid.current) {
                deleteCase(oldTempCaseUuid.current)
                    .then()
                    .catch((error) =>
                        handleFileUploadError(error, setCreateStudyErr)
                    );
            }
            oldTempCaseUuid.current = tempCaseUuid;
        }
    }, [tempCaseUuid, handleFileUploadError]);

    usePrefillNameField({
        nameRef: studyNameRef,
        selectedFile: providedExistingCase ?? providedCaseFile,
        setValue: setStudyName,
        selectedFileOk: providedCaseFileOk,
        fileError: createStudyErr,
        fileCheckedCase: fileCheckedCase,
        touched: touched,
    });

    //Inits the dialog
    useEffect(() => {
        if (open && providedExistingCase) {
            dispatch(selectCase(providedExistingCase.elementUuid));
            getCaseImportParams(
                providedExistingCase.elementUuid,
                setFormatWithParameters
            );
        } else if (open && providedCaseFile) {
            setUploadingFileInProgress(true);
            createCaseWithoutDirectoryElementCreation(providedCaseFile)
                .then((caseUuid) => {
                    setTempCaseUuid(caseUuid);
                    getCaseImportParams(caseUuid, setFormatWithParameters);
                    setCreateStudyErr('');
                })
                .catch((error) => {
                    setTempCaseUuid(null);
                    handleFileUploadError(error, setCreateStudyErr);
                    dispatch(selectFile(null));
                    setFormatWithParameters([]);
                    setProvidedCaseFileOk(false);
                })
                .finally(() => {
                    setUploadingFileInProgress(false);
                    setFileCheckedCase(true);
                });
        }
    }, [
        open,
        dispatch,
        selectedDirectory?.elementName,
        providedExistingCase,
        providedCaseFile,
        getCaseImportParams,
        handleFileUploadError,
        setStudyName,
        setProvidedCaseFileOk,
    ]);

    const handleCloseDialog = () => {
        // if we have an oldTempCaseUuid here that means we cancelled the creation,
        // so we need to delete the associated newly created case (if we created one)
        if (providedCaseFile && oldTempCaseUuid.current) {
            deleteCase(oldTempCaseUuid.current)
                .then()
                .catch((error) =>
                    handleFileUploadError(error, setCreateStudyErr)
                );
        }
        dispatch(setActiveDirectory(selectedDirectory?.elementUuid));
        dispatch(removeSelectedCase());
        resetProvidedCaseFile();
        onClose();
    };

    const handleCreateNewStudy = () => {
        //To manage the case when we never tried to enter a name
        if (studyName === '') {
            setCreateStudyErr(intl.formatMessage({ id: 'nameEmpty' }));
            return;
        }
        //We don't do anything if the checks are not over or the name is not valid
        if (!studyNameOk) {
            return;
        }
        if (!!providedExistingCase && selectedCase === null) {
            setCreateStudyErr(intl.formatMessage({ id: 'caseNameErrorMsg' }));
            return;
        }
        if (!providedExistingCase && providedCaseFile === null) {
            setCreateStudyErr(intl.formatMessage({ id: 'uploadErrorMsg' }));
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
            selectedCase ?? tempCaseUuid,
            !!providedExistingCase,
            activeDirectory,
            currentParameters && isParamsDisplayed
                ? JSON.stringify(currentParameters)
                : ''
        )
            .then(() => {
                oldTempCaseUuid.current = null;
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
                setTempCaseUuid(null);
                dispatch(removeUploadingElement(uploadingStudy));
            });
        dispatch(addUploadingElement(uploadingStudy));
    };

    const handleSelectFolder = () => {
        setFolderSelectorOpen(true);
    };

    const handleSelectedDirectoryToCreateStudy = (directory) => {
        if (directory.length > 0) {
            dispatch(setActiveDirectory(directory[0].id));
        }
        setFolderSelectorOpen(false);
    };

    const isCreationAllowed = () => {
        return !(
            studyName === '' ||
            !studyNameOk ||
            !!formatWithParameters.length ||
            (!providedExistingCase && !providedCaseFileOk) ||
            isUploadingFileInProgress
        );
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
                            handleSelectFolder={handleSelectFolder}
                            activeDirectoryName={activeDirectoryName}
                            open={folderSelectorOpen}
                            onClose={handleSelectedDirectoryToCreateStudy}
                            types={[ElementType.DIRECTORY]}
                        />
                    )}
                    <ImportParametersSection
                        currentParameters={currentParameters}
                        onChange={onParametersChange}
                        isParamsDisplayed={isParamsDisplayed}
                        handleShowParametersClick={handleShowParametersClick}
                        formatWithParameters={formatWithParameters}
                    />
                    {createStudyErr !== '' && (
                        <Alert
                            style={{
                                marginTop: '10px',
                            }}
                            severity="error"
                        >
                            {createStudyErr}
                        </Alert>
                    )}
                    {providedCaseFileError && (
                        <Alert severity="error">{providedCaseFileError}</Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => handleCloseDialog()}>
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
