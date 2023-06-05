import {forwardRef, useEffect, useMemo} from "react";
import TextField from "@mui/material/TextField";
import {FormattedMessage} from "react-intl";
import {Chip} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import React from "react";
import {useCallback, useState} from "react";
import makeStyles from "@mui/styles/makeStyles";

const useStyles = makeStyles((theme) => ({
    chip: {
        cursor: 'pointer',
        marginRight: theme.spacing(0.5),
    }
}));


const ChipsArrayEditor = forwardRef(({ ...props }, ref) => {
    const classes = useStyles();
    const [unsavedAutoCompleteValue, setUnsavedAutoCompleteValue] =
        useState('');
    const [isClean, setIsClean] = useState(props?.isClean === undefined ? false : props.isClean);
    const value = useMemo(() => props.data, [props.data])
    const handleAutoCompleteChange = useCallback(
        (newVal) => {
            console.log('newVal ', newVal)
            const noBlankEntries = newVal
                .filter((e) => String(e).trim().length > 0)
                .map((e) => e.trim());
            console.log('noBlankEntries ', noBlankEntries)
            const noBlankOrDuplicatesEntries = [...new Set(noBlankEntries)];
            props.data = {
                contingencyName: value?.contingencyName,
                equipmentIDs: noBlankOrDuplicatesEntries,
            }
            //props.handleSetClean(props?.rowIndex, true);
            setIsClean(true);
        },
        [value, props]
    );

    // If the user typed something in the autocomplete field but did not press Enter,
    // when the focus is lost on the field, its value is purged. To not lose the user's
    // input, we save it here.
    const handleAutoCompleteBlur = useCallback(() => {
        if (unsavedAutoCompleteValue?.trim().length > 0) {
            let arr = [...value.equipmentIDs];
            arr.push(unsavedAutoCompleteValue);
            handleAutoCompleteChange(arr);
        }
    }, [value, unsavedAutoCompleteValue, handleAutoCompleteChange]);

    const handleAutoCompleteInputChange = useCallback(
        (newVal) => {
            console.log('newVal autoComp', newVal, isClean)
            if (isClean && newVal.trim().length > 0) {
                props.isClean = false;
                //props.handleSetClean(props.rowIndex, false);
                setIsClean(false);
            } else if (!isClean && newVal.trim().length === 0) {
                //props.handleSetClean(props.rowIndex, true);
                props.isClean = true;
                setIsClean(true);
            }
            setUnsavedAutoCompleteValue(newVal);
        },
        [
            props,
            isClean,
            setIsClean,
            setUnsavedAutoCompleteValue,
        ]
    );

    const handleAutoCompleteDeleteItem = useCallback(
        (item, indexInArray) => {
            if (value?.equipmentIDs) {
                let arr = [...value.equipmentIDs];
                arr.splice(indexInArray, 1);
                handleAutoCompleteChange(arr);
            }
        },
        [value, handleAutoCompleteChange]
    );

    useEffect(() => {
        console.log('props CL : ', props);
        console.log('value CL : ', value)
    }, [props, value])

    return (
        <Autocomplete
            id={props.rowIndex + 'equipmentsInput'}
            onKeyUp={(event) => {
                console.log('event 777 : ', event);
                if (event.ctrlKey && event.key === 'Enter') {
                    console.log('props key pressed : ', props);
                    props.data.equipmentIDs.push(unsavedAutoCompleteValue);
                }
            }}
            value={value?.equipmentIDs ?? []}
            freeSolo // Allow any string from the user in the field
            multiple // Allow multiple strings in the field
            // Saves the user's input when pressing Enter. The value goes in a Chip.
            onChange={(_, newVal) =>
            {
                console.log('newVal onchange', newVal)
                handleAutoCompleteChange(newVal)
            }
            }
            // The following three parameters allow to save the user's input and put it in
            // a Chip if the user loses focus on the field.
            /*onBlur={handleAutoCompleteBlur} // To save the value and put it in a Chip when focus is lost
            clearOnBlur={true} // To clear the field when focus is lost, to not have the value and the chip at the same time*/
            onInputChange={(event, value) => {
                console.log('on Input change event ', event);
                console.log('on Input change value ', value);
                handleAutoCompleteInputChange(value)
            }

            } // To store the current value with each keystroke
            onAbort={(evt) => console.log('onAbort : ' , evt)}
            style={{ width: '100%' }}
            size="small"
            options={[]}
            renderInput={(props) => (
                <TextField
                    label={
                        <FormattedMessage id="equipments" />
                    }
                    {...props}
                />
            )}
            renderTags={(values) =>
            {
                console.log('values final CL', values)
                return values.map((item, indexInArray) => (
                    <Chip
                        size="small"
                        onDelete={() =>
                            handleAutoCompleteDeleteItem(
                                item,
                                indexInArray
                            )
                        }
                        label={item}
                        className={classes.chip}
                    />
                ))
            }
            }
        />
    )
});
