export function assertCountMatches(
  fieldName: string,
  declaredCount: number,
  actualCount: number
): void {
  if (declaredCount !== actualCount) {
    throw new RangeError(
      `${fieldName} (${declaredCount}) must match actual count (${actualCount})`
    );
  }
}

export function assertByteArrayLength(
  fieldName: string,
  data: number[],
  expectedLength: number
): void {
  if (data.length !== expectedLength) {
    throw new RangeError(
      `${fieldName} must have exactly ${expectedLength} bytes, got ${data.length}`
    );
  }
}

export function assertUint8Range(fieldName: string, value: number): void {
  if (!Number.isInteger(value) || value < 0 || value > 0xff) {
    throw new RangeError(`${fieldName} must be an integer in [0, 255], got ${value}`);
  }
}

export function assertByteArrayValues(fieldName: string, data: number[]): void {
  for (let i = 0; i < data.length; i++) {
    assertUint8Range(`${fieldName}[${i}]`, data[i]);
  }
}
