const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const OUT_DIR = path.join(__dirname, '..', 'out');

async function deployToIPFS() {
  console.log('🚀 Deploying to IPFS via Kubo CLI...\n');
  
  try {
    console.log('📦 Initializing IPFS...');
    try {
      await execAsync('ipfs init');
    } catch (e) {
      console.log('IPFS already initialized');
    }
    
    console.log('🔧 Starting IPFS daemon in background...');
    const daemon = exec('ipfs daemon');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('📤 Adding files to IPFS...');
    const { stdout } = await execAsync(`ipfs add -r -Q ${OUT_DIR}`);
    const cid = stdout.trim();
    
    console.log('\n✅ Successfully deployed to IPFS!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📍 IPFS CID: ${cid}`);
    console.log(`\n🌐 Access your app at:`);
    console.log(`   https://ipfs.io/ipfs/${cid}`);
    console.log(`   https://cloudflare-ipfs.com/ipfs/${cid}`);
    console.log(`   https://dweb.link/ipfs/${cid}`);
    console.log(`   https://${cid}.ipfs.dweb.link`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
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
    
    console.log('💾 Deployment info saved to ipfs-deployment.json\n');
    
    daemon.kill();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n⚠️  IPFS CLI deployment failed. Trying alternative...\n');
    await deployViaPinata();
  }
}

async function deployViaPinata() {
  console.log('🔄 Attempting deployment via Pinata API...\n');
  
  const FormData = require('form-data');
  const axios = require('axios');
  
  const apiKey = process.env.PINATA_API_KEY;
  const apiSecret = process.env.PINATA_SECRET_API_KEY;
  
  if (!apiKey || !apiSecret) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 Your app is built and ready in: ./out/');
    console.log('\n🔧 To deploy, choose one option:\n');
    console.log('1️⃣  Wait for IPFS to finish installing, then run:');
    console.log('   npm run ipfs:deploy\n');
    console.log('2️⃣  Get free Pinata API keys from https://pinata.cloud');
    console.log('   Then run:');
    console.log('   export PINATA_API_KEY=your_key');
    console.log('   export PINATA_SECRET_API_KEY=your_secret');
    console.log('   npm run ipfs:deploy\n');
    console.log('3️⃣  Manual upload:');
    console.log('   - Go to https://app.pinata.cloud');
    console.log('   - Upload the ./out/ folder');
    console.log('   - Get your IPFS CID\n');
    console.log('4️⃣  Use Fleek (easiest):');
    console.log('   npx @fleek-platform/cli sites deploy\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(0);
  }
  
  try {
    const form = new FormData();
    const files = getAllFiles(OUT_DIR);
    
    console.log(`📤 Uploading ${files.length} files to Pinata...`);
    
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
    
    console.log('\n✅ Successfully deployed via Pinata!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📍 IPFS CID: ${cid}`);
    console.log(`\n🌐 Access your app at:`);
    console.log(`   https://gateway.pinata.cloud/ipfs/${cid}`);
    console.log(`   https://ipfs.io/ipfs/${cid}`);
    console.log(`   https://${cid}.ipfs.dweb.link`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
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
    
    console.log('💾 Deployment info saved to ipfs-deployment.json\n');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Pinata deployment failed:', error.response?.data || error.message);
    console.log('\n📦 Your build is in ./out/ - upload manually to Pinata or Fleek');
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
