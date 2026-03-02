import { Server } from "http";
import app from "./app";
import config from "./config";
import cron from "node-cron";

import seedSuperAdmin from "./app/seedSuperAdmin";
import { startCourierSyncCron } from "./app/utils/courierSync.cron";

const port = config.port || 6005;

async function main() {
  const server: Server = app.listen(port, () => {
    // Server started successfully
  });
  seedSuperAdmin();
  
  // Start courier sync cron job
  startCourierSyncCron();
}

main();
