import type { BinaryReader } from "../binary/BinaryReader.js";
import type { BinaryWriter } from "../binary/BinaryWriter.js";
import type { EntityId } from "../core/entityId.js";
import { decodeEntityId, encodeEntityId } from "../core/entityId.js";
import type { ClockTime } from "../dis/clockTime.js";
import { decodeClockTime, encodeClockTime } from "../dis/clockTime.js";
import { decodePduHeader, encodePduHeader } from "./pduHeader.js";
import type { PduHeader } from "./pduHeader.js";

/** Stop/Freeze PDU (320 bits). */
export interface StopFreezePdu {
  header: PduHeader;
  originatingId: EntityId;
  receivingId: EntityId;
  realWorldTime: ClockTime;
  /** 8-bit enumeration: why the entity/exercise was stopped or frozen. */
  reason: number;
  /** 8-bit record: internal behavior and appearance while frozen. */
  frozenBehavior: number;
  /** 16-bit padding (unused on wire). */
  padding: number;
  requestId: number;
}

export function decodeStopFreezePdu(reader: BinaryReader): StopFreezePdu {
  return {
    header: decodePduHeader(reader),
    originatingId: decodeEntityId(reader),
    receivingId: decodeEntityId(reader),
    realWorldTime: decodeClockTime(reader),
    reason: reader.readUint8(),
    frozenBehavior: reader.readUint8(),
    padding: reader.readUint16(),
    requestId: reader.readUint32(),
  };
}

export function encodeStopFreezePdu(
  writer: BinaryWriter,
  pdu: StopFreezePdu
): void {
  encodePduHeader(writer, pdu.header);
  encodeEntityId(writer, pdu.originatingId);
  encodeEntityId(writer, pdu.receivingId);
  encodeClockTime(writer, pdu.realWorldTime);
  writer.writeUint8(pdu.reason);
  writer.writeUint8(pdu.frozenBehavior);
  writer.writeUint16(pdu.padding);
  writer.writeUint32(pdu.requestId);
  writer.patchUint16(8, writer.getOffset());
}
