import ScriptInput from '../../../utils/rhf-inputs/script-input';
import { SCRIPT } from '../../../utils/field-constants';

const ScriptInputForm = () => {
    return (
        <ScriptInput
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
