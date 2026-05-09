const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');

const EPHE_DIR = path.resolve(__dirname, '..', 'ephe');

const FILES = [
  'https://github.com/aloistr/swisseph/raw/master/ephe/sepl_18.se1',
  'https://github.com/aloistr/swisseph/raw/master/ephe/semo_18.se1',
  'https://github.com/aloistr/swisseph/raw/master/ephe/seas_18.se1'
];

async function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) {
      console.log(`[ephe] already exists: ${path.basename(dest)}`);
      return resolve();
    }

    console.log(`[ephe] downloading: ${url}`);
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200 && response.statusCode !== 302) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      
      // Handle redirects
      if (response.statusCode === 302) {
        download(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`[ephe] saved: ${path.basename(dest)}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  if (!fs.existsSync(EPHE_DIR)) {
    fs.mkdirSync(EPHE_DIR, { recursive: true });
  }

  for (const url of FILES) {
    const filename = path.basename(url);
    const dest = path.join(EPHE_DIR, filename);
    await download(url, dest);
  }
}

main().catch(err => {
  console.error('[ephe] error:', err);
  process.exit(1);
});
