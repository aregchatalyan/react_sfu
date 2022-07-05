export const onFullScreen = async (ref) => {
  if (ref.requestFullscreen) {
    await ref.requestFullscreen();
  } else if (ref.webkitEnterFullscreen) {
    await ref.webkitEnterFullscreen();
  }
  ref.onpause = () => ref.play();
}