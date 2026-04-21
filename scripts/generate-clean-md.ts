import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

interface SwaggerResponse {
  description?: string;
  content?: Record<string, any>;
}

interface SwaggerOperation {
  summary?: string;
  operationId?: string;
  description?: string;
  security?: any[];
  parameters?: any[];
  requestBody?: any;
  responses: Record<string, SwaggerResponse>;
}

function generateCleanMarkdown(jsonPath: string, outputPath: string) {
  const data = JSON.parse(readFileSync(jsonPath, 'utf-8'));
  let md = `# ${data.info.title}\n\n`;

  for (const [path, methods] of Object.entries(
    data.paths as Record<string, any>,
  )) {
    for (const [method, details] of Object.entries(
      methods as Record<string, SwaggerOperation>,
    )) {
      md += `## 🔹 ${details.summary || details.operationId}\n\n`;
      md += `### 📍 Route\n\n${method.toUpperCase()} \`${path}\`\n\n`;

      if (details.description) {
        md += `### 📝 Description\n\n${details.description}\n\n`;
      }

      if (details.security) {
        md += `### 🔑 Headers\n\n\`\`\`html\nAuthorization: Bearer <token>\n\`\`\`\n\n`;
      }

      const queryParams = details.parameters?.filter(
        (p: any) => p.in === 'query',
      );
      if (queryParams && queryParams.length > 0) {
        md += `### 🔎 Query Parameters\n\n`;
        md += `| Field | In | Type | Required | Description |\n`;
        md += `| --- | --- | --- | --- | --- |\n`;
        for (const p of queryParams) {
          const type = p.schema?.$ref
            ? p.schema.$ref.split('/').pop()
            : p.schema?.type || 'string';
          md += `| ${p.name} | ${p.in} | ${type} | ${p.required ? 'Yes' : 'No'} | ${p.description || 'none'} |\n`;
        }
        md += `\n`;
      }

      if (details.requestBody) {
        md += `### 📦 Request Body\n\n`;
        const content = details.requestBody.content?.['application/json'];
        let example = content?.example || content?.examples?.default?.value;

        if (!example && content?.schema?.$ref) {
          const schemaName = content.schema.$ref.split('/').pop();
          const schema = data.components.schemas[schemaName];
          example =
            schema?.example ||
            generateMockFromSchema(schema, data.components.schemas);
        }

        if (example) {
          md += `\`\`\`json\n${JSON.stringify(example, null, 2)}\n\`\`\`\n\n`;
        }
      }

      md += `### ✅ Responses\n\n---\n\n`;

      for (const [status, response] of Object.entries(details.responses)) {
        let emoji = '⚪';
        if (status.startsWith('2')) emoji = '🟢';
        else if (status.startsWith('4')) emoji = '🔴';
        else if (status.startsWith('5')) emoji = '🔴';

        md += `### ${emoji} ${status} ${response.description || ''}\n\n`;

        const content = response.content?.['application/json'];
        let example = content?.example || content?.examples?.default?.value;

        if (!example && content?.examples) {
          const firstExample = Object.values(content.examples)[0] as any;
          example = firstExample.value || firstExample;
        }

        if (!example && content?.schema?.$ref) {
          const schemaName = content.schema.$ref.split('/').pop();
          const schema = data.components.schemas[schemaName];
          example =
            schema?.example ||
            generateMockFromSchema(schema, data.components.schemas);
        }

        if (example) {
          md += `\`\`\`json\n${JSON.stringify(example, null, 2)}\n\`\`\`\n\n`;
        }
        md += `---\n\n`;
      }

      md += `\n`;
    }
  }

  writeFileSync(outputPath, md);
}

function generateMockFromSchema(schema: any, allSchemas: any): any {
  if (!schema) return null;
  if (schema.example) return schema.example;

  if (schema.$ref) {
    const name = schema.$ref.split('/').pop();
    return generateMockFromSchema(allSchemas[name], allSchemas);
  }

  if (schema.type === 'object' || schema.properties) {
    const obj: any = {};
    for (const [prop, details] of Object.entries(schema.properties || {})) {
      obj[prop] = generateMockFromSchema(details, allSchemas);
    }
    return obj;
  }

  if (schema.type === 'array') {
    return [generateMockFromSchema(schema.items, allSchemas)];
  }

  if (schema.example !== undefined) return schema.example;

  // Defaults
  switch (schema.type) {
    case 'string':
      return schema.format === 'date-time'
        ? new Date().toISOString()
        : 'string';
    case 'number':
      return 0;
    case 'boolean':
      return true;
    default:
      return null;
  }
}

const swaggerDir = './swagger-static';
const files = [
  'openapi-global.json',
  'openapi-event.json',
  'openapi-post.json',
  'openapi-social.json',
  'openapi-user.json',
];

for (const file of files) {
  const jsonPath = join(swaggerDir, file);
  if (existsSync(jsonPath)) {
    const mdPath = join(swaggerDir, file.replace('.json', '.md'));
    console.log(`✨ Generating custom Markdown for ${file}...`);
    generateCleanMarkdown(jsonPath, mdPath);
    console.log(`✅ Done: ${mdPath}`);
  }
}
