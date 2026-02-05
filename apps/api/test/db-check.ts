import * as net from 'net';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env (assuming script is run from backend root via npm run)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const checkConnection = (host: string, port: number, name: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.setTimeout(2000);

    socket.on('connect', () => {
      console.log(`✅ ${name} (${host}:${port}) is reachable.`);
      socket.destroy();
      resolve();
    });

    socket.on('timeout', () => {
      console.error(`❌ ${name} (${host}:${port}) timed out.`);
      socket.destroy();
      reject(new Error('Timeout'));
    });

    socket.on('error', (err) => {
      console.error(`❌ ${name} (${host}:${port}) connection failed: ${err.message}`);
      socket.destroy();
      reject(err);
    });

    socket.connect(port, host);
  });
};

async function run() {
  const pgHost = process.env.POSTGRES_HOST || 'localhost';
  const pgPort = parseInt(process.env.POSTGRES_PORT || '5432', 10);
  
  const redisHost = process.env.REDIS_HOST || 'localhost';
  const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

  console.log('Starting Infrastructure Check...');
  console.log(`Checking Postgres at ${pgHost}:${pgPort}...`);
  console.log(`Checking Redis at ${redisHost}:${redisPort}...`);

  try {
    await Promise.all([
        checkConnection(pgHost, pgPort, 'PostgreSQL'),
        checkConnection(redisHost, redisPort, 'Redis')
    ]);
    console.log('\n✨ All infrastructure services are up and running!');
    (process as any).exit(0);
  } catch (error) {
    console.error('\n⚠️ Infrastructure check failed.');
    (process as any).exit(1);
  }
}

run();