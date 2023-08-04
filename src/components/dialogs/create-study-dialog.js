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
    addUploadingElement,
    loadCasesSuccess,
    removeSelectedCase,
    removeUploadingElement,
    selectCase,
    selectFile,
    setActiveDirectory,
} from '../../redux/actions';
import { store } from '../../redux/store';
import PropTypes from 'prop-types';
import { FlatParameters, useSnackMessage } from '@gridsuite/commons-ui';
import { ElementType } from '../../utils/elementType';
import {
    useFileValue,
    useNameField,
    usePrefillNameField,
    useTextValue,
} from './field-hook';
import { keyGenerator } from '../../utils/functions.js';
import { Divider, Grid } from '@mui/material';
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
 * @param providedExistingCase
 */
export const CreateStudyDialog = ({ open, onClose, providedExistingCase }) => {
    const [caseExist, setCaseExist] = React.useState(false);

    const { snackError } = useSnackMessage();
    const [createStudyErr, setCreateStudyErr] = React.useState('');

    const userId = useSelector((state) => state.user.profile.sub);

    const classes = useStyles();
    const intl = useIntl();
    const dispatch = useDispatch();

    const activeDirectory = useSelector((state) => state.activeDirectory);
    const selectedDirectory = useSelector((state) => state.selectedDirectory);
    const selectedCase = useSelector((state) => state.selectedCase);

    const [tempCaseUuid, setTempCaseUuid] = useState(null);

    const oldTempCaseUuid = useRef(null);

    const [folderSelectorOpen, setFolderSelectorOpen] = useState(false);
    const [activeDirectoryName, setActiveDirectoryName] = useState(null);

    const [formatWithParameters, setFormatWithParameters] = useState([]);

    const [isParamsOk, setIsParamsOk] = useState(true);
    const [isParamsDisplayed, setIsParamsDisplayed] = useState(false);
    const [isParamsCaseFileDisplayed, setIsParamsCaseFileDisplayed] =
        useState(false);
    const [isUploadingFileInProgress, setUploadingFileInProgress] =
        useState(false);

    const [fileCheckedCase, setFileCheckedCase] = useState(
        !!providedExistingCase
    );

    const [studyName, NameField, nameError, nameOk, setStudyName, touched] =
        useNameField({
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

    const [currentParameters, setCurrentParameters] = useState({});
    const onChange = useCallback((paramName, value, isEdit) => {
        if (!isEdit) {
            setCurrentParameters((prevCurrentParameters) => {
                return {
                    ...prevCurrentParameters,
                    ...{ [paramName]: value },
                };
            });
        }
    }, []);

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
                    result.parameters = result.parameters?.map((p) => {
                        p.possibleValues = p.possibleValues?.sort((a, b) =>
                            a.localeCompare(b)
                        );
                        // we check if the param is for extension, in that case we select all possible values by default.
                        // the only way for the moment to check if the param is for extension, is by checking his type is STRING_LIST.
                        // STRING_LIST is the type of extension only but if this change in the future, it will cause problems.
                        // It should be change when we have a better way to identify params.
                        if (p.type === 'STRING_LIST') {
                            p.defaultValue = p.possibleValues;
                        }
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
            setCaseExist(true);
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
        // if we have an oldTempCaseUuid here that means we cancelled the creation
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
        if (caseExist && selectedCase === null) {
            setCreateStudyErr(intl.formatMessage({ id: 'caseNameErrorMsg' }));
            return;
        }
        if (!caseExist && providedCaseFile === null) {
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
            !nameOk ||
            !isParamsOk ||
            (!providedExistingCase && !providedCaseFileOk) ||
            isUploadingFileInProgress
        );
    };

    const importParametersSection = (
        AdvancedParameterButton,
        isParamsCaseFileDisplayed,
        handleShowParametersForCaseFileClick,
        formatWithParameters,
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
                {isParamsCaseFileDisplayed && (
                    <FlatParameters
                        paramsAsArray={formatWithParameters}
                        initValues={currentParameters}
                        onChange={onChange}
                        variant="standard"
                    />
                )}
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
