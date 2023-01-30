import FileCopyIcon from '@mui/icons-material/FileCopy';

const CreateStudyMenuItem = {
    messageDescriptorId: 'createNewStudy',
    handleClick: (activeElement, dialogsId) => dialogsId.ADD_NEW_STUDY,
    icon: <FileCopyIcon fontSize="small" />,
};

export default CreateStudyMenuItem;
