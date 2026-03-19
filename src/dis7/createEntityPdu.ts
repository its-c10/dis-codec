import type { BinaryReader } from "../binary/BinaryReader.js";
import type { BinaryWriter } from "../binary/BinaryWriter.js";
import type { EntityId } from "../core/entityId.js";
import { decodeEntityId, encodeEntityId } from "../core/entityId.js";
import { decodePduHeader, encodePduHeader } from "./pduHeader.js";
import type { PduHeader } from "./pduHeader.js";

/** Create Entity PDU (224 bits). Table 149. */
export interface CreateEntityPdu {
  header: PduHeader;
  originatingId: EntityId;
  receivingId: EntityId;
  requestId: number;
}

export function decodeCreateEntityPdu(reader: BinaryReader): CreateEntityPdu {
  return {
    header: decodePduHeader(reader),
    originatingId: decodeEntityId(reader),
    receivingId: decodeEntityId(reader),
    requestId: reader.readUint32(),
  };
}

export function encodeCreateEntityPdu(
  writer: BinaryWriter,
  pdu: CreateEntityPdu
): void {
  encodePduHeader(writer, pdu.header);
  encodeEntityId(writer, pdu.originatingId);
  encodeEntityId(writer, pdu.receivingId);
  writer.writeUint32(pdu.requestId);
  writer.patchUint16(8, writer.getOffset());
}
