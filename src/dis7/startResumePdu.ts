import type { BinaryReader } from "../binary/BinaryReader.js";
import type { BinaryWriter } from "../binary/BinaryWriter.js";
import type { EntityId } from "../core/entityId.js";
import { decodeEntityId, encodeEntityId } from "../core/entityId.js";
import type { ClockTime } from "../dis/clockTime.js";
import { decodeClockTime, encodeClockTime } from "../dis/clockTime.js";
import { decodePduHeader, encodePduHeader } from "./pduHeader.js";
import type { PduHeader } from "./pduHeader.js";

/** Start/Resume PDU (352 bits). */
export interface StartResumePdu {
  header: PduHeader;
  originatingId: EntityId;
  receivingId: EntityId;
  realWorldTime: ClockTime;
  simulationTime: ClockTime;
  requestId: number;
}

export function decodeStartResumePdu(reader: BinaryReader): StartResumePdu {
  return {
    header: decodePduHeader(reader),
    originatingId: decodeEntityId(reader),
    receivingId: decodeEntityId(reader),
    realWorldTime: decodeClockTime(reader),
    simulationTime: decodeClockTime(reader),
    requestId: reader.readUint32(),
  };
}

export function encodeStartResumePdu(
  writer: BinaryWriter,
  pdu: StartResumePdu
): void {
  encodePduHeader(writer, pdu.header);
  encodeEntityId(writer, pdu.originatingId);
  encodeEntityId(writer, pdu.receivingId);
  encodeClockTime(writer, pdu.realWorldTime);
  encodeClockTime(writer, pdu.simulationTime);
  writer.writeUint32(pdu.requestId);
  writer.patchUint16(8, writer.getOffset());
}
