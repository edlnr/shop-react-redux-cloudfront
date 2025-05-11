import { AttributeValue } from "@aws-sdk/client-dynamodb";

export function toDynamoDBItem<T extends Record<string, any>>(
  item: T
): Record<string, AttributeValue> {
  const dynamoItem: Record<string, AttributeValue> = {};

  for (const [key, value] of Object.entries(item)) {
    if (typeof value === "string") {
      dynamoItem[key] = { S: value };
    } else if (typeof value === "number") {
      dynamoItem[key] = { N: value.toString() };
    } else if (typeof value === "boolean") {
      dynamoItem[key] = { BOOL: value };
    }
  }

  return dynamoItem;
}
