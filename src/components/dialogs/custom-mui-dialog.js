import { FormProvider } from 'react-hook-form';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import { Grid, LinearProgress } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { SubmitButton } from '@gridsuite/commons-ui';

const styles = {
    dialogPaper: {
        '.MuiDialog-paper': {
            width: 'auto',
            minWidth: '800px',
            margin: 'auto',
        },
    },
};

const CustomMuiDialog = ({
    name,
    open,
    formSchema,
    formMethods,
    onClose,
    onSave,
    isDataFetching = false,
    onValidationError,
    titleId,
    disabledSave,
    removeOptional,
    ...dialogProps
}) => {
    const { handleSubmit } = formMethods;

    const handleClose = (event) => {
        onClose(event);
    };

    const handleCancel = (event) => {
        onClose(event);
    };

    const handleValidate = (data) => {
        onSave(data);
        onClose(data);
    };

    const handleValidationError = (errors) => {
        onValidationError && onValidationError(errors);
    };
    return (
        <FormProvider
            validationSchema={formSchema}
            {...formMethods}
            removeOptional={removeOptional}
        >
            <Dialog
                sx={styles.dialogPaper}
                open={open}
                onClose={handleClose}
                fullWidth
            >
                {isDataFetching && <LinearProgress />}
                <DialogTitle>
                    <Grid item xs={11}>
                        <FormattedMessage id={titleId} />
                    </Grid>
                </DialogTitle>
                <DialogContent>{dialogProps.children}</DialogContent>
                <DialogActions>
                    <Button onClick={handleCancel}>
                        <FormattedMessage id="cancel" />
                    </Button>
                    <SubmitButton
                        disabled={disabledSave}
                        onClick={handleSubmit(
                            handleValidate,
                            handleValidationError
                        )}
                    >
                        <FormattedMessage id="validate" />
                    </SubmitButton>
                </DialogActions>
            </Dialog>
        </FormProvider>
    );
};

export default CustomMuiDialog;
