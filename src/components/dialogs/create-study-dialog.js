/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useEffect, useState } from 'react';

import makeStyles from '@mui/styles/makeStyles';
import CheckIcon from '@mui/icons-material/Check';
import SettingsIcon from '@mui/icons-material/Settings';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import DirectorySelector from './directory-selector.js';
import {
    createStudy,
    elementExists,
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
} from '../../redux/actions';
import { store } from '../../redux/store';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import {
    displayErrorMessageWithSnackbar,
    useIntlRef,
} from '../../utils/messages';
import { ElementType } from '../../utils/elementType';
import { useFileValue } from './field-hook';
import { keyGenerator } from '../../utils/functions.js';
import { Divider, Grid, Stack } from '@mui/material';
import { useMeta } from '@gridsuite/commons-ui';

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

    const { enqueueSnackbar } = useSnackbar();

    const [studyName, setStudyName] = React.useState('');
    const [studyDescription, setStudyDescription] = React.useState('');
    const [createStudyErr, setCreateStudyErr] = React.useState('');

    const [loadingCheckStudyName, setLoadingCheckStudyName] =
        React.useState(false);
    const [studyNameValid, setStudyNameValid] = useState(false);

    const userId = useSelector((state) => state.user.profile.sub);

    const timer = React.useRef();

    const classes = useStyles();
    const intl = useIntl();
    const intlRef = useIntlRef();
    const dispatch = useDispatch();

    const caseName = useSelector((state) => state.selectedCase);
    const activeDirectory = useSelector((state) => state.activeDirectory);
    const selectedDirectory = useSelector((state) => state.selectedDirectory);
    const selectedCase = useSelector((state) => state.selectedCase);

    const [folderSelectorOpen, setFolderSelectorOpen] = useState(false);
    const [activeDirectoryName, setActiveDirectoryName] = useState(null);

    const [formatWithParameters, setFormatWithParameters] = useState([]);

    const [triggerReset, setTriggerReset] = React.useState(true);

    const [isParamsDisplayed, setIsParamsDisplayed] = useState(false);

    const handleShowParametersClick = () => {
        setIsParamsDisplayed((oldValue) => !oldValue);
    };

    const metasAsArray = formatWithParameters?.parameters || [];
    const [currentParameters, paramsComponent, resetImportParamsToDefault] =
        useMeta(metasAsArray);

    //Inits the dialog
    useEffect(() => {
        if (open && providedCase) {
            setStudyName(providedCase?.elementName);
            setCaseExist(true);
            dispatch(selectCase(providedCase?.elementUuid));
            getCaseImportParameters(providedCase?.elementUuid).then(
                (result) => {
                    // sort possible values alphabetically to display select options sorted
                    result.parameters = result.parameters?.map((p) => {
                        let sortedPossibleValue = p.possibleValues?.sort(
                            (a, b) => a.localeCompare(b)
                        );
                        p.possibleValues = sortedPossibleValue;
                        return p;
                    });
                    setFormatWithParameters(result);
                }
            );
        }
    }, [open, dispatch, selectedDirectory?.elementName, providedCase]);

    const [selectedFile, FileField, selectedFileError, isSelectedFileOk] =
        useFileValue({
            label: 'Case',
            triggerReset,
        });

    const resetDialog = () => {
        setCreateStudyErr('');
        setStudyName('');
        setStudyDescription('');
        setLoadingCheckStudyName(false);
        setStudyNameValid(false);
        setActiveDirectoryName(selectedDirectory?.elementName);
        dispatch(setActiveDirectory(selectedDirectory?.elementUuid));
        dispatch(removeSelectedCase());
        setTriggerReset((oldVal) => !oldVal);
    };

    const handleCloseDialog = () => {
        onClose();
        resetImportParamsToDefault();
        resetDialog();
    };

    const handleStudyDescriptionChanges = (e) => {
        setStudyDescription(e.target.value);
    };

    const handleStudyNameChanges = (e) => {
        const name = e.target.value;
        setStudyName(name);
    };

    const MakeAdvancedParameterButton = (
        showOpenIcon,
        label,
        callback,
        disabled = false
    ) => {
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

    useEffect(() => {
        const updateStudyFormState = (inputValue) => {
            if (inputValue !== '' && activeDirectory) {
                //If the name is not only white spaces
                if (inputValue.replace(/ /g, '') !== '') {
                    elementExists(
                        activeDirectory,
                        inputValue,
                        ElementType.STUDY
                    )
                        .then((data) => {
                            setStudyFormState(
                                data
                                    ? intl.formatMessage({
                                          id: 'studyNameAlreadyUsed',
                                      })
                                    : '',
                                !data
                            );
                        })
                        .catch((error) => {
                            setStudyFormState(
                                intl.formatMessage({
                                    id: 'nameValidityCheckErrorMsg',
                                }) + error,
                                false
                            );
                        })
                        .finally(() => {
                            setLoadingCheckStudyName(false);
                        });
                } else {
                    setStudyFormState(
                        intl.formatMessage({ id: 'nameEmpty' }),
                        false
                    );
                    setLoadingCheckStudyName(false);
                }
            } else {
                setStudyFormState('', false);
                setLoadingCheckStudyName(false);
            }
        };

        setLoadingCheckStudyName(true);

        //Reset the timer so we only call update on the last input
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            updateStudyFormState(studyName);
        }, 700);
    }, [activeDirectory, intl, studyName]);

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

    const renderStudyNameStatus = () => {
        const showOk =
            studyName !== '' && !loadingCheckStudyName && studyNameValid;
        return (
            <div
                style={{
                    display: 'inline-block',
                    verticalAlign: 'bottom',
                }}
            >
                {loadingCheckStudyName && (
                    <CircularProgress
                        className={classes.progress}
                        size="1rem"
                    />
                )}
                {showOk && <CheckIcon style={{ color: 'green' }} />}
            </div>
        );
    };

    const setStudyFormState = (errorMessage, isNameValid) => {
        setCreateStudyErr(errorMessage);
        setStudyNameValid(isNameValid);
    };

    const studyCreationError = useCallback(
        (studyName, msg) =>
            displayErrorMessageWithSnackbar({
                errorMessage: msg,
                enqueueSnackbar: enqueueSnackbar,
                headerMessage: {
                    headerMessageId: 'studyCreationError',
                    intlRef: intlRef,
                    headerMessageValues: { studyName },
                },
            }),
        [enqueueSnackbar, intlRef]
    );

    const handleCreateNewStudy = () => {
        //To manage the case when we never tried to enter a name
        if (studyName === '') {
            setCreateStudyErr(intl.formatMessage({ id: 'nameEmpty' }));
            return;
        }
        //We don't do anything if the checks are not over or the name is not valid
        if (!studyNameValid || loadingCheckStudyName) {
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
            uploading: true,
        };
        createStudy(
            caseExist,
            studyName,
            studyDescription,
            caseName,
            selectedFile,
            activeDirectory,
            currentParameters && isParamsDisplayed
                ? JSON.stringify(currentParameters)
                : ''
        )
            .then()
            .catch((message) => {
                studyCreationError(studyName, message);
            })
            .finally(() => dispatch(removeUploadingElement(uploadingStudy)));
        dispatch(addUploadingElement(uploadingStudy));
        handleCloseDialog();
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
            !studyNameValid ||
            loadingCheckStudyName ||
            (!providedCase && !isSelectedFileOk)
        );
    };

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
                    <div>
                        <TextField
                            onChange={(e) => handleStudyNameChanges(e)}
                            autoFocus
                            margin="dense"
                            value={studyName}
                            type="text"
                            error={
                                studyName !== '' &&
                                !studyNameValid &&
                                !loadingCheckStudyName
                            }
                            style={{ width: '90%' }}
                            label={<FormattedMessage id="nameProperty" />}
                        />
                        {renderStudyNameStatus()}
                    </div>
                    <TextField
                        onChange={(e) => handleStudyDescriptionChanges(e)}
                        margin="dense"
                        value={studyDescription}
                        type="text"
                        style={{ width: '90%' }}
                        label={<FormattedMessage id="descriptionProperty" />}
                    />
                    {!selectedCase ? (
                        caseExist ? (
                            <SelectCase />
                        ) : (
                            FileField
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
                            <Divider className={classes.paramDivider} />
                            <div
                                style={{
                                    marginTop: '10px',
                                }}
                            >
                                <Stack
                                    marginTop="0.7em"
                                    direction="row"
                                    justifyContent="space-between"
                                    alignItems="center"
                                >
                                    {MakeAdvancedParameterButton(
                                        isParamsDisplayed,
                                        intl.formatMessage({
                                            id: 'importParameters',
                                        }),
                                        handleShowParametersClick,
                                        metasAsArray.length === 0
                                    )}
                                </Stack>
                                {isParamsDisplayed && paramsComponent}
                            </div>
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
