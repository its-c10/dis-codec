import type { BinaryReader } from "../binary/BinaryReader.js";
import type { BinaryWriter } from "../binary/BinaryWriter.js";

/** Site + application (uint16 each), 4 bytes on wire before entity number. */
export interface SimulationAddress {
  site: number;
  application: number;
}

/** DIS Entity ID: simulation address then entity (uint16), 6 bytes total. */
export interface EntityId {
  simulationAddress: SimulationAddress;
  entity: number;
}

export function decodeEntityId(reader: BinaryReader): EntityId {
  return {
    simulationAddress: {
      site: reader.readUint16(),
      application: reader.readUint16(),
    },
    entity: reader.readUint16(),
  };
}

export function encodeEntityId(writer: BinaryWriter, value: EntityId): void {
  writer.writeUint16(value.simulationAddress.site);
  writer.writeUint16(value.simulationAddress.application);
  writer.writeUint16(value.entity);
}

export function decodeSimulationAddress(reader: BinaryReader): SimulationAddress {
  return {
    site: reader.readUint16(),
    application: reader.readUint16(),
  };
}

export function encodeSimulationAddress(
  writer: BinaryWriter,
  value: SimulationAddress
): void {
  writer.writeUint16(value.site);
  writer.writeUint16(value.application);
}
