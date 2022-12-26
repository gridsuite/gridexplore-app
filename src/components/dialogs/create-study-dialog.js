/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

import makeStyles from '@mui/styles/makeStyles';
import CheckIcon from '@mui/icons-material/Check';
import SettingsIcon from '@mui/icons-material/Settings';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Alert from '@mui/material/Alert';
import DirectorySelector from './directory-selector.js';
import {
    createCaseWithoutDirectoryElementCreation,
    createStudy,
    deleteCase,
    fetchCases,
    fetchPath,
    getCaseImportParameters,
} from '../../utils/rest-api';
import { FormattedMessage, useIntl } from 'react-intl';

import { useDispatch, useSelector } from 'react-redux';
import {
    loadCasesSuccess,
    selectCase,
    removeSelectedCase,
    setActiveDirectory,
    addUploadingElement,
    removeUploadingElement,
    selectFile,
} from '../../redux/actions';
import { store } from '../../redux/store';
import PropTypes from 'prop-types';
import { useSnackMessage } from '@gridsuite/commons-ui';
import { ElementType } from '../../utils/elementType';
import {
    useFileValue,
    useNameField,
    useTextValue,
    usePrefillNameField,
} from './field-hook';
import { keyGenerator } from '../../utils/functions.js';
import { Divider, Grid } from '@mui/material';
import { useImportExportParams } from '@gridsuite/commons-ui';
import {
    HTTP_CONNECTION_FAILED_MESSAGE,
    HTTP_UNPROCESSABLE_ENTITY_STATUS,
} from '../../utils/UIconstants.js';

const useStyles = makeStyles((theme) => ({
    addIcon: {
        fontSize: '64px',
    },
    addButtonArea: {
        height: '136px',
    },
    paramDivider: {
        marginTop: theme.spacing(2),
    },
    advancedParameterButton: {
        marginTop: theme.spacing(3),
        marginBottom: theme.spacing(1),
    },
}));

const SelectCase = () => {
    const dispatch = useDispatch();
    const cases = useSelector((state) => state.cases);

    const [openSelectCase, setSelectCase] = React.useState(false);

    useEffect(() => {
        fetchCases().then((cases) => {
            dispatch(loadCasesSuccess(cases));
        });
        // Note: dispatch doesn't change
    }, [dispatch]);

    const handleChangeSelectCase = (event) => {
        dispatch(selectCase(event.target.value));
    };

    const handleCloseSelectCase = () => {
        setSelectCase(false);
    };

    const handleOpenSelectCase = () => {
        setSelectCase(true);
    };

    return (
        <div>
            <FormControl fullWidth>
                <InputLabel id="demo-controlled-open-select-label">
                    <FormattedMessage id="caseName" />
                </InputLabel>
                <Select
                    labelId="demo-controlled-open-select-label"
                    id="demo-controlled-open-select"
                    open={openSelectCase}
                    onClose={handleCloseSelectCase}
                    onOpen={handleOpenSelectCase}
                    value={
                        store.getState().selectedCase != null
                            ? store.getState().selectedCase
                            : ''
                    }
                    onChange={handleChangeSelectCase}
                >
                    {cases.map(function (element) {
                        return (
                            <MenuItem key={element.uuid} value={element.uuid}>
                                {element.name}
                            </MenuItem>
                        );
                    })}
                </Select>
            </FormControl>
        </div>
    );
};

/**
 * Dialog to create a study
 * @param {Boolean} open Is the dialog open ?
 * @param {EventListener} onClose Event to close the dialog
 */
