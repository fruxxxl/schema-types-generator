import type {
  UnitReflectionReturnValue,
  UnitReflectionT,
} from "./schema-types";
import ts from "typescript";

const transform = (
  schema: UnitReflectionT[],
  treeName: string
): ts.InterfaceDeclaration => {
  return ts.factory.createInterfaceDeclaration(
    ts.factory.createModifiersFromModifierFlags(ts.ModifierFlags.Export),
    treeName,
    undefined,
    undefined,
    schema.flatMap(transformHelper)
  );
};

const transformHelper = (xs: UnitReflectionT): ts.PropertySignature => {
  const typeMap: Record<
    Exclude<UnitReflectionReturnValue, "recursive">,
    ts.TypeReferenceNode
  > = {
    boolean: ts.factory.createTypeReferenceNode("boolean"),
    string: ts.factory.createTypeReferenceNode("string"),
    number: ts.factory.createTypeReferenceNode("number"),
    date: ts.factory.createTypeReferenceNode("Date"),
  };

  const questionToken = !xs.required
    ? ts.factory.createToken(ts.SyntaxKind.QuestionToken)
    : undefined;

  if (xs.returnValue !== "recursive") {
    return ts.factory.createPropertySignature(
      undefined,
      xs.key,
      questionToken,
      typeMap[xs.returnValue]
    );
  }
  return ts.factory.createPropertySignature(
    undefined,
    xs.key,
    questionToken,
    ts.factory.createTypeLiteralNode(xs.values.map(transformHelper))
  );
};

export type SchemaTypeTree = string & {
  readonly SchemaTypeTree: unique symbol;
};

export function generateTypeTree(
  schema: UnitReflectionT[],
  treeName: string
): SchemaTypeTree {
  const transformedSchema = transform(schema, treeName);

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

  return printer.printNode(
    ts.EmitHint.Unspecified,
    transformedSchema,
    ts.createSourceFile(
      "sourceFile.ts",
      "",
      ts.ScriptTarget.Latest,
      false,
      ts.ScriptKind.TS
    )
  ) as SchemaTypeTree;
}
