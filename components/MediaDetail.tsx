import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { someAction } from '../actions/someAction';
import MediaPlayer from './MediaPlayer';

const MediaDetail = ({ media }) => {
    return (
        <div>
            <MediaPlayer media={media} />
        </div>
    );
};

MediaDetail.propTypes = {
    media: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
    media: state.media,
});

export default connect(mapStateToProps)(MediaDetail);