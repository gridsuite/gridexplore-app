import { Grid, Tooltip } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import { ArrowCircleDown, ArrowCircleUp, Upload } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/ControlPoint';
import DeleteIcon from '@mui/icons-material/Delete';
import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { styled } from '@mui/material/styles';
import { ErrorInput, FieldErrorAlert, CsvUploader } from '@gridsuite/commons-ui';

const InnerColoredButton = styled(IconButton)(({ theme, root }) => {
    return {
        color: theme.palette.primary.main,
    };
});

const BottomRightButtons = ({
    name,
    disableUp,
    disableDown,
    disableDelete,
    handleAddRow,
    handleDeleteRows,
    handleMoveRowUp,
    handleMoveRowDown,
    useFieldArrayOutput,
    csvProps,
}) => {
    const [uploaderOpen, setUploaderOpen] = useState(false);
    const intl = useIntl();

    return (
        <>
            <Grid container paddingTop={1} paddingLeft={2}>
                <Grid item xs={1}>
                    {csvProps && (
                        <InnerColoredButton
                            onClick={() => setUploaderOpen(true)}
                        >
                            <Tooltip
                                title={intl.formatMessage({
                                    id: 'ImportCSV',
                                })}
                                placement="bottom"
                            >
                                <Upload />
                            </Tooltip>
                        </InnerColoredButton>
                    )}
                </Grid>
                <Grid
                    item
                    xs={11}
                    sx={{ display: 'flex', justifyContent: 'right' }}
                >
                    <InnerColoredButton
                        key={'addButton'}
                        onClick={handleAddRow}
                    >
                        <AddIcon />
                    </InnerColoredButton>
                    <InnerColoredButton
                        key={'DeleteButton'}
                        onClick={handleDeleteRows}
                        disabled={disableDelete}
                    >
                        <DeleteIcon />
                    </InnerColoredButton>
                    <InnerColoredButton
                        key={'upButton'}
                        disabled={disableUp}
                        onClick={handleMoveRowUp}
                    >
                        <ArrowCircleUp />
                    </InnerColoredButton>
                    <InnerColoredButton
                        key={'downButton'}
                        disabled={disableDown}
                        onClick={handleMoveRowDown}
                    >
                        <ArrowCircleDown />
                    </InnerColoredButton>
                </Grid>
            </Grid>
            <Grid item xs={12}>
                <ErrorInput name={name} InputField={FieldErrorAlert} />
            </Grid>
            <CsvUploader
                open={uploaderOpen}
                onClose={() => setUploaderOpen(false)}
                name={name}
                useFieldArrayOutput={useFieldArrayOutput}
                {...csvProps}
            />
        </>
    );
};

export default BottomRightButtons;
