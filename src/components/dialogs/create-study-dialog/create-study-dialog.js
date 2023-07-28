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
    InputAdornment,
    CircularProgress,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import TextFieldInput from '../commons/text-field-input';
import UploadNewCase from '../commons/upload-new-case';
import {
    createCaseWithoutDirectoryElementCreation,
    deleteCase,
    elementExists,
    getCaseImportParameters,
} from '../../../utils/rest-api';
import {
    HTTP_CONNECTION_FAILED_MESSAGE,
    HTTP_UNPROCESSABLE_ENTITY_STATUS,
} from '../../../utils/UIconstants';
import { ElementType } from '../../../utils/elementType';
import DirectorySelect from './directory-select';
import ImportParametersSection from './importParametersSection';
import { useSelector } from 'react-redux';
import CheckIcon from '@mui/icons-material/Check';

const MAX_FILE_SIZE_IN_MO = 100;
const MAX_FILE_SIZE_IN_BYTES = MAX_FILE_SIZE_IN_MO * 1024 * 1024;

const CreateStudyDialog = ({ open, onClose, providedExistingCase }) => {
    const intl = useIntl();

    // States
    const [isCreationAllowed, setIsCreationAllowed] = useState(false);
    const [studyName, setStudyName] = useState('');
    const [studyNameError, setStudyNameError] = useState('');
    const [studyNameChanged, setStudyNameChanged] = useState(false);
    const [studyNameChecking, setStudyNameChecking] = useState(false);
    const [description, setDescription] = useState('');

    const [caseFile, setCaseFile] = useState(null);
    const [caseFileLoading, setCaseFileLoading] = useState(false);
    const [caseFileError, setCaseFileError] = useState('');
    const [caseFileAdornment, setCaseFileAdornment] = useState(null);
    const [caseUuid, setCaseUuid] = useState('');

    const [currentParams, setCurrentParams] = useState({});
    const [formattedCaseParams, setFormattedCaseParams] = useState([]);

    const [apiCallError, setApiCallError] = useState('');

    const activeDirectory = useSelector((state) => state.activeDirectory);

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
        async (uuid) => {
            try {
                const { parameters = [] } = await getCaseImportParameters(uuid);

                // sort possible values alphabetically to display select options sorted
                setFormattedCaseParams(
                    parameters.map((parameter) => ({
                        ...parameter,
                        possibleValues: parameter.possibleValues?.sort((a, b) =>
                            a.localeCompare(b)
                        ),
                    }))
                );
            } catch (error) {
                setFormattedCaseParams([]);
                setApiCallError(
                    intl.formatMessage({ id: 'parameterLoadingProblem' })
                );
            }
        },
        [intl]
    );

    const handleStudyNameCheck = useCallback(async () => {
        const nameFormatted = studyName.replace(/ /g, '');
        setStudyNameError('');

        if (!nameFormatted) {
            setCaseFileAdornment(false);

            if (studyNameChanged) {
                setStudyNameError(intl.formatMessage({ id: 'nameEmpty' }));
            }
        } else {
            setStudyNameChecking(true);

            setCaseFileAdornment(
                <InputAdornment position="end">
                    <CircularProgress size="1rem" />
                </InputAdornment>
            );

            try {
                const isElementExists = await elementExists(
                    activeDirectory,
                    studyName,
                    ElementType.STUDY
                );

                if (isElementExists) {
                    setStudyNameError(
                        intl.formatMessage({
                            id: 'nameAlreadyUsed',
                        })
                    );
                    setCaseFileAdornment(false);
                } else {
                    setCaseFileAdornment(
                        <InputAdornment position="end">
                            <CheckIcon style={{ color: 'green' }} />
                        </InputAdornment>
                    );
                }
            } catch (error) {
                setStudyNameError(
                    intl.formatMessage({
                        id: 'nameValidityCheckErrorMsg',
                    }) + error.message
                );
            } finally {
                setStudyNameChecking(false);
            }
        }
    }, [activeDirectory, intl, studyName, studyNameChanged]);

    const handleCloseDialog = () => {
        onClose();
    };

    const handleCreateNewStudy = () => {};

    const handleCaseFileUpload = async (event) => {
        event.preventDefault();

        setCaseFile(null);
        setCaseFileError('');

        const files = event.target.files;
        if (files?.length) {
            const currentFile = files[0];

            if (currentFile.size <= MAX_FILE_SIZE_IN_BYTES) {
                setCaseFileLoading(true);
                setCaseFile(currentFile);

                // Create new case
                try {
                    const newCaseUuid =
                        await createCaseWithoutDirectoryElementCreation(
                            currentFile
                        );

                    setCaseUuid((prevCaseUuid) => {
                        if (prevCaseUuid && prevCaseUuid !== newCaseUuid) {
                            deleteCase(prevCaseUuid)
                                .then()
                                .catch((error) => handleApiCallError(error));
                        }

                        return newCaseUuid;
                    });
                    getCurrentCaseImportParams(newCaseUuid);
                } catch (e) {
                    handleApiCallError(apiCallError);
                } finally {
                    setCaseFileLoading(false);
                }
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

    // handle check studyName
    useEffect(() => {
        handleStudyNameCheck();
    }, [handleStudyNameCheck]);

    console.log(
        studyName,
        formattedCaseParams.length,
        caseFileLoading,
        studyNameChecking,
        !caseUuid
    );
    // handle change possibility to create new study
    useEffect(() => {
        if (
            studyName &&
            formattedCaseParams.length &&
            !caseFileLoading &&
            !studyNameChecking &&
            caseUuid &&
            !studyNameError &&
            !apiCallError
        ) {
            setIsCreationAllowed(true);
        } else {
            setIsCreationAllowed(false);
        }
    }, [
        caseFileLoading,
        caseUuid,
        formattedCaseParams.length,
        studyName,
        studyNameChecking,
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
                    adornment={caseFileAdornment}
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
                <Button onClick={handleCloseDialog}>
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
