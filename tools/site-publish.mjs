import { createInterface } from "node:readline";
import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const root = resolve(process.cwd());

function run(command, args, options = {}) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, { ...options, windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => { stdout += chunk; });
    child.stderr?.on("data", (chunk) => { stderr += chunk; });
    child.on("error", rejectRun);
    child.on("close", (code) => code === 0 ? resolveRun({ stdout, stderr }) : rejectRun(new Error(`${command} terminó con código ${code}: ${stderr || stdout}`)));
  });
}

if (process.stdin.isTTY && process.stdin.setRawMode) process.stdin.setRawMode(true);
console.log("Ready for Site publish JSON on stdin (input is hidden).");
const lines = createInterface({ input: process.stdin, crlfDelay: Infinity });
for await (const line of lines) {
  if (!line.trim()) continue;
  const input = JSON.parse(line);
  const credential = input.credential;
  if (!credential?.token || !credential?.remote_url) throw new Error("Faltan las credenciales de publicación.");

  const stageRoot = join(tmpdir(), `kaizen-sites-${Date.now()}`);
  const checkout = join(stageRoot, "checkout");
  const archive = resolve(root, input.archivePath || "site-deploy.tar.gz");
  const authHeader = `Authorization: Bearer ${credential.token}`;
  const gitExecPath = (await run("git", ["--exec-path"], { env: process.env })).stdout.trim();
  const gitBin = resolve(gitExecPath, "..", "..", "bin");
  const gitEnv = {
    ...process.env,
    PATH: `${gitBin};${process.env.PATH || ""}`,
    GIT_CONFIG_COUNT: "1",
    GIT_CONFIG_KEY_0: "http.extraHeader",
    GIT_CONFIG_VALUE_0: authHeader,
    GIT_TERMINAL_PROMPT: "0"
  };

  await mkdir(stageRoot, { recursive: true });
  await run("git", ["clone", "--branch", credential.branch || "main", "--single-branch", credential.remote_url, checkout], { env: gitEnv });
  for (const entry of await readdir(checkout)) {
    if (entry !== ".git") await rm(join(checkout, entry), { recursive: true, force: true });
  }

  for (const item of [".openai", "assets", "css", "js", "tools", "index.html", "tienda.html", "carrito.html", "nutricion.html", "acceso.html", "cuenta.html", "README.md", ".gitignore"]) {
    await cp(join(root, item), join(checkout, item), { recursive: true });
  }

  await run("node", ["tools/build.mjs"], { cwd: checkout, env: process.env });
  await run("git", ["config", "user.name", "Codex"], { cwd: checkout, env: gitEnv });
  await run("git", ["config", "user.email", "codex@local"], { cwd: checkout, env: gitEnv });
  await run("git", ["add", "."], { cwd: checkout, env: gitEnv });
  const diff = await run("git", ["status", "--porcelain"], { cwd: checkout, env: gitEnv });
  if (diff.stdout.trim()) await run("git", ["commit", "-m", "Build functional Kaizen storefront and booking site"], { cwd: checkout, env: gitEnv });
  const commit = (await run("git", ["rev-parse", "HEAD"], { cwd: checkout, env: gitEnv })).stdout.trim();
  await run("git", ["push", "origin", `HEAD:${credential.branch || "main"}`], { cwd: checkout, env: gitEnv });

  await rm(archive, { force: true });
  await run("tar", ["-czf", archive, ".openai", "dist"], { cwd: checkout, env: process.env });
  console.log(JSON.stringify({ checkout_path: checkout, commit_sha: commit, archive }));
  if (process.stdin.isTTY && process.stdin.setRawMode) process.stdin.setRawMode(false);
  lines.close();
  process.stdin.destroy();
  break;
}