export const CreateStudyDialog = ({ open, onClose, providedCase }) => {
    const [caseExist, setCaseExist] = React.useState(false);

    const { snackError } = useSnackMessage();
    const [createStudyErr, setCreateStudyErr] = React.useState('');

    const userId = useSelector((state) => state.user.profile.sub);

    const classes = useStyles();
    const intl = useIntl();
    const dispatch = useDispatch();

    const caseName = useSelector((state) => state.selectedCase);
    const activeDirectory = useSelector((state) => state.activeDirectory);
    const selectedDirectory = useSelector((state) => state.selectedDirectory);
    const selectedCase = useSelector((state) => state.selectedCase);

    const [tempCaseUuid, setTempCaseUuid] = useState(null);

    const oldTempCaseUuid = useRef(null);

    const [folderSelectorOpen, setFolderSelectorOpen] = useState(false);
    const [activeDirectoryName, setActiveDirectoryName] = useState(null);

    const [formatWithParameters, setFormatWithParameters] = useState([]);

    const [triggerReset, setTriggerReset] = React.useState(true);

    const [isParamsOk, setIsParamsOk] = useState(true);
    const [isParamsDisplayed, setIsParamsDisplayed] = useState(false);
    const [isParamsCaseFileDisplayed, setIsParamsCaseFileDisplayed] =
        useState(false);
    const [isUploadingFileInProgress, setUploadingFileInProgress] =
        useState(false);

    const [fileCheckedCase, setFileCheckedCase] = useState(false);

    const [studyName, NameField, nameError, nameOk, setStudyName, touched] =
        useNameField({
            label: 'nameProperty',
            autoFocus: true,
            elementType: ElementType.STUDY,
            parentDirectoryId: activeDirectory,
            triggerReset,
            active: open,
            style: {
                width: '90%',
            },
        });

    const [description, DescriptionField] = useTextValue({
        label: 'descriptionProperty',
        triggerReset,
        style: {
            width: '90%',
        },
    });

    const studyNameRef = React.useRef(studyName);

    useEffect(() => {
        studyNameRef.current = studyName;
    }, [studyName]);

    const handleShowParametersClick = () => {
        setIsParamsDisplayed((oldValue) => !oldValue);
    };
    const handleShowParametersForCaseFileClick = () => {
        setIsParamsCaseFileDisplayed((oldValue) => !oldValue);
    };

    const [currentParameters, paramsComponent, resetImportParamsToDefault] =
        useImportExportParams(formatWithParameters);

    const [
        selectedFile,
        FileField,
        selectedFileError,
        selectedFileOk,
        setSelectedFileOk,
    ] = useFileValue({
        label: 'Case',
        triggerReset,
        isLoading: isUploadingFileInProgress,
    });

    const getCaseImportParams = useCallback(
        (caseUuid, setFormatWithParameters) => {
            getCaseImportParameters(caseUuid)
                .then((result) => {
                    // sort possible values alphabetically to display select options sorted
                    result.parameters = result.parameters?.map((p) => {
                        let sortedPossibleValue = p.possibleValues?.sort(
                            (a, b) => a.localeCompare(b)
                        );
                        p.possibleValues = sortedPossibleValue;
                        return p;
                    });
                    setFormatWithParameters(result.parameters);
                    setIsParamsOk(true);
                })
                .catch(() => {
                    setFormatWithParameters([]);
                    setIsParamsOk(false);
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
        selectedFile,
        setValue: setStudyName,
        selectedFileOk,
        createStudyErr,
        fileCheckedCase,
        touched,
    });

    //Inits the dialog
    useEffect(() => {
        if (open && providedCase) {
            setCaseExist(true);
            dispatch(selectCase(providedCase.elementUuid));
            getCaseImportParams(
                providedCase.elementUuid,
                setFormatWithParameters
            );
        } else if (open && selectedFile) {
            setUploadingFileInProgress(true);
            createCaseWithoutDirectoryElementCreation(selectedFile)
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
                    setSelectedFileOk(false);
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
        providedCase,
        selectedFile,
        getCaseImportParams,
        handleFileUploadError,
        setStudyName,
        setSelectedFileOk,
    ]);

    const resetDialog = () => {
        setCreateStudyErr('');
        setStudyName('');
        setActiveDirectoryName(selectedDirectory?.elementName);
        dispatch(setActiveDirectory(selectedDirectory?.elementUuid));
        dispatch(removeSelectedCase());
        setTriggerReset((oldVal) => !oldVal);
        setFormatWithParameters([]);
        setIsParamsCaseFileDisplayed(false);
    };

    const handleCloseDialog = () => {
        onClose();
        resetImportParamsToDefault();
        resetDialog();
    };

    const AdvancedParameterButton = ({
        showOpenIcon,
        label,
        callback,
        disabled = false,
    }) => {
        return (
            <>
                <Grid item xs={12} className={classes.advancedParameterButton}>
                    <Button
                        startIcon={<SettingsIcon />}
                        endIcon={
                            showOpenIcon && (
                                <CheckIcon style={{ color: 'green' }} />
                            )
                        }
                        onClick={callback}
                        disabled={disabled}
                    >
                        <FormattedMessage id={label} />
                    </Button>
                </Grid>
            </>
        );
    };

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

    const handleCreateNewStudy = () => {
        //To manage the case when we never tried to enter a name
        if (studyName === '') {
            setCreateStudyErr(intl.formatMessage({ id: 'nameEmpty' }));
            return;
        }
        //We don't do anything if the checks are not over or the name is not valid
        if (!nameOk) {
            return;
        }
        if (caseExist && caseName === null) {
            setCreateStudyErr(intl.formatMessage({ id: 'caseNameErrorMsg' }));
            return;
        }
        if (!caseExist && selectedFile === null) {
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
            caseName ?? tempCaseUuid,
            activeDirectory,
            currentParameters &&
                (isParamsDisplayed || isParamsCaseFileDisplayed)
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
            .finally(() => dispatch(removeUploadingElement(uploadingStudy)));
        dispatch(addUploadingElement(uploadingStudy));
    };

    const handleKeyPressed = (event) => {
        if (event.key === 'Enter') {
            handleCreateNewStudy();
        }
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
            !nameOk ||
            !isParamsOk ||
            (!providedCase && !selectedFileOk) ||
            isUploadingFileInProgress
        );
    };

    const importParametersSection = (
        AdvancedParameterButton,
        isParamsCaseFileDisplayed,
        handleShowParametersForCaseFileClick,
        formatWithParameters,
        paramsComponent,
        paramDivider
    ) => (
        <>
            <Divider className={paramDivider} />
            <div
                style={{
                    marginTop: '10px',
                }}
            >
                <AdvancedParameterButton
                    showOpenIcon={isParamsCaseFileDisplayed}
                    label={'importParameters'}
                    callback={handleShowParametersForCaseFileClick}
                    disabled={formatWithParameters.length === 0}
                />
                {isParamsCaseFileDisplayed && paramsComponent}
            </div>
        </>
    );

    return (
        <div>
            <Dialog
                fullWidth={true}
                open={open}
                onClose={handleCloseDialog}
                aria-labelledby="form-dialog-title"
                onKeyPress={handleKeyPressed}
            >
                <DialogTitle id="form-dialog-title">
                    <FormattedMessage id="createNewStudy" />
                </DialogTitle>
                <DialogContent>
                    {NameField}
                    {DescriptionField}
                    {nameError && <Alert severity="error">{nameError}</Alert>}
                    {!selectedCase ? (
                        caseExist ? (
                            <SelectCase />
                        ) : (
                            <>
                                {FileField}
                                {importParametersSection(
                                    AdvancedParameterButton,
                                    isParamsCaseFileDisplayed,
                                    handleShowParametersForCaseFileClick,
                                    formatWithParameters,
                                    paramsComponent,
                                    classes.paramDivider
                                )}
                            </>
                        )
                    ) : (
                        <>
                            <div
                                style={{
                                    marginTop: '10px',
                                }}
                            >
                                <Button
                                    onClick={handleSelectFolder}
                                    variant="contained"
                                    style={{
                                        paddingLeft: '30px',
                                        paddingRight: '30px',
                                    }}
                                    color="primary"
                                    component="label"
                                >
                                    <FormattedMessage id="showSelectDirectoryDialog" />
                                </Button>
                                <span
                                    style={{
                                        marginLeft: '10px',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {activeDirectoryName}
                                </span>

                                <DirectorySelector
                                    open={folderSelectorOpen}
                                    onClose={
                                        handleSelectedDirectoryToCreateStudy
                                    }
                                    types={[ElementType.DIRECTORY]}
                                    title={intl.formatMessage({
                                        id: 'selectDirectoryDialogTitle',
                                    })}
                                    validationButtonText={intl.formatMessage({
                                        id: 'confirmDirectoryDialog',
                                    })}
                                    contentText={intl.formatMessage({
                                        id: 'moveItemContentText',
                                    })}
                                />
                            </div>
                            {importParametersSection(
                                AdvancedParameterButton,
                                isParamsDisplayed,
                                handleShowParametersClick,
                                formatWithParameters,
                                paramsComponent,
                                classes.paramDivider
                            )}
                        </>
                    )}
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
                    {selectedFileError && (
                        <Alert severity="error">{selectedFileError}</Alert>
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
    providedCase: PropTypes.any,
};

export default CreateStudyDialog;
