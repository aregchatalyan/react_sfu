const fs = require('fs');
const path = require('path');

const paths = [
  path.join(__dirname, '../client/build'),
  path.join(__dirname, '../client/node_modules'),
  path.join(__dirname, '../client/package-lock.json'),
  path.join(__dirname, '../node_modules'),
  path.join(__dirname, '../package-lock.json'),
];

(async () => {
  const { F_OK } = fs.constants;

  try {
    for (const path of paths) {
      const exist = await fs.promises.access(path, F_OK);

      if (!exist) {
        await fs.promises.rm(path, { recursive: true });
        console.log(`${ path } cleared`);
      }
    }
  } catch (e) {
    console.error(e);
  }
})();
