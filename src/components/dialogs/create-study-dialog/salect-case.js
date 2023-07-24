import { useEffect, useState } from 'react';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { FormattedMessage } from 'react-intl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

const SelectCase = ({
    cases = [],
    handleChangeSelectCase,
    selectedCase,
    handleFetchCases,
}) => {
    const [openSelectCase, setSelectCase] = useState(false);

    useEffect(() => {
        handleFetchCases();
    }, []);

    const handleChange = (event) => {
        handleChangeSelectCase(event.target.value);
    };

    const handleCloseSelectCase = () => {
        setSelectCase(false);
    };

    const handleOpenSelectCase = () => {
        setSelectCase(true);
    };

    return (
        <div>
            <FormControl fullWidth>
                <InputLabel id="demo-controlled-open-select-label">
                    <FormattedMessage id="caseName" />
                </InputLabel>
                <Select
                    labelId="demo-controlled-open-select-label"
                    id="demo-controlled-open-select"
                    open={openSelectCase}
                    onClose={handleCloseSelectCase}
                    onOpen={handleOpenSelectCase}
                    value={selectedCase}
                    onChange={handleChange}
                >
                    {cases.map(function (element) {
                        return (
                            <MenuItem key={element.uuid} value={element.uuid}>
                                {element.name}
                            </MenuItem>
                        );
                    })}
                </Select>
            </FormControl>
        </div>
    );
};

export default SelectCase;
