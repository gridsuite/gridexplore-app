import AceInput from '../../../utils/rhf-inputs/ace-input';
import { SCRIPT } from '../../../utils/field-constants';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles(() => ({
    aceInput: {
        minWidth: '650px',
        minHeight: '450px',
        marginTop: '4px',
        flexGrow: 1,
    },
}));

const ScriptInputForm = () => {
    const classes = useStyles();

    return (
        <AceInput
            name={SCRIPT}
            placeholder="Insert your groovy script here"
            fontSize="18px"
            editorProps={{ $blockScrolling: true }}
            className={classes.aceInput}
        />
    );
};

export default ScriptInputForm;
