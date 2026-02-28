import { Server } from "http";
import app from "./app";
import config from "./config";
import cron from "node-cron";

import seedSuperAdmin from "./app/seedSuperAdmin";

const port = config.port || 6005;

async function main() {
  const server: Server = app.listen(port, () => {
    // Server started successfully
  });
  seedSuperAdmin();


}

main();
