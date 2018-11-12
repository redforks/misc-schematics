import * as ts from 'typescript';
import { removeAt, insertAt } from 'tsmisc';

export function toLodashMethodModule(content: string, path: string): string {
  let f = ts.createSourceFile(
    path,
    content,
    ts.ScriptTarget.Latest,
    /*setParentNodes */ true,
  );

  let updated = f.text;
  let sourceOffset = 0;
  function travel(n: ts.Node) {
    if (ts.isImportDeclaration(n)) {
      if (ts.isStringLiteral(n.moduleSpecifier) && n.moduleSpecifier.text === 'lodash') {
        let newImports: string[] = [];
        if (n.importClause && n.importClause.namedBindings && ts.isNamedImports(n.importClause.namedBindings)) {
          let namedBindings = n.importClause.namedBindings;
          for (const binding of namedBindings.elements) {
            let detailImport = ts.createImportEqualsDeclaration(
              undefined, undefined, ts.createIdentifier(binding.name.text), ts.createExternalModuleReference(ts.createStringLiteral(n.moduleSpecifier.text + '/' + binding.name.text)));
            newImports.push(dumpNode(detailImport, f).replace(/"/g, "'"));
          }
        }
        let updatedCode = '\n' + newImports.join('\n');
        updated = removeAt(updated, n.pos + sourceOffset, n.end - n.pos);
        updated = insertAt(updated, n.pos + sourceOffset, updatedCode);
        sourceOffset += updatedCode.length - (n.end - n.pos);
      }
    }
  }

  ts.forEachChild(f, travel);
  return updated;
}

function dumpNode(n: ts.Node, f: ts.SourceFile) {
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
  });
  return printer.printNode(ts.EmitHint.Unspecified, n, f)
}

export function updateTsConfig(content: string) {
  let tsConfig = JSON.parse(content);
  if (!tsConfig.compilerOptions) {
    tsConfig.compilerOptions = {};
  }
  if (!tsConfig.compilerOptions.allowSyntheticDefaultImports) {
    tsConfig.compilerOptions.allowSyntheticDefaultImports = true;

    return JSON.stringify(tsConfig, undefined, 2);
  }
  return content;
}
