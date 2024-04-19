import { getFileIcon } from '@gridsuite/commons-ui';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { FormattedMessage } from 'react-intl';

const styles = {
    icon: (theme) => ({
        marginRight: theme.spacing(2),
        width: '18px',
        height: '18px',
    }),
    grid: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: 'inline-block',
    },
    grid2: (theme) => ({
        marginRight: theme.spacing(2),
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: 'inline-block',
        color: 'grey',
    }),
};
function SearchItem({ matchingElement, ...othersProps }) {
    return (
        <li {...othersProps}>
            <>
                <span>{getFileIcon(matchingElement.type, styles.icon)}</span>
                <Grid container>
                    <Grid item xs={11} sx={styles.grid}>
                        {matchingElement.name}
                    </Grid>
                    <Grid item sx={styles.grid2}>
                        <Typography>
                            <FormattedMessage id="path" />
                            {matchingElement.pathName?.join(' / ')}
                        </Typography>
                    </Grid>
                </Grid>
            </>
        </li>
    );
}

export default SearchItem;
