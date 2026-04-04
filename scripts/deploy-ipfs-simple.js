const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const OUT_DIR = path.join(__dirname, '..', 'out');

async function deployToIPFS() {
  
  try {
    try {
      await execAsync('ipfs init');
    } catch (e) {
    }
    
    const daemon = exec('ipfs daemon');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const { stdout } = await execAsync(`ipfs add -r -Q ${OUT_DIR}`);
    const cid = stdout.trim();
    
    
    fs.writeFileSync(
      path.join(__dirname, '..', 'ipfs-deployment.json'),
      JSON.stringify({ 
        cid, 
        timestamp: new Date().toISOString(),
        urls: [
          `https://ipfs.io/ipfs/${cid}`,
          `https://cloudflare-ipfs.com/ipfs/${cid}`,
          `https://dweb.link/ipfs/${cid}`,
          `https://${cid}.ipfs.dweb.link`
        ]
      }, null, 2)
    );
    
    
    daemon.kill();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await deployViaPinata();
  }
}

async function deployViaPinata() {
  
  const FormData = require('form-data');
  const axios = require('axios');
  
  const apiKey = process.env.PINATA_API_KEY;
  const apiSecret = process.env.PINATA_SECRET_API_KEY;
  
  if (!apiKey || !apiSecret) {
    process.exit(0);
  }
  
  try {
    const form = new FormData();
    const files = getAllFiles(OUT_DIR);
    
    
    files.forEach(file => {
      form.append('file', fs.createReadStream(file), {
        filepath: path.relative(OUT_DIR, file)
      });
    });
    
    const metadata = JSON.stringify({
      name: 'bridge-swift-app'
    });
    form.append('pinataMetadata', metadata);
    
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      form,
      {
        maxBodyLength: Infinity,
        headers: {
          'Content-Type': `multipart/form-data; boundary=${form._boundary}`,
          'pinata_api_key': apiKey,
          'pinata_secret_api_key': apiSecret
        }
      }
    );
    
    const cid = response.data.IpfsHash;
    
    
    fs.writeFileSync(
      path.join(__dirname, '..', 'ipfs-deployment.json'),
      JSON.stringify({ 
        cid, 
        timestamp: new Date().toISOString(),
        provider: 'pinata',
        urls: [
          `https://gateway.pinata.cloud/ipfs/${cid}`,
          `https://ipfs.io/ipfs/${cid}`,
          `https://${cid}.ipfs.dweb.link`
        ]
      }, null, 2)
    );
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Pinata deployment failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });
  return arrayOfFiles;
}

deployToIPFS();
