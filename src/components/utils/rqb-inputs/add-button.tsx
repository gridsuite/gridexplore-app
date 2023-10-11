import { ActionWithRulesAndAddersProps } from 'react-querybuilder';
import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/ControlPoint';
import { FormattedMessage } from 'react-intl';
import React from 'react';

const AddButton = (props: ActionWithRulesAndAddersProps) => (
    <span>
        <Button
            startIcon={<AddIcon />}
            onClick={props.handleOnClick}
            size={'small'}
            className={'add-button'}
        >
            <FormattedMessage id={props.label} />
        </Button>
    </span>
);

export default AddButton;
