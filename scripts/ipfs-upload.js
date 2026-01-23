const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const OUT_DIR = path.join(__dirname, '..', 'out');

async function uploadToIPFS() {
  console.log('🚀 Starting IPFS upload...');
  
  console.log('💡 Trying Pinata via CLI...');
  await uploadToPinata();
}

async function uploadToPinata() {
  const FormData = require('form-data');
  const axios = require('axios');
  
  const pinataApiKey = process.env.PINATA_API_KEY;
  const pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;

  if (!pinataApiKey || !pinataSecretApiKey) {
    console.error('❌ Missing Pinata credentials. Set PINATA_API_KEY and PINATA_SECRET_API_KEY');
    console.log('\n📝 Alternative: Using Filebase (IPFS-compatible S3)...');
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
    console.log('\n🎉 Pinata deployment successful!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📍 IPFS CID: ${cid}`);
    console.log(`🌐 Gateway: https://gateway.pinata.cloud/ipfs/${cid}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    fs.writeFileSync(
      path.join(__dirname, '..', 'ipfs-deployment.json'),
      JSON.stringify({ cid, timestamp: new Date().toISOString() }, null, 2)
    );

  } catch (error) {
    console.error('❌ Pinata upload failed:', error.message);
    console.log('\n📝 Trying Filebase...');
    await uploadToFilebase();
  }
}

async function uploadToFilebase() {
  console.log('\n📝 Trying IPFS CLI (ipfs add)...');
  
  try {
    const { stdout } = await execAsync(`which ipfs`);
    if (!stdout.trim()) throw new Error('IPFS not installed');
    
    console.log('📦 Adding to IPFS...');
    const { stdout: addOutput } = await execAsync(`ipfs add -r ${OUT_DIR}`);
    const lines = addOutput.trim().split('\n');
    const lastLine = lines[lines.length - 1];
    const cid = lastLine.split(' ')[1];
    
    console.log('\n🎉 IPFS CLI deployment successful!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📍 IPFS CID: ${cid}`);
    console.log(`🌐 IPFS Gateway: https://ipfs.io/ipfs/${cid}`);
    console.log(`🌐 Cloudflare Gateway: https://cloudflare-ipfs.com/ipfs/${cid}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    fs.writeFileSync(
      path.join(__dirname, '..', 'ipfs-deployment.json'),
      JSON.stringify({ cid, timestamp: new Date().toISOString() }, null, 2)
    );

  } catch (error) {
    console.error('❌ IPFS CLI not available');
    console.log('\n📝 Final option: Using NFT.Storage API...');
    await uploadToNFTStorage();
  }
}

async function uploadToNFTStorage() {
  const axios = require('axios');
  const FormData = require('form-data');
  
  const token = process.env.NFT_STORAGE_TOKEN;
  
  if (!token) {
    console.error('\n❌ No IPFS provider available!');
    console.log('\n🔧 Quick setup options:');
    console.log('1. Install IPFS CLI: brew install ipfs');
    console.log('2. Get Pinata keys: https://pinata.cloud (free)');
    console.log('   Then: export PINATA_API_KEY=xxx PINATA_SECRET_API_KEY=xxx');
    console.log('3. Get NFT.Storage token: https://nft.storage (free)');
    console.log('   Then: export NFT_STORAGE_TOKEN=xxx');
    console.log('\n📦 Your build is ready in: ./out/');
    console.log('You can manually upload to: https://app.fleek.co or https://www.pinata.cloud');
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
    console.log('\n🎉 NFT.Storage deployment successful!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📍 IPFS CID: ${cid}`);
    console.log(`🌐 Gateway: https://nftstorage.link/ipfs/${cid}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    fs.writeFileSync(
      path.join(__dirname, '..', 'ipfs-deployment.json'),
      JSON.stringify({ cid, timestamp: new Date().toISOString() }, null, 2)
    );

  } catch (error) {
    console.error('❌ NFT.Storage upload failed:', error.message);
    console.log('\n📦 Your build is ready in: ./out/');
    console.log('Manual upload: https://app.fleek.co or https://www.pinata.cloud');
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
