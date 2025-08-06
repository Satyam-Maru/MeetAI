import React from 'react';
import '../styles/VideoPlaceholder.css';
import LandingPageVideoMp4 from '../assets/LandingPageVideo.mp4'
import LandingPageVideoWebm from '../assets/LandingPageVideo.webm'
import LandingPageVideoPoster from '../assets/LandingPageVideoPoster.png'

const VideoPlaceholder = () => {
  return <div className="video-placeholder">
    <video
        className="responsive-video"
        poster={LandingPageVideoPoster}
        autoPlay
        muted
        playsInline
      >
        <source src={LandingPageVideoWebm} type="video/webm" />
        <source src={LandingPageVideoMp4} type="video/mp4" />
        Your browser does not support the video tag
      </video>
  </div>;
};

export default VideoPlaceholder; 