// TEMP DEBUG: Try direct relative import to see if named exports work
import * as YamlFrontmatter from '@utils/yamlFrontmatter';
console.log('[DEBUG] Exports from relative import:', Object.keys(YamlFrontmatter));
console.log('[DEBUG] YamlFrontmatter.extractFrontmatter:', typeof YamlFrontmatter.extractFrontmatter);
console.log('[DEBUG] YamlFrontmatter.writeFrontmatterToFile:', typeof YamlFrontmatter.writeFrontmatterToFile);
