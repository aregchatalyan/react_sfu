let isVideoOnFullScreen = false;

export const onFullScreen = async (id) => {
  const videoPlayer = document.getElementById(id);

  videoPlayer.addEventListener('fullscreenchange', () => {
    if (videoPlayer.controls) return;

    const fullscreenElement = document['fullscreenElement'];

    if (!fullscreenElement) {
      isVideoOnFullScreen = false;
    }
  });

  videoPlayer.addEventListener('webkitfullscreenchange', () => {
    if (videoPlayer.controls) return;

    const webkitIsFullScreen = document['webkitIsFullScreen'];

    if (!webkitIsFullScreen) {
      isVideoOnFullScreen = false;
    }
  });

  videoPlayer.addEventListener('click', async () => {
    if (videoPlayer.controls) return;

    if (!isVideoOnFullScreen) {
      if (videoPlayer.requestFullscreen) {
        await videoPlayer.requestFullscreen();
      } else if (videoPlayer['webkitRequestFullscreen']) {
        videoPlayer['webkitRequestFullscreen']();
      } else if (videoPlayer['msRequestFullscreen']) {
        videoPlayer['msRequestFullscreen']();
      } else if (videoPlayer['webkitEnterFullscreen']) {
        videoPlayer['webkitEnterFullscreen']();
      }

      isVideoOnFullScreen = true;
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document['webkitCancelFullScreen']) {
        document['webkitCancelFullScreen']();
      } else if (document['msExitFullscreen']) {
        document['msExitFullscreen']();
      }

      videoPlayer.play();
      isVideoOnFullScreen = false;
    }
  });
}