const { Worker, isMainThread, parentPort } = require('worker_threads');
const crypto = require('crypto');

const target_hash = "5d41402abc4b2a76b9719d911017c592";
const chars = "abcdefghijklmnopqrstuvwxyz";
const max_attempts = 10000000;
const num_workers = 2;

if (isMainThread) {
  console.log("Threads: ", num_workers);
  console.log("Chars: ", chars);
  console.log("Max attempts: ", max_attempts);
  console.log("Target hash: ", target_hash);
  console.log("Starting...");

  for (let i = 0; i < num_workers; i++) {
    const worker = new Worker(__filename, { workerData: i });
    worker.on('message', (msg) => {
      if (msg.success) {
        console.log(`Hash cracked! Password: '${msg.password}' found in ${msg.attempts} attempts.`);
        process.exit(0);
      }
    });
    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Worker stopped with exit code ${code}`);
      }
    });
  }
} else {
  const worker_index = process.argv[2] ? parseInt(process.argv[2]) : 0;
  let attempts = 0;
  let password = "";
  const chunk_size = Math.pow(chars.length, 1);

  while (attempts < max_attempts) {
    let current_attempt = worker_index + attempts * num_workers;
    password = generate_password(current_attempt, chars);

    let hash = crypto.createHash("md5").update(password).digest("hex");
    
    if (hash === target_hash) {
      parentPort.postMessage({ success: true, password: password, attempts: attempts });
      break;
    }

    attempts++;
  }

  parentPort.postMessage({ success: false, attempts: attempts });
}

function generate_password(index, chars) {
  let password = '';
  const base = chars.length;

  do {
    password = chars[index % base] + password;
    index = Math.floor(index / base);
  } while (index > 0);

  return password;
}

