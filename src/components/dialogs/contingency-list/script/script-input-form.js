import AceInput from '../../../utils/rhf-inputs/ace-input';
import { SCRIPT } from '../../../utils/field-constants';

const ScriptInputForm = () => {
    return (
        <AceInput
            name={SCRIPT}
            placeholder="Insert your groovy script here"
            fontSize="18px"
            editorProps={{ $blockScrolling: true }}
            style={{
                minWidth: '650px',
                minHeight: '450px',
                marginTop: '4px',
                flexGrow: 1,
            }}
        />
    );
};

export default ScriptInputForm;
