import React, { FunctionComponent } from 'react';
import { FormProvider } from 'react-hook-form';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import { Grid } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import makeStyles from '@mui/styles/makeStyles';
import { SubmitButton } from '@gridsuite/commons-ui';

interface ICustomMuiDialog {
    open: boolean;
    formSchema: any;
    formMethods: any;
    onClose: (event: React.MouseEvent) => void;
    onSave: (data: any) => void;
    onValidationError?: (errors: any) => void;
    titleId: string;
    disabledSave: boolean;
    removeOptional?: boolean;
    onCancel?: () => void;
    children: React.ReactNode;
}

const useStyles = makeStyles((theme: any) => ({
    root: {
        margin: 0,
        padding: theme.spacing(2),
    },
    closeButton: {
        position: 'absolute',
        right: theme.spacing(1),
        top: theme.spacing(1),
        color: theme.palette.grey[500],
    },
    dialogPaper: {
        width: 'auto',
        minWidth: '800px',
        margin: 'auto',
    },
    content: {
        overflow: 'auto',
        justifyContent: 'space-around',
        flexGrow: 1,
    },
}));

const CustomMuiDialog: FunctionComponent<ICustomMuiDialog> = ({
    open,
    formSchema,
    formMethods,
    onClose,
    onSave,
    onValidationError,
    titleId,
    disabledSave,
    removeOptional = false,
    onCancel,
    children,
}) => {
    const classes = useStyles();
    const { handleSubmit } = formMethods;

    const handleCancel = (event: React.MouseEvent) => {
        onCancel && onCancel();
        onClose(event);
    };

    const handleClose = (event: React.MouseEvent, reason?: string) => {
        if (reason === 'backdropClick' && onCancel) {
            handleCancel(event);
        }
        onClose(event);
    };

    const handleValidate = (data: any) => {
        onSave(data);
        onClose(data);
    };

    const handleValidationError = (errors: any) => {
        onValidationError && onValidationError(errors);
    };

    return (
        <FormProvider
            validationSchema={formSchema}
            {...formMethods}
            removeOptional={removeOptional}
        >
            <Dialog
                classes={{ paper: classes.dialogPaper }}
                open={open}
                onClose={handleClose}
                fullWidth
            >
                <DialogTitle>
                    <Grid item xs={11}>
                        <FormattedMessage id={titleId} />
                    </Grid>
                </DialogTitle>
                <DialogContent>{children}</DialogContent>
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
                    />
                </DialogActions>
            </Dialog>
        </FormProvider>
    );
};

export default CustomMuiDialog;
