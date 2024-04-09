import {
    Box,
    Checkbox,
    Divider,
    FormControlLabel,
    Typography,
} from '@mui/material';
import { UUID } from 'crypto';
import { FunctionComponent } from 'react';
import { StashedElement } from './stashed-elements.type';
import LockIcon from '@mui/icons-material/Lock';

interface StashedElementListItemProps {
    stashedElement: StashedElement;
    isSelected: boolean;
    handleCheckBoxChange: (elementId: UUID) => void;
}

function getOptionLabel(element: StashedElement) {
    return element.second
        ? element.first.elementName + ' (' + element.second + ')'
        : element.first.elementName;
}

export const StashedElementListItem: FunctionComponent<
    StashedElementListItemProps
> = ({ stashedElement, isSelected, handleCheckBoxChange }) => {
    const element = stashedElement.first;
    console.log('TEST', element.accessRights.isPrivate);
    return (
        <>
            <Divider />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={isSelected}
                            onChange={() =>
                                handleCheckBoxChange(element.elementUuid)
                            }
                        />
                    }
                    label={
                        <Typography>
                            {getOptionLabel(stashedElement)}
                        </Typography>
                    }
                />
                {element.accessRights.isPrivate && <LockIcon />}
            </Box>
        </>
    );
};
