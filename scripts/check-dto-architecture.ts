import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../src');

let hasError = false;

function logError(file: string, message: string) {
  console.error(`\x1b[31m[ARCH ERROR]\x1b[0m ${file}: ${message}`);
  hasError = true;
}

function checkFile(filePath: string) {
  const relativePath = path.relative(ROOT, filePath);
  const fileName = path.basename(filePath);

  if (fileName === 'index.ts' || filePath.includes('/common/')) {
    return;
  }

  if (
    !fileName.endsWith('.request.dto.ts') &&
    !fileName.endsWith('.response.dto.ts')
  ) {
    logError(
      relativePath,
      'File must end with .request.dto.ts or .response.dto.ts',
    );
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  const classMatches = content.match(/export class (\w+)/g);
  if (!classMatches || classMatches.length !== 1) {
    logError(
      relativePath,
      `Must contain exactly one exported class (found ${classMatches?.length || 0})`,
    );
    return;
  }

  const className = classMatches[0].split(' ')[2];
  const isRequest = fileName.endsWith('.request.dto.ts');
  const isResponse = fileName.endsWith('.response.dto.ts');

  const expectedPrefix = fileName
    .split('.')[0]
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
  const expectedClassName = isRequest
    ? `${expectedPrefix}RequestDTO`
    : `${expectedPrefix}ResponseDTO`;

  if (className !== expectedClassName) {
    logError(
      relativePath,
      `Class name should be '${expectedClassName}' but found '${className}'`,
    );
  }

  if (isRequest) {
    const implementsInterface = content.includes('implements');
    const hasContractsImport = content.includes('@volontariapp/contracts');

    if (!implementsInterface || !hasContractsImport) {
      logError(
        relativePath,
        'Request class must implement an interface from @volontariapp/contracts',
      );
    }

    const hasMethod =
      content.includes('toCommand()') || content.includes('toQuery()');
    if (!hasMethod) {
      logError(
        relativePath,
        'Request class must have a toCommand() or toQuery() method',
      );
    }
  }

  if (isResponse) {
    // 5. Responses must implement both gRPC and Web interfaces
    const hasNestImport = content.includes('@volontariapp/contracts-nest');
    const hasContractsImport = content.includes('@volontariapp/contracts');
    const implementsLine = content.match(/implements\s+([^\{]+)\{/);

    if (!implementsLine) {
      logError(relativePath, 'Response class must implement interfaces');
    } else {
      const implemented = implementsLine[1];
      const interfaces = implemented.split(',').map((i) => i.trim());
      if (interfaces.length < 2 || !hasNestImport || !hasContractsImport) {
        logError(
          relativePath,
          'Response class must implement at least two interfaces (gRPC and Web) from both contracts-nest and contracts',
        );
      }
    }
  }
}

function walk(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (file.endsWith('.ts')) {
      if (fullPath.includes('/dto/')) {
        checkFile(fullPath);
      }
    }
  }
}

console.log('--- Starting DTO Architecture Check ---');
walk(ROOT);

if (hasError) {
  console.log('--- \x1b[31mCheck Failed\x1b[0m ---');
  process.exit(1);
} else {
  console.log('--- \x1b[32mCheck Passed\x1b[0m ---');
  process.exit(0);
}
