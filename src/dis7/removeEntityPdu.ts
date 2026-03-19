import type { BinaryReader } from "../binary/BinaryReader.js";
import type { BinaryWriter } from "../binary/BinaryWriter.js";
import type { EntityId } from "../core/entityId.js";
import { decodeEntityId, encodeEntityId } from "../core/entityId.js";
import { decodePduHeader, encodePduHeader } from "./pduHeader.js";
import type { PduHeader } from "./pduHeader.js";

/** Remove Entity PDU (224 bits). Table 150. */
export interface RemoveEntityPdu {
  header: PduHeader;
  originatingId: EntityId;
  receivingId: EntityId;
  requestId: number;
}

export function decodeRemoveEntityPdu(reader: BinaryReader): RemoveEntityPdu {
  return {
    header: decodePduHeader(reader),
    originatingId: decodeEntityId(reader),
    receivingId: decodeEntityId(reader),
    requestId: reader.readUint32(),
  };
}

export function encodeRemoveEntityPdu(
  writer: BinaryWriter,
  pdu: RemoveEntityPdu
): void {
  encodePduHeader(writer, pdu.header);
  encodeEntityId(writer, pdu.originatingId);
  encodeEntityId(writer, pdu.receivingId);
  writer.writeUint32(pdu.requestId);
  writer.patchUint16(8, writer.getOffset());
}
