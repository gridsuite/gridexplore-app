import { FormProvider } from 'react-hook-form';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import { Grid } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import makeStyles from '@mui/styles/makeStyles';

const useStyles = makeStyles((theme) => ({
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
        minHeight: '600px',
        margin: 'auto',
    },
}));

const CustomMuiDialog = ({
    name,
    open,
    schema,
    methods,
    onClose,
    onSave,
    onValidationError,
    titleId,
    disabledSave,
    ...dialogProps
}) => {
    const classes = useStyles();
    const { handleSubmit } = methods;

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
        <FormProvider validationSchema={schema} {...methods}>
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
                <DialogContent
                    style={{
                        overflow: 'auto',
                        justifyContent: 'space-around',
                        flexGrow: 1,
                    }}
                >
                    {dialogProps.children}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancel}>
                        <FormattedMessage id="cancel" />
                    </Button>
                    <Button
                        disabled={disabledSave}
                        onClick={handleSubmit(
                            handleValidate,
                            handleValidationError
                        )}
                    >
                        <FormattedMessage id="validate" />
                    </Button>
                </DialogActions>
            </Dialog>
        </FormProvider>
    );
};

export default CustomMuiDialog;
