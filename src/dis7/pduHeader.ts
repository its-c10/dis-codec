import type { BinaryReader } from "../binary/BinaryReader.js";
import type { BinaryWriter } from "../binary/BinaryWriter.js";

/**
 * Standard PDU header (12 bytes). Layout is version-specific; this module is DIS 7.
 */
export interface PduHeader {
  protocolVersion: number;
  exerciseId: number;
  pduType: number;
  protocolFamily: number;
  timestamp: number;
  /** Total PDU size in bytes, including this header. */
  length: number;
  pduStatus: number;
  padding: number;
}

export function decodePduHeader(reader: BinaryReader): PduHeader {
  return {
    protocolVersion: reader.readUint8(),
    exerciseId: reader.readUint8(),
    pduType: reader.readUint8(),
    protocolFamily: reader.readUint8(),
    timestamp: reader.readUint32(),
    length: reader.readUint16(),
    pduStatus: reader.readUint8(),
    padding: reader.readUint8(),
  };
}

export function encodePduHeader(
  writer: BinaryWriter,
  header: PduHeader
): void {
  writer.writeUint8(header.protocolVersion);
  writer.writeUint8(header.exerciseId);
  writer.writeUint8(header.pduType);
  writer.writeUint8(header.protocolFamily);
  writer.writeUint32(header.timestamp);
  writer.writeUint16(header.length);
  writer.writeUint8(header.pduStatus);
  writer.writeUint8(header.padding);
}
