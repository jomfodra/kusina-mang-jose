#!/usr/bin/env node
/**
 * Deploy script: Upload project files to GitHub repository
 * Usage: node deploy-to-github.js <github-token> <owner> <repo>
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function makeGitHubRequest(method, endpoint, token, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: endpoint,
      method: method,
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'kusina-deploy',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`GitHub API error ${res.statusCode}: ${data}`));
        } else {
          resolve(JSON.parse(data || '{}'));
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function uploadFile(token, owner, repo, filePath, gitPath) {
  const content = fs.readFileSync(filePath);
  const base64Content = content.toString('base64');

  try {
    const result = await makeGitHubRequest(
      'PUT',
      `/repos/${owner}/${repo}/contents/${gitPath}`,
      token,
      {
        message: `Add ${path.basename(gitPath)}`,
        content: base64Content,
        branch: 'main'
      }
    );
    console.log(`✅ Uploaded: ${gitPath}`);
    return result;
  } catch (err) {
    console.error(`❌ Failed to upload ${gitPath}: ${err.message}`);
    throw err;
  }
}

async function getAllFiles(dirPath, prefix = '') {
  const files = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    // Skip node_modules and certain directories
    if (['node_modules', '.git', 'dist', '.env.local', 'server/data.json'].includes(entry.name)) {
      continue;
    }

    const fullPath = path.join(dirPath, entry.name);
    const gitPath = prefix ? `${prefix}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      files.push(...await getAllFiles(fullPath, gitPath));
    } else {
      files.push({ localPath: fullPath, gitPath });
    }
  }

  return files;
}

async function main() {
  const token = process.argv[2];
  const owner = process.argv[3];
  const repo = process.argv[4];

  if (!token || !owner || !repo) {
    console.error('Usage: node deploy-to-github.js <github-token> <owner> <repo>');
    console.error('Example: node deploy-to-github.js ghp_xxxxx jomfodra kusina-mang-jose');
    process.exit(1);
  }

  console.log(`🚀 Deploying to ${owner}/${repo}...\n`);

  try {
    const projectDir = __dirname;
    const files = await getAllFiles(projectDir);

    console.log(`📦 Found ${files.length} files to upload\n`);

    for (const file of files) {
      await uploadFile(token, owner, repo, file.localPath, file.gitPath);
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n✅ Deployment complete!`);
  } catch (err) {
    console.error(`\n❌ Deployment failed: ${err.message}`);
    process.exit(1);
  }
}

main();
