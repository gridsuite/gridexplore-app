import React, { FunctionComponent } from 'react';
import { FieldErrors, FormProvider } from 'react-hook-form';
import { FormattedMessage } from 'react-intl';
import {
    DialogActions,
    DialogContent,
    Grid,
    LinearProgress,
    Dialog,
    DialogTitle,
} from '@mui/material';
import { CancelButton, SubmitButton } from '@gridsuite/commons-ui';

interface ICustomMuiDialog {
    open: boolean;
    formSchema: any;
    formMethods: any;
    onClose: (event: React.MouseEvent) => void;
    onSave: (data: any) => void;
    onValidationError?: (errors: FieldErrors) => void;
    titleId: string;
    disabledSave?: boolean;
    removeOptional?: boolean;
    onCancel?: () => void;
    children: React.ReactNode;
    isDataFetching?: boolean;
}

const styles = {
    dialogPaper: {
        '.MuiDialog-paper': {
            width: 'auto',
            minWidth: '800px',
            margin: 'auto',
        },
    },
};

const CustomMuiDialog: FunctionComponent<ICustomMuiDialog> = ({
    open,
    formSchema,
    formMethods,
    onClose,
    onSave,
    isDataFetching = false,
    onValidationError,
    titleId,
    disabledSave,
    removeOptional = false,
    onCancel,
    children,
}) => {
    const { handleSubmit } = formMethods;

    const handleCancel = (event: React.MouseEvent) => {
        onCancel && onCancel();
        onClose(event);
    };

    const handleClose = (event: React.MouseEvent, reason?: string) => {
        if (reason === 'backdropClick' && onCancel) {
            onCancel();
        }
        onClose(event);
    };

    const handleValidate = (data: any) => {
        onSave(data);
        onClose(data);
    };

    const handleValidationError = (errors: FieldErrors) => {
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
                <DialogContent>{children}</DialogContent>
                <DialogActions>
                    <CancelButton
                        color={'customButton'}
                        onClick={handleCancel}
                    />
                    <SubmitButton
                        variant="outlined"
                        disabled={disabledSave}
                        onClick={handleSubmit(
                            handleValidate,
                            handleValidationError
                        )}
                    />
                </DialogActions>
            </Dialog>
        </FormProvider>
    );
};

export default CustomMuiDialog;
