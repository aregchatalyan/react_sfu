export const onFullScreen = (ref) => {
  if (ref['requestFullscreen']) {
    ref['requestFullscreen']();
  } else if (ref['webkitEnterFullscreen']) {
    ref['webkitEnterFullscreen']();
  }
  ref.onpause = () => ref.play();
}