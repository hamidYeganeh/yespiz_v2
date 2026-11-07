import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("..", import.meta.url));
const pilot = process.argv.includes("--pilot");
const frontendCommand = process.argv.includes("--production") ? "start" : "dev";
if (pilot && frontendCommand !== "dev") {
  throw new Error("--pilot uses development servers. Omit --production.");
}
const customerPort = pilot ? 3210 : 3200;
const backendPort = customerPort + 3;
const backend = join(root, "apps", "backend");
const nest = join(
  dirname(require.resolve("@nestjs/cli/package.json")),
  "bin",
  "nest.js",
);
const next = join(
  dirname(require.resolve("next/package.json")),
  "dist",
  "bin",
  "next",
);

const build = spawnSync(process.execPath, [nest, "build"], {
  cwd: backend,
  stdio: "inherit",
});
if (build.error) throw build.error;
if (build.status !== 0) process.exit(build.status ?? 1);

const backendEnv = {
  ...process.env,
  PORT: String(backendPort),
  YESPIZ_HOST: "127.0.0.1",
  YESPIZ_LOCAL_PILOT: pilot ? "1" : "0",
};
if (pilot) {
  const directory = mkdtempSync(join(tmpdir(), "yespiz-pilot-"));
  const database = join(directory, "pilot.sqlite");
  const { seedPilot } = await import("../apps/backend/dist/pilot/seed.js");
  seedPilot(database);
  backendEnv.YESPIZ_DB = database;
  backendEnv.NODE_ENV = "development";
  for (const name of [
    "YESPIZ_ADMIN_EMAIL",
    "YESPIZ_ADMIN_PASSWORD",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "GOOGLE_ROUTES_KEY",
  ])
    delete backendEnv[name];
  console.log("Local cash-only pilot database:", database);
}
const frontendEnv = {
  ...process.env,
  YESPIZ_API_ORIGIN: `http://127.0.0.1:${backendPort}`,
  YESPIZ_LOCAL_PILOT: pilot ? "1" : "0",
  NEXT_TELEMETRY_DISABLED: "1",
};
for (const name of [
  "YESPIZ_ADMIN_PASSWORD",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "GOOGLE_ROUTES_KEY",
])
  delete frontendEnv[name];

const children = [
  spawn(process.execPath, ["dist/main.js"], {
    cwd: backend,
    stdio: "inherit",
    env: backendEnv,
  }),
];
for (const [app, port] of [
  ["application", customerPort],
  ["admin", customerPort + 1],
  ["business", customerPort + 2],
]) {
  children.push(
    spawn(
      process.execPath,
      [
        next,
        frontendCommand,
        "--hostname",
        "127.0.0.1",
        "--port",
        String(port),
      ],
      {
        cwd: join(root, "apps", app),
        stdio: "inherit",
        env: frontendEnv,
      },
    ),
  );
}

let stopping = false;
function stop(code) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) child.kill();
  }
}

for (const child of children) {
  child.on("exit", (code) => stop(code ?? 1));
  child.on("error", (error) => {
    console.error(error.message);
    stop(1);
  });
}
process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
