import 'dotenv/config';
import app, { initialize } from './app.js';

const PORT = Number(process.env.PORT) || 3001;

async function main() {
  await initialize();
  app.listen(PORT, () => {
    console.log(`LoanLedger API listening on http://localhost:${PORT}`);
    console.log('Sandbox mode: payments are simulated and no live funds are captured.');
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
