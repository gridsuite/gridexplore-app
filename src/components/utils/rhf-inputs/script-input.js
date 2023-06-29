import { useController } from 'react-hook-form';
import AceEditor from 'react-ace';
import React from 'react';
import makeStyles from '@mui/styles/makeStyles';
import { useSelector } from 'react-redux';
import 'ace-builds/src-noconflict/mode-groovy';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-clouds_midnight';

const useStyles = makeStyles(() => ({
    aceEditor: {
        minWidth: '650px',
        minHeight: '450px',
        marginTop: '4px',
        flexGrow: 1,
    },
}));

const ScriptInput = ({ name }) => {
    const classes = useStyles();
    const selectedTheme = useSelector((state) => state.theme);
    /**
     * Set name of for the Ace Editor : if theme is light set "github theme" else set "clouds_midnight theme"
     * */
    let themeForAceEditor = () => {
        return selectedTheme === 'Light'
            ? 'github'
            : selectedTheme === 'Dark'
            ? 'clouds_midnight'
            : '';
    };

    const {
        field: { onChange, value },
    } = useController({ name });

    return (
        <AceEditor
            className={classes.aceEditor}
            mode="groovy"
            placeholder="Insert your groovy script here"
            theme={themeForAceEditor()}
            onChange={(val) => onChange(val)}
            value={value}
            fontSize="18px"
            editorProps={{ $blockScrolling: true }}
        />
    );
};

export default ScriptInput;
