import type { BinaryReader } from "../binary/BinaryReader.js";
import type { BinaryWriter } from "../binary/BinaryWriter.js";

/** DIS Event ID: simulation address then event number (uint16 each), 6 bytes total. */
export interface EventId {
  simulationAddress: { site: number; application: number };
  event: number;
}

export function decodeEventId(reader: BinaryReader): EventId {
  return {
    simulationAddress: {
      site: reader.readUint16(),
      application: reader.readUint16(),
    },
    event: reader.readUint16(),
  };
}

export function encodeEventId(
  writer: BinaryWriter,
  value: EventId
): void {
  writer.writeUint16(value.simulationAddress.site);
  writer.writeUint16(value.simulationAddress.application);
  writer.writeUint16(value.event);
}
