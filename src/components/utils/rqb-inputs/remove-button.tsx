import { ActionWithRulesProps } from 'react-querybuilder';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import React from 'react';

const RemoveButton = (props: ActionWithRulesProps) => {
    return (
        <IconButton onClick={props.handleOnClick} className={props.className}>
            <DeleteIcon />
        </IconButton>
    );
};

export default RemoveButton;
