/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useEffect, useState } from 'react';

import { makeStyles } from '@material-ui/core/styles';
import CheckIcon from '@material-ui/icons/Check';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Switch from '@material-ui/core/Switch';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import Alert from '@material-ui/lab/Alert';
import CircularProgress from '@material-ui/core/CircularProgress';

import { createStudy, fetchCases, elementExists } from '../../utils/rest-api';
import { FormattedMessage, useIntl } from 'react-intl';

import { useDispatch, useSelector } from 'react-redux';
import {
    addUploadingStudy,
    loadCasesSuccess,
    removeUploadingStudy,
    removeSelectedFile,
    selectCase,
    selectFile,
} from '../../redux/actions';
import { store } from '../../redux/store';
import RadioGroup from '@material-ui/core/RadioGroup';
import Radio from '@material-ui/core/Radio';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import {
    displayErrorMessageWithSnackbar,
    useIntlRef,
} from '../../utils/messages';
import { ElementType } from '../../utils/elementType';

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

const UploadCase = () => {
    const dispatch = useDispatch();
    const selectedFile = useSelector((state) => state.selectedFile);

    const handleFileUpload = (e) => {
        e.preventDefault();
        let files = e.target.files;
        dispatch(selectFile(files[0]));
    };

    return (
        <table>
            <tbody>
                <tr>
                    <th>
                        <Button
                            variant="contained"
                            color="primary"
                            component="label"
                        >
                            <FormattedMessage id="uploadCase" />
                            <input
                                type="file"
                                name="file"
                                onChange={(e) => handleFileUpload(e)}
                                style={{ display: 'none' }}
                            />
                        </Button>
                    </th>
                    <th>
                        <p>
                            {selectedFile === null ? (
                                <FormattedMessage id="uploadMessage" />
                            ) : (
                                selectedFile.name
                            )}
                        </p>
                    </th>
                </tr>
            </tbody>
        </table>
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
export const CreateStudyDialog = ({ open, onClose }) => {
    const [caseExist, setCaseExist] = React.useState(false);

    const { enqueueSnackbar } = useSnackbar();

    const [studyName, setStudyName] = React.useState('');
    const [studyDescription, setStudyDescription] = React.useState('');
    const [studyPrivacy, setStudyPrivacy] = React.useState('private');
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

    const resetDialog = () => {
        setCreateStudyErr('');
        setStudyName('');
        setStudyDescription('');
        setStudyPrivacy('private');
        setLoadingCheckStudyName(false);
        setStudyNameValid(false);
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
        setLoadingCheckStudyName(true);

        //Reset the timer so we only call update on the last input
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            updateStudyFormState(name);
        }, 700);
    };

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

    const updateStudyFormState = (inputValue) => {
        if (inputValue !== '') {
            //If the name is not only white spaces
            if (inputValue.replace(/ /g, '') !== '') {
                elementExists(activeDirectory, inputValue, ElementType.STUDY)
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

    const setStudyFormState = (errorMessage, isNameValid) => {
        setCreateStudyErr(errorMessage);
        setStudyNameValid(isNameValid);
    };

    const handleChangeStudyPrivacy = (event) => {
        setStudyPrivacy(event.target.value);
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
        let isPrivateStudy = studyPrivacy === 'private';
        const uploadingStudy = {
            id: uploadingStudyKeyGenerator(),
            elementName: studyName,
            directory: activeDirectory,
            type: 'STUDY',
            owner: userId,
            accessRights: isPrivateStudy,
            uploading: true,
        };
        createStudy(
            caseExist,
            studyName,
            studyDescription,
            caseName,
            selectedFile,
            isPrivateStudy,
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
                    <DialogContentText>
                        <FormattedMessage id="createNewStudyDescription" />
                    </DialogContentText>
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
                        label=<FormattedMessage id="caseExist" />
                    />
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
                            label=<FormattedMessage id="studyName" />
                        />
                        {renderStudyNameStatus()}
                    </div>
                    <TextField
                        onChange={(e) => handleStudyDescriptionChanges(e)}
                        margin="dense"
                        value={studyDescription}
                        type="text"
                        style={{ width: '90%' }}
                        label=<FormattedMessage id="studyDescription" />
                    />

                    <RadioGroup
                        aria-label=""
                        name="studyPrivacy"
                        value={studyPrivacy}
                        onChange={handleChangeStudyPrivacy}
                        row
                    >
                        <FormControlLabel
                            value="public"
                            control={<Radio />}
                            label=<FormattedMessage id="public" />
                        />
                        <FormControlLabel
                            value="private"
                            control={<Radio />}
                            label=<FormattedMessage id="private" />
                        />
                    </RadioGroup>
                    {caseExist && <SelectCase />}
                    {!caseExist && <UploadCase />}
                    {createStudyErr !== '' && (
                        <Alert severity="error">{createStudyErr}</Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => handleCloseDialog()} variant="text">
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
};

export default CreateStudyDialog;
