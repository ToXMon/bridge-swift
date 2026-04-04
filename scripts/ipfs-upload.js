const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const OUT_DIR = path.join(__dirname, '..', 'out');

async function uploadToIPFS() {
  
  await uploadToPinata();
}

async function uploadToPinata() {
  const FormData = require('form-data');
  const axios = require('axios');
  
  const pinataApiKey = process.env.PINATA_API_KEY;
  const pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;

  if (!pinataApiKey || !pinataSecretApiKey) {
    console.error('❌ Missing Pinata credentials. Set PINATA_API_KEY and PINATA_SECRET_API_KEY');
    await uploadToFilebase();
    return;
  }

  const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
  const data = new FormData();

  const files = getAllFiles(OUT_DIR);
  files.forEach(file => {
    data.append('file', fs.createReadStream(file), {
      filepath: path.relative(OUT_DIR, file)
    });
  });

  try {
    const response = await axios.post(url, data, {
      maxBodyLength: Infinity,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretApiKey
      }
    });

    const cid = response.data.IpfsHash;

    fs.writeFileSync(
      path.join(__dirname, '..', 'ipfs-deployment.json'),
      JSON.stringify({ cid, timestamp: new Date().toISOString() }, null, 2)
    );

  } catch (error) {
    console.error('❌ Pinata upload failed:', error.message);
    await uploadToFilebase();
  }
}

async function uploadToFilebase() {
  
  try {
    const { stdout } = await execAsync(`which ipfs`);
    if (!stdout.trim()) throw new Error('IPFS not installed');
    
    const { stdout: addOutput } = await execAsync(`ipfs add -r ${OUT_DIR}`);
    const lines = addOutput.trim().split('\n');
    const lastLine = lines[lines.length - 1];
    const cid = lastLine.split(' ')[1];
    

    fs.writeFileSync(
      path.join(__dirname, '..', 'ipfs-deployment.json'),
      JSON.stringify({ cid, timestamp: new Date().toISOString() }, null, 2)
    );

  } catch (error) {
    console.error('❌ IPFS CLI not available');
    await uploadToNFTStorage();
  }
}

async function uploadToNFTStorage() {
  const axios = require('axios');
  const FormData = require('form-data');
  
  const token = process.env.NFT_STORAGE_TOKEN;
  
  if (!token) {
    console.error('\n❌ No IPFS provider available!');
    process.exit(1);
  }

  try {
    const data = new FormData();
    const files = getAllFiles(OUT_DIR);
    
    files.forEach(file => {
      data.append('file', fs.createReadStream(file), {
        filepath: path.relative(OUT_DIR, file)
      });
    });

    const response = await axios.post('https://api.nft.storage/upload', data, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...data.getHeaders()
      },
      maxBodyLength: Infinity
    });

    const cid = response.data.value.cid;

    fs.writeFileSync(
      path.join(__dirname, '..', 'ipfs-deployment.json'),
      JSON.stringify({ cid, timestamp: new Date().toISOString() }, null, 2)
    );

  } catch (error) {
    console.error('❌ NFT.Storage upload failed:', error.message);
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

uploadToIPFS().catch(console.error);
