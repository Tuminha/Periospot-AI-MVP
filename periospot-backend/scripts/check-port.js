const { execSync } = require('child_process');
const net = require('net');

// Only check backend port
const PORTS = [
  { port: 5001, name: 'Backend Server' }
];

async function killProcessOnPort(port) {
  try {
    const cmd = process.platform === 'win32'
      ? `netstat -ano | findstr :${port}`
      : `lsof -i :${port} -t`;

    const pid = execSync(cmd).toString().trim();

    if (pid) {
      console.log(`Found process ${pid} on port ${port}, attempting to kill...`);
      const killCmd = process.platform === 'win32'
        ? `taskkill /F /PID ${pid}`
        : `kill -9 ${pid}`;
      
      execSync(killCmd);
      console.log(`✅ Successfully killed process ${pid} on port ${port}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    if (error.status !== 1) {
      console.error(`❌ Error checking/killing process on port ${port}:`, error.message);
    }
  }
}

function checkPort(portInfo) {
  const { port, name } = portInfo;
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.once('error', async (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`⚠️ ${name} port ${port} is in use`);
        await killProcessOnPort(port);
        resolve();
      } else {
        reject(err);
      }
    });

    server.once('listening', () => {
      server.close();
      console.log(`✅ ${name} port ${port} is available`);
      resolve();
    });

    server.listen(port);
  });
}

async function checkAllPorts() {
  console.log('🔍 Checking backend port availability...\n');
  
  try {
    for (const portInfo of PORTS) {
      await checkPort(portInfo);
    }
    console.log('\n✨ Backend port is available\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Port check failed:', error.message);
    process.exit(1);
  }
}

checkAllPorts(); 