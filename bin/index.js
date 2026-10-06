#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline/promises');
const { stdin: input, stdout: output } = require('process');

const packageRootDir = path.resolve(__dirname, '..');
const targetClaudeDir = path.resolve(process.cwd(), '.claude');
const targetKlDir = path.resolve(process.cwd(), '.ai');
const foldersToSync = ['agents', 'commands', 'skills'];
const configTemplatePath = path.join(packageRootDir, 'templates', 'config.json');
const targetConfigPath = path.join(targetKlDir, 'config.json');

/**
 * Checks if items from the source folder already exist in the destination folder
 */
function getConflictingItems(srcFolder, destFolder) {
    const conflicts = [];
    if (!fs.existsSync(destFolder)) return conflicts;

    const items = fs.readdirSync(srcFolder);
    for (const item of items) {
        const destPath = path.join(destFolder, item);
        if (fs.existsSync(destPath)) {
            // Store relative path for user-friendly display
            conflicts.push(path.relative(targetClaudeDir, destPath));
        }
    }
    return conflicts;
}

async function main() {
    console.log('🚀 Checking WFL resources...\n');

    // 1. Scan for existing conflicts
    const conflicts = [];
    foldersToSync.forEach((folder) => {
        const srcPath = path.join(packageRootDir, folder);
        const destPath = path.join(targetClaudeDir, folder);

        if (fs.existsSync(srcPath)) {
            const found = getConflictingItems(srcPath, destPath);
            conflicts.push(...found);
        }
    });

    // 2. Ask user for confirmation if conflicts exist
    if (conflicts.length > 0) {
        console.log('⚠️  The following items already exist in .claude/:');
        conflicts.forEach((item) => console.log(`   - .claude/${item}`));
        console.log('');

        const rl = readline.createInterface({ input, output });
        const answer = await rl.question('❓ Do you want to overwrite these items? (y/N): ');
        rl.close();

        const isConfirmed = ['y', 'yes'].includes(answer.trim().toLowerCase());

        if (!isConfirmed) {
            console.log('\n❌ Operation cancelled. No files were modified.');
            process.exit(0);
        }
        console.log('\n🔄 Proceeding to overwrite existing files...');
    }

    // 3. Perform sync operation
    try {
        if (!fs.existsSync(targetClaudeDir)) {
            fs.mkdirSync(targetClaudeDir, { recursive: true });
        }

        foldersToSync.forEach((folder) => {
            const srcPath = path.join(packageRootDir, folder);
            const destPath = path.join(targetClaudeDir, folder);

            if (fs.existsSync(srcPath)) {
                fs.cpSync(srcPath, destPath, { recursive: true, force: true });
                console.log(`  ✔ Successfully updated: .claude/${folder}/`);
            } else {
                console.warn(`  ⚠️  Source folder not found: ${folder}`);
            }
        });

        console.log('\n✨ WFL sync completed successfully!');
    } catch (error) {
        console.error('\n❌ Error during sync process:', error.message);
        process.exit(1);
    }

    // 4. Seed .ai/config.json from template if it doesn't exist yet
    let pkbProjectId = '';
    if (!fs.existsSync(targetConfigPath)) {
        if (!fs.existsSync(targetKlDir)) {
            fs.mkdirSync(targetKlDir, { recursive: true });
        }
        fs.cpSync(configTemplatePath, targetConfigPath);
        console.log('  ✔ Created: .ai/config.json');
    } else {
        try {
            pkbProjectId = JSON.parse(fs.readFileSync(targetConfigPath, 'utf8')).pkbProjectId || '';
        } catch {
            // leave pkbProjectId empty if the existing file can't be parsed
        }
    }

    if (!pkbProjectId) {
        console.log('\n⚠️  .ai/config.json has no "pkbProjectId" set.');
        console.log('   Set it to this repo\'s PKB project_id (e.g. "NOP") so PKB MCP searches are scoped correctly.');
    }
}

main();