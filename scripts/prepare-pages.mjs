import {
  access,
  copyFile,
  cp,
  mkdir,
  rm,
  stat
} from "node:fs/promises";

import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptFile = fileURLToPath(import.meta.url);
const scriptDirectory = path.dirname(scriptFile);
const projectRoot = path.resolve(scriptDirectory, "..");
const distDirectory = path.join(projectRoot, "dist");

const requiredFiles = [
  "index.html"
];

const requiredDirectories = [
  "css",
  "js",
  "assets"
];

async function assertFile(relativePath) {
  const absolutePath = path.join(projectRoot, relativePath);

  try {
    await access(absolutePath);
    const info = await stat(absolutePath);

    if (!info.isFile()) {
      throw new Error(`Expected a file: ${relativePath}`);
    }
  } catch (error) {
    throw new Error(
      `Required file is missing or invalid: ${relativePath}`,
      { cause: error }
    );
  }
}

async function assertDirectory(relativePath) {
  const absolutePath = path.join(projectRoot, relativePath);

  try {
    await access(absolutePath);
    const info = await stat(absolutePath);

    if (!info.isDirectory()) {
      throw new Error(`Expected a directory: ${relativePath}`);
    }
  } catch (error) {
    throw new Error(
      `Required directory is missing or invalid: ${relativePath}`,
      { cause: error }
    );
  }
}

async function preparePages() {
  console.log("Preparing GitHub Pages deployment...");

  for (const file of requiredFiles) {
    await assertFile(file);
  }

  for (const directory of requiredDirectories) {
    await assertDirectory(directory);
  }

  await rm(distDirectory, {
    recursive: true,
    force: true
  });

  await mkdir(distDirectory, {
    recursive: true
  });

  await copyFile(
    path.join(projectRoot, "index.html"),
    path.join(distDirectory, "index.html")
  );

  for (const directory of requiredDirectories) {
    await cp(
      path.join(projectRoot, directory),
      path.join(distDirectory, directory),
      {
        recursive: true,
        force: true
      }
    );
  }

  console.log("");
  console.log("GitHub Pages files prepared successfully.");
  console.log(`Output: ${distDirectory}`);
  console.log("");
  console.log("Included:");
  console.log("  index.html");
  console.log("  css/");
  console.log("  js/");
  console.log("  assets/");
}

preparePages().catch((error) => {
  console.error("");
  console.error("Failed to prepare GitHub Pages deployment.");
  console.error(error.message);

  if (error.cause?.message) {
    console.error(error.cause.message);
  }

  process.exit(1);
});