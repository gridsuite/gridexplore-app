/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useEffect, useState } from 'react';

import makeStyles from '@mui/styles/makeStyles';
import CheckIcon from '@mui/icons-material/Check';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
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
} from '../../utils/rest-api';
import { FormattedMessage, useIntl } from 'react-intl';

import { useDispatch, useSelector } from 'react-redux';
import {
    addUploadingStudy,
    loadCasesSuccess,
    removeSelectedFile,
    removeUploadingStudy,
    selectCase,
    removeSelectedCase,
    setActiveDirectory,
} from '../../redux/actions';
import { store } from '../../redux/store';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import {
    displayErrorMessageWithSnackbar,
    useIntlRef,
} from '../../utils/messages';
import { ElementType } from '../../utils/elementType';
import { UploadCase } from './upload-case';

const useStyles = makeStyles(() => ({
    addIcon: {
        fontSize: '64px',
    },
    addButtonArea: {
        height: '136px',
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

const uploadingStudyKeyGenerator = (() => {
    let key = 1;
    return () => key++;
})();

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

    const selectedFile = useSelector((state) => state.selectedFile);
    const caseName = useSelector((state) => state.selectedCase);
    const activeDirectory = useSelector((state) => state.activeDirectory);
    const selectedDirectory = useSelector((state) => state.selectedDirectory);
    const selectedCase = useSelector((state) => state.selectedCase);

    const [folderSelectorOpen, setFolderSelectorOpen] = useState(false);
    const [activeDirectoryName, setActiveDirectoryName] = useState(null);

    //Inits the dialog
    useEffect(() => {
        if (open) {
            if (providedCase) {
                setStudyName(providedCase?.elementName);
                setCaseExist(true);
                dispatch(selectCase(providedCase?.elementUuid));
            }
        }
    }, [open, dispatch, selectedDirectory?.elementName, providedCase]);

    const resetDialog = () => {
        setCreateStudyErr('');
        setStudyName('');
        setStudyDescription('');
        setLoadingCheckStudyName(false);
        setStudyNameValid(false);
        setActiveDirectoryName(selectedDirectory?.elementName);
        dispatch(setActiveDirectory(selectedDirectory?.elementUuid));
        dispatch(removeSelectedCase());
        dispatch(removeSelectedFile());
    };

    const handleCloseDialog = () => {
        onClose();
        resetDialog();
    };

    const handleChangeSwitch = (e) => {
        setCaseExist(e.target.checked);
        setCreateStudyErr('');
    };

    const handleStudyDescriptionChanges = (e) => {
        setStudyDescription(e.target.value);
    };

    const handleStudyNameChanges = (e) => {
        const name = e.target.value;
        setStudyName(name);
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
            id: uploadingStudyKeyGenerator(),
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
            activeDirectory
        )
            .then()
            .catch((message) => {
                studyCreationError(studyName, message);
            })
            .finally(() => dispatch(removeUploadingStudy(uploadingStudy)));
        dispatch(addUploadingStudy(uploadingStudy));
        onClose();
        resetDialog();
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

    return (
        <div>
            <Dialog
                fullWidth={true}
                open={open}
                onClose={handleCloseDialog}
                aria-labelledby="form-dialog-title"
                onKeyPress={handleKeyPressed}
                onContextMenu={(e) => e.stopPropagation()}
            >
                <DialogTitle id="form-dialog-title">
                    <FormattedMessage id="createNewStudy" />
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        <FormattedMessage id="createNewStudyDescription" />
                    </DialogContentText>
                    {!selectedCase && (
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={caseExist}
                                    onChange={(e) => handleChangeSwitch(e)}
                                    value="checked"
                                    color="primary"
                                    inputProps={{
                                        'aria-label': 'primary checkbox',
                                    }}
                                />
                            }
                            label={<FormattedMessage id="caseExist" />}
                        />
                    )}
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
                            label={<FormattedMessage id="studyName" />}
                        />
                        {renderStudyNameStatus()}
                    </div>
                    <TextField
                        onChange={(e) => handleStudyDescriptionChanges(e)}
                        margin="dense"
                        value={studyDescription}
                        type="text"
                        style={{ width: '90%' }}
                        label={<FormattedMessage id="studyDescription" />}
                    />
                    {!selectedCase ? (
                        (caseExist && <SelectCase />) ||
                        (!caseExist && <UploadCase />)
                    ) : (
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
                                onClose={handleSelectedDirectoryToCreateStudy}
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
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => handleCloseDialog()}>
                        <FormattedMessage id="cancel" />
                    </Button>
                    <Button
                        onClick={() => handleCreateNewStudy()}
                        disabled={
                            studyName === '' ||
                            !studyNameValid ||
                            loadingCheckStudyName
                        }
                        variant="outlined"
                    >
                        <FormattedMessage id="create" />
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
