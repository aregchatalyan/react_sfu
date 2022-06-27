const config = require("./config");
const mediasoupInit = require("mediasoup");

let workers = [];
let nextMediasoupWorkerIdx = 0;


(async () => {
  const { CPU, worker: { logLevel, logTags, rtcMinPort, rtcMaxPort } } = config.mediasoup;

  for (const thread of CPU) {
    const worker = await mediasoupInit.createWorker({
      logLevel, logTags, rtcMinPort, rtcMaxPort
    });

    worker.on('died', () => {
      console.error('mediasoupInit worker died, exiting in 2 seconds... [pid:%d]', worker.pid);
      setTimeout(() => process.exit(1), 2000);
    });

    workers.push(worker);
  }
})();

const getMediasoupWorker = () => {
  const worker = workers[nextMediasoupWorkerIdx];

  if (++nextMediasoupWorkerIdx === workers.length) nextMediasoupWorkerIdx = 0;

  return worker;
}

module.exports = getMediasoupWorker;